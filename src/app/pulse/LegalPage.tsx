import type { ReactNode } from "react";
import Container from "@/components/ui/Container";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container className="py-14 sm:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-ink">ADRITASH Pulse</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Version {updated}</p>
        <p role="note" className="mt-6 rounded-xl border border-gold/40 bg-surface p-4 text-sm text-foreground">
          Draft pending legal review. This text describes how the service is built today; it will be reviewed by a lawyer before public launch.
        </p>
        <div className="mt-8 space-y-6 leading-relaxed text-foreground [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted [&_li]:text-muted">
          {children}
        </div>
      </article>
    </Container>
  );
}
