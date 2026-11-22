import { createHmac } from "node:crypto";
import { Redis } from "ioredis";
import { createDb, setDbForTests, type Db } from "@/pulse/infrastructure/db";
import { setRedisForTests } from "@/pulse/infrastructure/redis";
import { resetEnvCache } from "@/pulse/config/env";
import { CaptureTransport, setTransportForTests } from "@/pulse/modules/whatsapp/whatsapp.client";
import { setProviderForTests } from "@/pulse/modules/market-data/market-data.service";
import { SandboxProvider } from "@/pulse/modules/market-data/providers/sandbox.provider";
import { clearCalendarCache, loadCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { clearInstrumentCache } from "@/pulse/modules/market-data/symbol-resolver";
import { setInterpreterForTests } from "@/pulse/modules/ai/ai.service";
import { seed } from "../../prisma/seed";
import "@/pulse/modules/ai/tools";

export const TEST_WA_ID = "919800000001";
export const OTHER_WA_ID = "919800000002";
/** Monday 23 Nov 2026, 10:30 IST — a normal NSE trading day. */
export const TRADING_MORNING = new Date("2026-11-23T05:00:00Z");
/** Tuesday 24 Nov 2026 — NSE holiday (Guru Nanak Jayanti). */
export const HOLIDAY_DAY = new Date("2026-11-24T05:00:00Z");

export type TestEnv = {
  db: Db;
  redis: Redis;
  transport: CaptureTransport;
  provider: SandboxProvider;
  clock: { now: Date };
};

export async function createTestEnv(): Promise<TestEnv> {
  resetEnvCache();
  const db = createDb(process.env.DATABASE_URL!);
  const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
  setDbForTests(db);
  setRedisForTests(redis);
  const transport = new CaptureTransport();
  setTransportForTests(transport);
  const clock = { now: TRADING_MORNING };
  const provider = new SandboxProvider(() => clock.now);
  setProviderForTests(provider);
  setInterpreterForTests(null);
  return { db, redis, transport, provider, clock };
}

const TABLES = [
  "AlertExecution", "Alert", "WatchlistItem", "Message", "Conversation", "ConsentRecord", "UsageRecord",
  "Payment", "Subscription", "LoginToken", "WebhookEvent", "AuditLog", "ProviderHealthSample", "User",
  "AdminUser", "Plan", "Instrument", "MarketHoliday", "MarketCalendarYear",
];

export async function resetData(env: TestEnv) {
  await env.db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`);
  await env.redis.flushdb();
  await seed(process.env.DATABASE_URL!);
  clearCalendarCache();
  clearInstrumentCache();
  env.transport.clear();
  env.provider.failWith = null;
  env.provider.overrides.clear();
  env.provider.calls = 0;
  env.clock.now = TRADING_MORNING;
}

export async function closeTestEnv(env: TestEnv) {
  await env.db.$disconnect();
  await env.redis.quit();
}

export const calendar = (env: TestEnv) => loadCalendar(env.db, true);

let seq = 0;
export function inboundPayload(text: string, opts: { waId?: string; id?: string; at?: Date; phoneNumberId?: string } = {}) {
  const id = opts.id ?? `wamid.TEST${Date.now()}${++seq}`;
  return {
    id,
    body: {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_TEST",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "910000000000", phone_number_id: opts.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID },
                contacts: [{ wa_id: opts.waId ?? TEST_WA_ID, profile: { name: "Test User" } }],
                messages: [
                  {
                    from: opts.waId ?? TEST_WA_ID,
                    id,
                    timestamp: String(Math.floor((opts.at ?? new Date()).getTime() / 1000)),
                    type: "text",
                    text: { body: text },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  };
}

export function sign(raw: string, secret = process.env.WHATSAPP_APP_SECRET!) {
  return `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
}

/** Queue stand-in that records added jobs (BullMQ itself is tested separately). */
export function fakeQueue<T>() {
  const jobs: { name: string; data: T; opts?: { jobId?: string } }[] = [];
  return {
    jobs,
    add: async (name: string, data: T, opts?: { jobId?: string }) => {
      if (opts?.jobId && jobs.some((j) => j.opts?.jobId === opts.jobId)) return { id: opts.jobId } as never;
      jobs.push({ name, data, opts });
      return { id: opts?.jobId ?? String(jobs.length) } as never;
    },
  };
}
