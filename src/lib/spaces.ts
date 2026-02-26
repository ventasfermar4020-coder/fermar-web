import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/src/env";

function getSpacesClient() {
  if (
    !env.DO_SPACES_ENDPOINT ||
    !env.DO_SPACES_KEY ||
    !env.DO_SPACES_SECRET ||
    !env.DO_SPACES_REGION
  ) {
    throw new Error(
      "DigitalOcean Spaces is not configured. Set DO_SPACES_ENDPOINT, DO_SPACES_KEY, DO_SPACES_SECRET, and DO_SPACES_REGION."
    );
  }

  return new S3Client({
    endpoint: env.DO_SPACES_ENDPOINT,
    region: env.DO_SPACES_REGION,
    credentials: {
      accessKeyId: env.DO_SPACES_KEY,
      secretAccessKey: env.DO_SPACES_SECRET,
    },
    forcePathStyle: false,
  });
}

export async function uploadImageToSpaces(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<string> {
  if (!env.DO_SPACES_BUCKET || !env.DO_SPACES_CDN_BASE_URL) {
    throw new Error(
      "DigitalOcean Spaces is not configured. Set DO_SPACES_BUCKET and DO_SPACES_CDN_BASE_URL."
    );
  }

  const client = getSpacesClient();
  const key = `products/${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  // Return full CDN URL
  const cdnBase = env.DO_SPACES_CDN_BASE_URL.replace(/\/$/, "");
  return `${cdnBase}/${key}`;
}
