import type { Db } from "@/pulse/infrastructure/db";
import { ConfigError } from "@/pulse/lib/errors";
import { parseLimits, type PlanLimits } from "./plans";

export type EffectivePlan = { planId: string; code: string; name: string; limits: PlanLimits; subscriptionId?: string; endAt?: Date | null };

/**
 * The plan that governs a user right now. A paid plan applies only while a
 * server-verified subscription is ACTIVE and not past its end date; otherwise the
 * default (free) plan applies. Never derived from AI output or client claims.
 */
export async function getEffectivePlan(db: Db, userId: string, now = new Date()): Promise<EffectivePlan> {
  const sub = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE", OR: [{ endAt: null }, { endAt: { gt: now } }] },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (sub && sub.plan.active) {
    return { planId: sub.planId, code: sub.plan.code, name: sub.plan.name, limits: parseLimits(sub.plan.limits), subscriptionId: sub.id, endAt: sub.endAt };
  }
  const plan = await db.plan.findFirst({ where: { isDefault: true, active: true } });
  if (!plan) throw new ConfigError("No default plan configured. Run the Pulse seed.");
  return { planId: plan.id, code: plan.code, name: plan.name, limits: parseLimits(plan.limits) };
}
