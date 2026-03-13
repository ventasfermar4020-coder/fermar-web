import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { getResendClient } from "@/src/lib/email";
import { env } from "@/src/env";
import { generateOwnerOrderEmail } from "@/src/emails/owner-new-order";
import { generateCustomerOrderConfirmationEmail } from "@/src/emails/customer-order-confirmation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface MetadataItem {
  productId: number;
  quantity: number;
  name: string;
  price: string;
}

/**
 * Parse items from Stripe metadata.
 * Supports both the new multi-item format (metadata.items JSON array)
 * and the legacy single-item format (metadata.productId).
 */
function parseItemsFromMetadata(metadata: Stripe.Metadata): MetadataItem[] | null {
  // New multi-item format
  if (metadata.items) {
    try {
      return JSON.parse(metadata.items);
    } catch {
      console.error("❌ Failed to parse items metadata:", metadata.items);
      return null;
    }
  }

  // Legacy single-item format (backward compat)
  if (metadata.productId) {
    return [
      {
        productId: parseInt(metadata.productId),
        quantity: 1,
        name: metadata.productName || "Unknown",
        price: "0",
      },
    ];
  }

  return null;
}

export async function POST(req: NextRequest) {
  console.log("🎯 Webhook received!");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No signature provided");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("✅ Webhook signature verified, event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    console.log("💰 Processing payment_intent.succeeded event");
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Extract metadata
      const metadata = paymentIntent.metadata;

      console.log("📋 Metadata received:", metadata);
      console.log("📋 Payment Intent ID:", paymentIntent.id);

      // Check if this is a real payment with metadata (not a test trigger)
      if (!metadata || (!metadata.items && !metadata.productId) || !metadata.email) {
        console.log("⚠️ Skipping event - no product metadata (likely a test trigger)");
        return NextResponse.json({ received: true, skipped: true });
      }

      // Check if order already exists (may have been created by verify-payment endpoint)
      const existingOrder = await database
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      if (existingOrder.length > 0) {
        console.log("✅ Order already exists (created by verify-payment):", existingOrder[0].id);
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      // Parse items from metadata
      const parsedItems = parseItemsFromMetadata(metadata);
      if (!parsedItems || parsedItems.length === 0) {
        console.error("❌ No valid items in metadata");
        return NextResponse.json(
          { error: "Invalid items metadata" },
          { status: 400 }
        );
      }

      const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");

      console.log(`📦 Processing order for ${parsedItems.length} item(s)`);

      // Use a transaction to ensure stock is decremented and order is created atomically
      await database.transaction(async (tx) => {
        // Double-check inside transaction to prevent race condition
        const existingOrderInTx = await tx
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
          .limit(1);

        if (existingOrderInTx.length > 0) {
          console.log("✅ Order already exists in transaction:", existingOrderInTx[0].id);
          return; // Exit early, don't decrement stock or create order
        }

        // Decrement stock for each physical product
        for (const item of parsedItems) {
          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (product && !product.isDigital) {
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} - ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));

            console.log(`✅ Stock decremented for physical product: ${item.productId} (qty: ${item.quantity})`);
          } else if (product?.isDigital) {
            console.log(`ℹ️ Digital product - stock not decremented: ${item.productId}`);
          }
        }

        // Create order in database
        const [order] = await tx
          .insert(orders)
          .values({
            contactEmail: metadata.email,
            contactPhone: metadata.phone,
            shippingAddress: shippingAddress.line1 || "",
            shippingCity: shippingAddress.city || "",
            shippingState: shippingAddress.state || "",
            shippingZipCode: shippingAddress.postal_code || "",
            shippingCountry: shippingAddress.country || "",
            shippingReferencia: metadata.referencia || null,
            status: "pending",
            totalAmount: (paymentIntent.amount / 100).toString(), // Convert cents to decimal
            stripePaymentIntentId: paymentIntent.id,
          })
          .returning();

        // Create order items for each cart item
        for (const item of parsedItems) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
            productNameSnapshot: item.name,
          });
        }

        console.log(`✅ Order created: ${order.id} with ${parsedItems.length} items for payment ${paymentIntent.id}`);

        // Send emails after successful order creation
        try {
          // Check if email configuration is available
          if (!env.RESEND_API_KEY || !env.OWNER_EMAIL) {
            console.log("⚠️ Email not configured - skipping email notifications");
            console.log("  Set RESEND_API_KEY and OWNER_EMAIL environment variables to enable emails");
            return; // Skip email sending
          }

          // Fetch the complete order with items and product details for emails
          const orderWithItems = await tx
            .select()
            .from(orders)
            .where(eq(orders.id, order.id))
            .limit(1);

          const items = await tx
            .select({
              id: orderItems.id,
              orderId: orderItems.orderId,
              productId: orderItems.productId,
              quantity: orderItems.quantity,
              priceAtPurchase: orderItems.priceAtPurchase,
              productNameSnapshot: orderItems.productNameSnapshot,
              product: products,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));

          // Get Resend client
          const resend = getResendClient();

          // Send email to owner
          const ownerEmailHtml = generateOwnerOrderEmail({
            order: orderWithItems[0],
            items,
          });

          await resend.emails.send({
            from: "Notificaciones <onboarding@resend.dev>",
            to: env.OWNER_EMAIL,
            subject: `Nueva Orden #${order.id} - $${Number(order.totalAmount).toFixed(2)} MXN`,
            html: ownerEmailHtml,
          });

          console.log(`📧 Owner notification email sent to ${env.OWNER_EMAIL}`);

          // Send confirmation email to customer
          const customerEmailHtml = generateCustomerOrderConfirmationEmail({
            order: orderWithItems[0],
            items,
          });

          await resend.emails.send({
            from: "Fermar <onboarding@resend.dev>",
            to: metadata.email,
            subject: `Confirmación de Orden #${order.id}`,
            html: customerEmailHtml,
          });

          console.log(`📧 Customer confirmation email sent to ${metadata.email}`);
        } catch (emailError) {
          // Log email errors but don't fail the webhook
          console.error("⚠️ Error sending emails (order still created):", emailError);
        }
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Error creating order:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
