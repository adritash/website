import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runSchedulerTick } from "@/pulse/modules/alerts/alert.scheduler";
import { processAlertJob } from "@/pulse/workers/processors";
import type { AlertJob } from "@/pulse/infrastructure/queue";
import { calendar, closeTestEnv, createTestEnv, fakeQueue, resetData, type TestEnv } from "../helpers";
import { say } from "../e2e/drive";

let env: TestEnv;
beforeAll(async () => { env = await createTestEnv(); });
afterAll(async () => closeTestEnv(env));
beforeEach(async () => resetData(env));

const deps = () => ({ db: env.db, redis: env.redis, provider: env.provider, now: () => env.clock.now });

async function onboardPlus() {
  await say(env, "hi");
  await say(env, "AGREE");
  const user = await env.db.user.findFirstOrThrow();
  const plus = await env.db.plan.findUniqueOrThrow({ where: { code: "PLUS" } });
  await env.db.subscription.create({ data: { userId: user.id, planId: plus.id, status: "ACTIVE", provider: "test" } });
  return user;
}

/** Sets the sandbox price and drops the short-lived quote cache, as if time had passed. */
async function setPrice(symbol: string, lastPrice: number, previousClose: number) {
  env.provider.overrides.set(`NSE:${symbol}`, { lastPrice, previousClose });
  await env.redis.del(`pulse:quote:NSE:${symbol}`);
}

async function tickAt(iso: string) {
  env.clock.now = new Date(iso);
  const q = fakeQueue<AlertJob>();
  const result = await runSchedulerTick(env.db, await calendar(env), q, env.clock.now);
  return { q, result };
}

