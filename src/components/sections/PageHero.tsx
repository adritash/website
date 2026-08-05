import Container from "@/components/ui/Container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface py-16 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"
        aria-hidden="true"
      />
      <Container className="relative">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
