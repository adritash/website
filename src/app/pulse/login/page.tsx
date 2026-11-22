import type { Metadata } from "next";
import Container from "@/components/ui/Container";

export const metadata: Metadata = { title: { absolute: "Sign in | ADRITASH Pulse" }, robots: { index: false, follow: false } };

/**
 * The WhatsApp link lands here. Signing in needs a click (POST), so link-preview
 * bots that fetch the URL cannot use up the single-use token.
 */
export default async function PulseLoginPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface-elevated p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Open your Pulse dashboard</h1>
        {error ? (
          <p className="mt-4 text-sm text-muted">This link has expired or was already used. Send <strong>dashboard</strong> to Pulse on WhatsApp for a new one.</p>
        ) : token ? (
          <form method="post" action="/api/pulse/session" className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
              Continue
            </button>
            <p className="mt-4 text-xs text-muted">This private link works once and expires 15 minutes after it was sent.</p>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">Send <strong>dashboard</strong> to Pulse on WhatsApp to get a private sign-in link.</p>
        )}
      </div>
    </Container>
  );
}
