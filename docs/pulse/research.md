# Adritash Pulse — Provider research (Phase 1)

Researched 2026-11-22 from official documentation where reachable. Items marked **UNVERIFIED** came from secondary sources or could not be confirmed and must be checked before launch.

## 1. WhatsApp Business Platform (Meta Cloud API)

Official sources: [Pricing](https://developers.facebook.com/docs/whatsapp/pricing), [Send messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages), [Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview), [Messaging limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits), [Webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint).

| Topic | Confirmed facts | Pulse implementation |
|---|---|---|
| Choice | Official Cloud API (hosted by Meta). No unofficial WhatsApp Web libraries. | `whatsapp.client.ts` calls `POST https://graph.facebook.com/{version}/{phone-number-id}/messages`. Version is config (`WHATSAPP_GRAPH_API_VERSION`, default `v27.0`, which is what current send-message examples use). |
| Webhook verify | GET with `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`; reply 200 with the raw challenge. The handshake is not signed. | `GET /api/pulse/whatsapp/webhook`, constant-time compare with `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. |
| Webhook signature | `X-Hub-Signature-256: sha256=<HMAC-SHA256(raw body, app secret)>`. | Verified on the raw body before parsing. |
| Subscription | The app must subscribe the WABA to the `messages` webhook field, or nothing is delivered. | Documented in `integrations.md`. |
| Pricing model | Per-message since 1 July 2025 (conversation pricing deprecated). Charged on delivery, by category (marketing, utility, authentication, service) and recipient country. | `Message.category`, `Message.billable`, `Message.estimatedCostInr` populated from status webhooks' `pricing` object. |
| Service window | A user message opens a 24-hour window, reset by each new user message. Inside it any message type may be sent; outside it only approved templates. | `User.lastInboundAt`; sender picks free-form vs template. |
| Utility inside window | Free from 1 Jul 2025 to 30 Sep 2026. **From 1 Oct 2026 Meta resumed charging** for utility templates in an open window. Service (free-form) messages: first 1,000 per business number per month free (agent-read; re-check the page wording before modelling). | Cost model treats every Pulse proactive alert as billable utility. |
| Rate changes | Only on 1 Jan, 1 Apr, 1 Jul, 1 Oct. INR billing for India since 1 Jan 2026; non-INR accounts must migrate by 31 Dec 2026. | Rates live in config / DB, not code. |
| India rates | **UNVERIFIED** (Meta's INR rate-card CSV not fetched). Secondary sources: utility ≈ ₹0.115 / message, marketing ≈ ₹0.8631 / message, + 18% GST. | Defaults in `PULSE_COST_*` env vars, flagged as estimates in admin. |
| Templates | Proactive (outside window) messages need an APPROVED template; categories marketing / utility / authentication. Meta may recategorise utility templates it considers promotional. | Three utility templates defined in `whatsapp.templates.ts`; content must avoid promotional wording. |
| Messaging limits | Unique users messaged outside the window per rolling 24 h: 250 for a new portfolio, 2,000 after verification / scaling path, then 10k, 100k, unlimited. | Worker caps proactive sends per 24 h (`WHATSAPP_DAILY_UNIQUE_LIMIT`, default 250). |
| Business requirements | Meta Business portfolio, WhatsApp Business Account, a phone number not registered on the consumer app, display-name approval, business verification to lift the 250 limit. | Listed as credentials/approvals Raj must obtain. |
| Opt-in / opt-out | Recipients must have opted in. WhatsApp Business Messaging Policy requires honouring opt-out requests. | Explicit consent per recurring alert, global `STOP` keyword, `START` to resume. |

## 2. Indian market data

**Exchange position (confirmed from NSE tariff sheets).** NSE market data is licensed. Real-time vendors may show 15-minute (or older) delayed data on their *own* terminals without extra fees for display only; delivering delayed or EOD data as feeds to clients needs NSE's written consent. NSE's 15-min delayed data tariff is charged **per medium** of display, and a website and a mobile app count as separate media (sheet values seen: ₹60,000–₹90,000 per medium, depending on sheet version — **UNVERIFIED which is current**). WhatsApp delivery would very likely be its own medium. Sources: [NSE 15-min delayed tariff](https://nsearchives.nseindia.com/web/sites/default/files/inline-files/Download%2015%20mins%20delayed%20data%20tariff.pdf), [NSE EOD tariff](https://nsearchives.nseindia.com/s3fs-public/inline-files/Download%20EOD%20data%20tariff.pdf).

| Candidate | NSE | BSE | RT / delayed | Commercial redistribution to consumers via WhatsApp | Notes |
|---|---|---|---|---|---|
| NSE direct (NSE Data & Analytics) | Yes | No | Both | Yes, under a licence + per-medium fees | Most defensible. Needs agreement; real-time display licences are expensive (third-party report of ~₹29 lakh/yr for a real-time website snapshot, **UNVERIFIED**). |
| BSE direct | No | Yes | Both | Yes, under licence | Separate agreement; BSE site blocks automated access, so terms not fetched. |
| TrueData (NSE/BSE authorised vendor) | Yes | Yes | RT, delayed, EOD | Their terms limit data to the subscriber; redistribution / commercial display needs exchange approval. | Good technical fit **once** the NSE delayed licence is in place. |
| Global Datafeeds (authorised vendor) | Yes | Yes | RT, delayed, EOD | Same model: exchange licence required for redistribution. | Same as TrueData. |
| EODHD | **UNVERIFIED** (exchange list shows `XNSE`; `.NSE` ticker not confirmed) | **UNVERIFIED** | Live endpoint is 15–20 min delayed | Personal plans forbid redistribution/display; commercial licence via sales. | Clean, documented REST API (`/api/real-time/{ticker}`), used as the first adapter. |
| Twelve Data | India shown as EOD | — | EOD for India | Commercial plans exist; India intraday not offered on public page (page ~1 yr old). | Not suitable for intraday India. |
| Broker APIs (Kite Connect, Upstox, etc.) | Yes | Yes | RT | **No** — for the account holder's own use; not a redistribution licence. | Rejected. |
| Scraping NSE/BSE websites or undocumented JSON | — | — | — | **Not permitted** by the brief and exchange terms. | Rejected. |

**Recommendation.** Launch as a **clearly labelled 15-minute delayed** product. Commercially: obtain an NSE delayed-data licence covering the WhatsApp medium (and the web dashboard if prices are shown there) and source the feed from an authorised vendor (TrueData or Global Datafeeds) or NSE directly. Technically: Pulse ships a provider interface with an **EODHD adapter** (documented API, for development and for production only once EODHD confirms NSE coverage and a commercial licence) and a **sandbox provider** that returns clearly-labelled fixture data, is used only in tests/dev, and is **refused at startup when `NODE_ENV=production`**. A TrueData/GDF adapter is a single new class once their API docs and credentials are provided; I have not written one because their API docs are behind a customer login and the brief forbids inventing endpoints.

**No provider is configured today, so the production path returns "price unavailable" and never a number.**

## 3. Market calendar

Source of truth: NSE circular [NSE/CMTR/71775](https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf) (12 Dec 2025) + addendum [NSE/CMTR/72260](https://nsearchives.nseindia.com/content/circulars/CMTR72260.pdf) (15 Jan 2026 holiday). Normal session 09:15–15:30 IST. Muhurat session (8 Nov 2026) not supported for alerts. Seeded into `MarketHoliday` with the circular reference. **BSE 2026 list not verified** (BSE site blocks automated fetch), so BSE recurring alerts stay blocked until an operator loads BSE holidays. **2027 lists are not published yet** (NSE usually publishes in December); the maintenance job raises an ops alert from 1 Dec if next year's calendar is missing, and alerts stop (fail safe) on 1 Jan if it is still missing.

## 4. Payments — Razorpay

Sources: [Subscriptions webhooks](https://razorpay.com/docs/payments/subscriptions/subscribe-to-webhooks/), [Webhook validation](https://razorpay.com/docs/webhooks/validate-test/).

- Webhook signature: `X-Razorpay-Signature` = HMAC-SHA256(raw body, webhook secret) — the webhook secret, not the API key. Deduplicate on `x-razorpay-event-id`.
- Events used: `subscription.authenticated`, `subscription.activated`, `subscription.charged` (each successful charge), `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `payment.failed`, `refund.processed`.
- Subscription creation: `POST https://api.razorpay.com/v1/subscriptions` with `plan_id`, `total_count`, `customer_notify`, `notes` (basic auth key:secret); response contains `short_url` for the hosted payment page, which Pulse sends on WhatsApp. Card data never touches Pulse.
- Razorpay KYC/activation and plan creation in the dashboard are prerequisites. Paid plans stay disabled (`PULSE_PAYMENTS_ENABLED=false`) until the cost review in `pricing-and-costs.md` passes.

## 5. AI provider

Reuse Gemini (`@google/genai`, key already configured for the site) via `models.generateContent` with `responseMimeType: application/json` + `responseJsonSchema`. Wrapped in `IntentInterpreter` so Claude/OpenAI can be swapped in. The rules parser handles common intents first; AI calls are capped per user per day.

## 6. Worker hosting options (cost estimates **UNVERIFIED**, check current price pages)

| Option | Worker | Redis | Postgres | Notes |
|---|---|---|---|---|
| Railway (recommended) | usage-based, small worker ≈ US$5/mo | Redis service in same project | Railway Postgres, or Neon | One dashboard, private networking between worker and Redis. |
| Render | Background worker (Starter) | Render Key Value | Render Postgres | Fixed monthly prices, simple. |
| Fly.io | Machine | Upstash via Fly | Neon / Supabase | Cheapest, more ops. |

Avoid pay-per-command serverless Redis for BullMQ: BullMQ polls and blocks, which inflates per-command bills; use a fixed-price Redis instance.
