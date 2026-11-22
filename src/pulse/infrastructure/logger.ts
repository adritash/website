import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

type Context = { correlationId: string; [key: string]: unknown };
const storage = new AsyncLocalStorage<Context>();

/** Runs `fn` with a correlation id that every log line inside it carries. */
export function withCorrelation<T>(
  correlationId: string | undefined,
  fn: () => T,
  extra: Record<string, unknown> = {}
): T {
  return storage.run({ correlationId: correlationId ?? randomUUID(), ...extra }, fn);
}

export function currentCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

const SECRET_KEYS = /(token|secret|password|authorization|signature|api[_-]?key|phone|wa_id|^to$|^from$)/i;
// 10+ digit sequences (phone numbers), optionally with leading +.
const PHONE_PATTERN = /\+?\d[\d\s-]{8,}\d/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/=-]+/g;
const URL_SECRET_PATTERN = /([?&](?:token|api_token|access_token|key)=)[^&\s]+/gi;

/** Redacts phone numbers, bearer tokens and secret-looking keys. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (typeof value === "string") {
    return value.replace(BEARER_PATTERN, "Bearer [redacted]").replace(URL_SECRET_PATTERN, "$1[redacted]").replace(PHONE_PATTERN, (m) => {
      const digits = m.replace(/\D/g, "");
      return digits.length >= 10 ? `[phone…${digits.slice(-2)}]` : m;
    });
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redact(value.message, depth + 1),
      code: (value as { code?: unknown }).code,
    };
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function threshold(): number {
  const env = (process.env.LOG_LEVEL as Level | undefined) ?? "info";
  return LEVELS[env] ?? LEVELS.info;
}

function write(level: Level, msg: string, fields?: Record<string, unknown>) {
  if (LEVELS[level] < threshold()) return;
  if (process.env.NODE_ENV === "test" && process.env.PULSE_TEST_LOGS !== "1") return;
  const ctx = storage.getStore();
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "pulse",
    ...(ctx ? (redact(ctx) as Record<string, unknown>) : {}),
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  };
  const text = JSON.stringify(line);
  if (level === "error" || level === "warn") console.error(text);
  else console.log(text);
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => write("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => write("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => write("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => write("error", msg, fields),
  /** Operational alert: logged at error with `alert` set so a log drain can page on it. */
  alert: (name: string, fields?: Record<string, unknown>) =>
    write("error", `OPS_ALERT ${name}`, { alert: name, ...fields }),
};
