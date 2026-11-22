import { z } from "zod";

export const INTENTS = [
  "STOCK_PRICE",
  "STOCK_PERFORMANCE",
  "PREVIOUS_CLOSE",
  "ADD_WATCHLIST",
  "REMOVE_WATCHLIST",
  "LIST_WATCHLIST",
  "WATCHLIST_PERFORMANCE",
  "CREATE_PRICE_ALERT",
  "CREATE_RECURRING_ALERT",
  "CREATE_DAILY_SUMMARY",
  "UPDATE_ALERT",
  "CANCEL_ALERT",
  "PAUSE_ALERTS",
  "RESUME_ALERTS",
  "LIST_ALERTS",
  "SUBSCRIPTION_STATUS",
  "UPGRADE",
  "DASHBOARD_LINK",
  "OPT_OUT",
  "OPT_IN",
  "DELETE_DATA",
  "AGREE",
  "HELP",
  "GREETING",
  "UNKNOWN",
] as const;

export type IntentName = (typeof INTENTS)[number];

/**
 * The only shape an interpreter (rules or AI) may return. `stock_query` is the
 * user's own words for a company; it is resolved against the instrument master,
 * so a model cannot introduce a symbol. There is no field for prices or times.
 */
export const intentSchema = z
  .object({
    intent: z.enum(INTENTS),
    stock_query: z.string().trim().min(1).max(60).optional(),
    exchange: z.enum(["NSE", "BSE"]).optional(),
    frequency_minutes: z.number().int().min(1).max(1440).optional(),
    threshold: z.number().positive().max(10_000_000).optional(),
    direction: z.enum(["above", "below"]).optional(),
    percent: z.number().positive().max(100).optional(),
    scope: z.enum(["one", "stock", "all"]).optional(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type Intent = z.infer<typeof intentSchema>;

/** JSON Schema given to the model for structured output (kept in sync with intentSchema). */
export const intentJsonSchema = {
  type: "object",
  properties: {
    intent: { type: "string", enum: [...INTENTS] },
    stock_query: { type: "string", description: "Company name or ticker exactly as the user wrote it. Omit if none." },
    exchange: { type: "string", enum: ["NSE", "BSE"] },
    frequency_minutes: { type: "integer" },
    threshold: { type: "number", description: "Price level in rupees the user mentioned, if any." },
    direction: { type: "string", enum: ["above", "below"] },
    percent: { type: "number" },
    scope: { type: "string", enum: ["one", "stock", "all"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["intent", "confidence"],
  additionalProperties: false,
} as const;

export const CONFIDENCE_THRESHOLD = 0.6;
