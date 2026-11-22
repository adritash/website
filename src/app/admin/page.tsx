import type { Metadata } from "next";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { getQueues } from "@/pulse/infrastructure/queue";
import { getRedis } from "@/pulse/infrastructure/redis";
import { formatIstDateTime } from "@/pulse/lib/time";
import { requireAdminPage } from "@/pulse/modules/admin/admin-auth";
import { adminOverview } from "@/pulse/modules/admin/admin.service";
import { loadCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { istParts } from "@/pulse/lib/time";
import AdminShell, { Stat } from "./AdminShell";

export const metadata: Metadata = { title: { absolute: "Admin | ADRITASH Pulse" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function queueHealth() {
  try {
    const q = getQueues();
    const [inWait, alertWait, alertFailed, dead, beat] = await Promise.all([
      q.inbound.getWaitingCount(),
      q.alerts.getWaitingCount(),
      q.alerts.getFailedCount(),
      q.deadLetter.getWaitingCount(),
      getRedis().get("pulse:worker:heartbeat"),
    ]);
    return { ok: true as const, inWait, alertWait, alertFailed, dead, heartbeatAge: beat ? Math.round((Date.now() - Number(beat)) / 1000) : null };
  } catch {
    return { ok: false as const };
  }
}

export default async function AdminOverviewPage() {
  if (!getEnv().PULSE_ENABLED) return <p className="p-10 text-muted">Pulse is disabled.</p>;
  const session = await requireAdminPage("VIEWER");
  const db = getDb();
  const [o, queues, calendar] = await Promise.all([adminOverview(db), queueHealth(), loadCalendar(db)]);
  const year = istParts(new Date()).year;
  const env = getEnv();

  return (
    <AdminShell session={session} active="/admin">
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total users" value={o.totalUsers} />
        <Stat label="Active (7 days)" value={o.activeUsers} />
        <Stat label="New today" value={o.newUsers} />
        <Stat label="Active subscriptions" value={o.activeSubs} hint={env.PULSE_PAYMENTS_ENABLED ? "Payments on" : "Payments off"} />
        <Stat label="Active alerts" value={o.activeAlerts} />
        <Stat label="Messages sent today" value={o.sentToday} />
        <Stat label="Failed / uncertain today" value={o.failedToday} />
        <Stat label="Est. cost today" value={inr(o.totalCost)} hint="Estimates, excl. GST" />
        <Stat label="Cost / active user (today)" value={o.costPerActiveUser === null ? "–" : inr(o.costPerActiveUser)} />
        <Stat label="Provider p50 latency (1h)" value={o.providerLatencyP50 === null ? "–" : `${o.providerLatencyP50} ms`} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h2 className="font-semibold text-foreground">Market data</h2>
          <p className="mt-1 text-sm text-muted">Configured: {env.MARKET_DATA_PROVIDER}{env.MARKET_DATA_PROVIDER === "sandbox" ? " (test data, not for production)" : ""}</p>
          {o.providers.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {o.providers.map((p) => (
                <li key={p.name} className="text-foreground">
                  <strong>{p.name}</strong>: {(p.errorRate * 100).toFixed(1)}% errors over {p.samples} calls, {p.rateLimited} rate-limited
                  <br />
                  <span className="text-muted">Last OK {p.lastOk ? formatIstDateTime(p.lastOk) : "never"}{p.lastError ? ` · last error ${p.lastError}` : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No calls in the last hour.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h2 className="font-semibold text-foreground">Queues & worker</h2>
          {queues.ok ? (
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              <li>Inbound waiting: {queues.inWait}</li>
              <li>Alerts waiting: {queues.alertWait} · failed: {queues.alertFailed}</li>
              <li>Dead-letter: {queues.dead}</li>
              <li className={queues.heartbeatAge === null || queues.heartbeatAge > 180 ? "text-burgundy" : ""}>
                Worker heartbeat: {queues.heartbeatAge === null ? "none (worker not running)" : `${queues.heartbeatAge}s ago`}
              </li>
            </ul>
          ) : (
            <p className="mt-3 text-sm text-burgundy">Redis unreachable.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h2 className="font-semibold text-foreground">Calendar & health (last hour)</h2>
          <ul className="mt-3 space-y-1 text-sm text-foreground">
            <li className={calendar.hasYear("NSE", year) ? "" : "text-burgundy"}>NSE {year}: {calendar.hasYear("NSE", year) ? "loaded" : "MISSING"}</li>
            <li className={calendar.hasYear("NSE", year + 1) ? "" : "text-muted"}>NSE {year + 1}: {calendar.hasYear("NSE", year + 1) ? "loaded" : "not loaded"}</li>
            <li className={calendar.hasYear("BSE", year) ? "" : "text-muted"}>BSE {year}: {calendar.hasYear("BSE", year) ? "loaded" : "not loaded (BSE alerts paused)"}</li>
            <li>Failed messages: {o.ops.failedMessagesLastHour}</li>
            <li>Uncertain sends: {o.ops.uncertainSendsLastHour}</li>
            <li>Failed executions: {o.ops.failedExecutionsLastHour}</li>
          </ul>
        </section>
      </div>

      <section className="mt-10 rounded-xl border border-border bg-surface-elevated p-5">
        <h2 className="font-semibold text-foreground">Cost today by type</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-1">Type</th><th>Count</th><th>Est. INR</th></tr></thead>
          <tbody>
            {Object.entries(o.costByType).map(([k, v]) => (
              <tr key={k} className="border-t border-border text-foreground"><td className="py-1.5">{k}</td><td>{v.quantity}</td><td>{inr(v.inr)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">WhatsApp rates from configuration (utility ₹{env.PULSE_COST_WHATSAPP_UTILITY_INR}, marketing ₹{env.PULSE_COST_WHATSAPP_MARKETING_INR}); delivery webhooks zero out non-billable messages. Verify against Meta&apos;s INR rate card.</p>
      </section>
    </AdminShell>
  );
}
