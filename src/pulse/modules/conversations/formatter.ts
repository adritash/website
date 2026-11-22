import { formatIstDateTime, formatIstTime, istDateKey } from "@/pulse/lib/time";
import type { MarketQuote } from "@/pulse/modules/market-data/market-data.types";

export const DISCLAIMER = "Information only, not investment advice.";

export function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function signedInr(n: number): string {
  return `${n >= 0 ? "+" : "-"}₹${inr(Math.abs(n))}`;
}

export function signedPct(n: number): string {
  return `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(2)}%`;
}

/** One line describing how fresh the data is. Never says "real-time" unless it is. */
export function freshnessLine(quote: MarketQuote, now = new Date()): string {
  const ts = new Date(quote.dataTimestamp);
  const sameDay = istDateKey(ts) === istDateKey(now);
  const when = sameDay ? formatIstTime(ts) : formatIstDateTime(ts);
  if (quote.isFixture) return `SANDBOX TEST DATA, not real prices (as of ${when})`;
  if (quote.marketStatus === "CLOSED") return `Market closed. Last available price as of ${when}`;
  const kind =
    quote.dataType === "REALTIME"
      ? "Real-time"
      : quote.dataType === "EOD"
        ? "End-of-day price"
        : `Delayed by ${quote.delayMinutes ?? 15} minutes`;
  return quote.stale ? `${kind}. This price may be outdated (as of ${when})` : `${kind}, as of ${when}`;
}

export function formatQuoteReply(quote: MarketQuote, now = new Date()): string {
  const lines = [`*${quote.companyName}* (${quote.symbol}, ${quote.exchange}): ₹${inr(quote.lastPrice)}`];
  if (quote.change !== undefined && quote.changePercent !== undefined) {
    const label = quote.marketStatus === "CLOSED" ? "Change on the day" : "Change today";
    lines.push(`${label}: ${signedInr(quote.change)} (${signedPct(quote.changePercent)})`);
  }
  lines.push(`Data: ${freshnessLine(quote, now)}`);
  lines.push(`Source: ${quote.provider}`);
  return lines.join("\n");
}

export function formatPreviousClose(quote: MarketQuote, now = new Date()): string {
  if (quote.previousClose === undefined) {
    return `I couldn't get the previous closing price for ${quote.symbol} from ${quote.provider}.`;
  }
  return [
    `*${quote.companyName}* (${quote.symbol}, ${quote.exchange}) previous close: ₹${inr(quote.previousClose)}`,
    `Latest: ₹${inr(quote.lastPrice)}. ${freshnessLine(quote, now)}`,
    `Source: ${quote.provider}`,
  ].join("\n");
}

/** Short single-line summary used in lists and templates (no newlines). */
export function quoteSummary(quote: MarketQuote): string {
  const pct = quote.changePercent !== undefined ? ` (${signedPct(quote.changePercent)})` : "";
  return `${quote.symbol} ₹${inr(quote.lastPrice)}${pct}`;
}

export function priceUnavailable(symbol: string, code: string): string {
  if (code === "MD_NOT_CONFIGURED") {
    return `Live prices aren't switched on yet, so I can't show a price for ${symbol} right now. I won't guess one.`;
  }
  return `I couldn't get a reliable price for ${symbol} right now, so I won't show one. Please try again in a few minutes.`;
}
