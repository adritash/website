import { getEnv } from "@/pulse/config/env";
import { formatIstDateTime } from "@/pulse/lib/time";
import { registerTool, registeredTools, type ToolContext, type ToolResult } from "./tool.registry";
import { intentSchema, type Intent } from "./intent.schema";
import { getQuote, getQuotes } from "@/pulse/modules/market-data/market-data.service";
import { resolveInstrument } from "@/pulse/modules/market-data/symbol-resolver";
import type { ExchangeCode, InstrumentRef } from "@/pulse/modules/market-data/market-data.types";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/pulse/modules/watchlists/watchlist.service";
import {
  cancelAlerts,
  createAlert,
  listAlerts,
  pauseAlerts,
  resumeAlerts,
  updateFrequency,
  WATCHLIST_SYMBOL,
} from "@/pulse/modules/alerts/alert.service";
import { recordUsage, usageToday } from "@/pulse/modules/subscriptions/usage.service";
import { SYSTEM_FREQUENCIES } from "@/pulse/modules/subscriptions/plans";
import { createLoginLink } from "@/pulse/modules/users/login-link";
import { grantConsent, requestDeletion, revokeConsent } from "@/pulse/modules/users/user.service";
import { startUpgrade } from "@/pulse/modules/payments/payment.service";
import {
  DISCLAIMER,
  formatPreviousClose,
  formatQuoteReply,
  inr,
  priceUnavailable,
  quoteSummary,
} from "@/pulse/modules/conversations/formatter";

export const HELP_TEXT = [
  "Here's what I can do:",
  "• *Price of TCS* — latest price",
  "• *Track Infosys* — add to your watchlist",
  "• *Show my watchlist*",
  "• *Send TCS updates every hour* — during market hours",
  "• *Send me daily closing prices*",
  "• *Alert me if Reliance falls below ₹1,000*",
  "• *Show my alerts* / *Stop TCS alerts* / *Stop all alerts*",
  "• *Pause alerts* / *Resume alerts*",
  "• *My plan* / *Dashboard* (private web link)",
  "• *STOP* to stop all messages, *DELETE MY DATA* to erase your data",
  "",
  `Prices are for NSE/BSE equities. ${DISCLAIMER}`,
].join("\n");

const anyIntent = intentSchema;

function privacyUrl() {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/pulse/privacy`;
}

/**
 * Resolves the stock the user named, or asks. Never picks a company the user
 * didn't clearly name: ambiguous or fuzzy matches become a numbered question.
 */
async function resolveOrAsk(
  ctx: ToolContext,
  intent: Intent,
  opts: { allowLast?: boolean } = {}
): Promise<{ instrument: InstrumentRef } | { result: ToolResult }> {
  if (!intent.stock_query) {
    if (opts.allowLast && ctx.context.lastInstrument) return { instrument: ctx.context.lastInstrument };
    return { result: { reply: "Which stock? Reply with the company name or NSE symbol, for example *TCS* or *Infosys*.", pending: { kind: "need_stock", intent } } };
  }
  const resolution = await resolveInstrument(ctx.db, intent.stock_query, intent.exchange as ExchangeCode | undefined);
  if (resolution.status === "resolved") return { instrument: resolution.instrument };
  if (resolution.status === "ambiguous") {
    const lines = resolution.options.map((o, i) => `${i + 1}. ${o.companyName} (${o.symbol}, ${o.exchange})`);
    const ask = resolution.options.length === 1 ? `Did you mean ${resolution.options[0].companyName}? Reply *1* to confirm.` : "Which one do you mean? Reply with the number.";
    return { result: { reply: `${ask}\n${lines.join("\n")}`, pending: { kind: "choose_instrument", intent, options: resolution.options } } };
  }
  return {
    result: {
      reply: `I couldn't find a listed stock matching "${intent.stock_query.slice(0, 40)}". Try the NSE symbol (for example *HDFCBANK*) or the full company name.`,
      pending: null,
    },
  };
}

async function quoteQuota(ctx: ToolContext): Promise<string | null> {
  const used = await usageToday(ctx.db, ctx.user.id, "QUOTE_QUERY", ctx.now);
  if (used >= ctx.plan.limits.dailyQuoteQueries) {
    return `You've used today's ${ctx.plan.limits.dailyQuoteQueries} price checks on ${ctx.plan.name}. They reset at midnight IST.`;
  }
  return null;
}

