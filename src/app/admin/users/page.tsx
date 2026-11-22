import type { Metadata } from "next";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { formatIstDateTime } from "@/pulse/lib/time";
import { requireAdminPage, roleAllows } from "@/pulse/modules/admin/admin-auth";
import { searchUsers } from "@/pulse/modules/admin/admin.service";
import AdminShell from "../AdminShell";

export const metadata: Metadata = { title: { absolute: "Users | Pulse admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!getEnv().PULSE_ENABLED) return <p className="p-10 text-muted">Pulse is disabled.</p>;
  const session = await requireAdminPage("VIEWER");
  const { q = "" } = await searchParams;
  const users = await searchUsers(getDb(), q.slice(0, 80));
  const canEdit = roleAllows(session.role, "OPERATOR");
  return (
    <AdminShell session={session} active="/admin/users">
      <h1 className="text-2xl font-bold text-foreground">Users</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="User id, last 4 digits or name" className="w-72 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button className="rounded-lg border border-border px-4 py-2 text-sm">Search</button>
      </form>
      <p className="mt-2 text-xs text-muted">Phone numbers are masked. Full numbers are never shown here.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">User</th><th>Phone</th><th>Status</th><th>Plan</th><th>Alerts</th><th>Watchlist</th><th>Last message</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border align-top text-foreground">
                <td className="py-2"><code className="text-xs">{u.id}</code><br /><span className="text-xs text-muted">{u.displayName ?? ""}</span></td>
                <td>{u.phone}</td>
                <td>{u.status.toLowerCase()}{u.optedOut ? " · opted out" : ""}</td>
                <td>{u.plan}</td>
                <td>{u.activeAlerts}</td>
                <td>{u.watchlist}</td>
                <td>{u.lastInboundAt ? formatIstDateTime(u.lastInboundAt) : "–"}</td>
                <td>
                  {canEdit ? (
                    <form method="post" action="/api/pulse/admin/actions" className="flex flex-col gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="back" value={`/admin/users?q=${encodeURIComponent(q)}`} />
                      {u.status === "ACTIVE" ? (
                        <button name="action" value="disable-user" className="rounded border border-border px-2 py-0.5 text-xs">Disable</button>
                      ) : u.status === "DISABLED" ? (
                        <button name="action" value="enable-user" className="rounded border border-border px-2 py-0.5 text-xs">Enable</button>
                      ) : null}
                      {roleAllows(session.role, "OWNER") && u.status !== "DELETION_REQUESTED" ? (
                        <button name="action" value="delete-user" className="rounded border border-burgundy/40 px-2 py-0.5 text-xs text-burgundy">Erase (on request)</button>
                      ) : null}
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? <p className="mt-4 text-sm text-muted">No users found.</p> : null}
      </div>
    </AdminShell>
  );
}
