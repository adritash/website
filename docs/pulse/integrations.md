# Adritash Pulse — Integrations

## WhatsApp Business Platform (Cloud API)

**What Raj needs to do in Meta (cannot be done from code):**

1. Meta Business portfolio → start business verification (needed to go beyond 250 unique users a day outside the 24 h window).
2. Create a Meta developer app (type Business) and add the WhatsApp product.
3. Add a phone number that is **not** registered on the WhatsApp consumer or Business app; verify it by SMS/voice; request display-name approval ("ADRITASH Pulse").
4. Create a **System User** in Business Settings, give it the app and WABA, and generate a **permanent token** with `whatsapp_business_messaging` and `whatsapp_business_management`.
5. Note: phone number ID, WABA ID, app secret (App settings → Basic).

**Environment:**

| Var | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | System-user permanent token |
| `WHATSAPP_PHONE_NUMBER_ID` | From WhatsApp → API setup |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID |
| `WHATSAPP_APP_SECRET` | App secret (used to verify `X-Hub-Signature-256`) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Any long random string you choose |
| `WHATSAPP_GRAPH_API_VERSION` | `v27.0` (current docs); bump deliberately |
| `NEXT_PUBLIC_PULSE_WHATSAPP_NUMBER` | Public number, digits only, for the click-to-chat button |

**Webhook:** in the app's WhatsApp → Configuration, set callback URL `https://www.adritash.com/api/pulse/whatsapp/webhook` and the verify token. Meta sends a GET handshake (answered only when `PULSE_ENABLED=true` and the token matches). Then **subscribe to the `messages` field**; without it nothing arrives. Use the `www` host: the apex domain redirects to `www`, and webhook deliveries should not depend on a redirect being followed.

**Templates (WhatsApp Manager → Message templates), category Utility, language English (`en`):**

| Name | Body |
|---|---|
| `pulse_price_update` | Pulse update for {{1}} ({{2}}): ₹{{3}}, {{4}} today. {{5}}. Reply STOP {{1}} to stop these updates. |
| `pulse_price_alert` | Price alert: {{1}} ({{2}}) is ₹{{3}}, {{4}} your level of ₹{{5}}. {{6}}. Reply STOP {{1}} to stop this alert. |
| `pulse_watchlist_update` | Pulse update for your watchlist: {{1}}. {{2}}. Reply STOP to stop all updates. |
| `pulse_daily_summary` | Pulse closing summary for {{1}}: {{2}}. {{3}}. Reply STOP to stop all updates. |

Sample values are in `src/pulse/modules/whatsapp/whatsapp.templates.ts`. Meta may re-categorise a utility template as marketing (about 7.5× the price in India); keep the wording strictly informational.

**Behaviour:** replies to a user message are free-form text (inside the 24 h window). Scheduled updates use free-form text if the user wrote in the last ~23 h 50 min, otherwise the approved template. Delivery statuses update each message and its billable flag.

## Market data

Configured by `MARKET_DATA_PROVIDER`:

- `none` (default): every price request answers "prices aren't switched on yet". Nothing is invented.
- `sandbox`: deterministic fake prices, every reply says "SANDBOX TEST DATA". Refused when `NODE_ENV=production`.
- `eodhd`: EODHD real-time (15–20 min delayed) endpoint. **Before production:** confirm with EODHD that `.NSE`/`.BSE` tickers are covered on the live endpoint and that a commercial licence permits display to end users on WhatsApp. If their suffixes differ, pass `exchangeSuffix` in `market-data.service.ts`.

**Adding a licensed Indian vendor (recommended: TrueData or Global Datafeeds under an NSE delayed-data licence):** implement `MarketDataProvider` (`getQuote`, `getQuotes`, `healthCheck`) in `src/pulse/modules/market-data/providers/`, map their fields to `MarketQuote` (set `dataType`, `delayMinutes`, `provider` for attribution), register it in `getProvider()`, and add a mocked-HTTP test like `tests/pulse/integration/providers.test.ts`. Validation, caching, staleness checks, health sampling and formatting are shared and need no change.

**Instrument master:** the seed adds ~50 large NSE companies with aliases. Before launch, load the full NSE list from NSE's `EQUITY_L.csv` (and BSE's list if BSE is offered) into the `Instrument` table, and keep aliases for common names.

**Holiday calendar:** NSE 2026 is seeded from circulars NSE/CMTR/71775 and 72260. Each year, add the new circular's holidays to `MarketHoliday` and a `MarketCalendarYear` row for (exchange, year). Until a year is present, alerts for that exchange do not run and the admin shows "MISSING".

## AI

`AI_PROVIDER=gemini` with `GEMINI_API_KEY` (the site's existing key works) and `AI_MODEL`. The model only classifies messages the rules parser cannot; its JSON is validated against a strict schema and stock names it returns are resolved against the instrument table. Swap providers by implementing `IntentInterpreter` in `src/pulse/modules/ai/ai.service.ts`.

## Payments (Razorpay) — disabled

1. Activate the Razorpay account (KYC).
2. Create a monthly plan for ₹99 (or the final price) in Razorpay → Subscriptions → Plans; copy its `plan_...` id into the `Plan` row with code `PLUS` (`providerPlanId`).
3. Webhook: `https://www.adritash.com/api/pulse/payments/razorpay/webhook`, a strong secret, events `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `payment.failed`, `refund.processed`.
4. Set `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, then (after the cost review) `PULSE_PAYMENTS_ENABLED=true`.

A user sends "upgrade" → Pulse creates a Razorpay subscription and sends its hosted `short_url`. The plan switches on only when a signed webhook reports the subscription `active`; it falls back to Free after `current_end` or on halt/cancel. Receipts/invoices are Razorpay-hosted (`Payment.invoiceId` stored). Refunds are issued in the Razorpay dashboard; the `refund.processed` webhook marks the payment refunded.
