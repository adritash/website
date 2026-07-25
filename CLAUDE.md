# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js 16

This project uses **Next.js 16**, which has breaking changes — APIs, conventions, and file structure may all differ from your training data. Before writing any routing, middleware, or data-fetching code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
npm run dev       # Dev server (http://localhost:3000)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint via eslint-config-next
```

## Source Layout

All source lives under `src/` — there is no top-level `app/` directory.

```
src/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root HTML shell (fonts, Navbar, Footer, metadata)
│   ├── page.tsx          # Home — hero + credibility + who-we-help + services + why + process + CTA
│   ├── services/         # 12-card services page (3 practices × 4 cards, each with SVG icon)
│   ├── projects/         # Case studies grid
│   ├── insights/         # Blog + Case Studies + White Papers + Resources (anchor-linked sections)
│   ├── about/            # Mission + Founder (Dwaipayan Rajguru) sections
│   ├── contact/          # Contact form UI (no backend wired yet)
│   ├── solutions/        # Detailed 3-practice breakdown (not in nav, still accessible)
│   └── industries/       # Industry sectors (not in nav, still accessible)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx    # "use client" — sticky nav, active-link via usePathname, mobile hamburger
│   │   └── Footer.tsx    # Server component — links + email + LinkedIn
│   ├── sections/
│   │   └── PageHero.tsx  # Shared dark hero banner (props: title, subtitle)
│   └── ui/               # Shared primitive UI components (currently empty — add here)
├── styles/
│   └── globals.css       # Tailwind import + CSS variables for light/dark theme
├── hooks/                # Empty — add custom hooks here
├── lib/                  # Empty — add utilities here
├── types/                # Empty — add shared TypeScript types here
└── content/              # Empty — blog/, services/, projects/ subdirs for future MDX
```

## Architecture

- **`@/` alias** resolves to `src/` (configured in `tsconfig.json`). Use `@/components/...`, `@/lib/...`, etc. throughout.
- **Tailwind CSS v4** — configured via `postcss.config.mjs` using `@tailwindcss/postcss`. There is **no** `tailwind.config.js`; utilities resolve automatically. Theme tokens live in `src/styles/globals.css` under `@theme inline`.
- **Navbar is a Client Component** (`"use client"`) because it uses `useState` (mobile menu) and `usePathname` (active link). Footer and all page components are Server Components.
- **Navigation links** (Home · Services · Projects · Insights · About · Contact) — `solutions` and `industries` pages exist but are not in the nav.
- **SVG icons** are inline throughout — no icon library is installed. Use Heroicons 24px outline paths to stay consistent.
- **No backend** — no API routes, no server actions, no database. Contact form is UI only.
- **No tests** — no test runner is configured.

## Brand Context

Adritash is an enterprise technology consultancy founded by **Dwaipayan Rajguru**. Brand tagline: *"Enterprise Architecture. Cloud Modernization. AI-Powered Transformation."* The three service practices are Consulting (Architecture), AI Solutions (Automation), and Cloud Services (Modernization). Do not refer to Adritash as a personal portfolio — it is a consultancy brand.
