# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 web application built with React 19, TypeScript, and Tailwind CSS v4. The project is an e-commerce platform with Stripe payment integration and PostgreSQL database using Drizzle ORM. It uses the App Router architecture and is configured to use Turbopack for fast builds and development.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack (runs on http://0.0.0.0:3000)
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Run migrations then start production server
- `npm run start:prod` - Start production server without running migrations
- `npm run lint` - Run ESLint to check code quality

### Stripe
- `npm run stripe:listen` - Start Stripe CLI webhook forwarding to localhost:3000/api/webhooks/stripe

### Database
- `npm run db:push` - Push schema changes directly to database (development)
- `npm run db:migrate` - Run pending migrations
- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:studio` - Launch Drizzle Studio GUI for database management
- `npm run db:seed` - Seed database with initial data
- `npm run db:clear` - Clear all data from database
- `npm run db:reset` - Complete database reset (clear → migrate → seed)

## Architecture

### Project Structure
- **`app/`** - Next.js App Router directory containing all routes and pages
  - `layout.tsx` - Root layout with font configuration (Lato, Geist Sans, Geist Mono)
  - `page.tsx` - Home page with product catalog and checkout modal
  - `conocenos/page.tsx` - About us page
  - `kefir/page.tsx` - Kefir product page
  - `success/page.tsx` - Payment success page (displays activation codes and download links for digital products)
  - `admin/orders/page.tsx` - Admin view of all orders
  - `admin/orders/[id]/label/page.tsx` - Printable shipping label for an order
  - `components/CheckoutModal.tsx` - Stripe checkout form component
  - `components/ProductGrid.tsx` - Reusable product grid component
  - `api/checkout/route.ts` - API endpoint for creating Stripe payment intents
  - `api/webhooks/stripe/route.ts` - Stripe webhook handler (processes payment_intent.succeeded)
  - `api/verify-payment/route.ts` - Endpoint to verify payment status and create orders (returns product details including activation codes)
  - `api/download/route.ts` - Secure download endpoint for digital products (validates order before serving files)
  - `globals.css` - Global styles with Tailwind CSS v4 and CSS variables for theming

- **`public/downloads/`** - Storage directory for digital product files (WordPress plugins as password-protected RAR files)

- **`src/`** - Source code for database and utilities
  - `db/schema.ts` - Drizzle ORM database schema definitions
  - `db/index.ts` - Database connection singleton (with dev global caching)
  - `db/migrate.ts` - Database migration runner script
  - `db/seed.ts` - Database seeding script
  - `db/clear.ts` - Database cleanup script
  - `env.ts` - Environment variable validation using Zod

### Database Architecture

**Technology Stack:**
- **ORM:** Drizzle ORM with `drizzle-orm/postgres-js`
- **Database:** PostgreSQL
- **Driver:** `postgres` (postgres-js)
- **Migrations:** Drizzle Kit (outputs to `./drizzle` directory)

**Schema Design (E-commerce):**
- **`ec_products`** - Product catalog
  - Fields: id, name, description, price (numeric 10,2), stripePriceId, imageId, image, stock, isActive
  - Digital product fields: isDigital (boolean), downloadUrl (path to RAR file), activationCode (fixed password for RAR)
  - Timestamps: createdAt, updatedAt

- **`ec_orders`** - Customer orders
  - Contact: contactEmail, contactPhone
  - Shipping: shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry, shippingReferencia (optional delivery reference)
  - Order details: status (enum: pending, processing, shipped, delivered, cancelled), totalAmount (numeric 10,2)
  - Payment: stripePaymentIntentId
  - Timestamps: createdAt, updatedAt, deliveredAt
  - Indexes: status, contactEmail

- **`ec_order_items`** - Line items for each order
  - Links: orderId (cascade delete), productId (cascade delete)
  - Fields: quantity, priceAtPurchase (snapshot), productNameSnapshot
  - Index: orderId

**Database Connection Pattern:**
- Singleton pattern with global caching in development to prevent connection exhaustion during hot reloads
- Production uses direct connection without caching
- Connection exported as `database` and raw client as `pg`

### Payment Integration

**Stripe Setup:**
- Payment intents created via `/api/checkout` route
- Currency: MXN (Mexican Peso)
- Metadata stored: productId, productName, email, phone, shippingAddress, referencia
- Receipt sent to customer email
- API version: `2025-09-30.clover`
- Required env vars:
  - `STRIPE_SECRET_KEY` - Stripe secret key for API operations
  - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret for validating webhook events

**Webhook Flow:**
- Stripe webhooks received at `/api/webhooks/stripe`
- Handles `payment_intent.succeeded` event
- Creates order and order items in database
- Decrements product stock atomically using database transactions (only for physical products)
- Prevents duplicate order creation by checking if order with same `stripePaymentIntentId` already exists
- Uses race condition protection with transaction-level checks

**Digital Products (WordPress Plugins):**
- Products can be marked as digital using the `isDigital` field
- Each digital product has:
  - `downloadUrl` - Filename of the RAR file in `public/downloads/` directory
  - `activationCode` - Fixed password for opening the RAR file (set manually in database)
- After successful payment, customers see:
  - Activation code with copy button on success page
  - Download button that securely serves the file
- Download endpoint (`/api/download`) validates:
  - Order exists and contains the product
  - Payment was successful
  - Product is digital and has a download URL
- Stock is NOT decremented for digital products (unlimited downloads)

### Environment Variables

Environment validation handled by `src/env.ts` using Zod:
- `DATABASE_URL` (required, URL format) - PostgreSQL connection string
- `NODE_ENV` (optional, defaults to "development") - Environment mode
- `STRIPE_SECRET_KEY` (used but not validated in env.ts) - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` (used but not validated in env.ts) - Stripe webhook signing secret

