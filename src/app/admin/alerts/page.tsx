import type { Metadata } from "next";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { formatIstDateTime } from "@/pulse/lib/time";
import { requireAdminPage, roleAllows } from "@/pulse/modules/admin/admin-auth";
import { alertMonitoring } from "@/pulse/modules/admin/admin.service";
import AdminShell from "../AdminShell";

export const metadata: Metadata = { title: { absolute: "Alerts | Pulse admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  if (!getEnv().PULSE_ENABLED) return <p className="p-10 text-muted">Pulse is disabled.</p>;
  const session = await requireAdminPage("VIEWER");
  const { active, failed, recent } = await alertMonitoring(getDb());
  const canEdit = roleAllows(session.role, "OPERATOR");
  const Row = ({ cells }: { cells: React.ReactNode[] }) => (
    <tr className="border-t border-border text-foreground">{cells.map((c, i) => <td key={i} className="py-1.5 pr-3">{c}</td>)}</tr>
  );
  return (
    <AdminShell session={session} active="/admin/alerts">
      <h1 className="text-2xl font-bold text-foreground">Alerts & jobs</h1>

      <h2 className="mt-8 font-semibold text-foreground">Failed executions</h2>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>
          {failed.map((e) => (
            <Row key={e.id} cells={[formatIstDateTime(e.scheduledFor), `${e.alert.symbol} · ${e.alert.alertType}`, e.errorCode ?? "", `${e.attempts} attempts`,
              canEdit ? (
                <form method="post" action="/api/pulse/admin/actions">
                  <input type="hidden" name="executionId" value={e.id} />
                  <input type="hidden" name="back" value="/admin/alerts" />
                  <button name="action" value="retry-execution" className="rounded border border-border px-2 py-0.5 text-xs">Retry</button>
                </form>
              ) : null]} />
          ))}
        </tbody>
      </table>
      {!failed.length ? <p className="text-sm text-muted">None.</p> : null}

      <h2 className="mt-8 font-semibold text-foreground">Active and paused alerts ({active.length})</h2>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>
          {active.map((a) => (
            <Row key={a.id} cells={[`${a.symbol} (${a.exchange})`, a.alertType, a.frequencyMinutes ? `${a.frequencyMinutes} min` : "", a.status.toLowerCase(), a.nextRunAt ? formatIstDateTime(a.nextRunAt) : "–",
              canEdit && a.status === "ACTIVE" ? (
                <form method="post" action="/api/pulse/admin/actions">
                  <input type="hidden" name="alertId" value={a.id} />
                  <input type="hidden" name="back" value="/admin/alerts" />
                  <button name="action" value="pause-alert" className="rounded border border-border px-2 py-0.5 text-xs">Pause</button>
                </form>
              ) : null]} />
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 font-semibold text-foreground">Recent executions</h2>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>
          {recent.map((e) => (
            <Row key={e.id} cells={[formatIstDateTime(e.scheduledFor), `${e.alert.symbol} · ${e.alert.alertType}`, e.status, e.errorCode ?? "", e.estimatedCostInr ? `₹${Number(e.estimatedCostInr).toFixed(4)}` : ""]} />
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
