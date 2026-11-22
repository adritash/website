import { ProviderError } from "@/pulse/lib/errors";
import type { HistoricalQuote, InstrumentRef, MarketDataProvider, MarketQuote } from "../market-data.types";

/**
 * EODHD adapter (https://eodhd.com/financial-apis/live-realtime-stocks-api).
 * Endpoint and fields are from EODHD's public docs: GET /api/real-time/{ticker}?api_token=&fmt=json,
 * extra tickers via `s=`; fields code, timestamp, gmtoffset, open, high, low, close,
 * volume, previousClose, change, change_p. Stated delay: 15-20 minutes.
 *
 * NOT VERIFIED: EODHD's NSE/BSE ticker suffixes and India coverage, and whether
 * its licence permits display to end users. Confirm both with EODHD before
 * enabling this provider in production (see docs/pulse/research.md).
 */
type EodhdRealtime = {
  code?: string;
  timestamp?: number | string;
  gmtoffset?: number;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
  previousClose?: number | string;
  change?: number | string;
  change_p?: number | string;
};

const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

export class EodhdProvider implements MarketDataProvider {
  readonly name = "EODHD";
  readonly dataType = "DELAYED" as const;

  constructor(
    private readonly opts: {
      apiKey: string;
      timeoutMs: number;
      delayMinutes: number;
      exchangeSuffix?: Record<"NSE" | "BSE", string>;
      fetchImpl?: typeof fetch;
      baseUrl?: string;
    }
  ) {}

  get delayMinutes() {
    return this.opts.delayMinutes;
  }

  private ticker(i: InstrumentRef): string {
    const suffix = (this.opts.exchangeSuffix ?? { NSE: "NSE", BSE: "BSE" })[i.exchange];
    return `${i.symbol}.${suffix}`;
  }

  private async request(path: string, params: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.opts.baseUrl ?? "https://eodhd.com"}${path}`);
    for (const [k, v] of Object.entries({ ...params, api_token: this.opts.apiKey, fmt: "json" })) url.searchParams.set(k, v);
    let response: Response;
    try {
      response = await (this.opts.fetchImpl ?? fetch)(url, { signal: AbortSignal.timeout(this.opts.timeoutMs), cache: "no-store" });
    } catch (error) {
      throw new ProviderError("MD_NETWORK", "Market data request failed", true, error);
    }
    if (response.status === 429) throw new ProviderError("MD_RATE_LIMITED", "Market data rate limit", true);
    if (response.status === 401 || response.status === 403) throw new ProviderError("MD_AUTH", "Market data authorisation failed", false);
    if (response.status === 404) throw new ProviderError("MD_NOT_FOUND", "Symbol not found at provider", false);
    if (!response.ok) throw new ProviderError(`MD_HTTP_${response.status}`, "Market data provider error", response.status >= 500);
    try {
      return await response.json();
    } catch (error) {
      throw new ProviderError("MD_BAD_JSON", "Invalid provider response", true, error);
    }
  }

  private toQuote(raw: EodhdRealtime, instrument: InstrumentRef): MarketQuote {
    const close = num(raw.close);
    const ts = num(raw.timestamp);
    if (close === undefined || ts === undefined) {
      throw new ProviderError("MD_MISSING_FIELDS", "Provider returned no price", false);
    }
    return {
      symbol: instrument.symbol,
      companyName: instrument.companyName,
      exchange: instrument.exchange,
      lastPrice: close,
      previousClose: num(raw.previousClose),
      change: num(raw.change),
      changePercent: num(raw.change_p),
      open: num(raw.open),
      high: num(raw.high),
      low: num(raw.low),
      currency: "INR",
      dataTimestamp: new Date(ts * 1000).toISOString(),
      receivedAt: new Date().toISOString(),
      dataType: this.dataType,
      delayMinutes: this.delayMinutes,
      provider: this.name,
    };
  }

  async getQuote(instrument: InstrumentRef): Promise<MarketQuote> {
    const raw = (await this.request(`/api/real-time/${encodeURIComponent(this.ticker(instrument))}`, {})) as EodhdRealtime;
    if (raw.code && raw.code.toUpperCase() !== this.ticker(instrument).toUpperCase()) {
      throw new ProviderError("QUOTE_SYMBOL_MISMATCH", "Provider returned a different symbol", false);
    }
    return this.toQuote(raw, instrument);
  }

  async getQuotes(instruments: InstrumentRef[]): Promise<MarketQuote[]> {
    if (instruments.length === 0) return [];
    // EODHD recommends up to 15-20 tickers per request.
    const results: MarketQuote[] = [];
    for (let i = 0; i < instruments.length; i += 15) {
      const batch = instruments.slice(i, i + 15);
      const [first, ...rest] = batch;
      const params: Record<string, string> = rest.length ? { s: rest.map((x) => this.ticker(x)).join(",") } : {};
      const raw = await this.request(`/api/real-time/${encodeURIComponent(this.ticker(first))}`, params);
      const rows = (Array.isArray(raw) ? raw : [raw]) as EodhdRealtime[];
      const byCode = new Map(rows.map((r) => [String(r.code ?? "").toUpperCase(), r]));
      for (const inst of batch) {
        const row = byCode.get(this.ticker(inst).toUpperCase());
        if (row) results.push(this.toQuote(row, inst));
      }
    }
    return results;
  }

  async getHistoricalData(instrument: InstrumentRef, fromDate: string, toDate: string): Promise<HistoricalQuote[]> {
    const raw = await this.request(`/api/eod/${encodeURIComponent(this.ticker(instrument))}`, { from: fromDate, to: toDate, period: "d" });
    if (!Array.isArray(raw)) throw new ProviderError("MD_BAD_JSON", "Invalid history response", true);
    return raw
      .map((r: Record<string, unknown>) => ({
        date: String(r.date),
        open: num(r.open) ?? NaN,
        high: num(r.high) ?? NaN,
        low: num(r.low) ?? NaN,
        close: num(r.close) ?? NaN,
        volume: num(r.volume),
      }))
      .filter((r) => Number.isFinite(r.close));
  }

  async healthCheck() {
    const started = Date.now();
    try {
      await this.getQuote({ symbol: "TCS", exchange: "NSE", companyName: "Tata Consultancy Services" });
      return { ok: true, latencyMs: Date.now() - started };
    } catch (error) {
      return { ok: false, latencyMs: Date.now() - started, errorCode: error instanceof ProviderError ? error.code : "UNEXPECTED" };
    }
  }
}
