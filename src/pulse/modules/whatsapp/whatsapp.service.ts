import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { currentCorrelationId, logger } from "@/pulse/infrastructure/logger";
import { LimitError, PulseError } from "@/pulse/lib/errors";
import { istDateKey } from "@/pulse/lib/time";
import { phoneForSending, type PulseUser } from "@/pulse/modules/users/user.service";
import { recordUsage } from "@/pulse/modules/subscriptions/usage.service";
import { estimateMessageCost } from "@/pulse/modules/subscriptions/cost.service";
import { getTransport, WhatsAppApiError, type OutboundPayload } from "./whatsapp.client";
import { flattenParam, TEMPLATES, type TemplateKey } from "./whatsapp.templates";
import type { MessageCategory, MessageStatus } from "@/pulse/generated/prisma/enums";
import type { NormalizedStatus } from "./whatsapp.types";
import type { Redis } from "ioredis";

const WINDOW_MS = 24 * 3600 * 1000;
// Keep a safety margin so a message is never sent seconds after the window closes.
const WINDOW_MARGIN_MS = 10 * 60 * 1000;

export function isWithinServiceWindow(lastInboundAt: Date | null | undefined, now = new Date()): boolean {
  if (!lastInboundAt) return false;
  return now.getTime() - lastInboundAt.getTime() < WINDOW_MS - WINDOW_MARGIN_MS;
}

export type OutboundContent = {
  /** Free-form text, allowed only inside the customer-service window. */
  text: string;
  /** Approved template used when the window is closed. Omit for replies (always in-window). */
  template?: { key: TemplateKey; params: string[] };
};

export type SendOptions = {
  idempotencyKey: string;
  /** "reply" answers an inbound message; "proactive" is an alert the user subscribed to. */
  purpose: "reply" | "proactive";
  alertId?: string;
  conversationId?: string;
  redis?: Redis;
};

export type SendOutcome =
  | { status: "sent"; messageId: string; providerMessageId: string; category: MessageCategory }
  | { status: "duplicate"; messageId: string }
  | { status: "skipped"; reason: "window_closed_no_template" | "opted_out" | "daily_limit" | "user_inactive" };

/**
 * Sends one message to a user with exactly-once intent:
 * a Message row with a unique idempotency key is written before calling Meta, so a
 * retried job finds it and does not send again. Retryable API failures (429/5xx,
 * where Meta definitely did not accept the message) leave the row re-sendable.
 */
