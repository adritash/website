import type { Db } from "@/pulse/infrastructure/db";
import { NotFoundError } from "@/pulse/lib/errors";
import { audit, securityEvent } from "@/pulse/modules/audit/audit.service";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import type { InstrumentRef } from "@/pulse/modules/market-data/market-data.types";
import type { PlanLimits } from "@/pulse/modules/subscriptions/plans";
import { SYSTEM_FREQUENCIES } from "@/pulse/modules/subscriptions/plans";
import { grantConsent, revokeConsent } from "@/pulse/modules/users/user.service";
import { computeNextRun } from "./alert.schedule";
import type { AlertType } from "@/pulse/generated/prisma/enums";

/** Pseudo-symbol for a daily summary that covers the user's whole watchlist. */
export const WATCHLIST_SYMBOL = "WATCHLIST";

const RECURRING_TYPES: AlertType[] = ["RECURRING_UPDATE", "DAILY_CLOSE"];
const PRICE_TYPES: AlertType[] = ["PRICE_ABOVE", "PRICE_BELOW", "PERCENT_MOVE"];

export type CreateAlertInput = {
  instrument: InstrumentRef;
  alertType: AlertType;
  frequencyMinutes?: number;
  thresholdValue?: number;
  /** Where the consent came from, e.g. "whatsapp:<message id>". */
  consentSource: string;
};

export type CreateAlertResult =
  | { status: "created"; alertId: string; nextRunAt: Date | null; calendarUnavailable: boolean }
  | { status: "duplicate"; alertId: string }
  | { status: "frequency_not_allowed"; allowed: number[] }
  | { status: "limit"; max: number; kind: "price" | "recurring" }
  | { status: "invalid_threshold" };

/**
 * Creates an alert after deterministic checks: valid frequency for the plan,
 * per-plan limits, positive thresholds. Records explicit consent for proactive
 * messages for this alert.
 */
export async function createAlert(
  db: Db,
  calendar: MarketCalendar,
  userId: string,
  limits: PlanLimits,
  input: CreateAlertInput,
  now = new Date()
): Promise<CreateAlertResult> {
  const { alertType, instrument } = input;
  let frequencyMinutes: number | null = null;

  if (alertType === "RECURRING_UPDATE") {
    const f = input.frequencyMinutes ?? 60;
    const allowed = limits.recurringFrequencies.filter((x) => (SYSTEM_FREQUENCIES as readonly number[]).includes(x));
    if (!allowed.includes(f)) return { status: "frequency_not_allowed", allowed };
    frequencyMinutes = f;
  }
  if (alertType === "DAILY_CLOSE" && !limits.dailyCloseSummary) return { status: "frequency_not_allowed", allowed: limits.recurringFrequencies };
  if (PRICE_TYPES.includes(alertType)) {
    const t = input.thresholdValue;
    if (t === undefined || !Number.isFinite(t) || t <= 0 || t > 10_000_000) return { status: "invalid_threshold" };
    if (alertType === "PERCENT_MOVE" && t > 50) return { status: "invalid_threshold" };
  }

  const duplicate = await db.alert.findFirst({
    where: {
      userId,
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      alertType,
      status: { in: ["ACTIVE", "PAUSED"] },
      ...(PRICE_TYPES.includes(alertType) ? { thresholdValue: input.thresholdValue } : {}),
    },
  });
  if (duplicate) {
    if (alertType === "RECURRING_UPDATE" && duplicate.frequencyMinutes !== frequencyMinutes) {
      // Same stock, new frequency: treat as an update rather than a second alert.
      await updateFrequency(db, calendar, userId, duplicate.id, frequencyMinutes ?? 60, limits, now);
      return { status: "created", alertId: duplicate.id, nextRunAt: (await db.alert.findUniqueOrThrow({ where: { id: duplicate.id } })).nextRunAt, calendarUnavailable: false };
    }
    return { status: "duplicate", alertId: duplicate.id };
  }

  const isRecurring = RECURRING_TYPES.includes(alertType);
  const activeOfKind = await db.alert.count({
    where: { userId, status: { in: ["ACTIVE", "PAUSED"] }, alertType: { in: isRecurring ? RECURRING_TYPES : PRICE_TYPES } },
  });
  const max = isRecurring ? limits.recurringAlertsMax : limits.priceAlertsMax;
  if (activeOfKind >= max) return { status: "limit", max, kind: isRecurring ? "recurring" : "price" };

  const exchange = instrument.symbol === WATCHLIST_SYMBOL ? "NSE" : instrument.exchange;
  const next = computeNextRun(calendar, exchange, alertType, frequencyMinutes, now);
  const alert = await db.$transaction(async (tx) => {
    const created = await tx.alert.create({
      data: {
        userId,
        symbol: instrument.symbol,
        exchange,
        companyName: instrument.companyName,
        alertType,
        frequencyMinutes,
        thresholdValue: input.thresholdValue,
        consentAt: now,
        nextRunAt: next.at,
      },
    });
    await grantConsent(tx as unknown as Db, userId, isRecurring ? "RECURRING_UPDATES" : "PROACTIVE_MESSAGES", input.consentSource, created.id);
    return created;
  });
  await audit(db, { actorType: "USER", actorId: userId, action: "alert.created", resourceType: "Alert", resourceId: alert.id, outcome: "success", metadata: { alertType, frequencyMinutes } });
  return { status: "created", alertId: alert.id, nextRunAt: alert.nextRunAt, calendarUnavailable: next.at === null };
}

