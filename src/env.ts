import { z } from "zod";

// Treats empty strings as undefined so that env vars like `GCS_BUCKET=` don't fail validation
const optionalString = z.string().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalEmail = z.string().email().optional().or(z.literal("").transform(() => undefined));

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RESEND_API_KEY: optionalString,
  OWNER_EMAIL: optionalEmail,
  ADMIN_USERNAME: optionalString,
  ADMIN_PASSWORD: optionalString,
  AUTH_SECRET: optionalString,
  GEMINI_API_KEY: optionalString,
  // GCP Cloud Storage: GCS_BUCKET is just the bucket name; GCS_CREDENTIALS_JSON is the
  // full service-account JSON key on a single line.
  GCS_PROJECT_ID: optionalString,
  GCS_BUCKET: optionalString,
  GCS_CREDENTIALS_JSON: optionalString,
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  AUTH_SECRET: process.env.AUTH_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
  GCS_BUCKET: process.env.GCS_BUCKET,
  GCS_CREDENTIALS_JSON: process.env.GCS_CREDENTIALS_JSON,
});
