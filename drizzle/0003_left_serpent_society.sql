CREATE TABLE "ec_product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"url" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ec_product_images" ADD CONSTRAINT "ec_product_images_productId_ec_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ec_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "ec_product_images" USING btree ("productId");