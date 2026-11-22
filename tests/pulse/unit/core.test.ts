import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, hashPassword, hashPhone, signToken, verifyPassword, verifyToken } from "@/pulse/lib/crypto";
import { redact } from "@/pulse/infrastructure/logger";
import { verifyWhatsAppSignature, parseWebhookPayload, eventKey } from "@/pulse/modules/whatsapp/whatsapp.webhook";
import { isWithinServiceWindow } from "@/pulse/modules/whatsapp/whatsapp.service";
import { flattenParam } from "@/pulse/modules/whatsapp/whatsapp.templates";
import { verifyRazorpaySignature } from "@/pulse/modules/payments/razorpay.webhook";
import { checkProductionReadiness, getEnv, resetEnvCache } from "@/pulse/config/env";
import { intentSchema } from "@/pulse/modules/ai/intent.schema";
import { interpretWithAi } from "@/pulse/modules/ai/ai.service";
import { inboundPayload, sign } from "../helpers";

const KEY = Buffer.alloc(32, 1).toString("base64");

describe("crypto", () => {
  it("encrypts phone numbers with authenticated encryption", () => {
    const ct = encrypt("919800000001", KEY);
    expect(ct).not.toContain("9198");
    expect(decrypt(ct, KEY)).toBe("919800000001");
    const tampered = ct.slice(0, -2) + (ct.endsWith("A") ? "BB" : "AA");
    expect(() => decrypt(tampered, KEY)).toThrow();
  });

  it("hashes phones deterministically per key", () => {
    expect(hashPhone("919800000001", KEY)).toBe(hashPhone("919800000001", KEY));
    expect(hashPhone("919800000001", KEY)).not.toBe(hashPhone("919800000001", Buffer.alloc(32, 2).toString("base64")));
  });

  it("verifies passwords and signed tokens", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
    const t = signToken({ sub: "u1" }, "s", 60);
    expect(verifyToken(t, "s")).toMatchObject({ sub: "u1" });
    expect(verifyToken(t, "other")).toBeNull();
    expect(verifyToken(signToken({ sub: "u1" }, "s", -1), "s")).toBeNull();
  });
});

describe("log redaction", () => {
  it("removes phone numbers, tokens and secret fields", () => {
    const out = JSON.stringify(redact({ msg: "from +91 98000 00001 ok", Authorization: "Bearer abc", nested: { apiKey: "x", note: "Bearer eyJhbGc.x" } }));
    expect(out).not.toContain("98000");
    expect(out).not.toContain("abc");
    expect(out).not.toContain("eyJhbGc");
    expect(out).toContain("[phone…01]");
  });
});

describe("webhook signatures", () => {
  it("accepts Meta's sha256= HMAC of the raw body only", () => {
    const raw = '{"a":1}';
    expect(verifyWhatsAppSignature(raw, sign(raw, "s"), "s")).toBe(true);
    expect(verifyWhatsAppSignature(raw + " ", sign(raw, "s"), "s")).toBe(false);
    expect(verifyWhatsAppSignature(raw, "sha1=abc", "s")).toBe(false);
    expect(verifyWhatsAppSignature(raw, null, "s")).toBe(false);
    expect(verifyWhatsAppSignature(raw, sign(raw, "s"), undefined)).toBe(false);
  });

  it("accepts Razorpay's hex HMAC", () => {
    const raw = '{"event":"x"}';
    expect(verifyRazorpaySignature(raw, createHmac("sha256", "w").update(raw).digest("hex"), "w")).toBe(true);
    expect(verifyRazorpaySignature(raw, "deadbeef", "w")).toBe(false);
  });

  it("normalises inbound messages and builds idempotency keys", () => {
    const { body, id } = inboundPayload("Price of TCS");
    const parsed = parseWebhookPayload(body, process.env.WHATSAPP_PHONE_NUMBER_ID);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.events[0]).toMatchObject({ kind: "message", providerMessageId: id, text: "Price of TCS", waId: "919800000001" });
    expect(eventKey(parsed.events[0])).toBe(`msg_${id}`);
  });
});

describe("WhatsApp rules", () => {
  it("knows the 24-hour window (with safety margin)", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    expect(isWithinServiceWindow(new Date("2026-11-23T09:00:00Z"), now)).toBe(true);
    expect(isWithinServiceWindow(new Date("2026-11-22T10:05:00Z"), now)).toBe(false);
    expect(isWithinServiceWindow(null, now)).toBe(false);
  });

  it("flattens template parameters", () => {
    expect(flattenParam("a\nb\tc     d")).toBe("a b c   d");
  });
});

describe("configuration", () => {
  it("refuses sandbox market data and missing secrets in production", () => {
    const env = { ...getEnv(), NODE_ENV: "production" as const, MARKET_DATA_PROVIDER: "sandbox" as const, WHATSAPP_APP_SECRET: undefined };
    const check = checkProductionReadiness(env);
    expect(check.ok).toBe(false);
    expect(check.errors.join()).toContain("sandbox");
    expect(check.missing).toContain("WHATSAPP_APP_SECRET");
    resetEnvCache();
  });
});

describe("AI output validation", () => {
  it("rejects model output with extra fields or invented data", async () => {
    expect(intentSchema.safeParse({ intent: "STOCK_PRICE", confidence: 0.9, price: 3420 }).success).toBe(false);
    expect(intentSchema.safeParse({ intent: "DROP_TABLES", confidence: 1 }).success).toBe(false);
    const fake = { name: "fake", interpret: async () => ({ intent: "STOCK_PRICE", stock_query: "TCS", confidence: 0.9, user_id: "someone-else" }) };
    expect((await interpretWithAi(fake, "x")).intent.intent).toBe("UNKNOWN");
    const broken = { name: "broken", interpret: async () => { throw new Error("timeout"); } };
    expect((await interpretWithAi(broken, "x")).ok).toBe(false);
    const good = { name: "good", interpret: async () => ({ intent: "ADD_WATCHLIST", stock_query: "Infosys", confidence: 0.92 }) };
    expect((await interpretWithAi(good, "x")).intent).toMatchObject({ intent: "ADD_WATCHLIST", stock_query: "Infosys" });
  });
});
