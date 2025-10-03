# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 web application built with React 19, TypeScript, and Tailwind CSS v4. The project uses the App Router architecture and is configured to use Turbopack for fast builds and development.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Architecture

### Project Structure
- **`app/`** - Next.js App Router directory containing all routes and pages
  - `layout.tsx` - Root layout with font configuration (Lato, Geist Sans, Geist Mono)
  - `page.tsx` - Home page component with hero section, statistics grid, and image cards
  - `globals.css` - Global styles with Tailwind CSS v4 and CSS variables for theming

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

### Styling Approach
- Use Tailwind utility classes directly in components
- Reference design tokens from `globals.css` CSS variables when needed
- The theme automatically adapts to user's preferred color scheme

### Font Usage
- **Lato** (primary): Use `font-[family-name:var(--font-lato)]` in className - this is the main font for headings and body text
- **Geist Sans**: Use `font-[family-name:var(--font-geist-sans)]` in className
- **Geist Mono**: Use `font-[family-name:var(--font-geist-mono)]` in className
- All fonts are applied via CSS variable interpolation in className attributes
