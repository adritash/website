import Link from "next/link";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import type { AdminSession } from "@/pulse/modules/admin/admin-auth";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/alerts", label: "Alerts & jobs" },
];

export default function AdminShell({ session, active, children }: { session: AdminSession; active: string; children: ReactNode }) {
  return (
    <Container className="app-shell py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-ink">ADRITASH Pulse · Admin</p>
          <nav className="mt-2 flex gap-4 text-sm">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className={t.href === active ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}>
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
        <form method="post" action="/api/pulse/admin/logout" className="flex items-center gap-3 text-sm text-muted">
          <span>{session.email} · {session.role.toLowerCase()}</span>
          <button className="rounded-md border border-border px-3 py-1.5 text-foreground hover:border-brand">Sign out</button>
        </form>
      </div>
      <div className="mt-8">{children}</div>
    </Container>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
