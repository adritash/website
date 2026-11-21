import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Presentation Dashboard",
  description:
    "Executive presentations, architecture roadmaps, board-level decks, and technical strategy briefings by Dwaipayan Rajguru.",
  path: "/dashboards/presentation",
});

const presentationKpis = [
  { label: "Sample Decks Shown", value: "4", note: "Illustrative briefing outlines" },
  { label: "Target Audience", value: "C-Level / VP", note: "CIO, CTO, CFO & Board" },
  { label: "Core Focus Areas", value: "Cloud & AI", note: "Modernisation & Governance" },
  { label: "Format", value: "On request", note: "Full decks shared under NDA" },
] as const;

const presentations = [
  {
    id: "cloud-modernization-roadmap",
    title: "Enterprise Cloud Modernisation & Legacy Migration Strategy",
    category: "Cloud Strategy",
    slidesCount: 38,
    date: "Executive Briefing",
    audience: "CIO & Executive Committee",
    summary:
      "Strategic evaluation of migrating core monolithic applications to AWS & GCP, including 3-year TCO modeling, target state cloud blueprints, risk mitigation frameworks, and phased transition architecture.",
    topics: ["TCO & ROI Analysis", "Wave Migration Planning", "Multi-Cloud Governance", "Container Modernisation"],
    format: "Keynote & PDF Deck",
    viewHref: "/architecture#fintech-data-modernization",
  },
  {
    id: "ai-transformation-governance",
    title: "Generative AI, Agentic Workflows & Enterprise Governance",
    category: "AI & Automation",
    slidesCount: 42,
    date: "Board Strategy Deck",
    audience: "Board of Directors & Head of Product",
    summary:
      "Actionable roadmap for adopting AI agents, LLM pipelines, and Model Context Protocol (MCP) in regulated enterprises. Covers data sovereignty, audit compliance, guardrails, and operational ROI.",
    topics: ["Agentic AI Workflows", "RAG & Vector Pipelines", "Data Privacy & SOX/GDPR", "Evaluation & Safety Gates"],
    format: "Executive Presentation",
    viewHref: "/architecture#stock-agent",
  },
  {
    id: "fintech-data-mesh-architecture",
    title: "FinTech Data Mesh & Governed Lakehouse Blueprint",
    category: "Enterprise Architecture",
    slidesCount: 34,
    date: "Architecture Review Board (ARB)",
    audience: "Enterprise Architects & VP Engineering",
    summary:
      "Target architecture for conformed analytics, automated financial reconciliation, and medallion lakehouses on Snowflake and BigQuery, replacing fragmented legacy pipelines.",
    topics: ["Medallion Architecture", "Data Contracts & Quality", "Financial Reconciliation", "Real-Time Ingestion"],
    format: "Technical Architecture Briefing",
    viewHref: "/architecture#fintech-data-modernization",
  },
  {
    id: "event-driven-fraud-architecture",
    title: "Real-Time Payment Fraud Monitoring Architecture",
    category: "Security & FinTech",
    slidesCount: 28,
    date: "Risk & Compliance Summit",
    audience: "Chief Risk Officer & Fraud Ops",
    summary:
      "Deep dive into real-time sub-second payment fraud scoring, event-driven streaming ingestion with Kafka/Kinesis, and explainable AI decisioning workflows.",
    topics: ["Sub-Second Latency", "Event Stream Processing", "Rule Engines vs ML", "Auditable Decision Logs"],
    format: "Architecture Showcase",
    viewHref: "/architecture#fintech-fraud-monitoring",
  },
];

export default function PresentationDashboardPage() {
  return (
    <>
      <PageHero
        eyebrow="Executive Communication & Strategy"
        title="Presentation Dashboard"
        description="Curated collection of executive strategy decks, board presentations, architecture review frameworks, and technical roadmaps delivered for enterprise transformations."
      />

      {/* KPI Ribbon */}
      <Section background="surface" className="py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {presentationKpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {kpi.label}
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {kpi.value}
              </p>
              <p className="mt-2 text-xs font-medium text-brand">
                {kpi.note}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Presentations Grid */}
      <Section background="white">
        <SectionHeader
          eyebrow="Curated Briefings"
          title="Executive Decks & Strategy Presentations"
          description="High-impact presentations designed to communicate complex architecture, financial trade-offs, and technical roadmaps to senior business stakeholders."
        />
        <p className="mb-8 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted">
          The decks below are illustrative sample outlines of ADRITASH briefing topics.
          Full decks are not published here. Request a briefing to see client-ready material.
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {presentations.map((deck) => (
            <article
              key={deck.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md sm:p-8"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="brand">{deck.category}</Badge>
                  <span className="text-xs font-medium text-muted">
                    Sample outline • {deck.format}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold leading-snug text-foreground">
                  {deck.title}
                </h3>

                <p className="mt-2 text-xs font-semibold text-brand">
                  Audience: {deck.audience}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {deck.summary}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {deck.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted">{deck.date}</span>
                <Button href={deck.viewHref} variant="secondary" size="sm">
                  View Related Architecture →
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Action Strip */}
      <section className="border-t border-border bg-surface-dark py-14">
        <Container className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Need executive architectural counsel?
            </h2>
            <p className="mt-2 text-sm text-white/90">
              ADRITASH prepares board briefings, cloud migration business cases, and technical roadmaps.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button href="/contact" variant="inverse">
              Request Briefing
            </Button>
            <Button href="/architecture" variant="ghost" className="border-white/40 text-white hover:border-white">
              View Architecture Dashboard
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
