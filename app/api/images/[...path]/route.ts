import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getImage, ObjectNotFoundError } from "@/src/lib/storage";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;
  const key = segments.join("/");

  if (segments.some((s) => s === ".." || s === ".")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (segments[0] !== "products") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { stream, contentType, contentLength } = await getImage(key);
    const webStream = Readable.toWeb(stream as Readable) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(contentLength != null && {
          "Content-Length": String(contentLength),
        }),
      },
    });
  } catch (error: unknown) {
    if (error instanceof ObjectNotFoundError) {
      return new NextResponse("Not Found", { status: 404 });
    }
    console.error("Image proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
