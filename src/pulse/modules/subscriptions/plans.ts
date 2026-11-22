import { z } from "zod";

/** System-wide recurring frequencies. Plans may allow a subset. "1440" = daily closing summary. */
export const SYSTEM_FREQUENCIES = [15, 30, 60] as const;

export const planLimitsSchema = z.object({
  dailyQuoteQueries: z.number().int().min(0),
  watchlistMax: z.number().int().min(0),
  priceAlertsMax: z.number().int().min(0),
  recurringAlertsMax: z.number().int().min(0),
  /** Allowed intraday frequencies in minutes (subset of SYSTEM_FREQUENCIES). */
  recurringFrequencies: z.array(z.number().int()),
  dailyCloseSummary: z.boolean(),
  dailyAiRequests: z.number().int().min(0),
  dailyProactiveMessages: z.number().int().min(0),
});

export type PlanLimits = z.infer<typeof planLimitsSchema>;

/**
 * Default plans used to seed the Plan table. Change limits and prices in the
 * database (admin or seed), not here; code reads them from the DB.
 */
export const DEFAULT_PLANS: { code: string; name: string; pricePaise: number; isDefault: boolean; limits: PlanLimits }[] = [
  {
    code: "FREE",
    name: "Pulse Free",
    pricePaise: 0,
    isDefault: true,
    limits: {
      dailyQuoteQueries: 20,
      watchlistMax: 3,
      priceAlertsMax: 2,
      recurringAlertsMax: 1,
      recurringFrequencies: [],
      dailyCloseSummary: true,
      dailyAiRequests: 20,
      dailyProactiveMessages: 5,
    },
  },
  {
    code: "PLUS",
    name: "Pulse Plus",
    // Pricing hypothesis only (₹99/month). Not sold until PULSE_PAYMENTS_ENABLED=true.
    pricePaise: 9900,
    isDefault: false,
    limits: {
      dailyQuoteQueries: 200,
      watchlistMax: 5,
      priceAlertsMax: 10,
      // Hourly updates are best sent as one watchlist digest per slot; see pricing-and-costs.md.
      recurringAlertsMax: 2,
      recurringFrequencies: [60],
      dailyCloseSummary: true,
      dailyAiRequests: 100,
      dailyProactiveMessages: 16,
    },
  },
];

export function parseLimits(value: unknown): PlanLimits {
  return planLimitsSchema.parse(value);
}
