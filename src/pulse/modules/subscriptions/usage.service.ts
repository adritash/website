import type { Db } from "@/pulse/infrastructure/db";
import { logger } from "@/pulse/infrastructure/logger";
import { istDateKey, istInstant } from "@/pulse/lib/time";

export type UsageType =
  | "QUOTE_QUERY"
  | "AI_REQUEST"
  | "MARKET_DATA_CALL"
  | "WHATSAPP_OUTBOUND"
  | "PROACTIVE_MESSAGE"
  | "ALERT_CREATED";

export async function recordUsage(
  db: Db,
  entry: { userId?: string | null; usageType: UsageType; quantity?: number; estimatedCostInr?: number; metadata?: Record<string, unknown> }
) {
  try {
    await db.usageRecord.create({
      data: {
        userId: entry.userId ?? null,
        usageType: entry.usageType,
        quantity: entry.quantity ?? 1,
        estimatedCostInr: entry.estimatedCostInr ?? 0,
        metadata: entry.metadata as object | undefined,
      },
    });
  } catch (error) {
    logger.error("usage.record_failed", { usageType: entry.usageType, error });
  }
}

/** Start of the current IST day. Quotas reset at midnight IST. */
export function startOfIstDay(now = new Date()): Date {
  return istInstant(istDateKey(now), 0);
}

export async function usageToday(db: Db, userId: string, usageType: UsageType, now = new Date()): Promise<number> {
  const result = await db.usageRecord.aggregate({
    where: { userId, usageType, createdAt: { gte: startOfIstDay(now) } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
