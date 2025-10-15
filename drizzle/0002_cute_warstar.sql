ALTER TABLE "ec_products" ADD COLUMN "isDigital" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ec_products" ADD COLUMN "downloadUrl" text;--> statement-breakpoint
ALTER TABLE "ec_products" ADD COLUMN "activationCode" text;