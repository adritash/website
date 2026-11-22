# Adritash Pulse — Deployment

Nothing in this document has been executed against production. It is the procedure for when credentials exist.

## Shape

| Component | Where | Why |
|---|---|---|
| Next.js site, Pulse pages, webhooks, admin | Vercel (existing project) | Already hosts adritash.com. Webhook handlers only verify, record and enqueue, so they finish well inside serverless limits. |
| Worker (`npm run pulse:worker`) | Railway, Render or Fly.io (persistent process) | Vercel cannot run long-lived workers or minute-level schedulers. |
| PostgreSQL 15+ | Neon, Supabase, Railway or Render | Managed backups and point-in-time restore. Use the pooled URL in `DATABASE_URL` and the direct URL in `DIRECT_URL` for migrations. |
| Redis 7+ | Same provider as the worker (private network), fixed-price plan | BullMQ blocks and polls; pay-per-command Redis gets expensive. Set `maxmemory-policy noeviction`. |

Recommended starting point: **Railway** project with the worker service + Redis, **Neon** Postgres in `ap-south-1` (Mumbai) or the provider's India region; Vercel functions in `bom1`. Verify current prices before choosing.

## Environments

| | Staging | Production |
|---|---|---|
| Vercel | Preview deployment of the `pulse/mvp` branch | `main` |
| WhatsApp | Meta **test number** from the app's API setup page (sends only to a few pre-verified recipient numbers) | Verified business number |
| Market data | `sandbox` or vendor trial key | Licensed vendor |
| DB/Redis | Separate small instances | Production instances |
| Payments | Razorpay test mode | Live mode (after cost review) |

Never share databases, Redis or secrets between staging and production.

## First deployment

1. **Secrets.** Generate `PULSE_ENCRYPTION_KEY`, `PULSE_PHONE_HASH_KEY` (`openssl rand -base64 32`), `PULSE_SESSION_SECRET`, `ADMIN_AUTH_SECRET` (`openssl rand -base64 48`). Store them in Vercel and the worker host's secret store. **Back up the two keys offline**: losing them makes stored phone numbers unrecoverable and every user unrecognisable. The same values must be set in Vercel and the worker.
2. **Database.** Create the DB; run `npx prisma migrate deploy` with `DATABASE_URL`/`DIRECT_URL` set (from a trusted machine or a CI step). Run `npm run pulse:seed`. Create the first admin with `npm run pulse:create-admin`.
3. **Worker.** Deploy the repo's `website/` directory with build command `npm ci` and start command `npm run pulse:worker`; set all Pulse env vars and `NODE_ENV=production`. The worker exits at start-up if required config is missing or if sandbox data is configured. Optional `WORKER_HEALTH_PORT` exposes `GET /health`. Run 1 instance; 2 is safe (scheduler claims use `SKIP LOCKED`, jobs are idempotent).
4. **Vercel.** Add the Pulse env vars to the project (Production and Preview separately). `npm run build` now runs `prisma generate` first; `postinstall` does too. Keep `PULSE_ENABLED=false` until the worker, DB and Redis are healthy; the site behaves exactly as before while it is false.
5. **Turn on.** Set `PULSE_ENABLED=true`, redeploy, check `https://www.adritash.com/api/health/ready` returns `ok`.
6. **WhatsApp webhook.** Configure as in `integrations.md`, subscribe to `messages`, send "hi" from a test phone, check the admin overview.

## Domain, DNS, SSL

No DNS change is needed: Pulse uses the existing `www.adritash.com` host on Vercel, which already serves HTTPS. Meta and Razorpay require HTTPS webhooks; Vercel provides it. The worker makes only outbound calls and needs no domain.

## Releases and migrations

- Migrations are forward-only, version-controlled in `prisma/migrations`. Apply with `prisma migrate deploy` **before** deploying code that needs them. Write migrations so the previous code still works (add columns nullable first, backfill, then tighten).
- Deploy order: migrations → worker → Vercel.

## Rollback

- Code: redeploy the previous Vercel deployment ("Promote to production") and the previous worker image.
- Pulse only: set `PULSE_ENABLED=false` on Vercel (webhooks return 404; Meta retries for a while) and stop the worker. The rest of the site is unaffected.
- Database: avoid down-migrations; restore from point-in-time backup only for data loss.

## Backups

- Enable daily backups + PITR on Postgres (7–30 days). Test a restore quarterly into a scratch DB.
- Redis holds only queues and caches; it can be rebuilt. Scheduled jobs are re-created by the worker at start-up; alerts live in Postgres.
- Keep encryption keys in a password manager and offline.

## Production smoke test (after each release)

1. `GET /api/health`, `/api/health/live`, `/api/health/ready` → 200.
2. Admin overview loads; worker heartbeat < 60 s; NSE current year "loaded".
3. From a test phone: "hi", "price of TCS" (check delay label and source), "show my alerts".
4. Existing site smoke tests: `BASE_URL=https://www.adritash.com npm test`.
