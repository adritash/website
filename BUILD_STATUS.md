# Adritash Pulse — Build status

_Last updated: 2026-11-22 (IST)._
Branch: `pulse/mvp` (local, from `main` @ 970d248). **Uncommitted, not pushed. `main` and the live site are untouched.**

## Summary

The MVP is code-complete and works end to end **locally** (real Postgres, Redis, BullMQ worker, signed webhooks, simulated WhatsApp, sandbox prices). It is **not** deployed and **not** connected to real WhatsApp, a licensed market-data feed, or payments, because those need Raj's accounts, approvals and a data licence (see "Missing credentials"). With `PULSE_ENABLED` unset, the website builds and behaves exactly as before.

## Phases

| Phase | Status |
|---|---|
| 1. Assessment, research, architecture, plan | ✅ `docs/pulse/architecture.md`, `research.md`, `compliance.md` |
| 2. Core foundation | ✅ Prisma schema + 2 migrations, Zod config, JSON logger with redaction + correlation ids, typed errors, crypto, health endpoints, user identity, admin auth |
| 3. WhatsApp | ✅ GET verify, signed POST, payload validation, per-event idempotency, inbound queue, Cloud API client, 24 h window/template selection, status + pricing tracking, opt-out, welcome + consent |
| 4. Market data | ✅ Provider interface, EODHD adapter (unverified for India, see below), sandbox provider (refused in production), validation, Redis cache, health sampling, symbol resolver, NSE 2026 calendar |
| 5. AI assistant | ✅ Intent schema, rules parser (handles every phrase in the brief), optional Gemini interpreter with strict schema, tool registry (22 tools) with consent/limits/audit, clarification + pending context |
| 6. Watchlist + alerts | ✅ Recurring (15/30/60 min), daily close, watchlist digest, above/below/percent alerts with trigger state + re-arm, pause/resume/cancel, scheduler (`SKIP LOCKED`), executor, execution history, worker with retries, DLQ, graceful shutdown, heartbeat, maintenance jobs |
| 7. Dashboard + admin | ✅ `/pulse`, `/pulse/privacy`, `/pulse/terms` (drafts), `/pulse/dashboard` via single-use WhatsApp link, `/admin` overview/users/alerts with RBAC |
| 8. Payments + subscriptions | ✅ Plans in DB, usage enforcement, Razorpay subscription + signed webhook (**disabled** by `PULSE_PAYMENTS_ENABLED=false`), cost calculator |
| 9. Testing + hardening | ✅ see "Tests executed" |
| 10. Deployment | 🟡 Procedure documented (`docs/pulse/deployment.md`); not executed — needs accounts/credentials |

## Tests executed (all on 2026-11-22, this machine)

| What | Command | Result |
|---|---|---|
| Unit, integration, end-to-end (Vitest, real Postgres 17 + Redis 8 + BullMQ) | `npm run test:pulse` | **109 passed**, 7 files |
| Brief's 7 E2E scenarios (price query, recurring alert, cancellation, holiday, provider failure, duplicate webhook, unauthorized access) | `tests/pulse/e2e/scenarios.test.ts` | **all pass** |
| Existing site + Pulse smoke tests (Playwright) with Pulse **enabled** | `BASE_URL=http://localhost:3100 npm test` | **16 passed** |
| Same with Pulse **disabled** (production default) | `BASE_URL=http://localhost:3101 npm test` | **16 passed** |
| Production build | `npm run build` | passes, no warnings |
| Typecheck / lint | `npm run typecheck`, `npx eslint` | clean |
| Manual: real worker + `next start` + signed simulated messages | `npm run pulse:simulate -- "…"` | welcome, consent, price, track, daily summary, price alert, list alerts, dashboard link all replied correctly |
| Manual: dashboard sign-in, pause alert, link reuse rejected | Browser | works; reused link shows "expired or already used" |
| Manual: admin login, pages, wrong password, cross-origin POST | curl | 303→/admin, pages 200, wrong password rejected, cross-origin 403 |
| Manual: message queued while worker down, processed after restart; SIGTERM shutdown | worker restart | processed; clean `worker.stopped` |