export async function listAlerts(db: Db, userId: string, includeInactive = false) {
  return db.alert.findMany({
    where: { userId, ...(includeInactive ? {} : { status: { in: ["ACTIVE", "PAUSED"] } }) },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Fetches an alert only if it belongs to the user. An attempt to touch someone
 * else's alert is logged as a security event and reported as "not found".
 */
export async function getOwnedAlert(db: Db, userId: string, alertId: string) {
  const alert = await db.alert.findFirst({ where: { id: alertId, userId } });
  if (alert) return alert;
  const exists = await db.alert.findUnique({ where: { id: alertId }, select: { id: true } });
  if (exists) {
    await securityEvent(db, { actorType: "USER", actorId: userId, action: "alert.cross_user_access", resourceType: "Alert", resourceId: alertId, outcome: "denied" });
  }
  throw new NotFoundError("Alert");
}

type Scope = { alertId?: string; symbol?: string; exchange?: "NSE" | "BSE" };

async function scopedIds(db: Db, userId: string, scope: Scope, statuses: ("ACTIVE" | "PAUSED")[]) {
  if (scope.alertId) {
    const a = await getOwnedAlert(db, userId, scope.alertId);
    return statuses.includes(a.status as "ACTIVE" | "PAUSED") ? [a] : [];
  }
  return db.alert.findMany({
    where: { userId, status: { in: statuses }, ...(scope.symbol ? { symbol: scope.symbol } : {}), ...(scope.exchange ? { exchange: scope.exchange } : {}) },
  });
}

export async function cancelAlerts(db: Db, userId: string, scope: Scope): Promise<number> {
  const alerts = await scopedIds(db, userId, scope, ["ACTIVE", "PAUSED"]);
  if (!alerts.length) return 0;
  const now = new Date();
  await db.alert.updateMany({ where: { userId, id: { in: alerts.map((a) => a.id) } }, data: { status: "CANCELLED", cancelledAt: now, nextRunAt: null } });
  // Any queued execution for these alerts will see CANCELLED and skip.
  for (const a of alerts) {
    await revokeConsent(db, userId, RECURRING_TYPES.includes(a.alertType) ? "RECURRING_UPDATES" : "PROACTIVE_MESSAGES", a.id);
  }
  await audit(db, { actorType: "USER", actorId: userId, action: "alert.cancelled", outcome: "success", metadata: { count: alerts.length, symbol: scope.symbol } });
  return alerts.length;
}

export async function pauseAlerts(db: Db, userId: string, scope: Scope): Promise<number> {
  const alerts = await scopedIds(db, userId, scope, ["ACTIVE"]);
  if (!alerts.length) return 0;
  await db.alert.updateMany({ where: { userId, id: { in: alerts.map((a) => a.id) } }, data: { status: "PAUSED", nextRunAt: null } });
  await audit(db, { actorType: "USER", actorId: userId, action: "alert.paused", outcome: "success", metadata: { count: alerts.length } });
  return alerts.length;
}

export async function resumeAlerts(db: Db, calendar: MarketCalendar, userId: string, scope: Scope, now = new Date()): Promise<number> {
  const alerts = await scopedIds(db, userId, scope, ["PAUSED"]);
  for (const a of alerts) {
    const next = computeNextRun(calendar, a.exchange, a.alertType, a.frequencyMinutes, now);
    await db.alert.updateMany({ where: { id: a.id, userId }, data: { status: "ACTIVE", nextRunAt: next.at, triggerState: "ARMED" } });
  }
  if (alerts.length) await audit(db, { actorType: "USER", actorId: userId, action: "alert.resumed", outcome: "success", metadata: { count: alerts.length } });
  return alerts.length;
}

export type UpdateFrequencyResult = { status: "updated"; count: number } | { status: "frequency_not_allowed"; allowed: number[] } | { status: "none" };

export async function updateFrequency(
  db: Db,
  calendar: MarketCalendar,
  userId: string,
  alertIdOrSymbol: string,
  frequencyMinutes: number,
  limits: PlanLimits,
  now = new Date()
): Promise<UpdateFrequencyResult> {
  if (!limits.recurringFrequencies.includes(frequencyMinutes)) return { status: "frequency_not_allowed", allowed: limits.recurringFrequencies };
  const alerts = await db.alert.findMany({
    where: { userId, alertType: "RECURRING_UPDATE", status: { in: ["ACTIVE", "PAUSED"] }, OR: [{ id: alertIdOrSymbol }, { symbol: alertIdOrSymbol }] },
  });
  if (!alerts.length) return { status: "none" };
  for (const a of alerts) {
    const next = a.status === "ACTIVE" ? computeNextRun(calendar, a.exchange, a.alertType, frequencyMinutes, now).at : null;
    await db.alert.updateMany({ where: { id: a.id, userId }, data: { frequencyMinutes, nextRunAt: next } });
  }
  await audit(db, { actorType: "USER", actorId: userId, action: "alert.frequency_updated", outcome: "success", metadata: { frequencyMinutes } });
  return { status: "updated", count: alerts.length };
}
