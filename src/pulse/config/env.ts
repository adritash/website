import { z } from "zod";

/**
 * Pulse configuration. Parsed lazily so the marketing site builds and runs
 * without any Pulse variables set. Secrets are never exposed via NEXT_PUBLIC_*.
 */
const bool = (fallback: boolean) =>
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === "true" || v === "1"));

const num = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === "") return fallback;
      const n = Number(v);
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: "custom", message: "must be a number" });
        return z.NEVER;
      }
      return n;
    });

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PULSE_ENABLED: bool(false),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: optionalString,
  REDIS_URL: optionalString,

  // 32-byte keys, base64 encoded. Generate with: openssl rand -base64 32
  PULSE_ENCRYPTION_KEY: optionalString,
  PULSE_PHONE_HASH_KEY: optionalString,
  PULSE_SESSION_SECRET: optionalString,
  ADMIN_AUTH_SECRET: optionalString,

  AI_PROVIDER: z.enum(["none", "gemini"]).default("none"),
  AI_MODEL: z.string().default("gemini-3.6-flash"),
  GEMINI_API_KEY: optionalString,
  AI_DAILY_REQUESTS_PER_USER: num(30),
  AI_TIMEOUT_MS: num(8000),

  WHATSAPP_ACCESS_TOKEN: optionalString,
  WHATSAPP_PHONE_NUMBER_ID: optionalString,
  WHATSAPP_BUSINESS_ACCOUNT_ID: optionalString,
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: optionalString,
  WHATSAPP_APP_SECRET: optionalString,
  WHATSAPP_GRAPH_API_VERSION: z.string().regex(/^v\d+\.\d+$/).default("v27.0"),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().default("en"),
  WHATSAPP_DAILY_UNIQUE_LIMIT: num(250),
  WHATSAPP_TIMEOUT_MS: num(10000),
  // Public display number for click-to-chat, digits only, e.g. 9198XXXXXXXX.
  NEXT_PUBLIC_PULSE_WHATSAPP_NUMBER: optionalString,

  MARKET_DATA_PROVIDER: z.enum(["none", "eodhd", "sandbox"]).default("none"),
  MARKET_DATA_API_KEY: optionalString,
  MARKET_DATA_TIMEOUT_MS: num(6000),
  MARKET_DATA_CACHE_SECONDS: num(60),
  MARKET_DATA_STALE_AFTER_MINUTES: num(45),
  // Display delay disclosed to users for the configured provider.
  MARKET_DATA_DELAY_MINUTES: num(15),

  PULSE_PAYMENTS_ENABLED: bool(false),
  PAYMENT_PROVIDER: z.enum(["none", "razorpay"]).default("none"),
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,

  // Cost model (INR, excluding GST). Verify against Meta's INR rate card.
  PULSE_COST_WHATSAPP_UTILITY_INR: num(0.115),
  PULSE_COST_WHATSAPP_MARKETING_INR: num(0.8631),
  PULSE_COST_WHATSAPP_SERVICE_INR: num(0),
  PULSE_COST_AI_REQUEST_INR: num(0.02),
  PULSE_COST_MARKET_DATA_CALL_INR: num(0),
  PULSE_DAILY_COST_ALERT_INR: num(500),

  PULSE_MESSAGE_RETENTION_DAYS: num(30),
  PULSE_INBOUND_PER_USER_PER_10_MIN: num(30),

  OPS_ALERT_EMAIL: optionalString,
  RESEND_API_KEY: optionalString,

  NEXT_PUBLIC_APP_URL: z.string().url().default("https://www.adritash.com"),
});

export type PulseEnv = z.infer<typeof envSchema>;

let cached: PulseEnv | null = null;

export function getEnv(): PulseEnv {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid Pulse configuration: ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** For tests only. */
export function resetEnvCache() {
  cached = null;
}

export type ProductionCheck = { ok: boolean; missing: string[]; errors: string[] };

/** Validates that everything needed to run Pulse in production is present. */
export function checkProductionReadiness(env: PulseEnv = getEnv()): ProductionCheck {
  const missing: string[] = [];
  const errors: string[] = [];
  const required: (keyof PulseEnv)[] = [
    "DATABASE_URL",
    "REDIS_URL",
    "PULSE_ENCRYPTION_KEY",
    "PULSE_PHONE_HASH_KEY",
    "PULSE_SESSION_SECRET",
    "ADMIN_AUTH_SECRET",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
    "WHATSAPP_APP_SECRET",
  ];
  for (const key of required) if (!env[key]) missing.push(key);
  if (env.MARKET_DATA_PROVIDER === "sandbox") {
    errors.push("MARKET_DATA_PROVIDER=sandbox is not allowed in production");
  }
  if (env.MARKET_DATA_PROVIDER === "eodhd" && !env.MARKET_DATA_API_KEY) missing.push("MARKET_DATA_API_KEY");
  if (env.AI_PROVIDER === "gemini" && !env.GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
  if (env.PULSE_PAYMENTS_ENABLED) {
    for (const key of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"] as const) {
      if (!env[key]) missing.push(key);
    }
  }
  for (const key of ["PULSE_ENCRYPTION_KEY", "PULSE_PHONE_HASH_KEY"] as const) {
    const v = env[key];
    if (v && Buffer.from(v, "base64").length !== 32) errors.push(`${key} must be 32 bytes, base64`);
  }
  return { ok: missing.length === 0 && errors.length === 0, missing, errors };
}
