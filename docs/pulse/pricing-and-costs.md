# Adritash Pulse — Pricing and cost model

**Status: paid plans are OFF** (`PULSE_PAYMENTS_ENABLED=false`). ₹99/month is a hypothesis. Do not switch payments on until the inputs marked "verify" below are confirmed and the margin is positive at your expected user count.

## How costs are tracked in the product

| Cost | Where it is recorded |
|---|---|
| WhatsApp messages | Each outbound `Message` row stores `category` and `estimatedCostInr` at send time. Meta's delivery webhook then sets `billable` and `pricingCategory`; non-billable messages are zeroed. |
| AI | `UsageRecord` `AI_REQUEST` × `PULSE_COST_AI_REQUEST_INR`. The rules parser runs first, so most messages cost nothing. |
| Market data | `UsageRecord` `MARKET_DATA_CALL` × `PULSE_COST_MARKET_DATA_CALL_INR` (0 for flat-fee plans) plus the fixed licence, which is per month, not per call. |
| Infra / support / payments | Not metered; entered as monthly inputs below. |

The admin overview shows today's estimated cost by type and cost per active user. An ops alert fires when the daily estimate exceeds `PULSE_DAILY_COST_ALERT_INR`.

## Calculator

`monthlyUnitEconomics()` in `src/pulse/modules/subscriptions/cost.service.ts` (unit-tested) computes per-paying-user monthly economics:

```
net revenue       = price / (1 + GST)
WhatsApp          = trading days × (proactive/day × utility rate + replies/day × service rate) × (1 + GST)
AI                = trading days × replies/day × AI share × cost per AI call
market data       = licence + vendor fees per month / active users
infra             = (Vercel + DB + Redis + worker) per month / active users
payment fees      = price × gateway rate × (1 + GST)
support           = estimate per user
gross margin      = net revenue − all of the above
```

### Inputs used in the table (all to be verified)

| Input | Value | Basis |
|---|---|---|
| Utility message (India) | ₹0.115 + 18% GST | Secondary sources; **verify** on Meta's INR rate card |
| Service (free-form reply in window) | ₹0 | Replies to the user's own messages; first 1,000/month per number are free. **Verify** charges beyond that. |
| Trading days | 21 / month | |
| Replies per user per day | 3 | |
| AI share / cost | 20% of replies / ₹0.02 | Gemini Flash-class pricing, **verify** |
| Market data | ₹60,000 / year | Low end of NSE's per-medium delayed-data fee seen on NSE tariff sheets, **excludes vendor feed fees**. **Verify** with NSE and the vendor. |
| Infra | ₹3,000 / month | Small worker + Redis + Postgres. **Verify** on chosen host. |
| Payment gateway | 2% + GST | Typical Razorpay standard rate, **verify** for subscriptions/UPI AutoPay |
| Support | ₹5 / user / month | Guess |

### Results (computed with the calculator, 2026-11-22)

| Scenario | WhatsApp | Data | Infra | Total cost | Net revenue | Margin |
|---|---|---|---|---|---|---|
| A. Plus, watchlist digest hourly + close (7 msgs/day), 500 users | ₹19.95 | ₹10.00 | ₹6.00 | ₹43.54 | ₹83.90 | **+₹40.36 (48%)** |
| B. Plus, 5 separate hourly alerts (31 msgs/day), 500 users | ₹88.34 | ₹10.00 | ₹6.00 | ₹111.93 | ₹83.90 | **−₹28.03** |
| C. Scenario A with only 100 users | ₹19.95 | ₹50.00 | ₹30.00 | ₹107.54 | ₹83.90 | **−₹23.64** |
| D. Scenario A, 2,000 users, 2 licensed media (₹1.2L/yr) | ₹19.95 | ₹5.00 | ₹2.50 | ₹35.04 | ₹83.90 | **+₹48.86 (58%)** |
| E. Free user, daily close only (1 msg/day), 500 users | ₹2.85 | ₹10.00 | ₹6.00 | ₹20.10 | ₹0 | **−₹20.10** |

### What this means

1. **Per-stock hourly messages lose money at ₹99.** That is why Plus defaults were set to 2 recurring updates and 16 proactive messages a day, and why "update me every hour" without a stock name sends **one watchlist digest per slot**. Keep this design.
2. **Fixed data-licence cost dominates below a few hundred paying users.** Break-even for scenario A is roughly 200–250 paying users with the assumptions above.
3. **Free users cost money** (mainly their share of fixed costs). Keep free proactive messages low (default: daily close only, 5/day cap).
4. Never advertise unlimited updates.

## Pre-launch checklist for paid plans

- [ ] Meta INR rate card for utility and service messages confirmed and env vars updated.
- [ ] Market-data licence + vendor quote in hand; per-user cost recalculated.
- [ ] Razorpay subscription fees for cards and UPI AutoPay confirmed.
- [ ] GST treatment of the ₹99 price decided with a CA (inclusive or exclusive).
- [ ] Margin positive at the realistic launch user count.
- [ ] Create the Razorpay plan, set `Plan.providerPlanId` for `PLUS`, set `PAYMENT_PROVIDER=razorpay` and `PULSE_PAYMENTS_ENABLED=true`.
