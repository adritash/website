import { Queue, type JobsOptions } from "bullmq";
import type { Redis } from "ioredis";
import { createRedis } from "./redis";
import { getEnv } from "@/pulse/config/env";
import { ConfigError } from "@/pulse/lib/errors";

export const QUEUE_NAMES = {
  inbound: "pulse-inbound",
  alerts: "pulse-alerts",
  maintenance: "pulse-maintenance",
  deadLetter: "pulse-dead-letter",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export type InboundJob = { webhookEventId: string; correlationId?: string };
export type AlertJob = { executionId: string; correlationId?: string };
export type MaintenanceJob = { task: "schedule-due-alerts" | "retention" | "calendar-check" | "ops-checks" | "provider-health" };
export type DeadLetterJob = { queue: string; jobId?: string; name: string; data: unknown; failedReason: string };

/** Retries with exponential backoff; failed jobs are kept for inspection (dead letter). */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 24 * 3600, count: 5_000 },
  removeOnFail: { age: 14 * 24 * 3600 },
};

/** BullMQ job ids may not contain ":"; keep ids readable and deterministic. */
export function jobId(...parts: (string | number)[]): string {
  return parts.map((p) => String(p).replace(/[^A-Za-z0-9_-]/g, "-")).join("_");
}

type Queues = {
  inbound: Queue<InboundJob>;
  alerts: Queue<AlertJob>;
  maintenance: Queue<MaintenanceJob>;
  deadLetter: Queue<DeadLetterJob>;
  connection: Redis;
};

const globalForQueues = globalThis as unknown as { pulseQueues?: Queues };

export function createQueues(connection: Redis): Queues {
  const opts = { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS };
  return {
    inbound: new Queue<InboundJob>(QUEUE_NAMES.inbound, opts),
    alerts: new Queue<AlertJob>(QUEUE_NAMES.alerts, opts),
    maintenance: new Queue<MaintenanceJob>(QUEUE_NAMES.maintenance, {
      connection,
      defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10_000 }, removeOnComplete: 200, removeOnFail: 500 },
    }),
    deadLetter: new Queue<DeadLetterJob>(QUEUE_NAMES.deadLetter, {
      connection,
      defaultJobOptions: { removeOnComplete: false, removeOnFail: false },
    }),
    connection,
  };
}

/** Producer-side queues (web process and worker). */
export function getQueues(): Queues {
  if (!globalForQueues.pulseQueues) {
    const url = getEnv().REDIS_URL;
    if (!url) throw new ConfigError("REDIS_URL is not configured");
    globalForQueues.pulseQueues = createQueues(createRedis(url, true));
  }
  return globalForQueues.pulseQueues;
}

export function setQueuesForTests(queues: Queues | undefined) {
  globalForQueues.pulseQueues = queues;
}

export async function closeQueues(queues: Queues) {
  await Promise.all([queues.inbound.close(), queues.alerts.close(), queues.maintenance.close(), queues.deadLetter.close()]);
}
