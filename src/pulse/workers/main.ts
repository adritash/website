/**
 * Adritash Pulse worker. Runs separately from the Next.js web app (Vercel cannot
 * host long-lived processes). Start with: npm run pulse:worker
 *
 * - pulse-inbound:     conversation processing for inbound WhatsApp messages
 * - pulse-alerts:      alert executions (one job per alert slot)
 * - pulse-maintenance: scheduler tick (every minute), retention, calendar, ops checks
 * Failed jobs are retried with exponential backoff; after the last attempt they are
 * copied to pulse-dead-letter for inspection from the admin dashboard.
 */
import "dotenv/config";
import { createServer } from "node:http";
import { Worker, type Job } from "bullmq";
import { checkProductionReadiness, getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { createRedis } from "@/pulse/infrastructure/redis";
import { createQueues, closeQueues, QUEUE_NAMES, type AlertJob, type InboundJob, type MaintenanceJob } from "@/pulse/infrastructure/queue";
import { logger, withCorrelation } from "@/pulse/infrastructure/logger";
import { getProvider } from "@/pulse/modules/market-data/market-data.service";
import { processAlertJob, processInboundJob, processMaintenanceJob } from "./processors";

export const HEARTBEAT_KEY = "pulse:worker:heartbeat";

async function main() {
  const env = getEnv();
  if (env.NODE_ENV === "production") {
    const check = checkProductionReadiness(env);
    if (!check.ok) {
      logger.error("worker.config_invalid", { missing: check.missing, errors: check.errors });
      process.exit(1);
    }
  }
  if (!env.REDIS_URL) throw new Error("REDIS_URL is required for the worker");

  const db = getDb();
  const connection = createRedis(env.REDIS_URL, true);
  const redis = createRedis(env.REDIS_URL);
  const queues = createQueues(connection);
  const provider = getProvider();
  const deps = { db, redis, provider };
  const isFinal = (job: Job) => job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

  const workers = [
    new Worker<InboundJob>(
      QUEUE_NAMES.inbound,
      (job) => withCorrelation(job.data.correlationId ?? job.id, () => processInboundJob(deps, job.data.webhookEventId, isFinal(job))),
      { connection, concurrency: 8 }
    ),
    new Worker<AlertJob>(
      QUEUE_NAMES.alerts,
      (job) => withCorrelation(job.data.correlationId ?? job.id, () => processAlertJob(deps, job.data.executionId, isFinal(job))),
      // Limits outbound bursts; WhatsApp Cloud API throughput is per phone number.
      { connection, concurrency: 10, limiter: { max: 20, duration: 1000 } }
    ),
    new Worker<MaintenanceJob>(
      QUEUE_NAMES.maintenance,
      (job) =>
        withCorrelation(job.id, () =>
          processMaintenanceJob(
            {
              ...deps,
              alertsQueue: queues.alerts,
              backlog: async () => (await queues.alerts.getWaitingCount()) + (await queues.inbound.getWaitingCount()),
              heartbeatAge: async () => {
                const v = await redis.get(HEARTBEAT_KEY);
                return v ? (Date.now() - Number(v)) / 1000 : null;
              },
            },
            job.data.task
          )
        ),
      { connection, concurrency: 1 }
    ),
  ];

  for (const worker of workers) {
    worker.on("failed", async (job, error) => {
      logger.warn("job.failed", { queue: worker.name, jobId: job?.id, attempts: job?.attemptsMade, error });
      if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        await queues.deadLetter.add("dead", { queue: worker.name, jobId: job.id, name: job.name, data: job.data, failedReason: error.message.slice(0, 500) });
        logger.alert("job_dead_lettered", { queue: worker.name, jobId: job.id });
      }
    });
    worker.on("error", (error) => logger.error("worker.error", { queue: worker.name, error }));
  }

  // Durable schedules stored in Redis (survive restarts; one copy across instances).
  await queues.maintenance.upsertJobScheduler("schedule-due-alerts", { every: 60_000 }, { name: "tick", data: { task: "schedule-due-alerts" } });
  await queues.maintenance.upsertJobScheduler("retention", { pattern: "0 30 2 * * *", tz: "Asia/Kolkata" }, { name: "retention", data: { task: "retention" } });
  await queues.maintenance.upsertJobScheduler("calendar-check", { pattern: "0 0 8 * * *", tz: "Asia/Kolkata" }, { name: "calendar", data: { task: "calendar-check" } });
  await queues.maintenance.upsertJobScheduler("ops-checks", { every: 15 * 60_000 }, { name: "ops", data: { task: "ops-checks" } });
  await queues.maintenance.upsertJobScheduler("provider-health", { every: 10 * 60_000 }, { name: "probe", data: { task: "provider-health" } });
  await queues.maintenance.add("calendar-check-startup", { task: "calendar-check" });

  const beat = async () => {
    await redis.set(HEARTBEAT_KEY, String(Date.now()), "EX", 600).catch(() => undefined);
  };
  await beat();
  const heartbeat = setInterval(beat, 30_000);

  // Optional liveness endpoint for hosts that probe a port.
  const port = Number(process.env.WORKER_HEALTH_PORT ?? 0);
  const server = port
    ? createServer((req, res) => {
        res.writeHead(req.url === "/health" ? 200 : 404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: req.url === "/health" ? "ok" : "not_found" }));
      }).listen(port)
    : null;

  logger.info("worker.started", { queues: workers.map((w) => w.name), provider: provider?.name ?? "none" });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info("worker.stopping", { signal });
    clearInterval(heartbeat);
    server?.close();
    // Let in-flight jobs finish; unfinished ones are retried by another instance.
    await Promise.all(workers.map((w) => w.close()));
    await closeQueues(queues);
    await redis.quit().catch(() => undefined);
    await connection.quit().catch(() => undefined);
    await db.$disconnect();
    logger.info("worker.stopped");
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  logger.error("worker.crashed", { error });
  process.exit(1);
});
