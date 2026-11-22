import type { Redis } from "ioredis";
import type { Queue } from "bullmq";
import type { Db } from "@/pulse/infrastructure/db";
import { logger } from "@/pulse/infrastructure/logger";
import { errorMessage } from "@/pulse/lib/errors";
import type { AlertJob } from "@/pulse/infrastructure/queue";
import { loadCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import type { MarketDataProvider } from "@/pulse/modules/market-data/market-data.types";
import { processInboundMessage } from "@/pulse/modules/conversations/conversation.service";
import { executeAlert } from "@/pulse/modules/alerts/alert.executor";
import { rescheduleUnscheduled, runSchedulerTick } from "@/pulse/modules/alerts/alert.scheduler";
import { checkCalendar, probeProvider, reapplyPendingStatuses, runOpsChecks, runRetention } from "@/pulse/modules/admin/maintenance.service";
import type { NormalizedInbound } from "@/pulse/modules/whatsapp/whatsapp.types";
import { Prisma } from "@/pulse/generated/prisma/client";
import "@/pulse/modules/ai/tools";

export type ProcessorDeps = { db: Db; redis?: Redis; provider?: MarketDataProvider | null; now?: () => Date };

/** Processes one queued inbound WhatsApp event. Idempotent: PROCESSED events are skipped. */
export async function processInboundJob(deps: ProcessorDeps, webhookEventId: string, finalAttempt: boolean) {
  const event = await deps.db.webhookEvent.findUnique({ where: { id: webhookEventId } });
  if (!event || event.status === "PROCESSED" || event.status === "IGNORED") return "skipped";
  const payload = event.payload as (Omit<NormalizedInbound, "sentAt"> & { sentAt: string }) | null;
  if (!payload || payload.kind !== "message") {
    await deps.db.webhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", processedAt: new Date() } });
    return "ignored";
  }
  try {
    const calendar = await loadCalendar(deps.db);
    const outcome = await processInboundMessage({ ...deps, calendar }, { ...payload, sentAt: new Date(payload.sentAt) });
    await deps.db.webhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date(), attempts: { increment: 1 }, payload: Prisma.DbNull } });
    return outcome;
  } catch (error) {
    await deps.db.webhookEvent.update({
      where: { id: event.id },
      data: { attempts: { increment: 1 }, error: errorMessage(error), status: finalAttempt ? "FAILED" : event.status },
    });
    throw error;
  }
}

export async function processAlertJob(deps: ProcessorDeps, executionId: string, finalAttempt: boolean) {
  const calendar = await loadCalendar(deps.db);
  return executeAlert({ ...deps, calendar }, executionId, finalAttempt);
}

export async function processMaintenanceJob(
  deps: ProcessorDeps & { alertsQueue: Pick<Queue<AlertJob>, "add">; backlog: () => Promise<number>; heartbeatAge: () => Promise<number | null> },
  task: string
) {
  const now = deps.now?.() ?? new Date();
  switch (task) {
    case "schedule-due-alerts": {
      const calendar = await loadCalendar(deps.db);
      await reapplyPendingStatuses(deps.db);
      return runSchedulerTick(deps.db, calendar, deps.alertsQueue, now);
    }
    case "retention":
      return runRetention(deps.db, now);
    case "calendar-check": {
      const calendar = await loadCalendar(deps.db, true);
      const rescheduled = await rescheduleUnscheduled(deps.db, calendar, now);
      return { issues: await checkCalendar(deps.redis, calendar, now), rescheduled };
    }
    case "ops-checks":
      return runOpsChecks(deps.db, deps.redis, await deps.backlog(), await deps.heartbeatAge());
    case "provider-health":
      return probeProvider(deps.db, await loadCalendar(deps.db), now);
    default:
      logger.warn("maintenance.unknown_task", { task });
      return null;
  }
}
