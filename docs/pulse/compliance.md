# Adritash Pulse — Compliance checklist

This is an engineering checklist, **not legal advice**. "Confirmed" = stated in a primary/official source I read. "Recommendation" = good practice that Raj should confirm with a lawyer. Nothing here is a legal conclusion.

## Digital Personal Data Protection Act 2023 + DPDP Rules 2025

Confirmed (PIB release, Gazette summaries by law firms): the DPDP Rules were notified on 13–14 Nov 2025 with phased commencement. Board/definitions provisions applied immediately; consent-manager registration ~12 months later (Nov 2026); **the core fiduciary obligations (notice, consent, security safeguards, breach intimation, erasure, grievance redressal) apply from ~13 May 2027**. Exact dates vary slightly between summaries; check the Gazette.

| # | Item | Type | Pulse status |
|---|---|---|---|
| 1 | Itemised privacy notice in clear language (data collected, purpose, how to withdraw consent, how to complain to the Board) | Confirmed obligation (from May 2027) | `/pulse/privacy` page + link in the welcome message |
| 2 | Consent must be free, specific, informed, unambiguous, by clear affirmative action; withdrawal as easy as giving it | Confirmed obligation | User must reply `AGREE` before Pulse stores a watchlist or alert; `STOP` withdraws messaging consent; `DELETE MY DATA` starts erasure. Each event is a `ConsentRecord` with text version |
| 3 | Purpose limitation and erasure once purpose is served | Confirmed obligation | Message bodies purged after 30 days; deletion request erases user data within the job window (audit rows keep only hashes) |
| 4 | Reasonable security safeguards (encryption, access control, logs) | Confirmed obligation | Phone AES-256-GCM + HMAC, RBAC admin, audit log, log redaction |
| 5 | Breach intimation to the Board and affected users | Confirmed obligation | **Process** documented in `operations.md`; no automation |
| 6 | Grievance contact published | Confirmed obligation | Contact email on privacy page; Raj must confirm the named grievance contact |
| 7 | Children's data needs verifiable parental consent | Confirmed obligation | Recommendation: terms state 18+ only; Pulse does not knowingly onboard minors |
| 8 | Retention: Rules prescribe log retention for at least one year for certain fiduciaries | Reported in summaries, **verify applicability** | Audit log retained 1 year by default |

## WhatsApp policy

| Item | Type | Status |
|---|---|---|
| Opt-in before business-initiated messages | Confirmed (Meta docs: recipients must have opted in) | Consent per recurring alert |
| Honour opt-out | Confirmed (WhatsApp Business Messaging Policy) | `STOP` / `STOP TCS` / `STOP ALL` |
| Templates for messages outside 24 h window | Confirmed | Utility templates |
| Don't send promotional content in utility templates | Confirmed (Meta recategorises) | Templates contain only requested price data |

## Financial-data disclaimers (recommendations unless noted)

- Pulse is information only; not investment advice; Adritash is not a SEBI-registered investment adviser or research analyst (recommendation: this disclaimer in welcome, help, terms). Pulse must not give buy/sell recommendations — enforced: no such intent exists, and the AI prompt forbids it. Whether SEBI IA/RA regulations are triggered by pure price relays should be confirmed by a lawyer; my understanding is they are aimed at advice/recommendations, but that is not a legal conclusion.
- Data freshness label on every price (confirmed requirement of the brief and of NSE delayed-data display terms, which require delayed data to be shown as delayed — **verify exact NSE display wording in the licence**).
- Source attribution per provider licence.

## Payments and subscriptions

- RBI e-mandate rules for recurring card/UPI payments (pre-debit notification, AFA above limits) are handled by Razorpay subscriptions — **confirm in Razorpay's current docs at activation**.
- GST: Meta bills 18% GST on WhatsApp charges (secondary source). Pulse's own ₹99 price: GST registration/thresholds and whether ₹99 is GST-inclusive is a decision for Raj and his CA.
- Consumer Protection (E-Commerce) Rules 2020 (recommendation to confirm applicability): show seller identity, grievance officer, refund/cancellation policy, total price incl. taxes before payment. Terms page has placeholders for these.

## Required before public launch

1. Lawyer review of privacy notice and terms.
2. NSE (and BSE if offered) data licence covering WhatsApp display.
3. Meta business verification + approved templates.
4. Grievance officer name and address.