const quoteDeps = (ctx: ToolContext) => ({ db: ctx.db, redis: ctx.redis, calendar: ctx.calendar, provider: ctx.provider, now: () => ctx.now });

registerTool({
  name: "get_quote",
  intents: ["STOCK_PRICE", "STOCK_PERFORMANCE"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx, intent) {
    const r = await resolveOrAsk(ctx, intent, { allowLast: true });
    if ("result" in r) return r.result;
    const quota = await quoteQuota(ctx);
    if (quota) return { reply: quota };
    await recordUsage(ctx.db, { userId: ctx.user.id, usageType: "QUOTE_QUERY" });
    const q = await getQuote(quoteDeps(ctx), r.instrument, ctx.user.id);
    if (!q.ok) return { reply: priceUnavailable(r.instrument.symbol, q.code), lastInstrument: r.instrument, pending: null };
    const tracked = await ctx.db.watchlistItem.findFirst({ where: { userId: ctx.user.id, symbol: r.instrument.symbol, exchange: r.instrument.exchange } });
    const suffix = tracked ? "" : `\n\nWould you like me to track ${r.instrument.symbol}? Reply *track ${r.instrument.symbol}*.`;
    return { reply: formatQuoteReply(q.quote, ctx.now) + suffix, lastInstrument: r.instrument, pending: null };
  },
});

registerTool({
  name: "previous_close",
  intents: ["PREVIOUS_CLOSE"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx, intent) {
    const r = await resolveOrAsk(ctx, intent, { allowLast: true });
    if ("result" in r) return r.result;
    const quota = await quoteQuota(ctx);
    if (quota) return { reply: quota };
    await recordUsage(ctx.db, { userId: ctx.user.id, usageType: "QUOTE_QUERY" });
    const q = await getQuote(quoteDeps(ctx), r.instrument, ctx.user.id);
    if (!q.ok) return { reply: priceUnavailable(r.instrument.symbol, q.code), lastInstrument: r.instrument };
    return { reply: formatPreviousClose(q.quote, ctx.now), lastInstrument: r.instrument, pending: null };
  },
});

registerTool({
  name: "add_watchlist",
  intents: ["ADD_WATCHLIST"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx, intent) {
    const r = await resolveOrAsk(ctx, intent, { allowLast: true });
    if ("result" in r) return r.result;
    const res = await addToWatchlist(ctx.db, ctx.user.id, r.instrument, ctx.plan.limits.watchlistMax);
    const name = `${r.instrument.companyName} (${r.instrument.symbol}, ${r.instrument.exchange})`;
    if (res.status === "exists") return { reply: `${name} is already on your watchlist.`, lastInstrument: r.instrument, pending: null };
    if (res.status === "limit") return { reply: `Your watchlist is full (${res.max} stocks on ${ctx.plan.name}). Remove one first, e.g. *remove ${r.instrument.symbol} from my watchlist*.`, pending: null };
    return {
      reply: `Added ${name} to your watchlist.\nWant regular updates? Reply *send ${r.instrument.symbol} updates every hour* or *send me daily closing prices*.`,
      lastInstrument: r.instrument,
      pending: null,
    };
  },
});

registerTool({
  name: "remove_watchlist",
  intents: ["REMOVE_WATCHLIST"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx, intent) {
    const r = await resolveOrAsk(ctx, intent);
    if ("result" in r) return r.result;
    const removed = await removeFromWatchlist(ctx.db, ctx.user.id, r.instrument);
    const alerts = await ctx.db.alert.count({ where: { userId: ctx.user.id, symbol: r.instrument.symbol, status: "ACTIVE" } });
    const note = alerts ? `\nYour ${alerts} alert(s) for ${r.instrument.symbol} are still active. Reply *stop ${r.instrument.symbol} alerts* to cancel them.` : "";
    return { reply: (removed ? `Removed ${r.instrument.symbol} from your watchlist.` : `${r.instrument.symbol} wasn't on your watchlist.`) + note, pending: null };
  },
});

registerTool({
  name: "list_watchlist",
  intents: ["LIST_WATCHLIST"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx) {
    const items = await listWatchlist(ctx.db, ctx.user.id);
    if (!items.length) return { reply: "Your watchlist is empty. Reply *track TCS* to add a stock.", pending: null };
    const lines = items.map((i, n) => `${n + 1}. ${i.companyName} (${i.symbol}, ${i.exchange})`);
    return { reply: `Your watchlist (${items.length}/${ctx.plan.limits.watchlistMax}):\n${lines.join("\n")}`, pending: null };
  },
});

