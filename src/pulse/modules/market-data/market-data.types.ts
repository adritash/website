export type ExchangeCode = "NSE" | "BSE";
export type DataType = "REALTIME" | "DELAYED" | "EOD";

export interface MarketQuote {
  symbol: string;
  companyName: string;
  exchange: ExchangeCode;
  lastPrice: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
  currency: "INR";
  /** When the provider says this price was valid (ISO). */
  dataTimestamp: string;
  /** When Pulse received it (ISO). */
  receivedAt: string;
  dataType: DataType;
  delayMinutes?: number;
  /** Provider display name, used for source attribution. */
  provider: string;
  /** True when the provider is a development fixture, never real market data. */
  isFixture?: boolean;
  marketStatus?: "OPEN" | "CLOSED" | "UNKNOWN";
  /** Set by validation when the price is older than the freshness threshold. */
  stale?: boolean;
}

export interface HistoricalQuote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type InstrumentRef = { symbol: string; exchange: ExchangeCode; companyName: string };

export interface MarketDataProvider {
  readonly name: string;
  readonly dataType: DataType;
  readonly delayMinutes: number;
  getQuote(instrument: InstrumentRef): Promise<MarketQuote>;
  getQuotes(instruments: InstrumentRef[]): Promise<MarketQuote[]>;
  getHistoricalData?(instrument: InstrumentRef, fromDate: string, toDate: string): Promise<HistoricalQuote[]>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; errorCode?: string }>;
}
