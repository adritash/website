import type { Queue } from "bullmq";
import type { Db } from "@/pulse/infrastructure/db";
import { logger } from "@/pulse/infrastructure/logger";
import { jobId, type AlertJob } from "@/pulse/infrastructure/queue";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { computeNextRun, graceMinutes, isValidSlot } from "./alert.schedule";
import type { AlertType, Exchange } from "@/pulse/generated/prisma/enums";

type DueRow = { id: string; exchange: Exchange; alertType: AlertType; frequencyMinutes: number | null; nextRunAt: Date };

export type TickResult = { claimed: number; queued: number; skippedClosed: number; missed: number; calendarUnavailable: number; requeued: number };

/**
 * One scheduler tick. Claims due alerts with FOR UPDATE SKIP LOCKED so several
 * worker instances never claim the same alert, records an AlertExecution per slot
 * (unique on alertId+scheduledFor, the idempotency key), advances nextRunAt, then
 * enqueues jobs whose id is the execution id. Safe to run repeatedly and after a crash.
 */
export async function runSchedulerTick(
  db: Db,
  calendar: MarketCalendar,
  alertsQueue: Pick<Queue<AlertJob>, "add">,
  now = new Date(),
  batchSize = 200
): Promise<TickResult> {
  const result: TickResult = { claimed: 0, queued: 0, skippedClosed: 0, missed: 0, calendarUnavailable: 0, requeued: 0 };
  const toQueue: string[] = [];

  await db.$transaction(async (tx) => {
    const due = await tx.$queryRaw<DueRow[]>`
      SELECT id, exchange, "alertType", "frequencyMinutes", "nextRunAt"
      FROM "Alert"
      WHERE status = 'ACTIVE' AND "nextRunAt" IS NOT NULL AND "nextRunAt" <= ${now}
      ORDER BY "nextRunAt" ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED`;
    result.claimed = due.length;

    for (const alert of due) {
      const scheduledFor = alert.nextRunAt;
      const lateMinutes = (now.getTime() - scheduledFor.getTime()) / 60_000;
      const slot = isValidSlot(calendar, alert.exchange, alert.alertType, scheduledFor);
      let status: "QUEUED" | "SKIPPED_MARKET_CLOSED" | "SKIPPED_CALENDAR_UNAVAILABLE" | "SKIPPED_MISSED" = "QUEUED";
      if (slot === "UNKNOWN") status = "SKIPPED_CALENDAR_UNAVAILABLE";
      else if (slot === "CLOSED") status = "SKIPPED_MARKET_CLOSED";
      else if (lateMinutes > graceMinutes(alert.alertType, alert.frequencyMinutes)) status = "SKIPPED_MISSED";

      const created = await tx.alertExecution.createMany({
        data: [{ alertId: alert.id, scheduledFor, status, executedAt: status === "QUEUED" ? null : now }],
        skipDuplicates: true,
      });

      const next = computeNextRun(calendar, alert.exchange, alert.alertType, alert.frequencyMinutes, now > scheduledFor ? now : scheduledFor);
      await tx.alert.update({ where: { id: alert.id }, data: { nextRunAt: next.at } });
      if (next.at === null) {
        result.calendarUnavailable++;
        logger.alert("market_calendar_unavailable", { exchange: alert.exchange, alertId: alert.id });
      }

      if (created.count === 1) {
        if (status === "QUEUED") {
          const exec = await tx.alertExecution.findUniqueOrThrow({ where: { alertId_scheduledFor: { alertId: alert.id, scheduledFor } }, select: { id: true } });
          toQueue.push(exec.id);
        } else if (status === "SKIPPED_MARKET_CLOSED") result.skippedClosed++;
        else if (status === "SKIPPED_MISSED") result.missed++;
        else result.calendarUnavailable++;
      }
    }
  });

  // Recovery: executions left QUEUED by a crash between commit and enqueue.
  const stranded = await db.alertExecution.findMany({
    where: { status: "QUEUED", createdAt: { lt: new Date(now.getTime() - 2 * 60_000), gt: new Date(now.getTime() - 60 * 60_000) } },
    select: { id: true },
    take: 200,
  });
  for (const s of stranded) if (!toQueue.includes(s.id)) { toQueue.push(s.id); result.requeued++; }

  for (const executionId of toQueue) {
    await alertsQueue.add("execute", { executionId }, { jobId: jobId("exec", executionId) });
    result.queued++;
  }
  if (result.claimed) logger.info("scheduler.tick", result);
  return result;
}

/**
 * Re-computes nextRunAt for active alerts that have none (e.g. calendar was
 * missing and has since been loaded).
 */
export async function rescheduleUnscheduled(db: Db, calendar: MarketCalendar, now = new Date()): Promise<number> {
  const alerts = await db.alert.findMany({ where: { status: "ACTIVE", nextRunAt: null }, take: 500 });
  let n = 0;
  for (const a of alerts) {
    const next = computeNextRun(calendar, a.exchange, a.alertType, a.frequencyMinutes, now);
    if (next.at) {
      await db.alert.update({ where: { id: a.id }, data: { nextRunAt: next.at } });
      n++;
    }
  }
  return n;
}