registerTool({
  name: "watchlist_performance",
  intents: ["WATCHLIST_PERFORMANCE"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx) {
    const items = await listWatchlist(ctx.db, ctx.user.id);
    if (!items.length) return { reply: "Your watchlist is empty. Reply *track TCS* to add a stock.", pending: null };
    const quota = await quoteQuota(ctx);
    if (quota) return { reply: quota };
    await recordUsage(ctx.db, { userId: ctx.user.id, usageType: "QUOTE_QUERY" });
    const refs = items.map((i) => ({ symbol: i.symbol, exchange: i.exchange, companyName: i.companyName }));
    const results = await getQuotes(quoteDeps(ctx), refs, ctx.user.id);
    const lines: string[] = [];
    let freshness: string | undefined;
    let provider: string | undefined;
    for (const ref of refs) {
      const q = results.get(`${ref.exchange}:${ref.symbol}`);
      if (q?.ok) {
        lines.push(`• ${quoteSummary(q.quote)}`);
        provider = q.quote.provider;
        freshness ??= q.quote.isFixture ? "SANDBOX TEST DATA, not real prices" : q.quote.marketStatus === "CLOSED" ? "Market closed, last available prices" : `Delayed by ${q.quote.delayMinutes ?? 15} minutes`;
      } else {
        lines.push(`• ${ref.symbol}: price unavailable`);
      }
    }
    if (!provider) return { reply: priceUnavailable("your watchlist", [...results.values()].find((r) => !r.ok && r.code === "MD_NOT_CONFIGURED") ? "MD_NOT_CONFIGURED" : "MD_UNAVAILABLE") };
    return { reply: `Your watchlist today:\n${lines.join("\n")}\nData: ${freshness}. Source: ${provider}`, pending: null };
  },
});

function describeAlert(a: { symbol: string; alertType: string; frequencyMinutes: number | null; thresholdValue: unknown; status: string }): string {
  const t = a.thresholdValue !== null && a.thresholdValue !== undefined ? Number(a.thresholdValue) : undefined;
  const name = a.symbol === WATCHLIST_SYMBOL ? "Watchlist" : a.symbol;
  const what =
    a.alertType === "RECURRING_UPDATE"
      ? `update every ${a.frequencyMinutes === 60 ? "hour" : `${a.frequencyMinutes} min`} (market hours)`
      : a.alertType === "DAILY_CLOSE"
        ? "daily closing summary"
        : a.alertType === "PRICE_ABOVE"
          ? `alert above ₹${inr(t ?? 0)}`
          : a.alertType === "PRICE_BELOW"
            ? `alert below ₹${inr(t ?? 0)}`
            : `alert on a ${t}% move`;
  return `${name}: ${what}${a.status === "PAUSED" ? " (paused)" : ""}`;
}

function nextRunText(next: Date | null, calendarUnavailable: boolean): string {
  if (calendarUnavailable || !next) return "The exchange holiday calendar for the coming period isn't loaded yet, so I'll start once it is.";
  return `First update: ${formatIstDateTime(next)}.`;
}

