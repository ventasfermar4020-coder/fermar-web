ALTER TABLE "ec_products" ADD COLUMN "category" text;--> statement-breakpoint
-- Backfill categories for existing products. Everything currently in the
-- catalog is a toy except the Avon beauty set, which goes under Regalos.
UPDATE "ec_products" SET "category" = 'Juguetes' WHERE "category" IS NULL;--> statement-breakpoint
UPDATE "ec_products" SET "category" = 'Regalos' WHERE "name" = 'Set de Belleza Avon';