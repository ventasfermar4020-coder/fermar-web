import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomBytes } from "crypto";
import { uploadImageToSpaces } from "@/src/lib/spaces";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

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
    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = path.extname(image.name).toLowerCase();
    const randomName = randomBytes(16).toString("hex");
    const filename = `${randomName}${fileExtension}`;

    // Upload to DigitalOcean Spaces
    const publicUrl = await uploadImageToSpaces(buffer, image.type, filename);

    return NextResponse.json({
      success: true,
      path: publicUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Error uploading image:", error);

    const errorMessage = error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al subir la imagen",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