registerTool({
  name: "create_recurring_alert",
  intents: ["CREATE_RECURRING_ALERT"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx, intent) {
    const f = intent.frequency_minutes ?? 60;
    if (!(SYSTEM_FREQUENCIES as readonly number[]).includes(f)) {
      return { reply: "I can send updates every 15, 30 or 60 minutes during market hours, or a daily closing summary. Which would you like?", pending: null };
    }
    let instrument: InstrumentRef;
    if (!intent.stock_query && (await ctx.db.watchlistItem.count({ where: { userId: ctx.user.id } })) > 0) {
      // No stock named: one digest message per slot for the whole watchlist (cheaper than one per stock).
      instrument = { symbol: WATCHLIST_SYMBOL, exchange: "NSE", companyName: "Your watchlist" };
    } else {
      const r = await resolveOrAsk(ctx, intent, { allowLast: false });
      if ("result" in r) return r.result;
      instrument = r.instrument;
    }
    const r = { instrument };
    const res = await createAlert(ctx.db, ctx.calendar, ctx.user.id, ctx.plan.limits, { instrument, alertType: "RECURRING_UPDATE", frequencyMinutes: f, consentSource: `whatsapp:${ctx.sourceMessageId}` }, ctx.now);
    if (res.status === "frequency_not_allowed") {
      const allowed = res.allowed.length ? `${ctx.plan.name} allows updates every ${res.allowed.join(" or ")} minutes, or a daily closing summary.` : `${ctx.plan.name} includes a daily closing summary. Reply *send me daily closing prices*.`;
      return { reply: `${allowed}${getEnv().PULSE_PAYMENTS_ENABLED ? " Reply *upgrade* for more." : ""}`, pending: null };
    }
    if (res.status === "limit") return { reply: `You already have ${res.max} recurring update(s), the limit on ${ctx.plan.name}. Reply *show my alerts* to manage them.`, pending: null };
    if (res.status === "duplicate") return { reply: `You already get ${r.instrument.symbol} updates. Reply *show my alerts* to see them.`, pending: null };
    if (res.status !== "created") return { reply: "I couldn't set that up.", pending: null };
    const every = f === 60 ? "every hour" : `every ${f} minutes`;
    const isWatchlist = r.instrument.symbol === WATCHLIST_SYMBOL;
    const what = isWatchlist ? "one update covering your watchlist" : `${r.instrument.symbol} (${r.instrument.exchange}) updates`;
    const stop = isWatchlist ? "stop all alerts" : `stop ${r.instrument.symbol} updates`;
    return {
      reply: `Done. I'll send ${what} ${every} on trading days, 9:15 AM to 3:30 PM IST. No messages on weekends or exchange holidays.\n${nextRunText(res.nextRunAt, res.calendarUnavailable)}\nReply *${stop}* any time to stop.`,
      lastInstrument: isWatchlist ? undefined : r.instrument,
      pending: null,
    };
  },
});

registerTool({
  name: "create_daily_summary",
  intents: ["CREATE_DAILY_SUMMARY"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx, intent) {
    let instrument: InstrumentRef = { symbol: WATCHLIST_SYMBOL, exchange: "NSE", companyName: "Your watchlist" };
    if (intent.stock_query) {
      const r = await resolveOrAsk(ctx, intent);
      if ("result" in r) return r.result;
      instrument = r.instrument;
    } else {
      const count = await ctx.db.watchlistItem.count({ where: { userId: ctx.user.id } });
      if (!count) return { reply: "Your watchlist is empty, so there's nothing to summarise yet. Reply *track TCS* first, or *send me TCS closing price daily*.", pending: null };
    }
    const res = await createAlert(ctx.db, ctx.calendar, ctx.user.id, ctx.plan.limits, { instrument, alertType: "DAILY_CLOSE", consentSource: `whatsapp:${ctx.sourceMessageId}` }, ctx.now);
    if (res.status === "duplicate") return { reply: "You already get a daily closing summary for that.", pending: null };
    if (res.status === "limit") return { reply: `You already have ${res.max} recurring update(s), the limit on ${ctx.plan.name}. Reply *show my alerts* to manage them.`, pending: null };
    if (res.status !== "created") return { reply: `Daily summaries aren't included in ${ctx.plan.name}.`, pending: null };
    const what = instrument.symbol === WATCHLIST_SYMBOL ? "your watchlist stocks" : instrument.symbol;
    return {
      reply: `Done. I'll send closing prices for ${what} after the market closes (around 3:50 PM IST) on trading days.\n${nextRunText(res.nextRunAt, res.calendarUnavailable)}\nReply *stop all alerts* to stop.`,
      pending: null,
    };
  },
});

registerTool({
  name: "create_price_alert",
  intents: ["CREATE_PRICE_ALERT"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx, intent) {
    if (!intent.threshold && !intent.percent) return { reply: "At what price should I alert you? For example *alert me if TCS goes above ₹4,000*.", pending: null };
    const r = await resolveOrAsk(ctx, intent);
    if ("result" in r) return r.result;
    const alertType = intent.percent ? "PERCENT_MOVE" : intent.direction === "below" ? "PRICE_BELOW" : "PRICE_ABOVE";
    const res = await createAlert(ctx.db, ctx.calendar, ctx.user.id, ctx.plan.limits, { instrument: r.instrument, alertType, thresholdValue: intent.percent ?? intent.threshold, consentSource: `whatsapp:${ctx.sourceMessageId}` }, ctx.now);
    if (res.status === "invalid_threshold") return { reply: "That level doesn't look right. Please give a price in rupees, e.g. ₹1,400.", pending: null };
    if (res.status === "limit") return { reply: `You have ${res.max} price alerts, the limit on ${ctx.plan.name}. Reply *show my alerts* to manage them.`, pending: null };
    if (res.status === "duplicate") return { reply: "You already have that alert.", pending: null };
    if (res.status !== "created") return { reply: "I couldn't set that alert up.", pending: null };
    const what =
      alertType === "PERCENT_MOVE"
        ? `moves ${intent.percent}% or more in a day`
        : `goes ${alertType === "PRICE_ABOVE" ? "above" : "below"} ₹${inr(intent.threshold ?? 0)}`;
    return {
      reply: `Done. I'll message you once if ${r.instrument.symbol} (${r.instrument.exchange}) ${what}. I check every 15 minutes during market hours using delayed data, so the alert may arrive a little after the move.\nReply *stop ${r.instrument.symbol} alerts* to cancel.`,
      lastInstrument: r.instrument,
      pending: null,
    };
  },
});

