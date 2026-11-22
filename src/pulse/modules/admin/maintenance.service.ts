import type { Redis } from "ioredis";
import { Resend } from "resend";
import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { logger } from "@/pulse/infrastructure/logger";
import { istParts } from "@/pulse/lib/time";
import { eraseRequestedUsers } from "@/pulse/modules/users/user.service";
import { applyStatusUpdate } from "@/pulse/modules/whatsapp/whatsapp.service";
import type { NormalizedStatus } from "@/pulse/modules/whatsapp/whatsapp.types";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { getProvider } from "@/pulse/modules/market-data/market-data.service";
import { startOfIstDay } from "@/pulse/modules/subscriptions/usage.service";

/** Sends an ops alert by log (always) and email (if configured), at most once per hour per name. */
export async function raiseOpsAlert(redis: Redis | undefined, name: string, details: Record<string, unknown>) {
  logger.alert(name, details);
  const env = getEnv();
  if (!redis || !env.RESEND_API_KEY || !env.OPS_ALERT_EMAIL) return;
  const first = await redis.set(`pulse:opsalert:${name}`, "1", "EX", 3600, "NX");
  if (first !== "OK") return;
  try {
    await new Resend(env.RESEND_API_KEY).emails.send({
      from: "ADRITASH Pulse <contact@adritash.com>",
      to: env.OPS_ALERT_EMAIL,
      subject: `[Pulse] ${name}`,
      text: JSON.stringify(details, null, 2),
    });
  } catch (error) {
    logger.error("ops_alert.email_failed", { error });
  }
}

/** Data retention: purge message bodies, webhook payloads, used tokens; erase deleted users. */
export async function runRetention(db: Db, now = new Date()) {
  const env = getEnv();
  const contentCutoff = new Date(now.getTime() - env.PULSE_MESSAGE_RETENTION_DAYS * 24 * 3600 * 1000);
  const purged = await db.message.updateMany({ where: { createdAt: { lt: contentCutoff }, content: { not: null } }, data: { content: null, contentPurgedAt: now } });
  const payloadCutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const payloads = await db.$executeRaw`UPDATE "WebhookEvent" SET payload = NULL WHERE payload IS NOT NULL AND ("receivedAt" < ${payloadCutoff} OR status IN ('PROCESSED','IGNORED'))`;
  const tokens = await db.loginToken.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 24 * 3600 * 1000) } } });
  const auditCutoff = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
  const audits = await db.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } });
  const samples = await db.providerHealthSample.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } } });
  const erased = await eraseRequestedUsers(db);
  const result = { purgedMessages: purged.count, webhookPayloads: payloads, tokens: tokens.count, audits: audits.count, samples: samples.count, erasedUsers: erased };
  logger.info("maintenance.retention", result);
  return result;
}

/** Re-applies status webhooks that arrived before the outbound message id was stored. */
export async function reapplyPendingStatuses(db: Db) {
  const events = await db.webhookEvent.findMany({
    where: { provider: "whatsapp", eventType: "status", status: "RECEIVED", error: "unknown_message", receivedAt: { gt: new Date(Date.now() - 3600 * 1000) } },
    take: 500,
  });
  for (const e of events) {
    const p = e.payload as (Omit<NormalizedStatus, "at"> & { at: string }) | null;
    if (!p) continue;
    const outcome = await applyStatusUpdate(db, { ...p, at: new Date(p.at) });
    if (outcome !== "unknown_message") {
      await db.webhookEvent.update({ where: { id: e.id }, data: { status: "PROCESSED", processedAt: new Date(), error: null } });
    } else if (e.attempts >= 10) {
      await db.webhookEvent.update({ where: { id: e.id }, data: { status: "IGNORED", error: "unknown_message_final" } });
    } else {
      await db.webhookEvent.update({ where: { id: e.id }, data: { attempts: { increment: 1 } } });
    }
  }
}

