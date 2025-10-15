import { NextRequest, NextResponse } from "next/server";
import { database } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const orderId = searchParams.get("orderId");

    // Validate required parameters
    if (!productId || !orderId) {
      return NextResponse.json(
        { error: "Product ID and Order ID are required" },
        { status: 400 }
      );
    }

    const productIdNum = parseInt(productId);
    const orderIdNum = parseInt(orderId);

    if (isNaN(productIdNum) || isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: "Invalid Product ID or Order ID" },
        { status: 400 }
      );
    }

    console.log(`📥 Download request - Product: ${productIdNum}, Order: ${orderIdNum}`);

    // Verify the order exists and contains this product
    const [orderItem] = await database
      .select()
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, orderIdNum),
          eq(orderItems.productId, productIdNum)
        )
      )
      .limit(1);

    if (!orderItem) {
      console.log("❌ Order item not found");
      return NextResponse.json(
        { error: "Order not found or does not contain this product" },
        { status: 404 }
      );
    }

    // Verify the order payment was successful
    const [order] = await database
      .select()
      .from(orders)
      .where(eq(orders.id, orderIdNum))
      .limit(1);

    if (!order || !order.stripePaymentIntentId) {
      console.log("❌ Order payment not verified");
      return NextResponse.json(
        { error: "Order payment not verified" },
        { status: 403 }
      );
    }

    // Get product details
    const [product] = await database
      .select()
      .from(products)
      .where(eq(products.id, productIdNum))
      .limit(1);

    if (!product) {
      console.log("❌ Product not found");
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify product is digital and has a download URL
    if (!product.isDigital || !product.downloadUrl) {
      console.log("❌ Product is not digital or has no download URL");
      return NextResponse.json(
        { error: "Product is not available for download" },
        { status: 400 }
      );
    }

    // Construct file path (downloadUrl should be relative, e.g., "my-plugin.rar")
    const filePath = join(process.cwd(), "public", "downloads", product.downloadUrl);

    console.log(`📂 Reading file from: ${filePath}`);

    // Read the file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch (error) {
      console.error("❌ File not found:", error);
      return NextResponse.json(
        { error: "Download file not found on server" },
        { status: 404 }
      );
    }

    // Extract filename from downloadUrl
    const filename = product.downloadUrl.split("/").pop() || "download.rar";

    console.log(`✅ Serving file: ${filename} (${fileBuffer.length} bytes)`);

    // Convert Buffer to ArrayBuffer for NextResponse
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Return file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/x-rar-compressed",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error processing download:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
