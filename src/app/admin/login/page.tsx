import type { Metadata } from "next";
import Container from "@/components/ui/Container";

export const metadata: Metadata = { title: { absolute: "Admin sign in | ADRITASH Pulse" }, robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <Container className="py-20">
      <form method="post" action="/api/pulse/admin/login" className="mx-auto max-w-sm space-y-4 rounded-2xl border border-border bg-surface-elevated p-8">
        <h1 className="text-xl font-bold text-foreground">Pulse admin</h1>
        {error ? <p role="alert" className="text-sm text-burgundy">{error === "rate" ? "Too many attempts. Try again later." : "Sign-in failed."}</p> : null}
        <label className="block text-sm text-foreground">
          Email
          <input name="email" type="email" autoComplete="username" required className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label className="block text-sm text-foreground">
          Password
          <input name="password" type="password" autoComplete="current-password" required minLength={12} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <button className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">Sign in</button>
      </form>
    </Container>
  );
}