describe("alert execution", () => {
  it("sends a template when the 24h window is closed and records cost and history", async () => {
    const user = await onboardPlus();
    await say(env, "Send TCS updates every hour");
    await env.db.user.update({ where: { id: user.id }, data: { lastInboundAt: new Date("2026-11-01T00:00:00Z") } });
    const { q } = await tickAt("2026-11-23T05:46:00Z"); // 11:16 IST, slot 11:15
    expect(q.jobs).toHaveLength(1);
    const status = await processAlertJob(deps(), q.jobs[0].data.executionId, false);
    expect(status).toBe("SENT");
    const sent = env.transport.sent.at(-1)!;
    expect(sent.payload).toMatchObject({ type: "template", name: "pulse_price_update" });
    expect(sent.to).toBe("919800000001");
    const msg = await env.db.message.findFirstOrThrow({ where: { alertId: { not: null } } });
    expect(msg).toMatchObject({ category: "UTILITY", status: "SENT", templateName: "pulse_price_update" });
    expect(Number(msg.estimatedCostInr)).toBeCloseTo(0.115);
    const exec = await env.db.alertExecution.findFirstOrThrow();
    expect(exec.status).toBe("SENT");
    expect(exec.messageId).toBe(msg.id);
  });

  it("sends free-form text inside the window and never sends twice for one execution", async () => {
    await onboardPlus();
    await say(env, "Send TCS updates every hour");
    const { q } = await tickAt("2026-11-23T05:46:00Z");
    const id = q.jobs[0].data.executionId;
    await processAlertJob(deps(), id, false);
    const count = env.transport.sent.length;
    expect(env.transport.sent.at(-1)!.payload.type).toBe("text");
    // Re-delivery of the same job (e.g. worker crash after send) must not resend.
    await env.db.alertExecution.update({ where: { id }, data: { status: "RUNNING" } });
    await processAlertJob(deps(), id, false);
    expect(env.transport.sent.length).toBe(count);
    // A second scheduler tick in the same minute does not create a second execution.
    const again = await tickAt("2026-11-23T05:46:30Z");
    expect(again.q.jobs).toHaveLength(0);
  });

  it("skips weekends: Friday's last slot is followed by Monday's first", async () => {
    await onboardPlus();
    env.clock.now = new Date("2026-11-27T09:40:00Z"); // Fri 15:10 IST
    await say(env, "Send TCS updates every hour");
    const alert = await env.db.alert.findFirstOrThrow();
    expect(alert.nextRunAt?.toISOString()).toBe("2026-11-27T09:45:00.000Z"); // 15:15 IST
    await tickAt("2026-11-27T09:45:30Z");
    const updated = await env.db.alert.findFirstOrThrow();
    expect(updated.nextRunAt?.toISOString()).toBe("2026-11-30T04:45:00.000Z"); // Mon 10:15 IST
  });

  it("fires a threshold alert once and re-arms after the price retreats", async () => {
    await onboardPlus();
    await say(env, "Alert me if TCS goes above ₹4,000");
    await setPrice("TCS", 4010, 3950);
    let r = await tickAt("2026-11-23T05:15:30Z");
    expect(await processAlertJob(deps(), r.q.jobs[0].data.executionId, false)).toBe("SENT");
    expect(env.transport.sent.at(-1)!.payload).toMatchObject({ type: "text" });
    r = await tickAt("2026-11-23T05:30:30Z");
    expect(await processAlertJob(deps(), r.q.jobs[0].data.executionId, false)).toBe("NOT_TRIGGERED");
    await setPrice("TCS", 3900, 3950);
    r = await tickAt("2026-11-23T05:45:30Z");
    await processAlertJob(deps(), r.q.jobs[0].data.executionId, false);
    expect((await env.db.alert.findFirstOrThrow()).triggerState).toBe("ARMED");
    await setPrice("TCS", 4001, 3950);
    r = await tickAt("2026-11-23T06:00:30Z");
    expect(await processAlertJob(deps(), r.q.jobs[0].data.executionId, false)).toBe("SENT");
    expect(await env.db.alertExecution.count({ where: { status: "SENT" } })).toBe(2);
  });

  it("sends a daily closing summary for the watchlist after the close", async () => {
    await onboardPlus();
    await say(env, "track TCS");
    await say(env, "track infosys");
    const r0 = await say(env, "send me daily closing prices");
    expect(r0.text).toContain("closing prices for your watchlist stocks");
    const { q } = await tickAt("2026-11-23T10:21:00Z"); // 15:51 IST
    expect(await processAlertJob(deps(), q.jobs[0].data.executionId, false)).toBe("SENT");
    const text = env.transport.sent.at(-1)!.payload;
    expect(text.type === "text" && text.text).toContain("TCS ₹");
    expect(text.type === "text" && text.text).toContain("INFY ₹");
  });

  it("sends one hourly digest for the whole watchlist and skips it when no new data arrived", async () => {
    await onboardPlus();
    await say(env, "track TCS");
    await say(env, "track infosys");
    const r0 = await say(env, "Update me every hour");
    expect(r0.text).toContain("one update covering your watchlist every hour");
    let { q } = await tickAt("2026-11-23T05:46:00Z");
    expect(await processAlertJob(deps(), q.jobs[0].data.executionId, false)).toBe("SENT");
    const sent = env.transport.sent.at(-1)!.payload;
    expect(sent.type === "text" && sent.text).toMatch(/Watchlist update:\n• TCS ₹.*\n• INFY ₹/);
    // Next slot with the provider still returning the same data timestamp: nothing new to say.
    env.provider.overrides.set("NSE:TCS", { lastPrice: 1, previousClose: 1, dataTimestamp: "2026-11-23T05:31:00.000Z" });
    env.provider.overrides.set("NSE:INFY", { lastPrice: 1, previousClose: 1, dataTimestamp: "2026-11-23T05:31:00.000Z" });
    await env.redis.flushdb();
    ({ q } = await tickAt("2026-11-23T06:46:00Z"));
    expect(await processAlertJob(deps(), q.jobs[0].data.executionId, false)).toBe("SKIPPED_STALE_DATA");
  });

  it("STOP pauses everything and blocks proactive sends", async () => {
    await onboardPlus();
    await say(env, "Send TCS updates every hour");
    const stop = await say(env, "STOP");
    expect(stop.text).toContain("You won't get any more updates");
    expect((await env.db.alert.findFirstOrThrow()).status).toBe("PAUSED");
    const { q } = await tickAt("2026-11-23T05:46:00Z");
    expect(q.jobs).toHaveLength(0);
    const start = await say(env, "START");
    expect(start.text).toContain("Resumed 1 alert(s)");
  });

  it("stops recurring updates when the paid plan ends", async () => {
    const user = await onboardPlus();
    await say(env, "Send TCS updates every hour");
    await env.db.subscription.updateMany({ where: { userId: user.id }, data: { status: "CANCELLED" } });
    const { q } = await tickAt("2026-11-23T05:46:00Z");
    expect(await processAlertJob(deps(), q.jobs[0].data.executionId, false)).toBe("SKIPPED_LIMIT");
    expect((await env.db.alert.findFirstOrThrow()).status).toBe("PAUSED");
  });

  it("does not run when the calendar year is not loaded", async () => {
    await onboardPlus();
    env.clock.now = new Date("2026-12-31T09:50:00Z"); // Thu 15:20 IST, last 2026 slot is 15:15
    await say(env, "Alert me if TCS goes above ₹4,000");
    const alert = await env.db.alert.findFirstOrThrow();
    expect(alert.nextRunAt?.toISOString()).toBe("2026-12-31T10:00:00.000Z"); // 15:30 IST
    await tickAt("2026-12-31T10:00:30Z");
    expect((await env.db.alert.findFirstOrThrow()).nextRunAt).toBeNull(); // 2027 calendar missing
  });
});

