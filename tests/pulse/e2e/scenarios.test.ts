import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ProviderError } from "@/pulse/lib/errors";
import { runSchedulerTick } from "@/pulse/modules/alerts/alert.scheduler";
import { processAlertJob } from "@/pulse/workers/processors";
import { getOwnedAlert } from "@/pulse/modules/alerts/alert.service";
import type { AlertJob } from "@/pulse/infrastructure/queue";
import { calendar, closeTestEnv, createTestEnv, fakeQueue, HOLIDAY_DAY, OTHER_WA_ID, resetData, type TestEnv } from "../helpers";
import { say } from "./drive";

let env: TestEnv;

beforeAll(async () => {
  env = await createTestEnv();
});
afterAll(async () => closeTestEnv(env));
beforeEach(async () => resetData(env));

async function onboard(waId?: string) {
  await say(env, "hi", { waId });
  await say(env, "AGREE", { waId });
}

describe("Scenario 1: stock price query", () => {
  it("identifies the user, resolves TCS, calls the provider and discloses freshness", async () => {
    const r = await say(env, "What is the price of TCS?");
    expect(r.res.status).toBe(200);
    const users = await env.db.user.findMany();
    expect(users).toHaveLength(1);
    expect(users[0].phoneEncrypted).not.toContain("919800000001");
    expect(env.provider.calls).toBe(1);
    expect(r.text).toContain("Tata Consultancy Services Limited* (TCS, NSE)");
    expect(r.text).toMatch(/₹[\d,]+\.\d{2}/);
    expect(r.text).toContain("SANDBOX TEST DATA");
    expect(r.text).toMatch(/as of \d{1,2}:\d{2} (AM|PM) IST/);
    expect(r.text).toContain("Welcome to *Adritash Pulse*");
  });
});

describe("Scenario 2: recurring alert", () => {
  it("creates the alert, records consent and computes the next run", async () => {
    await onboard();
    // Free plan allows only a daily summary; move this user to Plus via a server-side subscription.
    const user = await env.db.user.findFirstOrThrow();
    const plus = await env.db.plan.findUniqueOrThrow({ where: { code: "PLUS" } });
    await env.db.subscription.create({ data: { userId: user.id, planId: plus.id, status: "ACTIVE", provider: "test" } });

    const r = await say(env, "Send TCS updates every hour.");
    expect(r.text).toContain("I'll send TCS (NSE) updates every hour");
    const alert = await env.db.alert.findFirstOrThrow();
    expect(alert).toMatchObject({ symbol: "TCS", exchange: "NSE", alertType: "RECURRING_UPDATE", frequencyMinutes: 60, status: "ACTIVE" });
    // 10:30 IST on a trading day → next hourly slot 11:15 IST.
    expect(alert.nextRunAt?.toISOString()).toBe("2026-11-23T05:45:00.000Z");
    const consent = await env.db.consentRecord.findFirst({ where: { userId: user.id, consentType: "RECURRING_UPDATES", scopeRef: alert.id } });
    expect(consent?.revokedAt).toBeNull();
  });

  it("refuses a frequency the free plan does not include", async () => {
    await onboard();
    const r = await say(env, "Send TCS updates every hour.");
    expect(r.text).toContain("Pulse Free includes a daily closing summary");
    expect(await env.db.alert.count()).toBe(0);
  });

  it("asks for privacy consent before saving, then completes the request on AGREE", async () => {
    await say(env, "hi");
    const ask = await say(env, "Track Infosys");
    expect(ask.text).toContain("Reply *AGREE*");
    expect(await env.db.watchlistItem.count()).toBe(0);
    const done = await say(env, "agree");
    expect(done.text).toContain("Added Infosys Limited (INFY, NSE)");
  });
});

describe("Scenario 3: alert cancellation", () => {
  it("cancels the right alert so no future job runs", async () => {
    await onboard();
    await say(env, "Alert me if TCS goes above ₹4,000");
    await say(env, "Alert me if Infosys falls below ₹1,400");
    const r = await say(env, "Stop TCS updates.");
    expect(r.text).toContain("Stopped 1 alert(s) for TCS");
    const tcs = await env.db.alert.findFirstOrThrow({ where: { symbol: "TCS" } });
    expect(tcs.status).toBe("CANCELLED");
    expect(tcs.nextRunAt).toBeNull();
    expect((await env.db.alert.findFirstOrThrow({ where: { symbol: "INFY" } })).status).toBe("ACTIVE");

    env.clock.now = new Date("2026-11-23T08:00:00Z");
    const q = fakeQueue<AlertJob>();
    await runSchedulerTick(env.db, await calendar(env), q, env.clock.now);
    const executions = await env.db.alertExecution.findMany({ include: { alert: true } });
    expect(executions.every((e) => e.alert.symbol === "INFY")).toBe(true);
  });
});