registerTool({
  name: "update_alert",
  intents: ["UPDATE_ALERT"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx, intent) {
    const r = await resolveOrAsk(ctx, intent, { allowLast: true });
    if ("result" in r) return r.result;
    const f = intent.frequency_minutes ?? 60;
    const res = await updateFrequency(ctx.db, ctx.calendar, ctx.user.id, r.instrument.symbol, f, ctx.plan.limits, ctx.now);
    if (res.status === "none") return { reply: `You don't have recurring updates for ${r.instrument.symbol}. Reply *send ${r.instrument.symbol} updates every hour* to start.`, pending: null };
    if (res.status === "frequency_not_allowed") return { reply: res.allowed.length ? `${ctx.plan.name} allows every ${res.allowed.join(" or ")} minutes.` : `${ctx.plan.name} includes the daily closing summary only.`, pending: null };
    return { reply: `Updated. ${r.instrument.symbol} updates now come every ${f === 60 ? "hour" : `${f} minutes`} during market hours.`, pending: null };
  },
});

registerTool({
  name: "cancel_alert",
  intents: ["CANCEL_ALERT"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx, intent) {
    if (intent.scope === "all" || !intent.stock_query) {
      const n = await cancelAlerts(ctx.db, ctx.user.id, {});
      return { reply: n ? `Stopped all ${n} alert(s). You won't get any more updates.` : "You don't have any active alerts.", pending: null };
    }
    const r = await resolveOrAsk(ctx, intent);
    if ("result" in r) return r.result;
    const n = await cancelAlerts(ctx.db, ctx.user.id, { symbol: r.instrument.symbol, exchange: r.instrument.exchange });
    const remaining = await ctx.db.alert.count({ where: { userId: ctx.user.id, status: { in: ["ACTIVE", "PAUSED"] } } });
    if (!n) return { reply: `You don't have active alerts for ${r.instrument.symbol}.`, pending: null };
    return { reply: `Stopped ${n} alert(s) for ${r.instrument.symbol}. ${remaining ? `You still have ${remaining} other alert(s).` : "You have no other alerts."}`, pending: null };
  },
});

registerTool({
  name: "pause_alerts",
  intents: ["PAUSE_ALERTS"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx, intent) {
    let scope = {};
    if (intent.stock_query) {
      const r = await resolveOrAsk(ctx, intent);
      if ("result" in r) return r.result;
      scope = { symbol: r.instrument.symbol, exchange: r.instrument.exchange };
    }
    const n = await pauseAlerts(ctx.db, ctx.user.id, scope);
    return { reply: n ? `Paused ${n} alert(s). Reply *resume alerts* to turn them back on.` : "There are no active alerts to pause.", pending: null };
  },
});

registerTool({
  name: "resume_alerts",
  intents: ["RESUME_ALERTS"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx, intent) {
    let scope = {};
    if (intent.stock_query) {
      const r = await resolveOrAsk(ctx, intent);
      if ("result" in r) return r.result;
      scope = { symbol: r.instrument.symbol, exchange: r.instrument.exchange };
    }
    if (ctx.user.proactiveOptOutAt) return { reply: "You've stopped all messages. Reply *START* first to receive alerts again.", pending: null };
    const n = await resumeAlerts(ctx.db, ctx.calendar, ctx.user.id, scope, ctx.now);
    return { reply: n ? `Resumed ${n} alert(s).` : "There are no paused alerts.", pending: null };
  },
});

