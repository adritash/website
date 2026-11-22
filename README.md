This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# ADRITASH Pulse

Pulse is a WhatsApp assistant for Indian stock-market information (NSE/BSE equities): prices with clear data-freshness labels, a personal watchlist, scheduled updates during market hours, and price alerts. It lives in this app under `/pulse`, `/admin` and `/api/pulse/*`, with a separate worker process for scheduling.

**Status:** MVP code complete and tested locally; not deployed. Pulse is off unless `PULSE_ENABLED=true`; with it off, the website behaves exactly as before. See [`BUILD_STATUS.md`](./BUILD_STATUS.md).

| | |
|---|---|
| Stack | Next.js 16 (web, webhooks, dashboards) · TypeScript · PostgreSQL + Prisma 7 · Redis + BullMQ worker · Zod · Gemini (optional, intent classification only) |
| Architecture | [`docs/pulse/architecture.md`](./docs/pulse/architecture.md) |
| Local setup, running, tests | [`docs/pulse/setup.md`](./docs/pulse/setup.md) |
| Deployment | [`docs/pulse/deployment.md`](./docs/pulse/deployment.md) |
| WhatsApp, market data, AI, payments | [`docs/pulse/integrations.md`](./docs/pulse/integrations.md) |
| Operations runbook | [`docs/pulse/operations.md`](./docs/pulse/operations.md) |
| Security | [`docs/pulse/security.md`](./docs/pulse/security.md) |
| Costs and pricing | [`docs/pulse/pricing-and-costs.md`](./docs/pulse/pricing-and-costs.md) |
| Research and compliance | [`docs/pulse/research.md`](./docs/pulse/research.md), [`docs/pulse/compliance.md`](./docs/pulse/compliance.md) |

Quick start:

```bash
npm install
npm run pulse:services          # local Postgres + Redis (brew install postgresql@17 redis)
npx prisma migrate deploy && npm run pulse:seed
npm run test:pulse              # unit, integration and end-to-end scenarios
npm run pulse:worker            # worker (needs the Pulse env vars, see .env.example)
```

## Product limitations (MVP)

- **Market data:** no licensed provider is connected yet. Until one is, Pulse says prices are unavailable and never shows a number. Data is delayed (typically 15 minutes) and always labelled; Pulse never claims real-time.
- **Coverage:** NSE equities with the official 2026 NSE holiday calendar. BSE listings and calendar are not loaded (BSE alerts are paused until they are). No derivatives, indices, crypto, commodities or international markets.
- **WhatsApp:** proactive updates outside the 24-hour window require Meta-approved utility templates; new business accounts can message at most 250 unique users a day outside the window until verified.
- **Frequencies:** updates every 15, 30 or 60 minutes during 09:15–15:30 IST on trading days, or a daily closing summary (~15:50 IST). Plans allow a subset (Free: daily summary only; Plus: hourly). Price alerts are checked every 15 minutes, so they can lag the move.
- **Subscriptions:** paid plans are implemented with Razorpay but switched off until the cost review passes.
