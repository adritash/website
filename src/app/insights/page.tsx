import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { blogPosts } from "@/lib/data/insights";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Insights",
  description:
    "Technical articles and learning by Dwaipayan Rajguru on enterprise architecture, cloud migration, and AI adoption.",
  path: "/insights",
});

const caseStudies = [
  {
    title: "Core Banking Modernisation for a Regional Bank",
    industry: "Financial Services",
    outcome: "Reduced time-to-deploy for new products from 18 weeks to 3 weeks.",
  },
  {
    title: "AI-Driven Document Processing for a Government Agency",
    industry: "Government",
    outcome:
      "Automated 84% of manual document classification, freeing 40 FTE hours weekly.",
  },
];

export default function InsightsPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Technical writing and learning"
        description="Articles on enterprise architecture, cloud modernisation, and AI adoption."
      />

      <Section id="blog" background="white">
        <SectionHeader eyebrow="Blog" title="Latest articles" />
        <div className="flex flex-col gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-border pb-8 last:border-0 last:pb-0"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge variant="brand">{post.tag}</Badge>
                <time className="text-sm text-muted" dateTime={post.date}>
                  {post.date}
                </time>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                <Link href={`/insights/${post.slug}`} className="hover:text-brand">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 max-w-2xl leading-relaxed text-muted">{post.excerpt}</p>
              <Link
                href={`/insights/${post.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section id="case-studies" background="surface">
        <SectionHeader eyebrow="Case Studies" title="Programme outcomes" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {caseStudies.map((study) => (
            <Card key={study.title} hover={false}>
              <Badge variant="brand">{study.industry}</Badge>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{study.title}</h3>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Outcome
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {study.outcome}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