describe("Scenario 4: market holiday", () => {
  it("skips the holiday slot and schedules the next trading day", async () => {
    await onboard();
    await say(env, "Alert me if TCS goes above ₹4,000");
    const alert = await env.db.alert.findFirstOrThrow();
    // Force the alert to be due during the 24 Nov holiday.
    await env.db.alert.update({ where: { id: alert.id }, data: { nextRunAt: new Date("2026-11-24T05:00:00Z") } });
    env.clock.now = new Date(HOLIDAY_DAY.getTime() + 60_000);
    const q = fakeQueue<AlertJob>();
    const tick = await runSchedulerTick(env.db, await calendar(env), q, env.clock.now);
    expect(tick.skippedClosed).toBe(1);
    expect(q.jobs).toHaveLength(0);
    const exec = await env.db.alertExecution.findFirstOrThrow();
    expect(exec.status).toBe("SKIPPED_MARKET_CLOSED");
    const updated = await env.db.alert.findUniqueOrThrow({ where: { id: alert.id } });
    // Next valid slot: Wed 25 Nov 09:30 IST.
    expect(updated.nextRunAt?.toISOString()).toBe("2026-11-25T04:00:00.000Z");
    expect(env.transport.sent.filter((m) => m.payload.type === "template")).toHaveLength(0);
  });
});

describe("Scenario 5: provider failure", () => {
  it("never fabricates a price and tells the user", async () => {
    env.provider.failWith = new ProviderError("MD_HTTP_503", "down", true);
    const r = await say(env, "Price of Reliance");
    expect(r.text).toContain("I couldn't get a reliable price for RELIANCE");
    expect(r.text).not.toMatch(/₹\d/);
    expect(env.provider.calls).toBe(2); // one retry
    const samples = await env.db.providerHealthSample.findMany();
    expect(samples.some((s) => !s.ok && s.errorCode === "MD_HTTP_503")).toBe(true);
  });

  it("retries an alert execution and fails it without sending", async () => {
    await onboard();
    await say(env, "Alert me if TCS goes above ₹1");
    // Created at 10:30 IST; first price check slot is 10:45 IST.
    env.clock.now = new Date("2026-11-23T05:16:00Z");
    const q = fakeQueue<AlertJob>();
    await runSchedulerTick(env.db, await calendar(env), q, env.clock.now);
    expect(q.jobs).toHaveLength(1);
    env.provider.failWith = new ProviderError("MD_HTTP_503", "down", true);
    const before = env.transport.sent.length;
    const deps = { db: env.db, redis: env.redis, provider: env.provider, now: () => env.clock.now };
    await expect(processAlertJob(deps, q.jobs[0].data.executionId, false)).rejects.toThrow();
    expect(await processAlertJob(deps, q.jobs[0].data.executionId, true)).toBe("FAILED");
    expect(env.transport.sent.length).toBe(before);
    const exec = await env.db.alertExecution.findFirstOrThrow();
    expect(exec).toMatchObject({ status: "FAILED", errorCode: "MD_HTTP_503", attempts: 2 });
  });
});

describe("Scenario 6: duplicate webhook", () => {
  it("processes the same message once", async () => {
    await onboard();
    const first = await say(env, "Alert me if TCS goes above ₹4,000", { id: "wamid.DUPLICATE1" });
    const second = await say(env, "Alert me if TCS goes above ₹4,000", { id: "wamid.DUPLICATE1" });
    expect(first.queued).toBe(1);
    expect(second.queued).toBe(0);
    expect(second.res.body).toMatchObject({ duplicates: 1 });
    expect(second.replies).toHaveLength(0);
    expect(await env.db.alert.count()).toBe(1);
  });
});

describe("Scenario 7: unauthorized access", () => {
  it("denies access to another user's alert and logs a security event", async () => {
    await onboard();
    await say(env, "Alert me if TCS goes above ₹4,000");
    await onboard(OTHER_WA_ID);
    const [owner, other] = await env.db.user.findMany({ orderBy: { createdAt: "asc" } });
    const alert = await env.db.alert.findFirstOrThrow({ where: { userId: owner.id } });
    await expect(getOwnedAlert(env.db, other.id, alert.id)).rejects.toThrow("Alert not found");
    const audit = await env.db.auditLog.findFirst({ where: { action: "alert.cross_user_access", security: true } });
    expect(audit).toMatchObject({ actorId: other.id, outcome: "denied" });
    // The other user's own list shows nothing of the owner's.
    const r = await say(env, "Show my alerts", { waId: OTHER_WA_ID });
    expect(r.text).toContain("You have no active alerts");
  });
});
