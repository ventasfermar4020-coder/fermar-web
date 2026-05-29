import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { sendOrderConfirmationEmails } from "@/src/lib/order-emails";

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

      // Fetch canonical product data once. Prices and names recorded on the
      // order MUST come from the database, never from client-controlled metadata.
      const productIds = parsedItems.map((i) => i.productId);
      const dbProducts = await database
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Use a transaction to ensure stock is decremented and order is created atomically
      const createdOrderId = await database.transaction(async (tx) => {
        // Double-check inside transaction to prevent race condition
        const existingOrderInTx = await tx
          .select()
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
          .limit(1);

        if (existingOrderInTx.length > 0) {
          console.log("✅ Order already exists in transaction:", existingOrderInTx[0].id);
          return existingOrderInTx[0].id; // Exit early, don't decrement stock or create order
        }

        // Decrement stock for each physical product, guarding against overselling.
        for (const item of parsedItems) {
          const product = productMap.get(item.productId);

          if (product && !product.isDigital) {
            const decremented = await tx
              .update(products)
              .set({
                stock: sql`${products.stock} - ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(products.id, item.productId),
                  gte(products.stock, item.quantity)
                )
              )
              .returning({ id: products.id });

            if (decremented.length === 0) {
              // Payment already succeeded, so we still create the order, but flag
              // the oversell so it can be reconciled manually.
              console.error(
                `🚨 OVERSELL: product ${item.productId} had insufficient stock for qty ${item.quantity} on paid order (PI ${paymentIntent.id})`
              );
            } else {
              console.log(`✅ Stock decremented for physical product: ${item.productId} (qty: ${item.quantity})`);
            }
          } else if (product?.isDigital) {
            console.log(`ℹ️ Digital product - stock not decremented: ${item.productId}`);
          }
        }

        // Create order in database
        const [order] = await tx
          .insert(orders)
          .values({
            userId: metadata.userId ? parseInt(metadata.userId) : null,
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

        // Create order items, snapshotting price and name from the DB product.
        for (const item of parsedItems) {
          const product = productMap.get(item.productId);
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: product?.price ?? item.price,
            productNameSnapshot: product?.name ?? item.name,
          });
        }

        console.log(`✅ Order created: ${order.id} with ${parsedItems.length} items for payment ${paymentIntent.id}`);

        return order.id;
      });

      // Send confirmation emails outside the transaction (exactly-once, idempotent).
      await sendOrderConfirmationEmails(createdOrderId);

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
