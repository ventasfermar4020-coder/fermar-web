import { NextRequest, NextResponse } from "next/server";
import { getImageFromSpaces } from "@/src/lib/spaces";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;
  const key = segments.join("/");

  // Security: reject path traversal
  if (segments.some((s) => s === ".." || s === ".")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Security: only allow products/ prefix
  if (segments[0] !== "products") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Security: validate image extension
  const ext = key.substring(key.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const response = await getImageFromSpaces(key);

    const stream = response.Body?.transformToWebStream();
    if (!stream) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(response.ContentLength != null && {
          "Content-Length": String(response.ContentLength),
        }),
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "NoSuchKey"
    ) {
      return new NextResponse("Not Found", { status: 404 });
    }
    console.error("Image proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
