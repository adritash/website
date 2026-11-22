# Adritash Pulse — Security

## Controls implemented (and where they are tested)

| Area | Control | Test |
|---|---|---|
| Webhook authenticity | HMAC-SHA256 of raw body vs `X-Hub-Signature-256` (WhatsApp) and `X-Razorpay-Signature` (Razorpay), constant-time compare. Bad signature → 401 + security audit event. | `unit/core.test.ts`, `integration/webhooks.test.ts` |
| Webhook handshake | Verify token compared in constant time; 404 while Pulse is disabled. | `unit/core`, Playwright |
| Input validation | Zod schemas for webhook payloads, Razorpay events, intents, plan limits, conversation context; 256 KB body cap. | unit + integration |
| Idempotency / replay | `WebhookEvent (provider, providerEventId)` unique; inbound message id unique; outbound `Message.idempotencyKey` unique; `AlertExecution (alertId, scheduledFor)` unique; BullMQ job ids deterministic. Replayed events are acknowledged and ignored. | Scenario 6, alerts tests |
| Identity | WhatsApp users are identified only by the `wa_id` of a signature-verified webhook. Numbers typed in messages are never used for identity. | Scenario 1 |
| Authorisation | All user-scoped queries filter by `userId` from the identity/session; cross-user access returns "not found" and logs `alert.cross_user_access`. Tools never accept a user id. | Scenario 7 |
| AI boundary | Model output is data: strict schema (`.strict()`, enum intents), no price/time fields, stock names resolved against the instrument table, one registered tool per message, plan/consent/limits checked in code. Prompt treats user text as untrusted. Any model failure → UNKNOWN. | `unit/core.test.ts` (AI output validation) |
| Admin | DB-backed admin accounts, scrypt hashes, HMAC-signed HTTP-only `SameSite=Strict` cookie (8 h), session re-validated against DB on every request, roles OWNER/OPERATOR/VIEWER per action, same-origin check on every POST, login rate limits per IP and per email, audit log of logins and actions. Pages `noindex`. | curl checks (see BUILD_STATUS), Playwright |
| User dashboard | Single-use, 15-minute link sent only to the user's own WhatsApp; consumed by POST (link-preview bots cannot burn it); 7-day signed session cookie. | Browser check |
| Data at rest | Phone numbers: HMAC-SHA256 lookup hash + AES-256-GCM ciphertext; last 4 digits for display. Message bodies purged after 30 days; webhook payloads cleared after processing. | unit + integration |
| Logs | Redaction of phone-like numbers, bearer tokens, URL tokens and secret-named fields. | `unit/core.test.ts` |
| Abuse / cost | Per-user inbound rate limit (30 / 10 min), per-plan daily quotas (quotes, AI, proactive messages), alert count limits, Meta unique-user cap, admin/login IP limits, daily cost alert. | integration |
| Secrets | Env only; `NEXT_PUBLIC_*` holds only the public WhatsApp number and app URL. Production start-up refuses missing secrets, sandbox data and log transport. | `unit/core.test.ts` |
| Payments | Subscription state changes only from verified, deduplicated Razorpay webhooks; no card data handled. | `integration/webhooks.test.ts` |

## Known gaps / follow-ups

- Rate limiting of the public webhook endpoints by IP is left to Vercel's platform protections; Meta's IP ranges change, so we don't allow-list them.
- No database-level row-level security (RLS). Ownership is enforced in every repository function and covered by tests. Adding Postgres RLS with a per-request `app.user_id` setting is a reasonable hardening step later.
- Admin has no MFA yet. Recommended before inviting other operators (TOTP).
- Encryption key rotation requires a re-encryption script (not yet written); document key versions (`v1.` prefix already in ciphertext).
- Dependency audit: `npm audit` reports advisories in the existing dependency tree; review before launch.
