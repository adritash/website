import type { Db } from "@/pulse/infrastructure/db";
import { addDaysToKey, istDateKey, istInstant, istParts, weekdayOfKey } from "@/pulse/lib/time";
import type { ExchangeCode } from "@/pulse/modules/market-data/market-data.types";

/** Normal equity session, minutes after midnight IST (09:15–15:30). */
export const SESSION = { open: 9 * 60 + 15, close: 15 * 60 + 30 } as const;

export type DayStatus = "TRADING" | "WEEKEND" | "HOLIDAY" | "UNKNOWN";

export type CalendarData = {
  /** `${exchange}:${YYYY-MM-DD}` → description */
  holidays: Map<string, string>;
  /** `${exchange}:${year}` for years whose official holiday list is loaded. */
  loadedYears: Set<string>;
};

/**
 * Trading calendar backed by official exchange holiday lists in the database.
 * A year without a verified list is UNKNOWN, never assumed to be Monday–Friday.
 * NSE and BSE are tracked separately.
 */
export class MarketCalendar {
  constructor(private readonly data: CalendarData) {}

  dayStatus(exchange: ExchangeCode, dateKey: string): DayStatus {
    const weekday = weekdayOfKey(dateKey);
    if (weekday === 0 || weekday === 6) return "WEEKEND";
    if (!this.data.loadedYears.has(`${exchange}:${dateKey.slice(0, 4)}`)) return "UNKNOWN";
    return this.data.holidays.has(`${exchange}:${dateKey}`) ? "HOLIDAY" : "TRADING";
  }

  holidayName(exchange: ExchangeCode, dateKey: string): string | undefined {
    return this.data.holidays.get(`${exchange}:${dateKey}`);
  }

  hasYear(exchange: ExchangeCode, year: number): boolean {
    return this.data.loadedYears.has(`${exchange}:${year}`);
  }

  /** OPEN during the normal session on a trading day; CLOSED otherwise; UNKNOWN if no calendar. */
  marketStatus(exchange: ExchangeCode, at: Date): "OPEN" | "CLOSED" | "UNKNOWN" {
    const key = istDateKey(at);
    const status = this.dayStatus(exchange, key);
    if (status === "UNKNOWN") return "UNKNOWN";
    if (status !== "TRADING") return "CLOSED";
    const m = istParts(at).minutesOfDay;
    return m >= SESSION.open && m < SESSION.close ? "OPEN" : "CLOSED";
  }

  /**
   * Next trading day on or after `dateKey`. Returns null when it would need a year
   * whose calendar is not loaded (callers must not guess).
   */
  nextTradingDay(exchange: ExchangeCode, dateKey: string, maxDays = 30): string | null {
    let key = dateKey;
    for (let i = 0; i <= maxDays; i++) {
      const s = this.dayStatus(exchange, key);
      if (s === "TRADING") return key;
      if (s === "UNKNOWN") return null;
      key = addDaysToKey(key, 1);
    }
    return null;
  }

  /** Start of the most recent completed or current session (for "closing price" wording). */
  lastSessionClose(exchange: ExchangeCode, at: Date): Date | null {
    let key = istDateKey(at);
    if (this.dayStatus(exchange, key) === "TRADING" && istParts(at).minutesOfDay >= SESSION.close) {
      return istInstant(key, SESSION.close);
    }
    for (let i = 0; i < 30; i++) {
      key = addDaysToKey(key, -1);
      const s = this.dayStatus(exchange, key);
      if (s === "UNKNOWN") return null;
      if (s === "TRADING") return istInstant(key, SESSION.close);
    }
    return null;
  }
}

let cache: { calendar: MarketCalendar; loadedAt: number } | null = null;
const CACHE_MS = 10 * 60 * 1000;

export async function loadCalendar(db: Db, force = false): Promise<MarketCalendar> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_MS) return cache.calendar;
  const [holidays, years] = await Promise.all([db.marketHoliday.findMany(), db.marketCalendarYear.findMany()]);
  const calendar = new MarketCalendar({
    holidays: new Map(holidays.map((h) => [`${h.exchange}:${h.date.toISOString().slice(0, 10)}`, h.description])),
    loadedYears: new Set(years.map((y) => `${y.exchange}:${y.year}`)),
  });
  cache = { calendar, loadedAt: Date.now() };
  return calendar;
}

export function clearCalendarCache() {
  cache = null;
}