registerTool({
  name: "list_alerts",
  intents: ["LIST_ALERTS"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx) {
    const alerts = await listAlerts(ctx.db, ctx.user.id);
    if (!alerts.length) return { reply: "You have no active alerts. Try *send TCS updates every hour* or *alert me if Infosys falls below ₹1,400*.", pending: null };
    const lines = alerts.map((a, i) => `${i + 1}. ${describeAlert(a)}`);
    return { reply: `Your alerts:\n${lines.join("\n")}\n\nReply *stop <stock> alerts* or *stop all alerts* to cancel.`, pending: null };
  },
});

registerTool({
  name: "subscription_status",
  intents: ["SUBSCRIPTION_STATUS"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx) {
    const l = ctx.plan.limits;
    const used = await usageToday(ctx.db, ctx.user.id, "QUOTE_QUERY", ctx.now);
    const renew = ctx.plan.endAt ? `\nRenews/ends: ${formatIstDateTime(ctx.plan.endAt)}` : "";
    return {
      reply: `You're on *${ctx.plan.name}*.${renew}\n• Price checks today: ${used}/${l.dailyQuoteQueries}\n• Watchlist: up to ${l.watchlistMax} stocks\n• Price alerts: up to ${l.priceAlertsMax}\n• Recurring updates: up to ${l.recurringAlertsMax}${l.recurringFrequencies.length ? ` (every ${l.recurringFrequencies.join("/")} min)` : " (daily closing summary)"}`,
      pending: null,
    };
  },
});

registerTool({
  name: "upgrade",
  intents: ["UPGRADE"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx) {
    return { reply: await startUpgrade(ctx.db, ctx.user.id, ctx.plan), pending: null };
  },
});

registerTool({
  name: "dashboard_link",
  intents: ["DASHBOARD_LINK"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx) {
    const link = await createLoginLink(ctx.db, ctx.user.id);
    return { reply: `Here's your private Pulse dashboard link. It works once and expires in 15 minutes. Don't share it.\n${link}`, pending: null };
  },
});

registerTool({
  name: "opt_out",
  intents: ["OPT_OUT"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx) {
    const now = ctx.now;
    const paused = await pauseAlerts(ctx.db, ctx.user.id, {});
    await ctx.db.user.update({ where: { id: ctx.user.id }, data: { proactiveOptOutAt: now } });
    await revokeConsent(ctx.db, ctx.user.id, "PROACTIVE_MESSAGES");
    return { reply: `You won't get any more updates or alerts from Pulse${paused ? ` (${paused} alert(s) paused)` : ""}. You can still ask me for prices. Reply *START* to turn messages back on.`, pending: null };
  },
});

registerTool({
  name: "opt_in",
  intents: ["OPT_IN"],
  input: anyIntent,
  requiresPrivacyConsent: true,
  async run(ctx) {
    await ctx.db.user.update({ where: { id: ctx.user.id }, data: { proactiveOptOutAt: null } });
    const resumed = await resumeAlerts(ctx.db, ctx.calendar, ctx.user.id, {}, ctx.now);
    return { reply: `Messages are back on.${resumed ? ` Resumed ${resumed} alert(s).` : ""} Reply *STOP* any time to stop them.`, pending: null };
  },
});

registerTool({
  name: "delete_data",
  intents: ["DELETE_DATA"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run() {
    return {
      reply: "This will stop all alerts and permanently erase your watchlist, alerts and message history from Pulse. Reply *YES DELETE* within 15 minutes to confirm.",
      pending: { kind: "confirm_delete" },
    };
  },
});

registerTool({
  name: "agree",
  intents: ["AGREE"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run(ctx) {
    await grantConsent(ctx.db, ctx.user.id, "PRIVACY_NOTICE", `whatsapp:${ctx.sourceMessageId}`);
    return { reply: "Thanks, noted. Reply *help* to see what I can do.", pending: null };
  },
});

registerTool({
  name: "help",
  intents: ["HELP", "GREETING"],
  input: anyIntent,
  requiresPrivacyConsent: false,
  async run() {
    return { reply: HELP_TEXT, pending: null };
  },
});

export const DELETE_CONFIRMED_REPLY = "Done. Your alerts are stopped and your Pulse data will be erased shortly. If you message again, you'll start as a new user.";

export async function confirmDeletion(ctx: ToolContext) {
  await requestDeletion(ctx.db, ctx.user.id);
  return DELETE_CONFIRMED_REPLY;
}

export function privacyLink() {
  return privacyUrl();
}

/** Ensures this module's tools are registered (import side effect). */
export function toolsLoaded(): number {
  return registeredTools().length;
}

