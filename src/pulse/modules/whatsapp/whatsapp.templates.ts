/**
 * Utility templates Pulse uses outside the 24-hour customer-service window.
 * They must be submitted and APPROVED in WhatsApp Manager with exactly these names,
 * category UTILITY, language `en`, and the body text below. Parameters may not
 * contain newlines, so values are flattened before sending.
 */
export const TEMPLATES = {
  priceUpdate: {
    name: "pulse_price_update",
    category: "UTILITY",
    body: "Pulse update for {{1}} ({{2}}): ₹{{3}}, {{4}} today. {{5}}. Reply STOP {{1}} to stop these updates.",
    example: ["TCS", "NSE", "3,420.50", "+0.53%", "Data delayed 15 min, as of 10:42 AM IST"],
  },
  priceAlert: {
    name: "pulse_price_alert",
    category: "UTILITY",
    body: "Price alert: {{1}} ({{2}}) is ₹{{3}}, {{4}} your level of ₹{{5}}. {{6}}. Reply STOP {{1}} to stop this alert.",
    example: ["TCS", "NSE", "4,005.00", "above", "4,000.00", "Data delayed 15 min, as of 1:15 PM IST"],
  },
  watchlistUpdate: {
    name: "pulse_watchlist_update",
    category: "UTILITY",
    body: "Pulse update for your watchlist: {{1}}. {{2}}. Reply STOP to stop all updates.",
    example: ["TCS ₹3,420.50 (+0.53%); INFY ₹1,512.00 (-0.40%)", "Data delayed 15 min, as of 11:15 AM IST"],
  },
  dailySummary: {
    name: "pulse_daily_summary",
    category: "UTILITY",
    body: "Pulse closing summary for {{1}}: {{2}}. {{3}}. Reply STOP to stop all updates.",
    example: ["24 Nov", "TCS ₹3,420.50 (+0.53%); INFY ₹1,512.00 (-0.40%)", "Closing prices, data delayed 15 min"],
  },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

/** Meta rejects newlines, tabs and runs of 4+ spaces in template parameters. */
export function flattenParam(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 900);
}
