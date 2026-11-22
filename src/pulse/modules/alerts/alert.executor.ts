import type { Redis } from "ioredis";
import type { Db } from "@/pulse/infrastructure/db";
import { logger } from "@/pulse/infrastructure/logger";
import { errorCode, errorMessage, PulseError } from "@/pulse/lib/errors";
import { istDateKey } from "@/pulse/lib/time";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { getQuote, getQuotes } from "@/pulse/modules/market-data/market-data.service";
import type { MarketDataProvider, MarketQuote } from "@/pulse/modules/market-data/market-data.types";
import { getEffectivePlan } from "@/pulse/modules/subscriptions/subscription.service";
import { startOfIstDay } from "@/pulse/modules/subscriptions/usage.service";
import { hasActiveConsent } from "@/pulse/modules/users/user.service";
import { sendToUser, type OutboundContent } from "@/pulse/modules/whatsapp/whatsapp.service";
import { freshnessLine, formatQuoteReply, inr, quoteSummary, signedPct } from "@/pulse/modules/conversations/formatter";
import { WATCHLIST_SYMBOL } from "./alert.service";
import { evaluateAlert } from "./alert.evaluator";
import { isValidSlot } from "./alert.schedule";
import type { ExecutionStatus } from "@/pulse/generated/prisma/enums";

export type ExecutorDeps = {
  db: Db;
  redis?: Redis;
  calendar: MarketCalendar;
  provider?: MarketDataProvider | null;
  now?: () => Date;
};

type Alert = NonNullable<Awaited<ReturnType<Db["alert"]["findUnique"]>>>;

function plainFreshness(quote: MarketQuote, now: Date) {
  return freshnessLine(quote, now).replace(/\.$/, "");
}

function recurringContent(alert: Alert, quote: MarketQuote, now: Date): OutboundContent {
  const pct = quote.changePercent !== undefined ? signedPct(quote.changePercent) : "change n/a";
  return {
    text: `⏱ ${formatQuoteReply(quote, now)}\n\nReply *stop ${alert.symbol} updates* to stop.`,
    template: { key: "priceUpdate", params: [alert.symbol, alert.exchange, inr(quote.lastPrice), pct, plainFreshness(quote, now)] },
  };
}

function thresholdContent(alert: Alert, quote: MarketQuote, direction: "above" | "below", now: Date): OutboundContent {
  const level = alert.alertType === "PERCENT_MOVE" ? `${Number(alert.thresholdValue)}% move` : `₹${inr(Number(alert.thresholdValue))}`;
  const verb = alert.alertType === "PERCENT_MOVE" ? (direction === "above" ? "up past" : "down past") : direction;
  return {
    text: `🔔 Price alert: ${alert.symbol} (${alert.exchange}) is ₹${inr(quote.lastPrice)}, ${verb} your level of ${level}.\nData: ${freshnessLine(quote, now)}. Source: ${quote.provider}\nReply *stop ${alert.symbol} alerts* to cancel.`,
    template: {
      key: "priceAlert",
      params: [alert.symbol, alert.exchange, inr(quote.lastPrice), verb, alert.alertType === "PERCENT_MOVE" ? `${Number(alert.thresholdValue)}%` : inr(Number(alert.thresholdValue)), plainFreshness(quote, now)],
    },
  };
}

async function finish(db: Db, executionId: string, status: ExecutionStatus, extra: Record<string, unknown> = {}) {
  await db.alertExecution.update({ where: { id: executionId }, data: { status, executedAt: new Date(), ...extra } });
  return status;
}

/**
 * Executes one scheduled alert slot. Re-checks everything at run time (status,
 * consent, opt-out, plan, market session) because state can change after the
 * job was queued. Sends at most once per execution (idempotency key = execution id).
 * Throws on retryable market-data/WhatsApp failures unless `finalAttempt`.
 */
