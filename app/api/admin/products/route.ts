import { NextRequest, NextResponse } from "next/server";
import { database } from "@/src/db";
import { products } from "@/src/db/schema";

type CreateProductRequest = {
  name: string;
  description: string;
  price: number;
  stock: number;
  isDigital: boolean;
  image: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.description || body.price === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validate price
    if (body.price < 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor o igual a 0" },
        { status: 400 }
      );
    }

    // Validate stock for physical products
    if (!body.isDigital && body.stock < 0) {
      return NextResponse.json(
        { error: "El inventario debe ser mayor o igual a 0" },
        { status: 400 }
      );
    }

    // Insert product into database
    const [newProduct] = await database
      .insert(products)
      .values({
        name: body.name,
        description: body.description,
        price: body.price.toString(),
        stock: body.isDigital ? 0 : body.stock,
        isDigital: body.isDigital,
        image: body.image,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allProducts = await database.select().from(products);
    return NextResponse.json({
      success: true,
      products: allProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}
