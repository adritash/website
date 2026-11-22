# Adritash Pulse — Operations runbook

## Processes

| Process | Start | Stop |
|---|---|---|
| Worker | `npm run pulse:worker` (or the host's restart button) | SIGTERM. It stops taking jobs, lets in-flight jobs finish, closes connections and exits. Unfinished jobs are retried by the next worker. |
| Web | Vercel | Set `PULSE_ENABLED=false` to switch Pulse off without touching the site. |

Durable schedules (stored in Redis, created at worker start-up):

| Job | When |
|---|---|
| `schedule-due-alerts` | every 60 s: claims due alerts, records executions, enqueues them; re-applies early delivery statuses |
| `provider-health` | every 10 min during NSE market hours |
| `ops-checks` | every 15 min |
| `calendar-check` | daily 08:00 IST and at start-up |
| `retention` | daily 02:30 IST |

## Monitoring

- **Admin → Overview:** users, alerts, messages sent/failed today, cost today, provider error rate and latency, queue depth, dead-letter count, worker heartbeat, calendar status.
- **Logs:** JSON lines with `correlationId`. Phone numbers, tokens and secrets are redacted. Lines with `"msg":"OPS_ALERT …"` are operational alerts; route them to email/Slack via your log drain. If `RESEND_API_KEY` and `OPS_ALERT_EMAIL` are set, the worker also emails each alert (at most once per hour per alert).

| Alert | Meaning | First response |
|---|---|---|
| `market_calendar` | Holiday list for this/next year missing | Load the new NSE circular into `MarketHoliday` + `MarketCalendarYear`. Alerts restart automatically (calendar-check reschedules). |
| `market_data_provider_errors` | > 20% provider errors in the last hour | Check vendor status; see "Provider outage". |
| `message_delivery_failures` | ≥ 10 failed sends in an hour | Check Meta error codes in Admin → Alerts / `Message.failureCode`. Common causes: template missing or not approved, message outside the 24 h window, quality rating or messaging-limit issues. |
| `alert_execution_failures` | ≥ 10 failed executions in an hour | Usually market data or WhatsApp; check codes. |
| `daily_cost_threshold` | Estimated spend today above `PULSE_DAILY_COST_ALERT_INR` | Look for a spike in proactive messages; pause abusive users or alerts. |
| `queue_backlog` | > 1,000 waiting jobs | Worker down or slow; check heartbeat, scale to 2 instances. |
| `worker_heartbeat_stale` | No heartbeat for 3 min | Restart the worker; check host logs. |
| `job_dead_lettered` | A job failed all retries | Inspect in Admin → Alerts (failed executions) and retry. |
| `whatsapp_daily_unique_limit` | Meta's unique-user limit reached | Proactive sends stop for the day. Complete business verification to raise the tier; adjust `WHATSAPP_DAILY_UNIQUE_LIMIT` to the new tier. |

## Handling a market-data outage

Users get "I couldn't get a reliable price … I won't show one". Alert executions retry 5 times with exponential backoff (5 s base), then are marked `FAILED` with the provider code; nothing is sent with stale or invented data. When the provider recovers, normal scheduling continues at the next slot (missed slots are skipped, not back-filled, to avoid a burst of old updates). Retry important failed executions from Admin → Alerts if still relevant.

## Failed alerts and reprocessing

- **Admin → Alerts & jobs → Failed executions → Retry** (OPERATOR+) re-queues the execution. It re-checks status, consent, plan and market session before sending, and its idempotency key prevents duplicates.
- `SEND_UNCERTAIN` messages (network failure after the request left) are **not** retried automatically, to avoid duplicates. Check Meta delivery statuses; most resolve to `SENT`/`DELIVERED` through the status webhook.
- Dead-letter queue (`pulse-dead-letter`) keeps the payload and failure reason of every job that exhausted its retries.

## Users

- Disable an abusive user: Admin → Users → Disable (pauses their alerts; inbound messages are ignored).
- Deletion requests: users self-serve ("DELETE MY DATA" + "YES DELETE", or the dashboard). An OWNER can also start erasure. The retention job erases within 24 hours (personal data, messages, watchlist, alerts deleted; the row is anonymised).

## Backup and restore

See `deployment.md`. Restore drill: restore PITR into a new database, point a staging deployment at it, run the smoke test.

## Incident response

1. Contain: `PULSE_ENABLED=false` on Vercel and/or stop the worker. The marketing site keeps working.
2. Preserve: export relevant logs and `AuditLog` rows (security events have `security = true`).
3. If personal data may be exposed: assess scope, notify affected users and the Data Protection Board as required by the DPDP Rules (timelines in `compliance.md`), rotate keys and tokens (WhatsApp system-user token, app secret, Razorpay keys, session secrets; rotating session secrets signs everyone out).
4. Fix, add a test, deploy, re-enable, write a short post-incident note.

## Yearly / periodic tasks

- December: load next year's NSE (and BSE) holiday circulars.
- Quarterly: verify Meta rate card and update `PULSE_COST_*`; check WhatsApp Graph API version deprecations; restore drill.
- Before price changes: rerun the calculator in `pricing-and-costs.md`.
