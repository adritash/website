import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { formatIstDateTime } from "@/pulse/lib/time";
import { maskPhone } from "@/pulse/lib/phone";
import { getSessionUser } from "@/pulse/modules/users/user-session";
import { getEffectivePlan } from "@/pulse/modules/subscriptions/subscription.service";
import { listAlerts, WATCHLIST_SYMBOL } from "@/pulse/modules/alerts/alert.service";
import { listWatchlist } from "@/pulse/modules/watchlists/watchlist.service";

export const metadata: Metadata = { title: { absolute: "Dashboard | ADRITASH Pulse" }, robots: { index: false, follow: false } };

function describe(a: { symbol: string; alertType: string; frequencyMinutes: number | null; thresholdValue: unknown }) {
  const name = a.symbol === WATCHLIST_SYMBOL ? "Watchlist" : a.symbol;
  const t = Number(a.thresholdValue ?? 0).toLocaleString("en-IN");
  switch (a.alertType) {
    case "RECURRING_UPDATE":
      return `${name}: every ${a.frequencyMinutes === 60 ? "hour" : `${a.frequencyMinutes} min`} in market hours`;
    case "DAILY_CLOSE":
      return `${name}: daily closing summary`;
    case "PRICE_ABOVE":
      return `${name}: alert above ₹${t}`;
    case "PRICE_BELOW":
      return `${name}: alert below ₹${t}`;
    default:
      return `${name}: alert on a ${t}% move`;
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function PulseDashboardPage() {
  if (!getEnv().PULSE_ENABLED) {
    return <Container className="py-20"><p className="text-muted">Pulse is not available yet.</p></Container>;
  }
  const user = await getSessionUser();
  if (!user) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground">Sign in with WhatsApp</h1>
          <p className="mt-3 text-muted">Send <strong>dashboard</strong> to ADRITASH Pulse on WhatsApp. You&apos;ll get a private link that signs you in.</p>
          <Link href="/pulse" className="mt-6 inline-block text-sm text-gold-ink underline">About Pulse</Link>
        </div>
      </Container>
    );
  }

  const db = getDb();
  const [plan, watchlist, alerts, recent] = await Promise.all([
    getEffectivePlan(db, user.id),
    listWatchlist(db, user.id),
    listAlerts(db, user.id),
    db.message.findMany({ where: { userId: user.id, direction: "OUTBOUND", alertId: { not: null } }, orderBy: { createdAt: "desc" }, take: 15, select: { id: true, createdAt: true, status: true, content: true } }),
  ]);
  const l = plan.limits;

  return (
    <Container className="app-shell py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-ink">ADRITASH Pulse</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Your dashboard</h1>
          <p className="mt-1 text-sm text-muted">WhatsApp {maskPhone(user.phoneLast4)}</p>
        </div>
        <form method="post" action="/api/pulse/session">
          <input type="hidden" name="action" value="logout" />
          <button className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-brand">Sign out</button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Plan">
          <p className="text-xl font-semibold text-foreground">{plan.name}</p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            <li>{l.dailyQuoteQueries} price checks a day</li>
            <li>Watchlist up to {l.watchlistMax}</li>
            <li>{l.priceAlertsMax} price alerts, {l.recurringAlertsMax} recurring update(s)</li>
          </ul>
          <p className="mt-3 text-xs text-muted">To change plans, send <strong>upgrade</strong> on WhatsApp.</p>
        </Panel>

        <Panel title={`Watchlist (${watchlist.length}/${l.watchlistMax})`}>
          {watchlist.length ? (
            <ul className="divide-y divide-border text-sm">
              {watchlist.map((w) => (
                <li key={w.id} className="flex justify-between py-2">
                  <span className="font-medium text-foreground">{w.symbol}</span>
                  <span className="text-muted">{w.exchange}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Empty. Send <strong>track TCS</strong> on WhatsApp.</p>
          )}
        </Panel>

        <Panel title="Privacy">
          <p className="text-sm text-muted">{user.proactiveOptOutAt ? "Proactive messages are off." : "Proactive messages are on for the alerts you set."}</p>
          <form method="post" action="/api/pulse/me/privacy" className="mt-3 flex flex-wrap gap-2">
            <button name="action" value={user.proactiveOptOutAt ? "optin" : "optout"} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-brand">
              {user.proactiveOptOutAt ? "Turn messages on" : "Stop all messages"}
            </button>
          </form>
          <form method="post" action="/api/pulse/me/privacy" className="mt-4">
            <label className="flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" name="confirm" value="yes" required className="mt-0.5" /> I understand this permanently erases my Pulse data.
            </label>
            <button name="action" value="delete" className="mt-2 rounded-lg border border-burgundy/40 px-3 py-1.5 text-sm text-burgundy hover:bg-burgundy/5">Delete my data</button>
          </form>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Active alerts">
          {alerts.length ? (
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{describe(a)}</p>
                    <p className="text-xs text-muted">
                      {a.status === "PAUSED" ? "Paused" : a.nextRunAt ? `Next check ${formatIstDateTime(a.nextRunAt)}` : "Waiting for exchange calendar"}
                    </p>
                  </div>
                  <form method="post" action="/api/pulse/me/alerts" className="flex gap-2">
                    <input type="hidden" name="alertId" value={a.id} />
                    <button name="action" value={a.status === "PAUSED" ? "resume" : "pause"} className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:border-brand">
                      {a.status === "PAUSED" ? "Resume" : "Pause"}
                    </button>
                    <button name="action" value="cancel" className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:border-burgundy">Stop</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No alerts. Try <strong>send TCS updates every hour</strong> on WhatsApp.</p>
          )}
        </Panel>

        <Panel title="Recent notifications">
          {recent.length ? (
            <ul className="space-y-3 text-sm">
              {recent.map((m) => (
                <li key={m.id} className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-muted">{formatIstDateTime(m.createdAt)} · {m.status.toLowerCase()}</p>
                  <p className="mt-1 whitespace-pre-line text-foreground">{m.content ?? "Message text removed after 30 days."}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing sent yet.</p>
          )}
        </Panel>
      </div>

      <p className="mt-8 text-xs text-muted">
        Prices are delayed and for information only, not investment advice. Help: send <strong>help</strong> on WhatsApp ·{" "}
        <Link href="/pulse/privacy" className="underline">Privacy</Link> · <Link href="/pulse/terms" className="underline">Terms</Link>
      </p>
    </Container>
  );
}
