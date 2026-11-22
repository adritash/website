import { istDateKey } from "@/pulse/lib/time";
import type { MarketQuote } from "@/pulse/modules/market-data/market-data.types";
import type { AlertType, TriggerState } from "@/pulse/generated/prisma/enums";

/** Re-arm band: a triggered threshold alert re-arms after the price retreats this far. */
export const REARM_BAND = 0.005;

export type AlertSnapshot = {
  alertType: AlertType;
  thresholdValue: number | null;
  triggerState: TriggerState;
  lastNotifiedDataAt: Date | null;
};

export type Evaluation =
  | { action: "send"; nextTriggerState: TriggerState; direction?: "above" | "below" }
  | { action: "skip"; reason: "NOT_TRIGGERED" | "NO_CHANGE" | "STALE_DATA"; nextTriggerState: TriggerState };

/**
 * Pure decision for one alert and one validated quote. Threshold alerts fire once
 * per crossing (ARMED → TRIGGERED) and re-arm only after the price moves back past
 * the band, so a stock sitting above its level does not spam the user.
 */
export function evaluateAlert(alert: AlertSnapshot, quote: MarketQuote): Evaluation {
  const state = alert.triggerState;
  if (quote.stale) return { action: "skip", reason: "STALE_DATA", nextTriggerState: state };
  const price = quote.lastPrice;
  const dataAt = new Date(quote.dataTimestamp);

  switch (alert.alertType) {
    case "RECURRING_UPDATE": {
      // Periodic snapshots were requested; skip only when there is no new data at all.
      if (alert.lastNotifiedDataAt && alert.lastNotifiedDataAt.getTime() === dataAt.getTime()) {
        return { action: "skip", reason: "NO_CHANGE", nextTriggerState: state };
      }
      return { action: "send", nextTriggerState: state };
    }
    case "PRICE_ABOVE": {
      const t = alert.thresholdValue ?? Infinity;
      if (state === "ARMED" && price >= t) return { action: "send", nextTriggerState: "TRIGGERED", direction: "above" };
      if (state === "TRIGGERED" && price < t * (1 - REARM_BAND)) return { action: "skip", reason: "NOT_TRIGGERED", nextTriggerState: "ARMED" };
      return { action: "skip", reason: "NOT_TRIGGERED", nextTriggerState: state };
    }
    case "PRICE_BELOW": {
      const t = alert.thresholdValue ?? -Infinity;
      if (state === "ARMED" && price <= t) return { action: "send", nextTriggerState: "TRIGGERED", direction: "below" };
      if (state === "TRIGGERED" && price > t * (1 + REARM_BAND)) return { action: "skip", reason: "NOT_TRIGGERED", nextTriggerState: "ARMED" };
      return { action: "skip", reason: "NOT_TRIGGERED", nextTriggerState: state };
    }
    case "PERCENT_MOVE": {
      const t = alert.thresholdValue ?? Infinity;
      const pct = quote.changePercent;
      // One notification per trading day: re-arm when the day changes.
      const notifiedToday = alert.lastNotifiedDataAt !== null && istDateKey(alert.lastNotifiedDataAt) === istDateKey(dataAt);
      const effective: TriggerState = notifiedToday ? state : "ARMED";
      if (pct === undefined) return { action: "skip", reason: "NOT_TRIGGERED", nextTriggerState: effective };
      if (effective === "ARMED" && Math.abs(pct) >= t) {
        return { action: "send", nextTriggerState: "TRIGGERED", direction: pct >= 0 ? "above" : "below" };
      }
      return { action: "skip", reason: "NOT_TRIGGERED", nextTriggerState: effective };
    }
    case "DAILY_CLOSE":
      return { action: "send", nextTriggerState: state };
  }
}
