# Fermar Web — Codebase Documentation

This repository is a Next.js (v15) application using the **App Router** ([app/] directory). It implements a small e-commerce site with:

- Public storefront and checkout flow (Stripe)
- Order persistence (Postgres + Drizzle ORM)
- Admin panel protected by Basic Auth middleware
- Stripe webhook processing + payment verification fallback
- Optional transactional emails via Resend
- Support for physical and digital products (download endpoint + activation code)

---

## Tech Stack

- **Framework**: Next.js (App Router), React 19
- **Database**: Postgres
- **ORM / Migrations**: Drizzle ORM + Drizzle Kit (SQL migrations in [drizzle/])
- **Payments**: Stripe (PaymentIntents + webhook)
- **Email**: Resend (optional)
- **Styling**: Tailwind (via PostCSS plugin)
- **Forms**: react-hook-form

---

## Top-level Structure

- **[app/]**
  Next.js App Router routes and UI.
- **[src/]**
  Server-side modules: DB, environment parsing, email client, email templates.
- **[public/]**
  Static assets:
  - `public/products/` uploaded product images (admin upload writes here)
  - `public/downloads/` digital product files (served through API download route)
- **[drizzle/]**
  Generated SQL migrations and Drizzle metadata snapshots.
- **[scripts/]**
  Small Node/TS scripts for checking/querying products.
- **[middleware.ts]**
  Basic auth protection for admin and admin API endpoints.
- **Config files**
  - [package.json], [tsconfig.json], [next.config.ts], [eslint.config.mjs], [postcss.config.mjs]
  - [docker-compose.yml] (Postgres dev container)

---

## App Router Pages and Layout

### Root Layout

- **[app/layout.tsx]**
  Root HTML layout:
  - Imports [app/globals.css]
  - Loads fonts (`Geist`, `Geist_Mono`, `Lato`)
  - Defines `metadata`

### Storefront (Public)

- **[app/page.tsx]**
  Main storefront page:
  - Server component
  - Queries active products from DB using `database` and [products] schema
  - Renders [ProductGrid] with products

- **[app/components/ProductGrid.tsx]** (client component)
  - Renders product cards
  - Opens [CheckoutModal] on purchase

- **[app/components/CheckoutModal.tsx]** (client component)
  - Collects customer/shipping details
  - Calls `POST /api/checkout` to create a Stripe PaymentIntent
  - Confirms card payment with Stripe Elements
  - Redirects to `/success?payment_intent=...`

### Static Content

- **[app/conocenos/page.tsx]**
  “About/Team” page content.

### Post-checkout Confirmation

- **[app/success/page.tsx]** (client component)
  - Reads `payment_intent` query param
  - Calls `POST /api/verify-payment` to ensure an order exists (fallback if webhook is delayed)
  - Shows order number
  - If the purchased product is digital, shows:
    - activation code (RAR password)
    - download link via `/api/download?productId=...&orderId=...`

---

## Admin Panel

Admin pages are protected by **HTTP Basic Auth** via [middleware.ts]

### Admin Pages

- **[app/admin/products/page.tsx]**
  - Server component
  - Lists all products from DB

- **[app/admin/products/new/page.tsx]** (client component)
  - Form to create a product
  - Upload flow:
    1. `POST /api/admin/upload-image` (multipart form upload)
    2. `POST /api/admin/products` (creates DB record)

- **[app/admin/orders/page.tsx]**
  - Server component
  - Lists orders from DB
  - Links to label printing page

- **`app/admin/orders/[id]/label/page.tsx`**
  - Server component
  - Fetches order and renders print-friendly label UI

- **`app/admin/orders/[id]/label/PrintButton.tsx`**
  - Client component wrapper for `window.print()`

### Admin Protection Middleware

- **[middleware.ts]**
  - Protects:
    - `/admin/products/new`
    - `/api/admin/products`
    - `/api/admin/upload-image`
  - Uses `ADMIN_USERNAME` and `ADMIN_PASSWORD` from [src/env.ts]
  - Uses a timing-safe comparison function for password matching

---

## API Routes (Server)

All API routes live under `app/api/*` as route handlers.

### Checkout

- **[app/api/checkout/route.ts]** ([POST])
  - Receives: `productId`, `email`, `phone`, `shippingAddress`, `referencia`
  - Validates product availability
  - Creates Stripe PaymentIntent with metadata used later by webhook/order creation
  - Returns `clientSecret`

### Stripe Webhook (Primary order creation path)

- **[app/api/webhooks/stripe/route.ts]** ([POST])
  - Verifies webhook signature (`STRIPE_WEBHOOK_SECRET`)
  - Handles `payment_intent.succeeded`
  - Idempotency / duplication protection:
    - Checks if an order already exists for `stripePaymentIntentId`
  - Uses a DB transaction:
    - If product is physical: decrements stock
    - Inserts [orders] and `orderItems`
  - Optional email sending (if configured):
    - Uses [src/lib/email.ts]
    - Uses templates in `src/emails/*`

### Payment Verification (Fallback order creation path)

- **[app/api/verify-payment/route.ts]** ([POST])
  - Receives: `paymentIntentId`
  - Retrieves PaymentIntent from Stripe and confirms it is `succeeded`
  - If order already exists, returns it (and product details)
  - Otherwise creates order (and decrements stock for physical products) in a transaction
  - Returns:
    - `orderId`
    - `alreadyProcessed`
    - `product` (includes digital download info/activation code)

