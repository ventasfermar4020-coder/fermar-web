import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";
import { eq, inArray } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

interface CartItemInput {
  productId: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { items, email, phone, shippingAddress, referencia } =
      await req.json();

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      );
    }

    const cartItems: CartItemInput[] = items;

    // Fetch all products from database
    const productIds = cartItems.map((item) => item.productId);
    const dbProducts = await database
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    // Validate all products exist and are available
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }
      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product not available: ${product.name}` },
          { status: 400 }
        );
      }
      if (!product.isDigital && product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate total from database prices (secure)
    let totalAmount = 0;
    const itemsMetadata = cartItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const itemTotal = parseFloat(product.price) * item.quantity;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product.name,
        price: product.price,
      };
    });

    // Create Payment Intent with items in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "mxn",
      metadata: {
        items: JSON.stringify(itemsMetadata),
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
