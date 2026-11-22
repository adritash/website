import { ProviderError } from "@/pulse/lib/errors";
import type { MarketQuote } from "./market-data.types";

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_PRICE = 10_000_000; // ₹1 crore per share is beyond any listed Indian equity.

function finitePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function optionalFinite(n: unknown): number | undefined {
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

/**
 * Rejects quotes that cannot be shown to a user. Throws ProviderError (never
 * returns a "best guess"). Recomputes change from previous close when both are
 * present so the displayed change is internally consistent.
 */
export function validateQuote(
  quote: MarketQuote,
  opts: { now?: Date; staleAfterMinutes: number; expectedSymbol?: string; expectedExchange?: string }
): MarketQuote {
  const now = opts.now ?? new Date();
  if (opts.expectedSymbol && quote.symbol !== opts.expectedSymbol) {
    throw new ProviderError("QUOTE_SYMBOL_MISMATCH", "Provider returned a different symbol", false);
  }
  if (opts.expectedExchange && quote.exchange !== opts.expectedExchange) {
    throw new ProviderError("QUOTE_EXCHANGE_MISMATCH", "Provider returned a different exchange", false);
  }
  if (quote.exchange !== "NSE" && quote.exchange !== "BSE") {
    throw new ProviderError("QUOTE_UNSUPPORTED_EXCHANGE", "Unsupported exchange", false);
  }
  if (quote.currency !== "INR") throw new ProviderError("QUOTE_BAD_CURRENCY", "Unexpected currency", false);
  if (!finitePositive(quote.lastPrice) || quote.lastPrice > MAX_PRICE) {
    throw new ProviderError("QUOTE_INVALID_PRICE", "Invalid last price", false);
  }
  const ts = Date.parse(quote.dataTimestamp);
  if (!Number.isFinite(ts)) throw new ProviderError("QUOTE_INVALID_TIMESTAMP", "Invalid timestamp", false);
  if (ts - now.getTime() > MAX_FUTURE_SKEW_MS) {
    throw new ProviderError("QUOTE_FUTURE_TIMESTAMP", "Timestamp is in the future", false);
  }

  const previousClose = finitePositive(quote.previousClose) ? quote.previousClose : undefined;
  let change = optionalFinite(quote.change);
  let changePercent = optionalFinite(quote.changePercent);
  if (previousClose !== undefined) {
    change = round(quote.lastPrice - previousClose, 2);
    changePercent = round(((quote.lastPrice - previousClose) / previousClose) * 100, 2);
  }
  // Implausible single-day moves (exchange circuit limits cap most stocks at 20%) indicate bad data.
  if (changePercent !== undefined && Math.abs(changePercent) > 60) {
    throw new ProviderError("QUOTE_IMPLAUSIBLE_CHANGE", "Implausible change", false);
  }

  const ageMinutes = (now.getTime() - ts) / 60_000;
  return {
    ...quote,
    previousClose,
    change,
    changePercent,
    stale: quote.dataType !== "EOD" && ageMinutes > opts.staleAfterMinutes + (quote.delayMinutes ?? 0),
  };
}

export function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Deduplicates instruments by exchange+symbol, keeping order. */
export function uniqueInstruments<T extends { symbol: string; exchange: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.exchange}:${i.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
