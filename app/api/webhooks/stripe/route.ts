import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { orders, orderItems } from "@/src/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Extract metadata
      const metadata = paymentIntent.metadata;
      const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");

      // Create order in database
      const [order] = await database
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
      await database.insert(orderItems).values({
        orderId: order.id,
        productId: parseInt(metadata.productId),
        quantity: 1, // Assuming 1 item per order for now
        priceAtPurchase: (paymentIntent.amount / 100).toString(),
        productNameSnapshot: metadata.productName,
      });

      console.log(`✅ Order created: ${order.id} for payment ${paymentIntent.id}`);

      return NextResponse.json({ received: true, orderId: order.id });
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
