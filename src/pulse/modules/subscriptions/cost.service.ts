import { getEnv } from "@/pulse/config/env";
import type { MessageCategory } from "@/pulse/generated/prisma/enums";

/** Estimated Meta charge (INR, excl. GST) for one delivered message of this category. */
export function estimateMessageCost(category: MessageCategory): number {
  const env = getEnv();
  switch (category) {
    case "UTILITY":
      return env.PULSE_COST_WHATSAPP_UTILITY_INR;
    case "MARKETING":
      return env.PULSE_COST_WHATSAPP_MARKETING_INR;
    case "SERVICE":
      return env.PULSE_COST_WHATSAPP_SERVICE_INR;
    default:
      return env.PULSE_COST_WHATSAPP_UTILITY_INR;
  }
}

export type CostInputs = {
  /** Plan price per month in INR, GST-inclusive. */
  priceInr: number;
  gstRate: number;
  tradingDaysPerMonth: number;
  /** Proactive (template) messages per user per trading day. */
  proactiveMessagesPerDay: number;
  /** Replies to user questions per user per trading day (service, in window). */
  repliesPerDay: number;
  utilityRateInr: number;
  serviceRateInr: number;
  /** Fraction of replies that need an AI call (rest handled by rules). */
  aiShare: number;
  aiCostPerRequestInr: number;
  marketDataCostPerUserInr: number;
  infraCostPerMonthInr: number;
  activeUsers: number;
  paymentFeeRate: number;
  supportCostPerUserInr: number;
};

export type CostBreakdown = {
  netRevenueInr: number;
  whatsappInr: number;
  aiInr: number;
  marketDataInr: number;
  infraInr: number;
  paymentFeesInr: number;
  supportInr: number;
  totalCostInr: number;
  grossMarginInr: number;
  grossMarginPct: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Monthly unit economics for one paying user. Pure function; documented in pricing-and-costs.md. */
export function monthlyUnitEconomics(i: CostInputs): CostBreakdown {
  const netRevenueInr = i.priceInr / (1 + i.gstRate);
  // Meta charges GST on top of its rates; it is a cost to Pulse.
  const whatsappInr =
    i.tradingDaysPerMonth *
    (i.proactiveMessagesPerDay * i.utilityRateInr + i.repliesPerDay * i.serviceRateInr) *
    (1 + i.gstRate);
  const aiInr = i.tradingDaysPerMonth * i.repliesPerDay * i.aiShare * i.aiCostPerRequestInr;
  const infraInr = i.activeUsers > 0 ? i.infraCostPerMonthInr / i.activeUsers : i.infraCostPerMonthInr;
  const paymentFeesInr = i.priceInr * i.paymentFeeRate * (1 + i.gstRate);
  const totalCostInr = whatsappInr + aiInr + i.marketDataCostPerUserInr + infraInr + paymentFeesInr + i.supportCostPerUserInr;
  const grossMarginInr = netRevenueInr - totalCostInr;
  return {
    netRevenueInr: r2(netRevenueInr),
    whatsappInr: r2(whatsappInr),
    aiInr: r2(aiInr),
    marketDataInr: r2(i.marketDataCostPerUserInr),
    infraInr: r2(infraInr),
    paymentFeesInr: r2(paymentFeesInr),
    supportInr: r2(i.supportCostPerUserInr),
    totalCostInr: r2(totalCostInr),
    grossMarginInr: r2(grossMarginInr),
    grossMarginPct: netRevenueInr > 0 ? r2((grossMarginInr / netRevenueInr) * 100) : 0,
  };
}
