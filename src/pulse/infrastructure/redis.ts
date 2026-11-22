import { Redis } from "ioredis";
import { getEnv } from "@/pulse/config/env";
import { ConfigError } from "@/pulse/lib/errors";

const globalForRedis = globalThis as unknown as { pulseRedis?: Redis };

/** Options BullMQ requires for blocking connections. */
export function createRedis(url: string, forWorker = false): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: forWorker ? null : 2,
    enableReadyCheck: true,
    connectTimeout: 5000,
    lazyConnect: false,
  });
}

/** Shared Redis client for rate limiting, caches and queue producers. */
export function getRedis(): Redis {
  if (!globalForRedis.pulseRedis) {
    const url = getEnv().REDIS_URL;
    if (!url) throw new ConfigError("REDIS_URL is not configured");
    globalForRedis.pulseRedis = createRedis(url);
  }
  return globalForRedis.pulseRedis;
}

export function setRedisForTests(redis: Redis | undefined) {
  globalForRedis.pulseRedis = redis;
}

/** Fixed-window counter. Returns the count within the window after incrementing. */
export async function incrementWindow(redis: Redis, key: string, windowSeconds: number): Promise<number> {
  const results = await redis.multi().incr(key).expire(key, windowSeconds, "NX").exec();
  const count = results?.[0]?.[1];
  return typeof count === "number" ? count : Number(count ?? 0);
}
