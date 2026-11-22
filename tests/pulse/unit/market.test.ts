import { describe, expect, it } from "vitest";
import { validateQuote, uniqueInstruments } from "@/pulse/modules/market-data/quote.validation";
import { resolveFromList, normalizeQuery } from "@/pulse/modules/market-data/symbol-resolver";
import { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { computeNextRun, slotsForDay, isValidSlot } from "@/pulse/modules/alerts/alert.schedule";
import { evaluateAlert } from "@/pulse/modules/alerts/alert.evaluator";
import { formatQuoteReply, freshnessLine, inr } from "@/pulse/modules/conversations/formatter";
import { monthlyUnitEconomics } from "@/pulse/modules/subscriptions/cost.service";
import { planLimitsSchema, DEFAULT_PLANS } from "@/pulse/modules/subscriptions/plans";
import type { MarketQuote } from "@/pulse/modules/market-data/market-data.types";
import { NSE_HOLIDAYS_2026 } from "../../../prisma/seed-data/nse-holidays-2026";

const now = new Date("2026-11-23T05:00:00Z"); // Mon 10:30 IST
const quote = (o: Partial<MarketQuote> = {}): MarketQuote => ({
  symbol: "TCS", companyName: "Tata Consultancy Services Limited", exchange: "NSE", lastPrice: 3420.5, previousClose: 3402.3,
  currency: "INR", dataTimestamp: new Date(now.getTime() - 15 * 60_000).toISOString(), receivedAt: now.toISOString(),
  dataType: "DELAYED", delayMinutes: 15, provider: "TestVendor", marketStatus: "OPEN", ...o,
});

const calendar = new MarketCalendar({
  holidays: new Map(NSE_HOLIDAYS_2026.map(([d, n]) => [`NSE:${d}`, n])),
  loadedYears: new Set(["NSE:2026"]),
});

describe("quote validation", () => {
  it("recomputes change from previous close", () => {
    const q = validateQuote(quote({ change: 999, changePercent: 99 }), { now, staleAfterMinutes: 45 });
    expect(q.change).toBe(18.2);
    expect(q.changePercent).toBe(0.53);
    expect(q.stale).toBe(false);
  });

  it("rejects bad prices, timestamps, exchanges and implausible moves", () => {
    const opts = { now, staleAfterMinutes: 45 };
    expect(() => validateQuote(quote({ lastPrice: 0 }), opts)).toThrow("Invalid last price");
    expect(() => validateQuote(quote({ lastPrice: Number.NaN }), opts)).toThrow();
    expect(() => validateQuote(quote({ dataTimestamp: "garbage" }), opts)).toThrow("Invalid timestamp");
    expect(() => validateQuote(quote({ dataTimestamp: new Date(now.getTime() + 3600_000).toISOString() }), opts)).toThrow("future");
    expect(() => validateQuote(quote({ exchange: "NYSE" as never }), opts)).toThrow("Unsupported exchange");
    expect(() => validateQuote(quote({ lastPrice: 9000 }), opts)).toThrow("Implausible");
    expect(() => validateQuote(quote(), { ...opts, expectedSymbol: "INFY" })).toThrow("different symbol");
  });

  it("flags stale data", () => {
    const q = validateQuote(quote({ dataTimestamp: new Date(now.getTime() - 3 * 3600_000).toISOString() }), { now, staleAfterMinutes: 45 });
    expect(q.stale).toBe(true);
  });

  it("deduplicates symbols", () => {
    expect(uniqueInstruments([{ symbol: "TCS", exchange: "NSE" }, { symbol: "TCS", exchange: "NSE" }, { symbol: "TCS", exchange: "BSE" }])).toHaveLength(2);
  });
});

describe("symbol resolution", () => {
  const list = [
    { symbol: "TCS", exchange: "NSE" as const, companyName: "Tata Consultancy Services Limited", aliases: ["tcs", "tata consultancy"] },
    { symbol: "TCS", exchange: "BSE" as const, companyName: "Tata Consultancy Services Limited", aliases: ["tcs"] },
    { symbol: "TATASTEEL", exchange: "NSE" as const, companyName: "Tata Steel Limited", aliases: ["tata steel"] },
    { symbol: "INFY", exchange: "NSE" as const, companyName: "Infosys Limited", aliases: ["infosys"] },
  ];
  it("normalises queries", () => expect(normalizeQuery("Infosys Ltd. share price")).toBe("infosys"));
  it("prefers NSE when the exchange is not given", () => expect(resolveFromList("TCS", list)).toEqual({ status: "resolved", instrument: { symbol: "TCS", exchange: "NSE", companyName: "Tata Consultancy Services Limited" } }));
  it("honours an explicit exchange", () => expect(resolveFromList("tcs", list, "BSE")).toMatchObject({ status: "resolved", instrument: { exchange: "BSE" } }));
  it("asks when several companies match", () => expect(resolveFromList("tata", list).status).toBe("ambiguous"));
  it("never auto-selects a fuzzy match", () => expect(resolveFromList("infosis", list)).toMatchObject({ status: "ambiguous", options: [{ symbol: "INFY" }] }));
  it("reports unknown names", () => expect(resolveFromList("acme widgets", list).status).toBe("not_found"));
});

describe("market calendar and schedule", () => {
  it("knows weekends, NSE holidays and unknown years", () => {
    expect(calendar.dayStatus("NSE", "2026-11-23")).toBe("TRADING");
    expect(calendar.dayStatus("NSE", "2026-11-24")).toBe("HOLIDAY");
    expect(calendar.dayStatus("NSE", "2026-11-28")).toBe("WEEKEND");
    expect(calendar.dayStatus("NSE", "2027-01-04")).toBe("UNKNOWN");
    expect(calendar.dayStatus("BSE", "2026-11-23")).toBe("UNKNOWN");
    expect(calendar.marketStatus("NSE", now)).toBe("OPEN");
    expect(calendar.marketStatus("NSE", new Date("2026-11-23T11:00:00Z"))).toBe("CLOSED");
  });

  it("builds session slots", () => {
    expect(slotsForDay("RECURRING_UPDATE", 60)).toEqual([615, 675, 735, 795, 855, 915]); // 10:15 … 15:15
    expect(slotsForDay("RECURRING_UPDATE", 30)).toHaveLength(12);
    expect(slotsForDay("DAILY_CLOSE", null)).toEqual([950]);
  });

  it("computes next runs across holidays and refuses unknown years", () => {
    // Mon 23 Nov after the close → Tue 24 is a holiday → Wed 25 10:15 IST.
    expect(computeNextRun(calendar, "NSE", "RECURRING_UPDATE", 60, new Date("2026-11-23T10:30:00Z")).at?.toISOString()).toBe("2026-11-25T04:45:00.000Z");
    expect(computeNextRun(calendar, "NSE", "RECURRING_UPDATE", 60, new Date("2026-12-31T10:00:00Z"))).toEqual({ at: null, reason: "CALENDAR_UNAVAILABLE" });
    expect(isValidSlot(calendar, "NSE", "RECURRING_UPDATE", new Date("2026-11-24T05:45:00Z"))).toBe("CLOSED");
  });
});

describe("alert evaluation", () => {
  const base = { thresholdValue: 3400, triggerState: "ARMED" as const, lastNotifiedDataAt: null };
  it("triggers above/below once and re-arms past the band", () => {
    expect(evaluateAlert({ ...base, alertType: "PRICE_ABOVE" }, quote())).toMatchObject({ action: "send", nextTriggerState: "TRIGGERED" });
    expect(evaluateAlert({ ...base, alertType: "PRICE_ABOVE", triggerState: "TRIGGERED" }, quote())).toMatchObject({ action: "skip", nextTriggerState: "TRIGGERED" });
    expect(evaluateAlert({ ...base, alertType: "PRICE_ABOVE", triggerState: "TRIGGERED" }, quote({ lastPrice: 3380 }))).toMatchObject({ action: "skip", nextTriggerState: "ARMED" });
    expect(evaluateAlert({ ...base, alertType: "PRICE_BELOW", thresholdValue: 3500 }, quote())).toMatchObject({ action: "send", direction: "below" });
  });
  it("handles percentage moves once per day", () => {
    const q = quote({ changePercent: -3.2 });
    expect(evaluateAlert({ ...base, alertType: "PERCENT_MOVE", thresholdValue: 3 }, q)).toMatchObject({ action: "send", direction: "below" });
    expect(evaluateAlert({ ...base, alertType: "PERCENT_MOVE", thresholdValue: 3, triggerState: "TRIGGERED", lastNotifiedDataAt: new Date(q.dataTimestamp) }, q).action).toBe("skip");
  });
  it("skips stale data and identical recurring snapshots", () => {
    expect(evaluateAlert({ ...base, alertType: "RECURRING_UPDATE" }, quote({ stale: true }))).toMatchObject({ action: "skip", reason: "STALE_DATA" });
    const q = quote();
    expect(evaluateAlert({ ...base, alertType: "RECURRING_UPDATE", lastNotifiedDataAt: new Date(q.dataTimestamp) }, q)).toMatchObject({ reason: "NO_CHANGE" });
  });
});

describe("message formatting", () => {
  it("shows price, change, delay, time and source", () => {
    const text = formatQuoteReply(validateQuote(quote(), { now, staleAfterMinutes: 45 }), now);
    expect(text).toContain("₹3,420.50");
    expect(text).toContain("+₹18.20 (+0.53%)");
    expect(text).toContain("Delayed by 15 minutes, as of 10:15 AM IST");
    expect(text).toContain("Source: TestVendor");
    expect(text).not.toMatch(/real-time/i);
  });
  it("labels closed-market and fixture data", () => {
    expect(freshnessLine(quote({ marketStatus: "CLOSED" }), now)).toContain("Market closed");
    expect(freshnessLine(quote({ isFixture: true }), now)).toContain("SANDBOX TEST DATA");
    expect(inr(1234567.5)).toBe("12,34,567.50");
  });
});

describe("plans and costs", () => {
  it("default plans are valid", () => {
    for (const p of DEFAULT_PLANS) expect(planLimitsSchema.safeParse(p.limits).success).toBe(true);
  });
  it("computes monthly unit economics", () => {
    const r = monthlyUnitEconomics({
      priceInr: 99, gstRate: 0.18, tradingDaysPerMonth: 21, proactiveMessagesPerDay: 7, repliesPerDay: 3,
      utilityRateInr: 0.115, serviceRateInr: 0, aiShare: 0.2, aiCostPerRequestInr: 0.02,
      marketDataCostPerUserInr: 10, infraCostPerMonthInr: 2000, activeUsers: 200, paymentFeeRate: 0.02, supportCostPerUserInr: 5,
    });
    expect(r.netRevenueInr).toBeCloseTo(83.9, 1);
    expect(r.whatsappInr).toBeCloseTo(19.95, 1);
    expect(r.totalCostInr).toBeGreaterThan(40);
    expect(r.grossMarginPct).toBeGreaterThan(0);
  });
});
