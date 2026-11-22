import type { Db } from "@/pulse/infrastructure/db";
import type { Queue } from "bullmq";
import { getEnv } from "@/pulse/config/env";
import { logger } from "@/pulse/infrastructure/logger";
import { jobId, type InboundJob } from "@/pulse/infrastructure/queue";
import { sha256Hex } from "@/pulse/lib/crypto";
import { securityEvent } from "@/pulse/modules/audit/audit.service";
import { applyStatusUpdate } from "./whatsapp.service";
import { eventKey, parseWebhookPayload, verifyWhatsAppSignature } from "./whatsapp.webhook";
import type { NormalizedEvent } from "./whatsapp.types";

export const MAX_WEBHOOK_BYTES = 256 * 1024;
const PROVIDER = "whatsapp";

export type IngestResult = { status: number; body: Record<string, unknown> };

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

/** Inserts the event once; returns the row and whether it was new. */
async function recordEvent(db: Db, event: NormalizedEvent, payloadHash: string) {
  const providerEventId = eventKey(event);
  try {
    const row = await db.webhookEvent.create({
      data: {
        provider: PROVIDER,
        providerEventId,
        eventType: event.kind,
        payloadHash,
        payload: { ...event, sentAt: event.kind === "message" ? event.sentAt.toISOString() : undefined, at: event.kind === "status" ? event.at.toISOString() : undefined },
      },
    });
    return { row, isNew: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const row = await db.webhookEvent.findUniqueOrThrow({ where: { provider_providerEventId: { provider: PROVIDER, providerEventId } } });
    return { row, isNew: false };
  }
}

/**
 * Handles a POST from Meta. Order matters: verify the signature on the raw body,
 * then validate, then record each event idempotently, then hand messages to the
 * queue. Returning non-2xx makes Meta redeliver, which is what we want when Redis
 * or Postgres is unavailable.
 */
export async function ingestWhatsAppWebhook(
  db: Db,
  inboundQueue: Pick<Queue<InboundJob>, "add">,
  rawBody: string,
  signatureHeader: string | null
): Promise<IngestResult> {
  const env = getEnv();
  if (Buffer.byteLength(rawBody) > MAX_WEBHOOK_BYTES) return { status: 413, body: { error: "payload_too_large" } };

  if (!verifyWhatsAppSignature(rawBody, signatureHeader, env.WHATSAPP_APP_SECRET)) {
    await securityEvent(db, { actorType: "SYSTEM", action: "whatsapp.webhook.bad_signature", outcome: "denied" });
    return { status: 401, body: { error: "invalid_signature" } };
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }

  const parsed = parseWebhookPayload(json, env.WHATSAPP_PHONE_NUMBER_ID);
  if (!parsed.ok) {
    logger.warn("whatsapp.webhook.invalid_payload");
    return { status: 400, body: { error: parsed.error } };
  }
  if (parsed.foreignNumberEvents) logger.warn("whatsapp.webhook.foreign_number", { count: parsed.foreignNumberEvents });

  const payloadHash = sha256Hex(rawBody);
  let queued = 0;
  let duplicates = 0;
  for (const event of parsed.events) {
    const { row, isNew } = await recordEvent(db, event, payloadHash);
    if (!isNew && (row.status === "QUEUED" || row.status === "PROCESSED" || row.status === "IGNORED")) {
      duplicates++;
      continue;
    }

    if (event.kind === "status") {
      // Status updates are a single indexed update; apply inline.
      const outcome = await applyStatusUpdate(db, event);
      if (outcome === "unknown_message") {
        // The status can arrive before our send call has stored the message id.
        // Leave it for the maintenance job to re-apply (see reapplyPendingStatuses).
        await db.webhookEvent.update({ where: { id: row.id }, data: { status: "RECEIVED", error: "unknown_message", attempts: { increment: 1 } } });
        continue;
      }
      await db.webhookEvent.update({
        where: { id: row.id },
        data: { status: outcome === "ignored" ? "IGNORED" : "PROCESSED", processedAt: new Date() },
      });
      continue;
    }

    await inboundQueue.add("inbound", { webhookEventId: row.id }, { jobId: jobId("in", row.id) });
    await db.webhookEvent.update({ where: { id: row.id }, data: { status: "QUEUED" } });
    queued++;
  }
  return { status: 200, body: { ok: true, queued, duplicates } };
}