export async function executeAlert(deps: ExecutorDeps, executionId: string, finalAttempt: boolean): Promise<ExecutionStatus> {
  const { db, calendar } = deps;
  const now = deps.now?.() ?? new Date();
  const execution = await db.alertExecution.findUnique({ where: { id: executionId }, include: { alert: { include: { user: true } } } });
  if (!execution) return "SKIPPED_INACTIVE";
  if (execution.status !== "QUEUED" && execution.status !== "RUNNING") return execution.status;
  await db.alertExecution.update({ where: { id: executionId }, data: { status: "RUNNING", attempts: { increment: 1 } } });

  const { alert } = execution;
  const user = alert.user;
  if (alert.status !== "ACTIVE") return finish(db, executionId, "SKIPPED_INACTIVE");
  if (user.status !== "ACTIVE" || user.proactiveOptOutAt) return finish(db, executionId, "SKIPPED_NO_CONSENT");
  const consentType = alert.alertType === "RECURRING_UPDATE" || alert.alertType === "DAILY_CLOSE" ? "RECURRING_UPDATES" : "PROACTIVE_MESSAGES";
  const consent = await db.consentRecord.findFirst({ where: { userId: user.id, consentType, scopeRef: alert.id, revokedAt: null } });
  if (!consent || !(await hasActiveConsent(db, user.id, "PRIVACY_NOTICE"))) return finish(db, executionId, "SKIPPED_NO_CONSENT");
  if (alert.expiresAt && alert.expiresAt < now) {
    await db.alert.update({ where: { id: alert.id }, data: { status: "EXPIRED", nextRunAt: null } });
    return finish(db, executionId, "SKIPPED_INACTIVE");
  }

  const slot = isValidSlot(calendar, alert.exchange, alert.alertType, execution.scheduledFor);
  if (slot === "UNKNOWN") return finish(db, executionId, "SKIPPED_CALENDAR_UNAVAILABLE");
  if (slot === "CLOSED") return finish(db, executionId, "SKIPPED_MARKET_CLOSED");

  // Plan may have changed since the alert was created (e.g. subscription ended).
  const plan = await getEffectivePlan(db, user.id, now);
  if (alert.alertType === "RECURRING_UPDATE" && !plan.limits.recurringFrequencies.includes(alert.frequencyMinutes ?? -1)) {
    await db.alert.update({ where: { id: alert.id }, data: { status: "PAUSED", nextRunAt: null } });
    logger.info("alert.paused_for_plan", { alertId: alert.id });
    return finish(db, executionId, "SKIPPED_LIMIT", { errorCode: "PLAN_FREQUENCY" });
  }
  const sentToday = await db.message.count({ where: { userId: user.id, alertId: { not: null }, direction: "OUTBOUND", status: { notIn: ["FAILED"] }, createdAt: { gte: startOfIstDay(now) } } });
  if (sentToday >= plan.limits.dailyProactiveMessages) return finish(db, executionId, "SKIPPED_LIMIT", { errorCode: "DAILY_PROACTIVE_CAP" });

  const quoteDeps = { db, redis: deps.redis, calendar, provider: deps.provider, now: () => now };

  let content: OutboundContent;
  let observed: MarketQuote | undefined;
  let nextTriggerState = alert.triggerState;

  const isDigest = alert.alertType === "DAILY_CLOSE" || (alert.alertType === "RECURRING_UPDATE" && alert.symbol === WATCHLIST_SYMBOL);
  if (isDigest) {
    const refs =
      alert.symbol === WATCHLIST_SYMBOL
        ? (await db.watchlistItem.findMany({ where: { userId: user.id } })).map((w) => ({ symbol: w.symbol, exchange: w.exchange, companyName: w.companyName }))
        : [{ symbol: alert.symbol, exchange: alert.exchange, companyName: alert.companyName }];
    if (!refs.length) return finish(db, executionId, "NOT_TRIGGERED", { errorCode: "EMPTY_WATCHLIST" });
    const results = await getQuotes(quoteDeps, refs, user.id);
    const quotes = [...results.values()].filter((r) => r.ok).map((r) => (r as { quote: MarketQuote }).quote);
    if (!quotes.length) {
      const code = [...results.values()].map((r) => (!r.ok ? r.code : "")).find(Boolean) ?? "MD_UNAVAILABLE";
      if (!finalAttempt && code !== "MD_NOT_CONFIGURED") throw new PulseError(code, "No quotes for daily summary", { retryable: true });
      return finish(db, executionId, "FAILED", { errorCode: code, errorMessage: "No market data" });
    }
    // Newest data point across the digest; used to skip a digest with no new data.
    observed = quotes.reduce((a, b) => (Date.parse(b.dataTimestamp) > Date.parse(a.dataTimestamp) ? b : a));
    const fresh = quotes.filter((q) => !q.stale);
    if (alert.alertType === "RECURRING_UPDATE") {
      if (!fresh.length) return finish(db, executionId, "SKIPPED_STALE_DATA");
      if (alert.lastNotifiedDataAt && alert.lastNotifiedDataAt.getTime() >= Date.parse(observed.dataTimestamp)) {
        return finish(db, executionId, "SKIPPED_NO_CHANGE");
      }
    }
    const shown = alert.alertType === "RECURRING_UPDATE" ? fresh : quotes;
    const summary = shown.map(quoteSummary).join("; ");
    const missing = refs.length - shown.length;
    const delay = `data delayed ${shown[0].delayMinutes ?? 15} min`;
    const label = shown[0].isFixture
      ? "SANDBOX TEST DATA, not real prices"
      : alert.alertType === "DAILY_CLOSE"
        ? `Closing prices, ${delay}`
        : `${plainFreshness(observed, now)}`;
    const list = `${shown.map((q) => `• ${quoteSummary(q)}`).join("\n")}${missing ? `\n(${missing} stock(s) unavailable)` : ""}`;
    content =
      alert.alertType === "DAILY_CLOSE"
        ? {
            text: `📊 Closing summary, ${istDateKey(now)}:\n${list}\nData: ${label}. Source: ${shown[0].provider}\nReply *stop all alerts* to stop.`,
            template: { key: "dailySummary", params: [new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(now), summary, label] },
          }
        : {
            text: `⏱ Watchlist update:\n${list}\nData: ${label}. Source: ${shown[0].provider}\nReply *stop all alerts* to stop.`,
            template: { key: "watchlistUpdate", params: [summary, label] },
          };
  } else {
    const q = await getQuote(quoteDeps, { symbol: alert.symbol, exchange: alert.exchange, companyName: alert.companyName }, user.id);
    if (!q.ok) {
      // Never send a price we don't have. Retry transient failures with backoff.
      if (!finalAttempt && q.code !== "MD_NOT_CONFIGURED") throw new PulseError(q.code, "Market data unavailable", { retryable: true });
      return finish(db, executionId, "FAILED", { errorCode: q.code, errorMessage: "Market data unavailable" });
    }
    observed = q.quote;
    const evaluation = evaluateAlert(
      { alertType: alert.alertType, thresholdValue: alert.thresholdValue === null ? null : Number(alert.thresholdValue), triggerState: alert.triggerState, lastNotifiedDataAt: alert.lastNotifiedDataAt },
      q.quote
    );
    nextTriggerState = evaluation.nextTriggerState;
    if (evaluation.action === "skip") {
      if (nextTriggerState !== alert.triggerState) await db.alert.update({ where: { id: alert.id }, data: { triggerState: nextTriggerState } });
      const status: ExecutionStatus = evaluation.reason === "NO_CHANGE" ? "SKIPPED_NO_CHANGE" : evaluation.reason === "STALE_DATA" ? "SKIPPED_STALE_DATA" : "NOT_TRIGGERED";
      return finish(db, executionId, status, { observedPrice: q.quote.lastPrice, marketDataTimestamp: new Date(q.quote.dataTimestamp) });
    }
    content = alert.alertType === "RECURRING_UPDATE" ? recurringContent(alert, q.quote, now) : thresholdContent(alert, q.quote, evaluation.direction ?? "above", now);
  }

  try {
    const outcome = await sendToUser(db, user, content, { idempotencyKey: `alert_${executionId}`, purpose: "proactive", alertId: alert.id, redis: deps.redis });
    if (outcome.status === "skipped") {
      return finish(db, executionId, outcome.reason === "daily_limit" ? "SKIPPED_LIMIT" : "SKIPPED_NO_CONSENT", { errorCode: outcome.reason.toUpperCase() });
    }
    const message = await db.message.findUnique({ where: { id: outcome.messageId } });
    await db.alert.update({
      where: { id: alert.id },
      data: {
        lastRunAt: now,
        triggerState: nextTriggerState,
        lastNotifiedPrice: observed?.lastPrice,
        lastNotifiedDataAt: observed ? new Date(observed.dataTimestamp) : undefined,
      },
    });
    return finish(db, executionId, "SENT", {
      messageId: outcome.messageId,
      observedPrice: observed?.lastPrice,
      marketDataTimestamp: observed ? new Date(observed.dataTimestamp) : undefined,
      estimatedCostInr: message?.estimatedCostInr ?? undefined,
    });
  } catch (error) {
    const retryable = error instanceof PulseError ? error.retryable : true;
    if (retryable && !finalAttempt) {
      await db.alertExecution.update({ where: { id: executionId }, data: { status: "QUEUED", errorCode: errorCode(error), errorMessage: errorMessage(error) } });
      throw error;
    }
    return finish(db, executionId, "FAILED", { errorCode: errorCode(error), errorMessage: errorMessage(error) });
  }
}

