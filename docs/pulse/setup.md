# Adritash Pulse — Local setup

Everything below was run on macOS (Apple silicon) on 2026-11-22.

## 1. Prerequisites

```bash
brew install postgresql@17 redis
```

Node 20+ (tested on Node 25). From `website/`:

```bash
npm install            # also runs `prisma generate`
```

## 2. Start Postgres and Redis

```bash
npm run pulse:services
```

This starts a throwaway Postgres on port 54329 (databases `pulse_dev`, `pulse_test`) and Redis on 63799, with data in `.pulse-dev/` (gitignored). Stop them with `./scripts/pulse/dev-services.sh stop`.

## 3. Configure

Create `website/.env` (read by Prisma, the worker and Next.js) with at least:

```
DATABASE_URL=postgresql://pulse@localhost:54329/pulse_dev
REDIS_URL=redis://localhost:63799
```

For a full local run, create `.pulse-dev/local.env` from the Pulse section of `.env.example` with:

- `PULSE_ENABLED=true`
- generated keys (`openssl rand -base64 32` for the two 32-byte keys, `openssl rand -base64 48` for the two secrets)
- any test values for `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`
- `MARKET_DATA_PROVIDER=sandbox` (clearly labelled fake prices; refused in production)
- `PULSE_WHATSAPP_TRANSPORT=log` (prints outbound messages instead of calling Meta; refused in production)
- `NEXT_PUBLIC_APP_URL=http://localhost:3100`

## 4. Database

```bash
npx prisma migrate deploy     # apply migrations
npm run pulse:seed            # plans, NSE 2026 holidays, starter instruments
PULSE_ADMIN_PASSWORD='<at least 12 chars>' npm run pulse:create-admin -- you@example.com OWNER
```

## 5. Run

```bash
npm run build
set -a; source .pulse-dev/local.env; set +a
npx next start -p 3100        # web app + webhooks
npm run pulse:worker          # in a second terminal with the same env
```

Simulate WhatsApp messages (signed like Meta's) against the local server:

```bash
npm run pulse:simulate -- "price of TCS"
npm run pulse:simulate -- "send me daily closing prices"
npm run pulse:simulate -- "dashboard"
```

The worker log shows each reply (`whatsapp.dev_outbound`). Open the dashboard link from the "dashboard" reply, and the admin at http://localhost:3100/admin.

## 6. Tests

```bash
npm run test:pulse            # Vitest: unit, integration (real Postgres + Redis + BullMQ), end-to-end scenarios
BASE_URL=http://localhost:3100 npm test   # Playwright smoke tests for the site and Pulse pages
npm run typecheck && npm run lint
```

Vitest applies migrations to `pulse_test` (non-destructive `migrate deploy`) and truncates its tables between tests; it refuses to run against a non-local database.
