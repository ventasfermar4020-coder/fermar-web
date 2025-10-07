# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 web application built with React 19, TypeScript, and Tailwind CSS v4. The project is an e-commerce platform with Stripe payment integration and PostgreSQL database using Drizzle ORM. It uses the App Router architecture and is configured to use Turbopack for fast builds and development.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack (runs on http://0.0.0.0:3000)
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

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
  - `success/page.tsx` - Payment success page
  - `components/CheckoutModal.tsx` - Stripe checkout form component
  - `api/checkout/route.ts` - API endpoint for creating Stripe payment intents
  - `globals.css` - Global styles with Tailwind CSS v4 and CSS variables for theming

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
  - Fields: id, name, description, price (numeric 10,2), imageId, image, stock, isActive
  - Timestamps: createdAt, updatedAt

- **`ec_orders`** - Customer orders
  - Contact: contactEmail, contactPhone
  - Shipping: shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry
  - Order details: status (enum), totalAmount (numeric 10,2)
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
- Metadata stored: productId, productName, email, phone, shippingAddress
- Receipt sent to customer email
- API version: `2024-12-18.acacia`
- Required env var: `STRIPE_SECRET_KEY`

### Environment Variables

Environment validation handled by `src/env.ts` using Zod:
- `DATABASE_URL` (required, URL format) - PostgreSQL connection string
- `NODE_ENV` (optional, defaults to "development") - Environment mode
- `STRIPE_SECRET_KEY` (used but not validated in env.ts) - Stripe secret key

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

### Styling Approach
- Use Tailwind utility classes directly in components
- Reference design tokens from `globals.css` CSS variables when needed
- The theme automatically adapts to user's preferred color scheme

### Font Usage
- **Lato** (primary): Use `font-[family-name:var(--font-lato)]` in className - this is the main font for headings and body text
- **Geist Sans**: Use `font-[family-name:var(--font-geist-sans)]` in className
- **Geist Mono**: Use `font-[family-name:var(--font-geist-mono)]` in className
- All fonts are applied via CSS variable interpolation in className attributes
