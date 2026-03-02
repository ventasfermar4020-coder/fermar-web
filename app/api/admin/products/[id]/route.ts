import { NextRequest, NextResponse } from "next/server";
import { database } from "@/src/db";
import { products, productImages } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400 }
      );
    }

    const [product] = await database
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const images = await database
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        images: images.map((img) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}

type UpdateProductRequest = {
  name: string;
  description: string;
  price: number;
  stock: number;
  isDigital: boolean;
  image: string | null;
  images?: string[];
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400 }
      );
    }

    const body: UpdateProductRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.description || body.price === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (body.price < 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor o igual a 0" },
        { status: 400 }
      );
    }

    if (!body.isDigital && body.stock < 0) {
      return NextResponse.json(
        { error: "El inventario debe ser mayor o igual a 0" },
        { status: 400 }
      );
    }

    // Check product exists
    const [existing] = await database
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Determine primary image from images array or single image field
    const primaryImage = body.images && body.images.length > 0
      ? body.images[0]
      : body.image ?? existing.image;

    // Update product
    const [updated] = await database
      .update(products)
      .set({
        name: body.name,
        description: body.description,
        price: body.price.toString(),
        stock: body.isDigital ? 0 : body.stock,
        isDigital: body.isDigital,
        image: primaryImage,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    // Update product images if images array was provided
    if (body.images) {
      // Delete all existing images for this product
      await database
        .delete(productImages)
        .where(eq(productImages.productId, productId));

      // Insert new images with proper sort order
      if (body.images.length > 0) {
        await database.insert(productImages).values(
          body.images.map((url, index) => ({
            productId,
            url,
            sortOrder: index,
          }))
        );
      }
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}
