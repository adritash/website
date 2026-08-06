import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import Section from "@/components/ui/Section";
import { createPageMetadata } from "@/lib/metadata";

type InsightArticleProps = {
  title: string;
  description: string;
  date: string;
  tag: string;
  children: React.ReactNode;
};

export function InsightArticle({
  title,
  description,
  date,
  tag,
  children,
}: InsightArticleProps) {
  return (
    <>
      <PageHero eyebrow={tag} title={title} description={description} />
      <Section background="white">
        <article className="max-w-3xl space-y-6 text-base leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted [&_ul]:space-y-2">
          <p className="text-sm text-muted">
            <time dateTime={date}>{date}</time>
          </p>
          {children}
        </article>
        <div className="mt-12 border-t border-border pt-8">
          <Link
            href="/insights"
            className="text-sm font-semibold text-brand hover:text-brand-dark"
          >
            ← Back to Insights
          </Link>
        </div>
      </Section>
    </>
  );
}

export function createInsightMetadata({
  title,
  description,
  slug,
}: {
  title: string;
  description: string;
  slug: string;
}): Metadata {
  return createPageMetadata({
    title,
    description,
    path: `/insights/${slug}`,
  });
}
