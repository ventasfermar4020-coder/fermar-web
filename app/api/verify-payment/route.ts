import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { database } from "@/src/db";
import { orders, orderItems, products, type Product } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

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
  if (metadata.items) {
    try {
      return JSON.parse(metadata.items);
    } catch {
      return null;
    }
  }
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

      // Fetch all order items with product details
      const existingItems = await database
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, existingOrder[0].id));

      // Fetch product details for all items
      const orderProducts = [];
      for (const item of existingItems) {
        const [product] = await database
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product) {
          orderProducts.push({
            id: product.id,
            name: product.name,
            isDigital: product.isDigital,
            downloadUrl: product.downloadUrl,
            activationCode: product.activationCode,
            quantity: item.quantity,
          });
        }
      }

      return NextResponse.json({
        success: true,
        orderId: existingOrder[0].id,
        alreadyProcessed: true,
        products: orderProducts,
      });
    }

    // Extract metadata
    const metadata = paymentIntent.metadata;

    if (!metadata || (!metadata.items && !metadata.productId) || !metadata.email) {
      console.log("⚠️ Missing metadata - cannot create order");
      return NextResponse.json(
        { error: "Payment missing required metadata" },
        { status: 400 }
      );
    }

    const parsedItems = parseItemsFromMetadata(metadata);
    if (!parsedItems || parsedItems.length === 0) {
      return NextResponse.json(
        { error: "Invalid items metadata" },
        { status: 400 }
      );
    }

    const shippingAddress = JSON.parse(metadata.shippingAddress || "{}");

    console.log(`📦 Creating order for ${parsedItems.length} item(s)`);

    // Fetch all product details
    const productDetails: (Product & { quantity: number })[] = [];
    for (const item of parsedItems) {
      const [product] = await database
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }
      productDetails.push({ ...product, quantity: item.quantity });
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

      // Decrement product stock for each physical product
      for (const item of parsedItems) {
        const product = productDetails.find((p) => p.id === item.productId);
        if (product && !product.isDigital) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
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
          totalAmount: (paymentIntent.amount / 100).toString(),
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

      console.log(`✅ Order created: ${order.id} with ${parsedItems.length} items`);

      return order;
    });

    // Return order details with product information
    return NextResponse.json({
      success: true,
      orderId: result.id,
      alreadyProcessed: false,
      products: productDetails.map((p) => ({
        id: p.id,
        name: p.name,
        isDigital: p.isDigital,
        downloadUrl: p.downloadUrl,
        activationCode: p.activationCode,
        quantity: p.quantity,
      })),
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