/** Raises an alert when the official holiday calendar for this or next year is missing. */
export async function checkCalendar(redis: Redis | undefined, calendar: MarketCalendar, now = new Date()) {
  const { year, month } = istParts(now);
  const issues: string[] = [];
  if (!calendar.hasYear("NSE", year)) issues.push(`NSE ${year} calendar missing: recurring NSE alerts are paused`);
  if (month === 12 && !calendar.hasYear("NSE", year + 1)) issues.push(`NSE ${year + 1} calendar not loaded yet; alerts stop on 1 Jan without it`);
  if (!calendar.hasYear("BSE", year)) issues.push(`BSE ${year} calendar missing: BSE alerts are paused`);
  if (issues.length) await raiseOpsAlert(redis, "market_calendar", { issues });
  return issues;
}

export type OpsSnapshot = {
  failedMessagesLastHour: number;
  uncertainSendsLastHour: number;
  failedExecutionsLastHour: number;
  providerErrorRateLastHour: number | null;
  estimatedCostTodayInr: number;
};

export async function opsSnapshot(db: Db, now = new Date()): Promise<OpsSnapshot> {
  const hourAgo = new Date(now.getTime() - 3600 * 1000);
  const [failedMessages, uncertain, failedExec, samples, cost] = await Promise.all([
    db.message.count({ where: { direction: "OUTBOUND", status: "FAILED", createdAt: { gte: hourAgo } } }),
    db.message.count({ where: { direction: "OUTBOUND", status: "SEND_UNCERTAIN", createdAt: { gte: hourAgo } } }),
    db.alertExecution.count({ where: { status: "FAILED", createdAt: { gte: hourAgo } } }),
    db.providerHealthSample.groupBy({ by: ["ok"], where: { createdAt: { gte: hourAgo } }, _count: true }),
    db.usageRecord.aggregate({ where: { createdAt: { gte: startOfIstDay(now) } }, _sum: { estimatedCostInr: true } }),
  ]);
  const total = samples.reduce((n, s) => n + s._count, 0);
  const errors = samples.find((s) => !s.ok)?._count ?? 0;
  return {
    failedMessagesLastHour: failedMessages,
    uncertainSendsLastHour: uncertain,
    failedExecutionsLastHour: failedExec,
    providerErrorRateLastHour: total ? errors / total : null,
    estimatedCostTodayInr: Number(cost._sum.estimatedCostInr ?? 0),
  };
}

/** Threshold checks for alerting. Queue depth is passed in by the worker. */
export async function runOpsChecks(db: Db, redis: Redis | undefined, queueBacklog: number, workerHeartbeatAgeSec: number | null) {
  const env = getEnv();
  const s = await opsSnapshot(db);
  if (s.failedMessagesLastHour >= 10) await raiseOpsAlert(redis, "message_delivery_failures", { count: s.failedMessagesLastHour });
  if (s.failedExecutionsLastHour >= 10) await raiseOpsAlert(redis, "alert_execution_failures", { count: s.failedExecutionsLastHour });
  if (s.providerErrorRateLastHour !== null && s.providerErrorRateLastHour > 0.2) await raiseOpsAlert(redis, "market_data_provider_errors", { rate: s.providerErrorRateLastHour });
  if (s.estimatedCostTodayInr > env.PULSE_DAILY_COST_ALERT_INR) await raiseOpsAlert(redis, "daily_cost_threshold", { inr: s.estimatedCostTodayInr });
  if (queueBacklog > 1000) await raiseOpsAlert(redis, "queue_backlog", { waiting: queueBacklog });
  if (workerHeartbeatAgeSec !== null && workerHeartbeatAgeSec > 180) await raiseOpsAlert(redis, "worker_heartbeat_stale", { ageSec: workerHeartbeatAgeSec });
  return s;
}

/** Light provider probe during market hours only (avoids paying for idle calls). */
export async function probeProvider(db: Db, calendar: MarketCalendar, now = new Date()) {
  const provider = getProvider();
  if (!provider || calendar.marketStatus("NSE", now) !== "OPEN") return null;
  const r = await provider.healthCheck();
  await db.providerHealthSample.create({ data: { provider: provider.name, kind: "probe", ok: r.ok, latencyMs: r.latencyMs, errorCode: r.errorCode } });
  return r;
}
