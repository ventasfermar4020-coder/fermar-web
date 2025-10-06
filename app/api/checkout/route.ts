import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { amount, productId, productName, email, phone, shippingAddress } =
      await req.json();

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "mxn",
      metadata: {
        productId: productId.toString(),
        productName,
        email,
        phone,
        shippingAddress: JSON.stringify(shippingAddress),
      },
      receipt_email: email,
      shipping: {
        name: email,
        phone: phone,
        address: {
          line1: shippingAddress.line1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
        },
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    return NextResponse.json(
      { error: "Error creating payment intent" },
      { status: 500 }
    );
  }
}
