import { hmacSha256Hex, safeEqual } from "@/pulse/lib/crypto";
import {
  webhookPayloadSchema,
  type NormalizedEvent,
  type InboundMessage,
} from "./whatsapp.types";

/** Verifies Meta's `X-Hub-Signature-256: sha256=<hex>` over the raw request body. */
export function verifyWhatsAppSignature(
  rawBody: string,
  header: string | null,
  appSecret: string | undefined
): boolean {
  if (!header || !appSecret) return false;
  const [scheme, provided] = header.split("=", 2);
  if (scheme !== "sha256" || !provided || !/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = hmacSha256Hex(appSecret, rawBody);
  return safeEqual(provided.toLowerCase(), expected);
}

/** Handles the GET subscription handshake. Returns the challenge to echo or null. */
export function verifySubscription(
  params: URLSearchParams,
  verifyToken: string | undefined
): string | null {
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  if (mode !== "subscribe" || !token || !challenge || !verifyToken) return null;
  if (!safeEqual(token, verifyToken)) return null;
  if (challenge.length > 200) return null;
  return challenge;
}

function textOf(message: InboundMessage): string | null {
  if (message.type === "text" && message.text) return message.text.body;
  if (message.type === "button" && message.button) return message.button.payload ?? message.button.text ?? null;
  if (message.type === "interactive" && message.interactive) {
    return message.interactive.button_reply?.id ?? message.interactive.list_reply?.id ?? null;
  }
  return null;
}

export type ParseResult =
  | { ok: true; events: NormalizedEvent[]; foreignNumberEvents: number }
  | { ok: false; error: string };

/**
 * Validates and flattens a webhook payload. Events addressed to a different
 * phone-number id than ours are dropped (and counted).
 */
export function parseWebhookPayload(body: unknown, expectedPhoneNumberId?: string): ParseResult {
  const parsed = webhookPayloadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "invalid_payload" };

  const events: NormalizedEvent[] = [];
  let foreignNumberEvents = 0;
  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;
      const value = change.value;
      const phoneNumberId = value.metadata?.phone_number_id;
      const count = (value.messages?.length ?? 0) + (value.statuses?.length ?? 0);
      if (expectedPhoneNumberId && phoneNumberId !== expectedPhoneNumberId) {
        foreignNumberEvents += count;
        continue;
      }
      const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));
      for (const message of value.messages ?? []) {
        events.push({
          kind: "message",
          providerMessageId: message.id,
          waId: message.from,
          profileName: names.get(message.from) ?? undefined,
          phoneNumberId,
          sentAt: new Date(Number(message.timestamp) * 1000),
          messageType: message.type,
          text: textOf(message),
        });
      }
      for (const status of value.statuses ?? []) {
        const err = status.errors?.[0];
        events.push({
          kind: "status",
          providerMessageId: status.id,
          status: status.status,
          at: new Date(Number(status.timestamp) * 1000),
          billable: status.pricing?.billable,
          pricingCategory: status.pricing?.category,
          errorCode: err?.code !== undefined ? String(err.code) : undefined,
          errorMessage: err?.title ?? err?.message,
        });
      }
    }
  }
  return { ok: true, events, foreignNumberEvents };
}

/** Idempotency key for a webhook event: one per inbound message, one per status transition. */
export function eventKey(event: NormalizedEvent): string {
  return event.kind === "message" ? `msg_${event.providerMessageId}` : `st_${event.providerMessageId}_${event.status}`;
}
