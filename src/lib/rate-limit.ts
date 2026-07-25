const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const localStore = new Map<string, { count: number; resetAt: number }>();

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type LocalOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

function cleanupLocalStore(now: number) {
  for (const [key, entry] of localStore.entries()) {
    if (entry.resetAt <= now) {
      localStore.delete(key);
    }
  }
}

function applyLocalRateLimit({
  key,
  limit,
  windowMs,
}: LocalOptions): RateLimitResult {
  const now = Date.now();
  cleanupLocalStore(now);

  const existing = localStore.get(key);
  if (!existing || existing.resetAt <= now) {
    localStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(limit - existing.count, 0),
    retryAfterSeconds: Math.max(
      Math.ceil((existing.resetAt - now) / 1000),
      1
    ),
  };
}

async function applyUpstashRateLimit({
  key,
  limit,
  windowMs,
}: LocalOptions): Promise<RateLimitResult> {
  const response = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, windowMs],
      ["PTTL", key],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed: ${response.status}`);
  }

  const [incrResult, expireResult, ttlResult] = (await response.json()) as Array<{
    result?: number;
    error?: string;
  }>;

  if (incrResult?.error || expireResult?.error || ttlResult?.error) {
    throw new Error("Upstash rate limit pipeline returned an error.");
  }

  const count = typeof incrResult?.result === "number" ? incrResult.result : limit + 1;
  const ttlMs =
    typeof ttlResult?.result === "number" && ttlResult.result > 0
      ? ttlResult.result
      : windowMs;

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    retryAfterSeconds: Math.max(Math.ceil(ttlMs / 1000), 1),
  };
}

export async function applyRateLimit({
  key,
  limit,
  windowMs,
}: LocalOptions): Promise<RateLimitResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await applyUpstashRateLimit({ key, limit, windowMs });
    } catch (error) {
      console.error("Falling back to in-memory rate limit.", error);
    }
  }

  return applyLocalRateLimit({ key, limit, windowMs });
}
