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

## Architecture

- **App Router** (`app/`) — `layout.tsx` defines the root HTML shell with Geist font variables loaded via `next/font/google`; `page.tsx` is the home route. All new pages go under `app/`.
- **Tailwind CSS v4** — configured via `postcss.config.mjs` using `@tailwindcss/postcss`. There is no `tailwind.config.js`; utility classes are resolved automatically. Global styles live in `app/globals.css`.
- **TypeScript** — `tsconfig.json` is canonical. `next-env.d.ts` is auto-generated; do not edit it.
- **No custom Next.js config** — `next.config.ts` exports an empty `nextConfig` object.
