import { describe, expect, it } from "vitest";
import { EodhdProvider } from "@/pulse/modules/market-data/providers/eodhd.provider";
import { CloudApiTransport, WhatsAppApiError } from "@/pulse/modules/whatsapp/whatsapp.client";
import { RazorpayProvider } from "@/pulse/modules/payments/payment.provider";

const tcs = { symbol: "TCS", exchange: "NSE" as const, companyName: "Tata Consultancy Services Limited" };

function fetchReturning(status: number, body: unknown, calls: { url: string; init?: RequestInit }[] = []) {
  return (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as typeof fetch;
}

describe("EODHD adapter (mocked HTTP)", () => {
  it("maps the documented real-time fields", async () => {
    const calls: { url: string }[] = [];
    const p = new EodhdProvider({ apiKey: "k", timeoutMs: 1000, delayMinutes: 15, fetchImpl: fetchReturning(200, { code: "TCS.NSE", timestamp: 1795392000, gmtoffset: 0, open: 3400, high: 3450, low: 3390, close: 3420.5, volume: 10, previousClose: 3402.3, change: 18.2, change_p: 0.53 }, calls) });
    const q = await p.getQuote(tcs);
    expect(calls[0].url).toContain("/api/real-time/TCS.NSE?");
    expect(calls[0].url).toContain("fmt=json");
    expect(q).toMatchObject({ lastPrice: 3420.5, previousClose: 3402.3, dataType: "DELAYED", delayMinutes: 15, currency: "INR", provider: "EODHD" });
    expect(q.dataTimestamp).toBe(new Date(1795392000 * 1000).toISOString());
  });

  it("classifies errors and refuses quotes without a price", async () => {
    await expect(new EodhdProvider({ apiKey: "k", timeoutMs: 1000, delayMinutes: 15, fetchImpl: fetchReturning(429, {}) }).getQuote(tcs)).rejects.toMatchObject({ code: "MD_RATE_LIMITED", retryable: true });
    await expect(new EodhdProvider({ apiKey: "k", timeoutMs: 1000, delayMinutes: 15, fetchImpl: fetchReturning(401, {}) }).getQuote(tcs)).rejects.toMatchObject({ code: "MD_AUTH", retryable: false });
    await expect(new EodhdProvider({ apiKey: "k", timeoutMs: 1000, delayMinutes: 15, fetchImpl: fetchReturning(200, { code: "TCS.NSE", close: "NA", timestamp: "NA" }) }).getQuote(tcs)).rejects.toMatchObject({ code: "MD_MISSING_FIELDS" });
    await expect(new EodhdProvider({ apiKey: "k", timeoutMs: 1000, delayMinutes: 15, fetchImpl: fetchReturning(200, { code: "INFY.NSE", close: 1, timestamp: 1 }) }).getQuote(tcs)).rejects.toMatchObject({ code: "QUOTE_SYMBOL_MISMATCH" });
  });
});

describe("WhatsApp Cloud API transport (mocked HTTP)", () => {
  it("posts the documented message body", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const t = new CloudApiTransport({ accessToken: "tok", phoneNumberId: "123", apiVersion: "v27.0", timeoutMs: 1000, fetchImpl: fetchReturning(200, { messages: [{ id: "wamid.X" }] }, calls) });
    const r = await t.send("919800000001", { type: "template", name: "pulse_price_update", language: "en", bodyParameters: ["TCS"] });
    expect(r.providerMessageId).toBe("wamid.X");
    expect(calls[0].url).toBe("https://graph.facebook.com/v27.0/123/messages");
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body).toMatchObject({ messaging_product: "whatsapp", to: "919800000001", type: "template", template: { name: "pulse_price_update", language: { code: "en" } } });
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("marks 5xx as retryable, 4xx as permanent and network errors as uncertain", async () => {
    const mk = (f: typeof fetch) => new CloudApiTransport({ accessToken: "t", phoneNumberId: "1", apiVersion: "v27.0", timeoutMs: 1000, fetchImpl: f });
    await expect(mk(fetchReturning(503, { error: { code: 1 } })).send("1", { type: "text", text: "x" })).rejects.toMatchObject({ retryable: true });
    await expect(mk(fetchReturning(400, { error: { code: 131047 } })).send("1", { type: "text", text: "x" })).rejects.toMatchObject({ code: "WA_OUTSIDE_WINDOW", retryable: false });
    const err = await mk((async () => { throw new TypeError("network"); }) as typeof fetch).send("1", { type: "text", text: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(WhatsAppApiError);
    expect(err.uncertain).toBe(true);
  });
});

describe("Razorpay adapter (mocked HTTP)", () => {
  it("creates a subscription with basic auth and returns the hosted link", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const p = new RazorpayProvider({ keyId: "rzp_test", keySecret: "s", fetchImpl: fetchReturning(200, { id: "sub_1", status: "created", short_url: "https://rzp.io/i/x" }, calls) });
    const r = await p.createSubscription({ providerPlanId: "plan_1", totalCount: 12, notes: { pulse_user_id: "u1" } });
    expect(r).toEqual({ providerSubscriptionId: "sub_1", paymentUrl: "https://rzp.io/i/x", status: "created" });
    expect(calls[0].url).toBe("https://api.razorpay.com/v1/subscriptions");
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("rzp_test:s").toString("base64")}`);
  });
});
