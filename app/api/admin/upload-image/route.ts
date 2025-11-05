import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = path.extname(image.name);
    const randomName = randomBytes(16).toString("hex");
    const filename = `${randomName}${fileExtension}`;

    // Save to public/products directory
    const filepath = path.join(process.cwd(), "public", "products", filename);
    await writeFile(filepath, buffer);

    // Return the path relative to public directory
    const publicPath = `/products/${filename}`;

    return NextResponse.json({
      success: true,
      path: publicPath,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}
