import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { getRedis } from "@/pulse/infrastructure/redis";

export type ComponentStatus = "ok" | "fail" | "disabled";

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Readiness: can this process reach its dependencies? Exposes status only, no details. */
export async function readiness(): Promise<{ ready: boolean; components: Record<string, ComponentStatus> }> {
  const env = getEnv();
  if (!env.PULSE_ENABLED) return { ready: true, components: { pulse: "disabled" } };

  const components: Record<string, ComponentStatus> = {};
  try {
    await withTimeout(getDb().$queryRaw`SELECT 1`, 2000);
    components.database = "ok";
  } catch {
    components.database = "fail";
  }
  try {
    const pong = await withTimeout(getRedis().ping(), 2000);
    components.redis = pong === "PONG" ? "ok" : "fail";
  } catch {
    components.redis = "fail";
  }
  const ready = Object.values(components).every((s) => s === "ok");
  return { ready, components };
}
