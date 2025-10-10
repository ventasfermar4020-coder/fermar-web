import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
      if (!metadata || !metadata.productId || !metadata.email) {
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

      const productId = parseInt(metadata.productId);

      // Validate productId is a valid number
      if (isNaN(productId)) {
        console.error("❌ Invalid productId:", metadata.productId);
        return NextResponse.json(
          { error: "Invalid product ID" },
          { status: 400 }
        );
      }

      const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");

      console.log(`📦 Processing order for product ${productId}`);

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

        // Decrement product stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));

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

        // Create order item
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: productId,
          quantity: 1, // Assuming 1 item per order for now
          priceAtPurchase: (paymentIntent.amount / 100).toString(),
          productNameSnapshot: metadata.productName,
        });

        console.log(`✅ Order created: ${order.id} for payment ${paymentIntent.id}`);
        console.log(`✅ Stock decremented for product: ${productId}`);
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
