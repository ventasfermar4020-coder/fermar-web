import { NextRequest, NextResponse } from "next/server";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";
import { eq } from "drizzle-orm";

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

    return NextResponse.json({ success: true, product });
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

    // Update product — keep existing image if no new one provided
    const [updated] = await database
      .update(products)
      .set({
        name: body.name,
        description: body.description,
        price: body.price.toString(),
        stock: body.isDigital ? 0 : body.stock,
        isDigital: body.isDigital,
        image: body.image ?? existing.image,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}