export async function sendToUser(db: Db, user: PulseUser, content: OutboundContent, opts: SendOptions): Promise<SendOutcome> {
  const env = getEnv();
  if (user.status !== "ACTIVE") return { status: "skipped", reason: "user_inactive" };
  if (opts.purpose === "proactive" && user.proactiveOptOutAt) return { status: "skipped", reason: "opted_out" };

  const inWindow = isWithinServiceWindow(user.lastInboundAt);
  let payload: OutboundPayload;
  let category: MessageCategory;
  let templateName: string | undefined;
  if (inWindow) {
    payload = { type: "text", text: content.text };
    category = "SERVICE";
  } else if (content.template) {
    const def = TEMPLATES[content.template.key];
    payload = {
      type: "template",
      name: def.name,
      language: env.WHATSAPP_TEMPLATE_LANGUAGE,
      bodyParameters: content.template.params.map(flattenParam),
    };
    category = def.category;
    templateName = def.name;
  } else {
    return { status: "skipped", reason: "window_closed_no_template" };
  }

  const existing = await db.message.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
  if (existing && existing.status !== "FAILED") return { status: "duplicate", messageId: existing.id };
  if (existing && existing.failureCode && !existing.failureCode.startsWith("RETRYABLE_")) {
    return { status: "duplicate", messageId: existing.id };
  }

  // Meta limits how many unique users a business may message outside the window per 24 h.
  if (opts.purpose === "proactive" && !inWindow && opts.redis) {
    const key = `pulse:wa:unique:${istDateKey(new Date())}`;
    const added = await opts.redis.sadd(key, user.id);
    await opts.redis.expire(key, 2 * 24 * 3600);
    const size = await opts.redis.scard(key);
    if (added === 1 && size > env.WHATSAPP_DAILY_UNIQUE_LIMIT) {
      await opts.redis.srem(key, user.id);
      logger.alert("whatsapp_daily_unique_limit", { limit: env.WHATSAPP_DAILY_UNIQUE_LIMIT });
      return { status: "skipped", reason: "daily_limit" };
    }
  }

  const estimatedCostInr = estimateMessageCost(category);
  const message = existing
    ? await db.message.update({
        where: { id: existing.id },
        data: { status: "PENDING", failureCode: null, failureReason: null, messageType: payload.type, category, templateName },
      })
    : await db.message.create({
        data: {
          userId: user.id,
          conversationId: opts.conversationId,
          idempotencyKey: opts.idempotencyKey,
          direction: "OUTBOUND",
          messageType: payload.type,
          content: content.text,
          status: "PENDING",
          category,
          templateName,
          alertId: opts.alertId,
          estimatedCostInr,
          correlationId: currentCorrelationId(),
        },
      });

  try {
    const result = await getTransport().send(phoneForSending(user), payload);
    await db.message.update({
      where: { id: message.id },
      data: { status: "SENT", providerMessageId: result.providerMessageId, sentAt: new Date(), statusUpdatedAt: new Date() },
    });
    await recordUsage(db, { userId: user.id, usageType: "WHATSAPP_OUTBOUND", estimatedCostInr, metadata: { category } });
    return { status: "sent", messageId: message.id, providerMessageId: result.providerMessageId, category };
  } catch (error) {
    if (error instanceof WhatsAppApiError) {
      const status: MessageStatus = error.uncertain ? "SEND_UNCERTAIN" : "FAILED";
      await db.message.update({
        where: { id: message.id },
        data: {
          status,
          failureCode: error.retryable ? `RETRYABLE_${error.code}` : error.code,
          failureReason: error.message,
          statusUpdatedAt: new Date(),
        },
      });
      if (error.uncertain) {
        // Do not resend: Meta may have delivered it. Visible to admins as SEND_UNCERTAIN.
        logger.warn("whatsapp.send_uncertain", { messageId: message.id });
        throw new PulseError("WA_SEND_UNCERTAIN", "Send outcome unknown", { retryable: false, cause: error });
      }
      throw error;
    }
    await db.message.update({
      where: { id: message.id },
      data: { status: "FAILED", failureCode: "RETRYABLE_UNEXPECTED", failureReason: String(error).slice(0, 300) },
    });
    throw error;
  }
}

const STATUS_RANK: Record<string, number> = { PENDING: 0, SEND_UNCERTAIN: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4 };

/** Applies a delivery-status webhook to the outbound message. Never downgrades a status. */
export async function applyStatusUpdate(db: Db, event: NormalizedStatus): Promise<"updated" | "unknown_message" | "ignored"> {
  const map: Record<string, MessageStatus> = { sent: "SENT", delivered: "DELIVERED", read: "READ", failed: "FAILED" };
  const next = map[event.status];
  if (!next) return "ignored";
  const message = await db.message.findUnique({ where: { providerMessageId: event.providerMessageId } });
  if (!message) return "unknown_message";
  const current = message.status;
  const upgrade = (STATUS_RANK[next] ?? 0) > (STATUS_RANK[current] ?? 0) || current === "SEND_UNCERTAIN";
  const data: Parameters<Db["message"]["update"]>[0]["data"] = {
    billable: event.billable ?? message.billable,
    pricingCategory: event.pricingCategory ?? message.pricingCategory,
  };
  if (event.billable === false) data.estimatedCostInr = 0;
  if (upgrade) {
    data.status = next;
    data.statusUpdatedAt = event.at;
    if (next === "FAILED") {
      data.failureCode = event.errorCode ? `META_${event.errorCode}` : "META_FAILED";
      data.failureReason = event.errorMessage?.slice(0, 300);
    }
  }
  await db.message.update({ where: { id: message.id }, data });
  return "updated";
}

export { LimitError };
