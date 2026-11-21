import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { adritashLinkedInPosts } from "@/lib/data/insights";
import { formatPostDate, getAllPosts } from "@/lib/content/posts";
import { createPageMetadata } from "@/lib/metadata";
import { assets, social } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Insights",
  description:
    "Technical articles, cloud architecture perspectives, and LinkedIn company updates from ADRITASH.",
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

export default async function InsightsPage() {
  const blogPosts = await getAllPosts();
  return (
    <>
      <PageHero
        eyebrow="Insights & Perspectives"
        title="Technical writing and company updates"
        description="Enterprise architecture briefings, cloud modernisation strategies, and executive updates from the ADRITASH LinkedIn company page."
      />

      {/* ── Official ADRITASH LinkedIn Area ────────────────────────────────────── */}
      <Section id="linkedin-feed" background="surface" className="py-12 sm:py-16">
        <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-sm sm:p-8 lg:p-10">
          {/* Header with LinkedIn branding and direct CTA */}
          <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0077b5]/10 border border-[#0077b5]/20">
                <svg
                  className="h-8 w-8 text-[#00608f] dark:text-[#5bbcf0]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00608f] dark:text-[#5bbcf0]">
                    Official Company Page
                  </span>
                  <span className="text-muted/40">•</span>
                  <span className="text-xs text-muted">linkedin.com/company/adritash</span>
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  ADRITASH on LinkedIn
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Follow our official company page for regular briefings on enterprise cloud migrations,
                  data architecture patterns, and executive AI transformation strategies.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <a
                href={social.linkedinCompany}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0077b5] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#005582] hover:shadow-lg"
              >
                <span>Follow ADRITASH</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Posts Feed Grid */}
          <div className="mt-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Latest Publications from @ADRITASH
              </p>
              <a
                href={social.linkedinCompany}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#00608f] dark:text-[#5bbcf0] hover:underline"
              >
                View all company updates on LinkedIn →
              </a>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {adritashLinkedInPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-[#0077b5]/40 hover:shadow-md"
                >
                  <div>
                    {/* Author & Timestamp */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-ink">
                        <Image
                          src={assets.emblem}
                          alt="ADRITASH"
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">
                            {post.author}
                          </span>
                          <span className="text-[11px] text-[#00608f] dark:text-[#5bbcf0]" title="Verified Company">
                            ●
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">{post.publishedAt}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="mt-4 text-xs leading-relaxed text-foreground/90 sm:text-sm">
                      {post.content}
                    </p>

                    {/* Hashtags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium text-[#00608f] dark:text-[#5bbcf0] hover:underline"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer with engagement & direct link */}
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <span className="text-muted">
                      {post.metrics?.reactions} reactions • {post.metrics?.comments} comments
                    </span>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand hover:underline"
                    >
                      Read on LinkedIn →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Technical Blog Articles ────────────────────────────────────────────── */}
      <Section id="blog" background="white">
        <SectionHeader eyebrow="Blog" title="Long-form technical articles" />
        <div className="flex flex-col gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-border pb-8 last:border-0 last:pb-0"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge variant="brand">{post.tag}</Badge>
                <time className="text-sm text-muted" dateTime={post.date}>
                  {formatPostDate(post.date)}
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

      {/* ── Case Studies ──────────────────────────────────────────────────────── */}
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

      {/* Action Strip */}
      <section className="border-t border-border bg-surface-dark py-14">
        <Container className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Stay connected with ADRITASH
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Join our network on LinkedIn for enterprise architecture and AI modernization insights.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <a
              href={social.linkedinCompany}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow hover:bg-white/90 transition-colors"
            >
              Follow on LinkedIn
            </a>
            <Button href="/contact" variant="ghost" className="border-white/40 text-white hover:border-white">
              Get in Touch
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