Not tested: anything against real Meta, real market-data vendors, Razorpay, Vercel or a hosted worker (no credentials). Performance/load testing beyond the unit-level batch sizes has not been done.

## Files created or changed

Changed (existing): `.gitignore` (ignore `.pulse-dev`, generated Prisma client; keep `.env.example`), `README.md` (Pulse section appended), `package.json`/`package-lock.json` (deps + scripts; `build` now runs `prisma generate` first, `postinstall` added), `playwright.config.ts` (`testMatch: **/*.spec.ts`), `next.config.ts` (`serverExternalPackages: ["bullmq"]`). No existing page, component or API route was modified.

Created: `BUILD_STATUS.md`, `.env.example`, `prisma.config.ts`, `prisma/` (schema, 2 migrations, seed, seed data), `src/pulse/**` (all Pulse code), `src/app/pulse/**`, `src/app/admin/**`, `src/app/api/pulse/**`, `src/app/api/health/**`, `scripts/pulse/` (dev services, create-admin, simulate-message), `tests/pulse/**`, `tests/pulse-smoke.spec.ts`, `vitest.config.mts`, `docs/pulse/*.md` (architecture, research, compliance, setup, deployment, integrations, operations, security, pricing-and-costs).

Local-only (gitignored): `.env` (local DB/Redis URLs), `.pulse-dev/` (Postgres/Redis data, local env with generated test keys, local admin password).

## Known issues / decisions to revisit

1. **No licensed market data.** EODHD's NSE/BSE coverage on its live endpoint and its commercial licence are unverified. Recommended path: NSE delayed-data licence covering WhatsApp + an authorised vendor (TrueData/Global Datafeeds); their APIs need customer docs, so no adapter is written yet.
2. **BSE** holiday calendar and instruments not loaded; BSE alerts stay paused. **2027** NSE calendar not yet published; alerts stop on 1 Jan 2027 unless loaded (ops alert fires from 1 Dec).
3. Instrument master is a ~50-company starter list; load NSE `EQUITY_L.csv` before launch (an import script is not written yet).
4. Unit economics: per-stock hourly messages lose money at ₹99 (see `pricing-and-costs.md`); Plus limits reduced accordingly and watchlist digests added.
5. Admin has no MFA; no Postgres RLS (ownership enforced in code + tests); encryption key rotation script not written.
6. Privacy notice and terms are drafts pending legal review; grievance officer details missing.
7. `/pulse` is not linked from the site navigation (left unchanged on purpose until launch).
8. `npm audit` reports advisories in the dependency tree (pre-existing and new); review before launch.

## Missing credentials / approvals (blocking production)

| Needed | For | Owner |
|---|---|---|
| Meta Business portfolio + verification, WABA, dedicated phone number, display name, permanent system-user token, app secret | WhatsApp | Raj |
| Approval of 4 utility templates (`docs/pulse/integrations.md`) | Proactive updates | Raj |
| Market-data licence + vendor account (or EODHD written confirmation of NSE coverage + commercial display rights) | Real prices | Raj |
| Managed Postgres, Redis, worker host accounts | Deployment | Raj |
| Vercel env vars for Pulse | Deployment | Raj |
| Razorpay account + KYC, plan id, keys, webhook secret | Payments (stay off until cost review) | Raj |
| Lawyer review of privacy notice/terms; grievance officer; CA input on GST | Launch | Raj |

## External dependencies

PostgreSQL 15+, Redis 7+, Meta Graph API (`v27.0`), a market-data vendor, Gemini API (optional), Razorpay (optional), Resend (optional, ops-alert email). npm: `prisma`/`@prisma/client`/`@prisma/adapter-pg` 7.10.1, `pg`, `bullmq` 6, `ioredis` 6, `zod` 4, `vitest` 4, `tsx`, `dotenv`.

## Next actions

1. Raj: decide whether to commit `pulse/mvp` and open a PR (nothing reaches `main` without approval).
2. Raj: start Meta business verification and the market-data licence conversation (longest lead times).
3. Then: staging deployment with the Meta test number + sandbox data (`docs/pulse/deployment.md`), template approval, vendor adapter, full instrument import.