This endpoint is used by [app/success/page.tsx] to ensure orders exist even if webhooks are delayed or not firing.

### Digital Downloads

- **[app/api/download/route.ts]** ([GET])
  - Query params: `productId`, `orderId`
  - Validates:
    - order item exists for that order/product
    - order has a `stripePaymentIntentId` (payment verified)
    - product is digital and has a `downloadUrl`
  - Reads file from:
    - `public/downloads/<product.downloadUrl>`
  - Serves file as attachment (`application/x-rar-compressed`)

### Admin API

- **[app/api/admin/products/route.ts]**
  - [GET]: returns all products
  - [POST]: validates and inserts product into DB

- **[app/api/admin/upload-image/route.ts]**
  - [POST]: receives `multipart/form-data`
  - Validates file type and size
  - Writes image into `public/products/`
  - Returns public path like `/products/<filename>`

---

## Server-side Modules ([src/])

### Environment Handling

- **[src/env.ts]**
  - Validates environment variables with Zod
  - Exposes `env` object used across server code
  - Key vars include:
    - `DATABASE_URL`
    - `RESEND_API_KEY`, `OWNER_EMAIL` (optional)
    - `ADMIN_USERNAME`, `ADMIN_PASSWORD` (optional but required for admin)
    - `NODE_ENV`

Note: [.env.example] exists but may be gitignored in this workspace view.

### Database

- **[src/db/index.ts]**
  - Creates Drizzle `database` connection using `postgres` driver
  - In non-production, stores db handle in `global` to avoid re-creating connections during hot reload

- **[src/db/schema.ts]**
  Defines tables:
  - `ec_products` ([products])
    - includes physical/digital fields:
      - `isDigital`
      - `downloadUrl`
      - `activationCode`
  - `ec_orders` ([orders])
  - `ec_order_items` (`orderItems`)
  - Also defines relations and inferred TS types

- **[src/db/migrate.ts]**
  CLI migration runner used by `npm run db:migrate`

- **[src/db/seed.ts]**
  Seeds initial products

- **[src/db/clear.ts]**
  Drops and recreates schemas (destructive reset)

### Email

- **[src/lib/email.ts]**
  Lazy singleton for Resend client ([getResendClient()])

- **[src/emails/owner-new-order.ts]**
  HTML generator for owner notification email

- **[src/emails/customer-order-confirmation.ts]**
  HTML generator for customer confirmation email

Email sending is triggered from [app/api/webhooks/stripe/route.ts] only, and only when `RESEND_API_KEY` and `OWNER_EMAIL` are configured.

---

## Migrations ([drizzle/])

- **`drizzle/*.sql`**
  SQL migrations generated by Drizzle Kit.

- **`drizzle/meta/*`**
  Snapshot and journal metadata for Drizzle migration state.

The migration config is in [drizzle.config.ts] pointing at [./src/db/schema.ts] and outputting to [./drizzle].

---

## Tooling and Configuration

- **[package.json]**
  Important scripts:
  - `dev`: `next dev --turbopack`
  - `start`: runs `db:migrate` then `next start`
  - `db:*`: drizzle kit + tsx scripts
  - `stripe:listen`: forwards Stripe webhooks to local `/api/webhooks/stripe`

- **[next.config.ts]**
  Image settings: `unoptimized` in development.

- **[tsconfig.json]**
  Path alias:
  - `@/*` maps to project root (used like `@/src/db`)

- **[postcss.config.mjs]**
  Tailwind postcss plugin: `@tailwindcss/postcss`

- **[eslint.config.mjs]**
  Extends `next/core-web-vitals` and `next/typescript`

- **[docker-compose.yml]**
  Postgres container for local development (maps host port `5433` to container `5432`).

---

## Relationship Map (How key parts connect)

### Storefront -> Checkout -> Order Creation

- **[app/page.tsx]**
  - Reads [products] from DB via [src/db/index.ts] + [src/db/schema.ts]
  - Renders [ProductGrid]

- **[ProductGrid] -> [CheckoutModal]**
  - Opens checkout UI and collects details

- **[CheckoutModal] -> `POST /api/checkout`**
  - Creates Stripe PaymentIntent (server uses DB price for security)

- **After payment**
  - Redirect to [app/success/page.tsx]
  - [success] calls `POST /api/verify-payment`
    - ensures an order exists (fallback)

- **Primary backend order creation**
  - Stripe triggers `POST /api/webhooks/stripe`
  - Webhook creates [orders] + `orderItems`, decrements stock for physical items, sends emails optionally

### Digital delivery

- If product is digital:
  - [verify-payment] returns `downloadUrl` and `activationCode`
  - [success] page links to `GET /api/download`
  - [download] validates the order and serves the file from `public/downloads`

### Admin

- Admin pages (`app/admin/*`) + admin APIs (`app/api/admin/*`)
  - Protected by [middleware.ts] basic auth
  - Admin product creation uploads images into `public/products` and writes DB records

---

## Notes / Known Characteristics

- The app currently assumes **1 item per order** (quantity fixed at 1 in order creation).
- Emails are **optional** and only sent if environment variables are configured.
- There is a deliberate “dual processing system” for orders:
  - webhook (preferred)
  - verify-payment fallback (for reliability)
  See [PAYMENT_FLOW_FIX.md] for background.

---