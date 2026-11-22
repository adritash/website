import { addDaysToKey, istDateKey, istInstant, istParts } from "@/pulse/lib/time";
import { SESSION, type MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import type { ExchangeCode } from "@/pulse/modules/market-data/market-data.types";
import type { AlertType } from "@/pulse/generated/prisma/enums";

/** Price-threshold alerts are evaluated on this cadence during the session. */
export const PRICE_ALERT_CHECK_MINUTES = 15;
/** Daily closing summary is sent after the close plus the data delay. */
export const DAILY_CLOSE_MINUTE = SESSION.close + 20; // 15:50 IST

/** Minutes-of-day (IST) at which an alert runs on a trading day. */
export function slotsForDay(alertType: AlertType, frequencyMinutes: number | null): number[] {
  if (alertType === "DAILY_CLOSE") return [DAILY_CLOSE_MINUTE];
  const step = alertType === "RECURRING_UPDATE" ? frequencyMinutes ?? 60 : PRICE_ALERT_CHECK_MINUTES;
  if (!Number.isInteger(step) || step < 5) throw new Error("Invalid frequency");
  const slots: number[] = [];
  for (let m = SESSION.open + step; m <= SESSION.close; m += step) slots.push(m);
  return slots;
}

export type NextRun = { at: Date } | { at: null; reason: "CALENDAR_UNAVAILABLE" };

/**
 * First run strictly after `after`, on a trading day for the exchange, per the
 * official calendar. Skips weekends and holidays. Returns CALENDAR_UNAVAILABLE
 * (instead of guessing) when it reaches a year without a loaded calendar.
 */
export function computeNextRun(
  calendar: MarketCalendar,
  exchange: ExchangeCode,
  alertType: AlertType,
  frequencyMinutes: number | null,
  after: Date
): NextRun {
  const slots = slotsForDay(alertType, frequencyMinutes);
  let dayKey = istDateKey(after);
  for (let i = 0; i < 40; i++) {
    const status = calendar.dayStatus(exchange, dayKey);
    if (status === "UNKNOWN") return { at: null, reason: "CALENDAR_UNAVAILABLE" };
    if (status === "TRADING") {
      const at = slots.map((slot) => istInstant(dayKey, slot)).find((t) => t.getTime() > after.getTime());
      if (at) return { at };
    }
    dayKey = addDaysToKey(dayKey, 1);
  }
  return { at: null, reason: "CALENDAR_UNAVAILABLE" };
}

/** True when `at` (IST) falls on a trading day inside the window this alert type runs in. */
export function isValidSlot(calendar: MarketCalendar, exchange: ExchangeCode, alertType: AlertType, at: Date): "OK" | "CLOSED" | "UNKNOWN" {
  const status = calendar.dayStatus(exchange, istDateKey(at));
  if (status === "UNKNOWN") return "UNKNOWN";
  if (status !== "TRADING") return "CLOSED";
  const m = istParts(at).minutesOfDay;
  if (alertType === "DAILY_CLOSE") return m >= SESSION.close ? "OK" : "CLOSED";
  return m > SESSION.open && m <= SESSION.close ? "OK" : "CLOSED";
}

/** How late a run may start before it is skipped as missed (e.g. after a worker outage). */
export function graceMinutes(alertType: AlertType, frequencyMinutes: number | null): number {
  if (alertType === "DAILY_CLOSE") return 120;
  if (alertType === "RECURRING_UPDATE") return Math.min(frequencyMinutes ?? 60, 30);
  return PRICE_ALERT_CHECK_MINUTES;
}
