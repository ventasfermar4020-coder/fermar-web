CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "ec_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" serial NOT NULL,
	"productId" serial NOT NULL,
	"quantity" integer NOT NULL,
	"priceAtPurchase" numeric(10, 2) NOT NULL,
	"productNameSnapshot" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ec_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"contactEmail" text NOT NULL,
	"contactPhone" text NOT NULL,
	"shippingAddress" text NOT NULL,
	"shippingCity" text NOT NULL,
	"shippingState" text NOT NULL,
	"shippingZipCode" text NOT NULL,
	"shippingCountry" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"stripePaymentIntentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deliveredAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "ec_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"imageId" text,
	"image" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ec_order_items" ADD CONSTRAINT "ec_order_items_orderId_ec_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."ec_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ec_order_items" ADD CONSTRAINT "ec_order_items_productId_ec_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ec_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "ec_order_items" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "ec_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_contact_email_idx" ON "ec_orders" USING btree ("contactEmail");