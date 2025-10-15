import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Verifying payment:", paymentIntentId);

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log("📋 Payment Intent Status:", paymentIntent.status);
    console.log("📋 Payment Intent Metadata:", paymentIntent.metadata);

    // Check if payment was successful
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not completed", status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Check if order already exists
    const existingOrder = await database
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    if (existingOrder.length > 0) {
      console.log("✅ Order already exists:", existingOrder[0].id);

      // Fetch the product details for this order
      const orderItem = await database
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, existingOrder[0].id))
        .limit(1);

      if (orderItem.length > 0) {
        const [product] = await database
          .select()
          .from(products)
          .where(eq(products.id, orderItem[0].productId))
          .limit(1);

        return NextResponse.json({
          success: true,
          orderId: existingOrder[0].id,
          alreadyProcessed: true,
          product: product ? {
            id: product.id,
            name: product.name,
            isDigital: product.isDigital,
            downloadUrl: product.downloadUrl,
            activationCode: product.activationCode,
          } : null,
        });
      }

      return NextResponse.json({
        success: true,
        orderId: existingOrder[0].id,
        alreadyProcessed: true,
      });
    }

    // Extract metadata
    const metadata = paymentIntent.metadata;

    if (!metadata || !metadata.productId || !metadata.email) {
      console.log("⚠️ Missing metadata - cannot create order");
      return NextResponse.json(
        { error: "Payment missing required metadata" },
        { status: 400 }
      );
    }

    const productId = parseInt(metadata.productId);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");

    console.log(`📦 Creating order for product ${productId}`);

    // Fetch product details to check if it's digital
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

    // Use a transaction to ensure stock is decremented and order is created atomically
    const result = await database.transaction(async (tx) => {
      // Double-check inside transaction to prevent race condition
      const existingOrderInTx = await tx
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntentId))
        .limit(1);

      if (existingOrderInTx.length > 0) {
        console.log("✅ Order already exists in transaction (created by webhook):", existingOrderInTx[0].id);
        return existingOrderInTx[0]; // Return existing order
      }

      // Decrement product stock (only for physical products)
      if (!product.isDigital) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));
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
          totalAmount: (paymentIntent.amount / 100).toString(),
          stripePaymentIntentId: paymentIntent.id,
        })
        .returning();

      // Create order item
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: productId,
        quantity: 1,
        priceAtPurchase: (paymentIntent.amount / 100).toString(),
        productNameSnapshot: metadata.productName,
      });

      console.log(`✅ Order created: ${order.id}`);

      return order;
    });

    // Return order details with product information (including activation code for digital products)
    return NextResponse.json({
      success: true,
      orderId: result.id,
      alreadyProcessed: false,
      product: {
        id: product.id,
        name: product.name,
        isDigital: product.isDigital,
        downloadUrl: product.downloadUrl,
        activationCode: product.activationCode,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