### Styling System
- Uses **Tailwind CSS v4** with the new `@tailwindcss/postcss` plugin
- CSS variables defined in `globals.css` for theming:
  - `--background` and `--foreground` for light/dark mode colors
  - Custom Tailwind theme integration via `@theme inline`
  - Automatic dark mode support via `prefers-color-scheme`
- **Fonts loaded via `next/font/google`:**
  - **Lato** (primary font, weights: 400, 700, 900) - available via `--font-lato` variable
  - **Geist Sans** - available via `--font-geist-sans` variable
  - **Geist Mono** - available via `--font-geist-mono` variable

### TypeScript Configuration
- Path alias: `@/*` maps to project root for clean imports
- Strict mode enabled
- Target: ES2017

### Build Configuration
- **Turbopack** enabled for both dev and build commands via `--turbopack` flag
- ESLint uses flat config format (`.mjs`) with Next.js core-web-vitals and TypeScript presets
- Ignores: `node_modules`, `.next`, `out`, `build`, `next-env.d.ts`

## Development Notes

### Adding New Pages
- Create new route folders under `app/` directory following App Router conventions
- Each route can have its own `page.tsx`, `layout.tsx`, `loading.tsx`, etc.

### Working with Database
- Schema is defined in `src/db/schema.ts` using Drizzle ORM syntax
- After schema changes: run `npm run db:generate` to create migrations, then `npm run db:push` or `npm run db:migrate`
- Use Drizzle Studio (`npm run db:studio`) for visual database inspection
- All table types are auto-generated and exported (e.g., `Product`, `NewProduct`, `Order`, etc.)
- Database instance is imported as `{ database }` from `@/src/db`

### Working with Stripe Webhooks
- Use `npm run stripe:listen` to forward webhooks to local development environment
- Webhook endpoint validates signature using `STRIPE_WEBHOOK_SECRET`
- Order creation happens in webhook handler after successful payment
- Stock is decremented atomically within a transaction to prevent overselling (only for physical products)
- Webhook handler includes duplicate prevention - checks if order already exists before creating

### Working with Digital Products
- To add a new WordPress plugin product:
  1. Place the password-protected RAR file in `public/downloads/` directory
  2. Create/update product in database with:
     - `isDigital: true`
     - `downloadUrl: "filename.rar"` (just the filename, not full path)
     - `activationCode: "your-password"` (the RAR password)
     - `stock: 0` (not used for digital products)
  3. Customers will automatically see the activation code and download button after purchase
- Files are served securely through `/api/download` endpoint which validates the purchase
- Same activation code is shared by all customers who purchase that plugin

### Styling Approach
- Use Tailwind utility classes directly in components
- Reference design tokens from `globals.css` CSS variables when needed
- The theme automatically adapts to user's preferred color scheme

### Font Usage
- **Lato** (primary): Use `font-[family-name:var(--font-lato)]` in className - this is the main font for headings and body text
- **Geist Sans**: Use `font-[family-name:var(--font-geist-sans)]` in className
- **Geist Mono**: Use `font-[family-name:var(--font-geist-mono)]` in className
- All fonts are applied via CSS variable interpolation in className attributes
