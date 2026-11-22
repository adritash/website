import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { createPageMetadata } from "@/lib/metadata";
import { assets, siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Pulse",
  description:
    "ADRITASH Pulse: NSE and BSE stock prices, watchlists and price alerts on WhatsApp. No app to install.",
  path: "/pulse",
});

const examples = [
  "What is TCS trading at?",
  "Track Infosys",
  "Send TCS updates every hour",
  "Alert me if Reliance falls below ₹1,000",
  "Show my alerts",
  "Stop all alerts",
];

const features = [
  { title: "Ask in plain words", body: "Type the way you talk. Pulse understands company names, NSE symbols and everyday phrasing." },
  { title: "Your watchlist", body: "Keep the stocks you care about in one place and see how they moved today." },
  { title: "Scheduled updates", body: "Hourly updates during market hours, or a closing summary after 3:30 PM. Never on weekends or exchange holidays." },
  { title: "Price alerts", body: "Hear once when a stock crosses your level. No repeated pings while it stays there." },
];

function whatsappLink(): string | null {
  const n = process.env.NEXT_PUBLIC_PULSE_WHATSAPP_NUMBER?.replace(/\D/g, "");
  return n ? `https://wa.me/${n}?text=${encodeURIComponent("Hi")}` : null;
}

export default function PulsePage() {
  const link = whatsappLink();
  return (
    <>
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(227,169,95,0.22),transparent_55%),linear-gradient(160deg,rgba(20,40,38,0.9),rgba(6,12,11,1))]"
          aria-hidden="true"
        />
        <Container className="relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Image src={assets.emblem} alt="" width={44} height={44} className="h-11 w-11 rounded-lg" priority />
              <span className="font-wordmark text-sm tracking-[0.3em] text-champagne">{siteConfig.brand} PULSE</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Indian stock prices and alerts, on WhatsApp.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Save the official ADRITASH Pulse number, say hi, and ask. Prices for NSE and BSE equities, a personal watchlist,
              scheduled updates and price alerts. No app, no commands to learn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {link ? (
                <Button href={link} external variant="gold" size="lg">
                  Chat on WhatsApp
                </Button>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-gold/40 px-6 py-3 text-sm font-semibold text-gold">
                  WhatsApp number coming soon
                </span>
              )}
              <Button href="#how-it-works" variant="outline-light" size="lg">
                How it works
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/55">{siteConfig.tagline}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur" aria-label="Example conversation">
            <div className="space-y-3 text-sm">
              <p className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1f5a4f] px-4 py-2.5">What is TCS trading at?</p>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 leading-relaxed">
                <p><strong>Tata Consultancy Services</strong> (TCS, NSE): ₹X,XXX.XX</p>
                <p>Change today: +₹XX.XX (+X.XX%)</p>
                <p className="text-white/70">Data: delayed by 15 minutes, as of 10:42 AM IST</p>
                <p className="text-white/70">Source: licensed data provider</p>
              </div>
              <p className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1f5a4f] px-4 py-2.5">Send TCS updates every hour</p>
              <p className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-2.5">
                Done. Updates every hour on trading days, 9:15 AM to 3:30 PM IST. Reply <em>stop TCS updates</em> any time.
              </p>
            </div>
            <p className="mt-4 text-xs text-white/45">Illustration only. Pulse never shows a price it doesn&apos;t have.</p>
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="section-anchor bg-background py-16 sm:py-20">
        <Container>
          <h2 className="text-3xl font-bold text-foreground">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {["Save the ADRITASH Pulse number and send “Hi”.", "Read the privacy notice and reply AGREE to save watchlists and alerts.", "Ask for prices, track stocks, set updates. Reply STOP any time."].map((step, i) => (
              <li key={step} className="rounded-2xl border border-border bg-surface-elevated p-6">
                <span className="text-sm font-semibold text-gold-ink">Step {i + 1}</span>
                <p className="mt-2 text-foreground">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <h3 className="text-xl font-semibold text-foreground">Things you can say</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {examples.map((e) => (
                <li key={e} className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm text-foreground">“{e}”</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Plans</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-elevated p-6">
                <p className="text-sm font-semibold text-gold-ink">Pulse Free</p>
                <p className="mt-1 text-2xl font-bold text-foreground">₹0</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted">
                  <li>20 price checks a day</li>
                  <li>Watchlist of 3 stocks</li>
                  <li>2 price alerts</li>
                  <li>Daily closing summary</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gold/40 bg-surface-elevated p-6">
                <p className="text-sm font-semibold text-gold-ink">Pulse Plus</p>
                <p className="mt-1 text-2xl font-bold text-foreground">Coming soon</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted">
                  <li>Watchlist of 5 stocks</li>
                  <li>Hourly updates in market hours</li>
                  <li>More price alerts</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Good to know</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
              <li>Prices are delayed (typically 15 minutes), never shown as real-time. Each reply says how old the price is and where it came from.</li>
              <li>NSE and BSE listed equities only. No derivatives, crypto or international markets.</li>
              <li>Updates run only during market hours on trading days, using the official exchange holiday calendar.</li>
              <li>Pulse provides information only. It is not investment advice and does not recommend buying or selling.</li>
              <li>
                Your data stays yours. Reply STOP to stop messages or DELETE MY DATA to erase it. Read the{" "}
                <Link href="/pulse/privacy" className="text-gold-ink underline">privacy notice</Link> and{" "}
                <Link href="/pulse/terms" className="text-gold-ink underline">terms</Link>.
              </li>
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
