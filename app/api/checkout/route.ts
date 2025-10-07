import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { productId, email, phone, shippingAddress, referencia } =
      await req.json();

    // Fetch product from database to get the real price
    const [product] = await database
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.isActive || product.stock <= 0) {
      return NextResponse.json(
        { error: "Product not available" },
        { status: 400 }
      );
    }

    // Use the price from the database (secure)
    const amount = parseFloat(product.price);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "mxn",
      metadata: {
        productId: productId.toString(),
        productName: product.name,
        email,
        phone,
        shippingAddress: JSON.stringify(shippingAddress),
        referencia: referencia || "",
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
