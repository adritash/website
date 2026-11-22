import { ProviderError } from "@/pulse/lib/errors";
import type { InstrumentRef, MarketDataProvider, MarketQuote } from "../market-data.types";

/**
 * DEVELOPMENT AND TEST FIXTURE ONLY — NOT MARKET DATA.
 * Returns deterministic made-up numbers so the product can be exercised without a
 * licensed feed. Every quote is flagged `isFixture` and labelled "SANDBOX" in user
 * messages. The provider factory refuses this provider when NODE_ENV=production.
 */
export class SandboxProvider implements MarketDataProvider {
  readonly name = "SANDBOX (test data, not real prices)";
  readonly dataType = "DELAYED" as const;
  readonly delayMinutes = 15;

  /** Tests can force failures or set exact prices. */
  public failWith: ProviderError | null = null;
  public overrides = new Map<string, { lastPrice: number; previousClose: number; dataTimestamp?: string }>();
  public calls = 0;

  constructor(private readonly clock: () => Date = () => new Date()) {}

  private fixturePrice(symbol: string): { lastPrice: number; previousClose: number } {
    let h = 0;
    for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const previousClose = 100 + (h % 4900);
    const drift = ((h >> 8) % 400) / 100 - 2; // -2%..+2%
    return { previousClose, lastPrice: Math.round(previousClose * (1 + drift / 100) * 100) / 100 };
  }

  async getQuote(instrument: InstrumentRef): Promise<MarketQuote> {
    this.calls++;
    if (this.failWith) throw this.failWith;
    const key = `${instrument.exchange}:${instrument.symbol}`;
    const o = this.overrides.get(key);
    const base = o ?? this.fixturePrice(instrument.symbol);
    const now = this.clock();
    return {
      symbol: instrument.symbol,
      companyName: instrument.companyName,
      exchange: instrument.exchange,
      lastPrice: base.lastPrice,
      previousClose: base.previousClose,
      currency: "INR",
      dataTimestamp: o?.dataTimestamp ?? new Date(now.getTime() - this.delayMinutes * 60_000).toISOString(),
      receivedAt: now.toISOString(),
      dataType: this.dataType,
      delayMinutes: this.delayMinutes,
      provider: this.name,
      isFixture: true,
    };
  }

  async getQuotes(instruments: InstrumentRef[]): Promise<MarketQuote[]> {
    return Promise.all(instruments.map((i) => this.getQuote(i)));
  }

  async healthCheck() {
    return this.failWith ? { ok: false, latencyMs: 0, errorCode: this.failWith.code } : { ok: true, latencyMs: 0 };
  }
}
