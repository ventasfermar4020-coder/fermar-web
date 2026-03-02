import { NextRequest, NextResponse } from "next/server";
import { database } from "@/src/db";
import { products, productImages } from "@/src/db/schema";
import { asc } from "drizzle-orm";

type CreateProductRequest = {
  name: string;
  description: string;
  price: number;
  stock: number;
  isDigital: boolean;
  image: string | null;
  images?: string[]; // Multiple images for the carousel
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

    // Use the first image from the images array as the primary image (backward compat)
    const primaryImage = body.images && body.images.length > 0
      ? body.images[0]
      : body.image;

    // Insert product into database
    const [newProduct] = await database
      .insert(products)
      .values({
        name: body.name,
        description: body.description,
        price: body.price.toString(),
        stock: body.isDigital ? 0 : body.stock,
        isDigital: body.isDigital,
        image: primaryImage,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    // Insert images into product_images table
    const imagesToInsert = body.images && body.images.length > 0
      ? body.images
      : body.image
        ? [body.image]
        : [];

    if (imagesToInsert.length > 0) {
      await database.insert(productImages).values(
        imagesToInsert.map((url, index) => ({
          productId: newProduct.id,
          url,
          sortOrder: index,
        }))
      );
    }

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
    // Fetch all products
    const allProducts = await database.select().from(products);

    // Fetch all product images, sorted by sortOrder
    const allImages = await database
      .select()
      .from(productImages)
      .orderBy(asc(productImages.sortOrder));

    // Group images by productId
    const imagesByProduct = new Map<number, { id: number; url: string; sortOrder: number }[]>();
    for (const img of allImages) {
      const list = imagesByProduct.get(img.productId) || [];
      list.push({ id: img.id, url: img.url, sortOrder: img.sortOrder });
      imagesByProduct.set(img.productId, list);
    }

    // Attach images array to each product
    const productsWithImages = allProducts.map((product) => ({
      ...product,
      images: imagesByProduct.get(product.id) || [],
    }));

    return NextResponse.json({
      success: true,
      products: productsWithImages,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}
