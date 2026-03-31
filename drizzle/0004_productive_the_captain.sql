CREATE TABLE "ec_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ec_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ec_orders" ADD COLUMN "userId" integer;--> statement-breakpoint
ALTER TABLE "ec_orders" ADD CONSTRAINT "ec_orders_userId_ec_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ec_users"("id") ON DELETE set null ON UPDATE no action;