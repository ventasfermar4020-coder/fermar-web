import { z } from "zod";

// Treats empty strings as undefined so that env vars like `DO_SPACES_KEY=` don't fail validation
const optionalString = z.string().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));
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
  DO_SPACES_REGION: optionalString,
  DO_SPACES_BUCKET: optionalString,
  DO_SPACES_KEY: optionalString,
  DO_SPACES_SECRET: optionalString,
  DO_SPACES_ENDPOINT: optionalUrl,
  DO_SPACES_CDN_BASE_URL: optionalUrl,
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
  DO_SPACES_REGION: process.env.DO_SPACES_REGION,
  DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET,
  DO_SPACES_KEY: process.env.DO_SPACES_KEY,
  DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
  DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT,
  DO_SPACES_CDN_BASE_URL: process.env.DO_SPACES_CDN_BASE_URL,
});
