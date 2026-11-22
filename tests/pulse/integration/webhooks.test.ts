import { createHmac } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Queue, Worker, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { ingestWhatsAppWebhook } from "@/pulse/modules/whatsapp/whatsapp.ingest";
import { verifySubscription } from "@/pulse/modules/whatsapp/whatsapp.webhook";
import { handleRazorpayWebhook } from "@/pulse/modules/payments/razorpay.webhook";
import { getEffectivePlan } from "@/pulse/modules/subscriptions/subscription.service";
import { processInboundJob } from "@/pulse/workers/processors";
import type { InboundJob } from "@/pulse/infrastructure/queue";
import { closeTestEnv, createTestEnv, fakeQueue, inboundPayload, resetData, sign, type TestEnv } from "../helpers";
import { say } from "../e2e/drive";

let env: TestEnv;
beforeAll(async () => { env = await createTestEnv(); });
afterAll(async () => closeTestEnv(env));
beforeEach(async () => resetData(env));

describe("WhatsApp webhook", () => {
  it("answers the verification handshake only with the right token", () => {
    const ok = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "test-verify-token", "hub.challenge": "12345" });
    expect(verifySubscription(ok, "test-verify-token")).toBe("12345");
    ok.set("hub.verify_token", "wrong");
    expect(verifySubscription(ok, "test-verify-token")).toBeNull();
  });

  it("rejects a bad signature, records a security event and queues nothing", async () => {
    const q = fakeQueue<InboundJob>();
    const raw = JSON.stringify(inboundPayload("price of TCS").body);
    const res = await ingestWhatsAppWebhook(env.db, q, raw, sign(raw, "attacker-secret"));
    expect(res.status).toBe(401);
    expect(q.jobs).toHaveLength(0);
    expect(await env.db.webhookEvent.count()).toBe(0);
    expect(await env.db.auditLog.count({ where: { action: "whatsapp.webhook.bad_signature", security: true } })).toBe(1);
  });

  it("rejects malformed payloads and ignores other phone numbers", async () => {
    const q = fakeQueue<InboundJob>();
    const bad = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: 1 }] });
    expect((await ingestWhatsAppWebhook(env.db, q, bad, sign(bad))).status).toBe(400);
    const foreign = JSON.stringify(inboundPayload("hi", { phoneNumberId: "999" }).body);
    const res = await ingestWhatsAppWebhook(env.db, q, foreign, sign(foreign));
    expect(res.status).toBe(200);
    expect(q.jobs).toHaveLength(0);
  });

  it("applies delivery statuses, including pricing, without downgrading", async () => {
    await say(env, "help");
    const out = await env.db.message.findFirstOrThrow({ where: { direction: "OUTBOUND" } });
    const status = (s: string, ts: number) => ({
      object: "whatsapp_business_account",
      entry: [{ id: "W", changes: [{ field: "messages", value: { metadata: { phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID }, statuses: [{ id: out.providerMessageId, status: s, timestamp: String(ts), recipient_id: "919800000001", pricing: { billable: false, category: "service", pricing_model: "PMP" } }] } }] }],
    });
    for (const [s, ts] of [["delivered", 2], ["read", 3], ["sent", 1]] as const) {
      const raw = JSON.stringify(status(s, ts));
      expect((await ingestWhatsAppWebhook(env.db, fakeQueue(), raw, sign(raw))).status).toBe(200);
    }
    const updated = await env.db.message.findUniqueOrThrow({ where: { id: out.id } });
    expect(updated).toMatchObject({ status: "READ", billable: false, pricingCategory: "service" });
  });

  it("processes through a real BullMQ queue and worker", async () => {
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const name = `pulse-inbound-test-${Date.now()}`;
    const queue = new Queue<InboundJob>(name, { connection });
    const events = new QueueEvents(name, { connection: connection.duplicate() });
    const worker = new Worker<InboundJob>(
      name,
      (job) => processInboundJob({ db: env.db, redis: env.redis, provider: env.provider, now: () => env.clock.now }, job.data.webhookEventId, false),
      { connection: connection.duplicate() }
    );
    try {
      await events.waitUntilReady();
      const raw = JSON.stringify(inboundPayload("price of TCS", { at: env.clock.now }).body);
      const res = await ingestWhatsAppWebhook(env.db, queue, raw, sign(raw));
      expect(res.body).toMatchObject({ queued: 1 });
      const job = (await queue.getJobs(["waiting", "active", "completed"]))[0];
      await job.waitUntilFinished(events, 15_000);
      expect(env.transport.sent.at(-1)?.payload.type).toBe("text");
      expect((await env.db.webhookEvent.findFirstOrThrow()).status).toBe("PROCESSED");
      expect((await env.db.webhookEvent.findFirstOrThrow()).payload).toBeNull();
    } finally {
      await worker.close();
      await events.close();
      await queue.obliterate({ force: true });
      await queue.close();
      await connection.quit();
    }
  });
});

describe("Razorpay webhook", () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const signRz = (raw: string, s = secret) => createHmac("sha256", s).update(raw).digest("hex");

  async function setup() {
    await say(env, "hi");
    const user = await env.db.user.findFirstOrThrow();
    const plus = await env.db.plan.findUniqueOrThrow({ where: { code: "PLUS" } });
    await env.db.subscription.create({ data: { userId: user.id, planId: plus.id, status: "CREATED", provider: "razorpay", providerSubscriptionId: "sub_TEST1" } });
    return user;
  }

  const charged = JSON.stringify({
    event: "subscription.charged",
    payload: {
      subscription: { entity: { id: "sub_TEST1", status: "active", current_start: 1795400000, current_end: 1798000000 } },
      payment: { entity: { id: "pay_TEST1", amount: 9900, currency: "INR", status: "captured" } },
    },
  });

  it("rejects unsigned events and never activates from them", async () => {
    const user = await setup();
    const res = await handleRazorpayWebhook(env.db, charged, signRz(charged, "wrong"), "evt_1");
    expect(res.status).toBe(401);
    expect((await getEffectivePlan(env.db, user.id)).code).toBe("FREE");
  });

  it("activates on a verified charge, once, and records the payment", async () => {
    const user = await setup();
    expect((await handleRazorpayWebhook(env.db, charged, signRz(charged), "evt_1")).status).toBe(200);
    const dup = await handleRazorpayWebhook(env.db, charged, signRz(charged), "evt_1");
    expect(dup.body).toMatchObject({ duplicate: true });
    const plan = await getEffectivePlan(env.db, user.id, new Date("2026-12-01T00:00:00Z"));
    expect(plan.code).toBe("PLUS");
    expect(await env.db.payment.count()).toBe(1);
    // After current_end the user falls back to the free plan.
    expect((await getEffectivePlan(env.db, user.id, new Date("2027-01-01T00:00:00Z"))).code).toBe("FREE");
  });

  it("downgrades on halt", async () => {
    const user = await setup();
    await handleRazorpayWebhook(env.db, charged, signRz(charged), "evt_1");
    const halted = JSON.stringify({ event: "subscription.halted", payload: { subscription: { entity: { id: "sub_TEST1", status: "halted" } } } });
    await handleRazorpayWebhook(env.db, halted, signRz(halted), "evt_2");
    expect((await getEffectivePlan(env.db, user.id, new Date("2026-12-01T00:00:00Z"))).code).toBe("FREE");
  });
});
