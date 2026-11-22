import { z } from "zod";
import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { logger } from "@/pulse/infrastructure/logger";
import { hmacSha256Hex, safeEqual, sha256Hex } from "@/pulse/lib/crypto";
import { audit, securityEvent } from "@/pulse/modules/audit/audit.service";
import type { PaymentStatus, SubscriptionStatus } from "@/pulse/generated/prisma/enums";

/** Razorpay signs the raw body: X-Razorpay-Signature = hex(HMAC-SHA256(body, webhook secret)). */
export function verifyRazorpaySignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!signature || !secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return safeEqual(signature.toLowerCase(), hmacSha256Hex(secret, rawBody));
}

const entity = <T extends z.ZodRawShape>(shape: T) => z.object({ entity: z.object(shape).passthrough() });

const eventSchema = z.object({
  event: z.string().max(80),
  created_at: z.number().optional(),
  payload: z
    .object({
      subscription: entity({
        id: z.string(),
        status: z.string(),
        current_start: z.number().nullable().optional(),
        current_end: z.number().nullable().optional(),
        notes: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).optional(),
      }).optional(),
      payment: entity({
        id: z.string(),
        amount: z.number().int(),
        currency: z.string(),
        status: z.string(),
        invoice_id: z.string().nullable().optional(),
        error_description: z.string().nullable().optional(),
      }).optional(),
      refund: entity({ id: z.string(), payment_id: z.string(), amount: z.number().int() }).optional(),
    })
    .passthrough(),
});

const SUB_STATUS: Record<string, SubscriptionStatus> = {
  created: "CREATED",
  authenticated: "AUTHENTICATED",
  active: "ACTIVE",
  pending: "PENDING",
  halted: "HALTED",
  cancelled: "CANCELLED",
  completed: "COMPLETED",
  expired: "EXPIRED",
};

const PAY_STATUS: Record<string, PaymentStatus> = {
  created: "CREATED",
  authorized: "AUTHORIZED",
  captured: "CAPTURED",
  failed: "FAILED",
  refunded: "REFUNDED",
};

export type WebhookOutcome = { status: number; body: Record<string, unknown> };

/**
 * Applies a Razorpay event. Subscription state is changed only here, from a
 * signature-verified, deduplicated provider event — never from the browser or AI.
 */
export async function handleRazorpayWebhook(db: Db, rawBody: string, signature: string | null, eventId: string | null): Promise<WebhookOutcome> {
  const env = getEnv();
  if (!verifyRazorpaySignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
    await securityEvent(db, { actorType: "SYSTEM", action: "razorpay.webhook.bad_signature", outcome: "denied" });
    return { status: 401, body: { error: "invalid_signature" } };
  }
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) return { status: 400, body: { error: "invalid_payload" } };
  const event = parsed.data;
  const providerEventId = eventId && eventId.length <= 100 ? eventId : `hash_${sha256Hex(rawBody)}`;

  try {
    await db.webhookEvent.create({ data: { provider: "razorpay", providerEventId, eventType: event.event, payloadHash: sha256Hex(rawBody), status: "RECEIVED" } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      const existing = await db.webhookEvent.findUnique({ where: { provider_providerEventId: { provider: "razorpay", providerEventId } } });
      if (existing?.status === "PROCESSED" || existing?.status === "IGNORED") return { status: 200, body: { ok: true, duplicate: true } };
    } else throw error;
  }

  const subEntity = event.payload.subscription?.entity;
  const payEntity = event.payload.payment?.entity;
  let outcome: "PROCESSED" | "IGNORED" = "IGNORED";

  if (subEntity) {
    const sub = await db.subscription.findUnique({ where: { providerSubscriptionId: subEntity.id } });
    if (!sub) {
      logger.warn("razorpay.unknown_subscription", { event: event.event });
    } else {
      const status = SUB_STATUS[subEntity.status] ?? sub.status;
      await db.subscription.update({
        where: { id: sub.id },
        data: {
          status,
          startAt: subEntity.current_start ? new Date(subEntity.current_start * 1000) : sub.startAt,
          endAt: subEntity.current_end ? new Date(subEntity.current_end * 1000) : sub.endAt,
          cancelledAt: status === "CANCELLED" ? new Date() : sub.cancelledAt,
        },
      });
      if (payEntity) {
        const payStatus = PAY_STATUS[payEntity.status] ?? "CREATED";
        await db.payment.upsert({
          where: { providerPaymentId: payEntity.id },
          update: { status: payStatus, failureReason: payEntity.error_description ?? undefined },
          create: {
            userId: sub.userId,
            subscriptionId: sub.id,
            provider: "razorpay",
            providerPaymentId: payEntity.id,
            amountPaise: payEntity.amount,
            currency: payEntity.currency,
            status: payStatus,
            invoiceId: payEntity.invoice_id ?? undefined,
            failureReason: payEntity.error_description ?? undefined,
          },
        });
      }
      await audit(db, { actorType: "SYSTEM", action: `subscription.${event.event}`, resourceType: "Subscription", resourceId: sub.id, outcome: "success", metadata: { status } });
      outcome = "PROCESSED";
    }
  } else if (payEntity && (event.event === "payment.failed" || event.event === "payment.captured")) {
    const existing = await db.payment.findUnique({ where: { providerPaymentId: payEntity.id } });
    if (existing) {
      await db.payment.update({ where: { id: existing.id }, data: { status: PAY_STATUS[payEntity.status] ?? existing.status, failureReason: payEntity.error_description ?? undefined } });
      outcome = "PROCESSED";
    }
  } else if (event.event === "refund.processed" && event.payload.refund) {
    const refund = event.payload.refund.entity;
    const existing = await db.payment.findUnique({ where: { providerPaymentId: refund.payment_id } });
    if (existing) {
      await db.payment.update({ where: { id: existing.id }, data: { status: "REFUNDED" } });
      outcome = "PROCESSED";
    }
  }

  await db.webhookEvent.update({
    where: { provider_providerEventId: { provider: "razorpay", providerEventId } },
    data: { status: outcome, processedAt: new Date() },
  });
  return { status: 200, body: { ok: true } };
}