describe("conversation flows", () => {
  it("asks which company when the name is ambiguous and uses the numbered answer", async () => {
    await say(env, "hi");
    const ask = await say(env, "price of tata");
    expect(ask.text).toContain("Which one do you mean?");
    const options = ask.text!.split("\n").filter((l) => /^\d\./.test(l));
    expect(options.length).toBeGreaterThan(1);
    const pick = await say(env, "1");
    expect(pick.text).toMatch(/\*Tata .*\(.*NSE\): ₹/);
  });

  it("confirms a fuzzy match instead of silently choosing", async () => {
    await say(env, "hi");
    const ask = await say(env, "price of infosis");
    expect(ask.text).toContain("Did you mean Infosys Limited?");
    expect((await say(env, "1")).text).toContain("(INFY, NSE)");
  });

  it("deletes user data only after explicit confirmation", async () => {
    await say(env, "hi");
    await say(env, "agree");
    await say(env, "track TCS");
    const ask = await say(env, "delete my data");
    expect(ask.text).toContain("Reply *YES DELETE*");
    expect(await env.db.watchlistItem.count()).toBe(1);
    const done = await say(env, "YES DELETE");
    expect(done.text).toContain("will be erased");
    const { runRetention } = await import("@/pulse/modules/admin/maintenance.service");
    await runRetention(env.db);
    expect(await env.db.watchlistItem.count()).toBe(0);
    const user = await env.db.user.findFirstOrThrow();
    expect(user).toMatchObject({ status: "DELETED", phoneEncrypted: "erased" });
  });

  it("rate-limits a flood of messages from one user", async () => {
    process.env.PULSE_INBOUND_PER_USER_PER_10_MIN = "3";
    const { resetEnvCache } = await import("@/pulse/config/env");
    resetEnvCache();
    try {
      for (let i = 0; i < 5; i++) await say(env, "help");
      const texts = env.transport.sent.map((s) => (s.payload.type === "text" ? s.payload.text : ""));
      expect(texts.filter((t) => t.includes("sending messages very quickly"))).toHaveLength(1);
      expect(texts).toHaveLength(4);
    } finally {
      delete process.env.PULSE_INBOUND_PER_USER_PER_10_MIN;
      resetEnvCache();
    }
  });

  it("enforces the free watchlist size", async () => {
    await say(env, "hi");
    await say(env, "agree");
    for (const s of ["TCS", "INFY", "WIPRO"]) await say(env, `track ${s}`);
    const r = await say(env, "track ITC");
    expect(r.text).toContain("Your watchlist is full (3 stocks on Pulse Free)");
  });

  it("answers the closing-price question for the last stock discussed", async () => {
    await say(env, "hi");
    await say(env, "price of TCS");
    const r = await say(env, "What was the closing price yesterday?");
    expect(r.text).toContain("(TCS, NSE) previous close: ₹");
  });
});
