import type { Db } from "@/pulse/infrastructure/db";
import { maskPhone } from "@/pulse/lib/phone";
import { startOfIstDay } from "@/pulse/modules/subscriptions/usage.service";
import { opsSnapshot } from "./maintenance.service";

/** Aggregates for the admin overview. Contains no phone numbers or message bodies. */
export async function adminOverview(db: Db, now = new Date()) {
  const today = startOfIstDay(now);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const [totalUsers, activeUsers, newUsers, activeSubs, activeAlerts, sentToday, failedToday, costRows, ops, providerRows] = await Promise.all([
    db.user.count({ where: { status: { not: "DELETED" } } }),
    db.user.count({ where: { status: "ACTIVE", lastInboundAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.alert.count({ where: { status: "ACTIVE" } }),
    db.message.count({ where: { direction: "OUTBOUND", createdAt: { gte: today }, status: { in: ["SENT", "DELIVERED", "READ"] } } }),
    db.message.count({ where: { direction: "OUTBOUND", createdAt: { gte: today }, status: { in: ["FAILED", "SEND_UNCERTAIN"] } } }),
    db.usageRecord.groupBy({ by: ["usageType"], where: { createdAt: { gte: today } }, _sum: { estimatedCostInr: true, quantity: true } }),
    opsSnapshot(db, now),
    db.providerHealthSample.findMany({ where: { createdAt: { gte: new Date(now.getTime() - 3600 * 1000) } }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const costByType = Object.fromEntries(costRows.map((r) => [r.usageType, { inr: Number(r._sum.estimatedCostInr ?? 0), quantity: r._sum.quantity ?? 0 }]));
  const totalCost = costRows.reduce((n, r) => n + Number(r._sum.estimatedCostInr ?? 0), 0);
  const latencies = providerRows.filter((r) => r.ok).map((r) => r.latencyMs).sort((a, b) => a - b);
  const p50 = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;
  const providers = [...new Set(providerRows.map((r) => r.provider))].map((name) => {
    const rows = providerRows.filter((r) => r.provider === name);
    const errors = rows.filter((r) => !r.ok);
    return {
      name,
      samples: rows.length,
      errorRate: rows.length ? errors.length / rows.length : 0,
      rateLimited: errors.filter((e) => e.errorCode === "MD_RATE_LIMITED").length,
      lastOk: rows.find((r) => r.ok)?.createdAt ?? null,
      lastError: errors[0]?.errorCode ?? null,
    };
  });

  return {
    totalUsers,
    activeUsers,
    newUsers,
    activeSubs,
    activeAlerts,
    sentToday,
    failedToday,
    costByType,
    totalCost,
    costPerActiveUser: activeUsers ? totalCost / activeUsers : null,
    ops,
    providerLatencyP50: p50,
    providers,
  };
}

export async function searchUsers(db: Db, query: string) {
  const q = query.trim();
  const users = await db.user.findMany({
    where: {
      status: { not: "DELETED" },
      ...(q ? { OR: [{ id: q }, { phoneLast4: q.replace(/\D/g, "").slice(-4) || "____" }, { displayName: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { alerts: { where: { status: "ACTIVE" } }, watchlist: true } },
      subscriptions: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 },
    },
  });
  return users.map((u) => ({
    id: u.id,
    phone: maskPhone(u.phoneLast4),
    displayName: u.displayName,
    status: u.status,
    plan: u.subscriptions[0]?.plan.name ?? "Free",
    activeAlerts: u._count.alerts,
    watchlist: u._count.watchlist,
    lastInboundAt: u.lastInboundAt,
    optedOut: Boolean(u.proactiveOptOutAt),
    createdAt: u.createdAt,
  }));
}

export async function alertMonitoring(db: Db) {
  const [active, failed, recent] = await Promise.all([
    db.alert.findMany({ where: { status: { in: ["ACTIVE", "PAUSED"] } }, orderBy: { nextRunAt: "asc" }, take: 100, select: { id: true, symbol: true, exchange: true, alertType: true, frequencyMinutes: true, status: true, nextRunAt: true, lastRunAt: true, userId: true } }),
    db.alertExecution.findMany({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, take: 50, include: { alert: { select: { symbol: true, alertType: true } } } }),
    db.alertExecution.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { alert: { select: { symbol: true, alertType: true } } } }),
  ]);
  return { active, failed, recent };
}
