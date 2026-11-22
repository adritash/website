import { describe, expect, it } from "vitest";
import { parseFrequency, parsePrice, parseWithRules } from "@/pulse/modules/ai/rules.parser";
import { intentSchema } from "@/pulse/modules/ai/intent.schema";

const cases: [string, Record<string, unknown>][] = [
  ["What is the current price of TCS?", { intent: "STOCK_PRICE", stock_query: "TCS" }],
  ["How much has Infosys moved today?", { intent: "STOCK_PERFORMANCE", stock_query: "Infosys" }],
  ["What is the current price of Reliance?", { intent: "STOCK_PRICE", stock_query: "Reliance" }],
  ["What is TCS trading at?", { intent: "STOCK_PRICE", stock_query: "TCS" }],
  ["Price of TCS", { intent: "STOCK_PRICE", stock_query: "TCS" }],
  ["Check Infosys", { intent: "STOCK_PRICE", stock_query: "Infosys" }],
  ["TCS", { intent: "STOCK_PRICE", stock_query: "TCS" }],
  ["Add TCS to my watchlist.", { intent: "ADD_WATCHLIST", stock_query: "TCS" }],
  ["Track Reliance", { intent: "ADD_WATCHLIST", stock_query: "Reliance" }],
  ["Remove Infosys from my watchlist", { intent: "REMOVE_WATCHLIST", stock_query: "Infosys" }],
  ["Send me TCS updates every hour.", { intent: "CREATE_RECURRING_ALERT", stock_query: "TCS", frequency_minutes: 60 }],
  ["Send TCS updates every hour", { intent: "CREATE_RECURRING_ALERT", stock_query: "TCS", frequency_minutes: 60 }],
  ["Update me every 30 minutes during market hours", { intent: "CREATE_RECURRING_ALERT", frequency_minutes: 30 }],
  ["Send me daily closing prices", { intent: "CREATE_DAILY_SUMMARY" }],
  ["Send closing prices for all my watchlist stocks.", { intent: "CREATE_DAILY_SUMMARY" }],
  ["Send me a daily summary at 3:30 PM.", { intent: "CREATE_DAILY_SUMMARY" }],
  ["Notify me if Infosys falls below ₹1,400.", { intent: "CREATE_PRICE_ALERT", stock_query: "Infosys", threshold: 1400, direction: "below" }],
  ["Alert me if TCS goes above ₹4,000", { intent: "CREATE_PRICE_ALERT", stock_query: "TCS", threshold: 4000, direction: "above" }],
  ["Alert me if Reliance falls below ₹1,000", { intent: "CREATE_PRICE_ALERT", stock_query: "Reliance", threshold: 1000, direction: "below" }],
  ["Alert me if HDFC Bank moves 3%", { intent: "CREATE_PRICE_ALERT", stock_query: "HDFC Bank", percent: 3 }],
  ["Stop sending me updates about TCS.", { intent: "CANCEL_ALERT", stock_query: "TCS", scope: "stock" }],
  ["Stop TCS alerts", { intent: "CANCEL_ALERT", stock_query: "TCS", scope: "stock" }],
  ["Stop TCS updates.", { intent: "CANCEL_ALERT", stock_query: "TCS", scope: "stock" }],
  ["Stop all alerts", { intent: "CANCEL_ALERT", scope: "all" }],
  ["STOP", { intent: "OPT_OUT" }],
  ["Show all my active alerts.", { intent: "LIST_ALERTS" }],
  ["Show my active alerts", { intent: "LIST_ALERTS" }],
  ["Show my watchlist", { intent: "LIST_WATCHLIST" }],
  ["Change my TCS update frequency to 30 minutes", { intent: "UPDATE_ALERT", stock_query: "TCS", frequency_minutes: 30 }],
  ["How much have my tracked stocks changed today?", { intent: "WATCHLIST_PERFORMANCE" }],
  ["What was the closing price yesterday?", { intent: "PREVIOUS_CLOSE" }],
  ["What was the closing price of TCS yesterday?", { intent: "PREVIOUS_CLOSE", stock_query: "TCS" }],
  ["Help", { intent: "HELP" }],
  ["Pause my alerts", { intent: "PAUSE_ALERTS", scope: "all" }],
  ["Resume alerts", { intent: "RESUME_ALERTS", scope: "all" }],
  ["Price of TCS on BSE", { intent: "STOCK_PRICE", stock_query: "TCS", exchange: "BSE" }],
  ["delete my data", { intent: "DELETE_DATA" }],
];

describe("rules parser", () => {
  for (const [text, expected] of cases) {
    it(`parses "${text}"`, () => {
      const result = parseWithRules(text);
      expect(intentSchema.safeParse(result).success).toBe(true);
      expect(result).toMatchObject(expected);
    });
  }

  it("returns UNKNOWN for unrelated text", () => {
    expect(parseWithRules("Can you write me a poem about the monsoon and my feelings").intent).toBe("UNKNOWN");
  });

  it("parses prices", () => {
    expect(parsePrice("₹4,000")).toBe(4000);
    expect(parsePrice("rs. 1,400.50")).toBe(1400.5);
    expect(parsePrice("4k")).toBe(4000);
    expect(parsePrice("12,34,567")).toBe(1234567);
    expect(parsePrice("nothing")).toBeUndefined();
  });

  it("parses frequencies", () => {
    expect(parseFrequency("every hour")).toBe(60);
    expect(parseFrequency("hourly")).toBe(60);
    expect(parseFrequency("every 30 minutes")).toBe(30);
    expect(parseFrequency("every half hour")).toBe(30);
    expect(parseFrequency("every 15 mins")).toBe(15);
    expect(parseFrequency("every 2 hours")).toBe(120);
  });
});
