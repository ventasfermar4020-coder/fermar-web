/**
 * One-shot migration: copy products/* from DigitalOcean Spaces to GCP Cloud Storage.
 *
 * Reads DO_SPACES_* and GCS_* env vars directly (not via src/env.ts, which no longer
 * declares DO_SPACES_*). Idempotent: skips objects that already exist in GCS.
 *
 * Run: npx tsx scripts/migrate-spaces-to-gcs.ts
 */
import "dotenv/config";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

async function main() {
  const doEndpoint = required("DO_SPACES_ENDPOINT");
  const doRegion = required("DO_SPACES_REGION");
  const doBucket = required("DO_SPACES_BUCKET");
  const doKey = required("DO_SPACES_KEY");
  const doSecret = required("DO_SPACES_SECRET");

  const gcsProjectId = required("GCS_PROJECT_ID");
  const gcsBucket = required("GCS_BUCKET");
  const gcsCredentialsJson = required("GCS_CREDENTIALS_JSON");

  const s3 = new S3Client({
    endpoint: doEndpoint,
    region: doRegion,
    credentials: { accessKeyId: doKey, secretAccessKey: doSecret },
    forcePathStyle: false,
  });

  const storage = new Storage({
    projectId: gcsProjectId,
    credentials: JSON.parse(gcsCredentialsJson),
  });
  const bucket = storage.bucket(gcsBucket);

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: doBucket,
        Prefix: "products/",
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of list.Contents ?? []) {
      if (!obj.Key) continue;
      const key = obj.Key;

      try {
        const [exists] = await bucket.file(key).exists();
        if (exists) {
          skipped++;
          console.log(`SKIP  ${key} (already in GCS)`);
          continue;
        }

        const get = await s3.send(
          new GetObjectCommand({ Bucket: doBucket, Key: key })
        );
        if (!get.Body) {
          console.warn(`WARN  ${key} has empty body`);
          failed++;
          continue;
        }

        const buffer = await streamToBuffer(get.Body as NodeJS.ReadableStream);
        await bucket.file(key).save(buffer, {
          contentType: get.ContentType || "application/octet-stream",
          resumable: false,
          metadata: { cacheControl: "public, max-age=31536000, immutable" },
        });

        copied++;
        console.log(`COPY  ${key} (${buffer.length} bytes)`);
      } catch (err) {
        failed++;
        console.error(`FAIL  ${key}:`, err);
      }
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`\nDone. copied=${copied} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
