import { Storage } from "@google-cloud/storage";
import { env } from "@/src/env";

export class ObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Object not found: ${key}`);
    this.name = "ObjectNotFoundError";
  }
}

let cached: Storage | null = null;

function parseCredentials(raw: string): { client_email: string; private_key: string } {
  // Accept either raw JSON or base64-encoded JSON. Base64 sidesteps `.env`
  // newline-escaping bugs that mangle the PEM `private_key` and cause
  // "Cannot call write after a stream was destroyed" from JWT signing.
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf-8");
  const parsed = JSON.parse(json);
  if (typeof parsed.private_key === "string") {
    // If dotenv stored the literal "\n" characters instead of real newlines, restore them.
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

function getStorage(): Storage {
  if (cached) return cached;
  if (!env.GCS_CREDENTIALS_JSON || !env.GCS_PROJECT_ID) {
    throw new Error(
      "GCP Cloud Storage is not configured. Set GCS_PROJECT_ID and GCS_CREDENTIALS_JSON."
    );
  }
  cached = new Storage({
    projectId: env.GCS_PROJECT_ID,
    credentials: parseCredentials(env.GCS_CREDENTIALS_JSON),
  });
  return cached;
}

export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<string> {
  if (!env.GCS_BUCKET) {
    throw new Error("GCS_BUCKET is not configured.");
  }

  const key = `products/${filename}`;
  await getStorage()
    .bucket(env.GCS_BUCKET)
    .file(key)
    .save(buffer, {
      contentType,
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });

  return `/api/images/${key}`;
}

export interface ImageFetchResult {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
}

export async function getImage(key: string): Promise<ImageFetchResult> {
  if (!env.GCS_BUCKET) {
    throw new Error("GCS_BUCKET is not configured.");
  }

  const file = getStorage().bucket(env.GCS_BUCKET).file(key);

  try {
    const [meta] = await file.getMetadata();
    return {
      stream: file.createReadStream(),
      contentType: meta.contentType,
      contentLength:
        typeof meta.size === "string" ? Number(meta.size) : (meta.size as number | undefined),
    };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 404) {
      throw new ObjectNotFoundError(key);
    }
    throw error;
  }
}
