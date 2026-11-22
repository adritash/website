import type { Redis } from "ioredis";
import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { logger } from "@/pulse/infrastructure/logger";
import { ConfigError, ProviderError, errorCode } from "@/pulse/lib/errors";
import { recordUsage } from "@/pulse/modules/subscriptions/usage.service";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import type { InstrumentRef, MarketDataProvider, MarketQuote } from "./market-data.types";
import { uniqueInstruments, validateQuote } from "./quote.validation";
import { EodhdProvider } from "./providers/eodhd.provider";
import { SandboxProvider } from "./providers/sandbox.provider";

let override: MarketDataProvider | null = null;

export function setProviderForTests(provider: MarketDataProvider | null) {
  override = provider;
}

/** Builds the configured provider. Fixture data is refused in production. */
export function getProvider(): MarketDataProvider | null {
  if (override) return override;
  const env = getEnv();
  switch (env.MARKET_DATA_PROVIDER) {
    case "eodhd":
      if (!env.MARKET_DATA_API_KEY) throw new ConfigError("MARKET_DATA_API_KEY is not configured");
      return new EodhdProvider({ apiKey: env.MARKET_DATA_API_KEY, timeoutMs: env.MARKET_DATA_TIMEOUT_MS, delayMinutes: env.MARKET_DATA_DELAY_MINUTES });
    case "sandbox":
      if (env.NODE_ENV === "production") throw new ConfigError("Sandbox market data is not allowed in production");
      return new SandboxProvider();
    default:
      return null;
  }
}

export type QuoteResult = { ok: true; quote: MarketQuote; cached: boolean } | { ok: false; code: string };

type Deps = { db: Db; redis?: Redis; calendar: MarketCalendar; provider?: MarketDataProvider | null; now?: () => Date };

const cacheKey = (i: InstrumentRef) => `pulse:quote:${i.exchange}:${i.symbol}`;

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!(error instanceof ProviderError) || !error.retryable || i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  throw last;
}

async function sampleHealth(db: Db, provider: string, ok: boolean, latencyMs: number, code?: string) {
  try {
    await db.providerHealthSample.create({ data: { provider, kind: "quote", ok, latencyMs, errorCode: code } });
  } catch (error) {
    logger.error("market_data.health_sample_failed", { error });
  }
}

/**
 * Returns a validated quote or a failure code. Never fabricates or reuses a
 * price beyond the cache TTL. Delayed data is cached briefly to cut API cost.
 */
export async function getQuote(deps: Deps, instrument: InstrumentRef, userId?: string): Promise<QuoteResult> {
  const env = getEnv();
  const provider = deps.provider === undefined ? getProvider() : deps.provider;
  if (!provider) return { ok: false, code: "MD_NOT_CONFIGURED" };
  const now = deps.now?.() ?? new Date();

  if (deps.redis && provider.dataType !== "REALTIME") {
    try {
      const hit = await deps.redis.get(cacheKey(instrument));
      if (hit) {
        const quote = JSON.parse(hit) as MarketQuote;
        return { ok: true, quote: finalize(quote, deps.calendar, now, env.MARKET_DATA_STALE_AFTER_MINUTES), cached: true };
      }
    } catch (error) {
      logger.warn("market_data.cache_read_failed", { error });
    }
  }

  const started = Date.now();
  try {
    const raw = await withRetry(() => provider.getQuote(instrument));
    const quote = finalize(raw, deps.calendar, now, env.MARKET_DATA_STALE_AFTER_MINUTES, instrument);
    await sampleHealth(deps.db, provider.name, true, Date.now() - started);
    await recordUsage(deps.db, { userId, usageType: "MARKET_DATA_CALL", estimatedCostInr: env.PULSE_COST_MARKET_DATA_CALL_INR });
    if (deps.redis && provider.dataType !== "REALTIME") {
      await deps.redis.set(cacheKey(instrument), JSON.stringify(raw), "EX", env.MARKET_DATA_CACHE_SECONDS).catch(() => undefined);
    }
    return { ok: true, quote, cached: false };
  } catch (error) {
    const code = errorCode(error);
    logger.warn("market_data.quote_failed", { code, symbol: instrument.symbol, exchange: instrument.exchange });
    await sampleHealth(deps.db, provider.name, false, Date.now() - started, code);
    return { ok: false, code };
  }
}

function finalize(raw: MarketQuote, calendar: MarketCalendar, now: Date, staleAfter: number, expected?: InstrumentRef): MarketQuote {
  const quote = validateQuote(raw, { now, staleAfterMinutes: staleAfter, expectedSymbol: expected?.symbol, expectedExchange: expected?.exchange });
  return { ...quote, marketStatus: calendar.marketStatus(quote.exchange, now) };
}

export async function getQuotes(deps: Deps, instruments: InstrumentRef[], userId?: string): Promise<Map<string, QuoteResult>> {
  const out = new Map<string, QuoteResult>();
  for (const i of uniqueInstruments(instruments)) {
    out.set(`${i.exchange}:${i.symbol}`, await getQuote(deps, i, userId));
  }
  return out;
}
