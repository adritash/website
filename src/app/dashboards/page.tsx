import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboards",
  description:
    "Enterprise dashboards — Project Management, Enterprise Architecture, and Executive Presentations by Dwaipayan Rajguru.",
  path: "/dashboards",
});

const dashboardDetails = [
  {
    title: "ADRITASH PM Toolkit",
    href: "/dashboards/project-management",
    badge: "Live tool + roadmap",
    description:
      "AI tools for project and programme delivery. The RAID Generator is live today; status reports, meeting minutes and health checks are on the roadmap.",
    features: [
      "RAID Generator with 5×5 risk matrix (live)",
      "Excel, CSV and JSON export",
      "Weekly status and meeting-minutes agents (coming soon)",
      "Sample portfolio governance view",
    ],
    ctaText: "Open PM Toolkit →",
  },
  {
    title: "Enterprise Architecture Dashboard",
    href: "/architecture",
    badge: "Cloud Architecture",
    description:
      "Interactive cloud architecture explorer featuring production-proven reference architectures across AWS and GCP, end-to-end data flows, service layers, and architectural decisions.",
    features: [
      "Full interactive cloud diagrams (AWS & GCP)",
      "Layer-by-layer service breakdown (Ingestion, Storage, AI)",
      "Step-by-step data flow traces",
      "Architectural trade-offs and decision logs",
    ],
    ctaText: "Explore Architecture Dashboard →",
  },
  {
    title: "Presentation Dashboard",
    href: "/dashboards/presentation",
    badge: "Executive Briefings",
    description:
      "Curated library of board-level slide decks, architectural roadmaps, C-suite technology business cases, and keynote presentations.",
    features: [
      "Enterprise cloud modernisation roadmaps",
      "Generative AI & Agentic governance blueprints",
      "FinTech data mesh & reconciliation strategies",
      "Board-level TCO & investment evaluations",
    ],
    ctaText: "View Presentation Dashboard →",
  },
];

export default function DashboardsHubPage() {
  return (
    <>
      <PageHero
        eyebrow="Executive Portals & Dashboards"
        title="Enterprise Dashboards"
        description="Interactive management dashboards providing visibility into project delivery governance, cloud reference architectures, and executive strategy presentations."
      />

      <Section background="white">
        <SectionHeader
          eyebrow="Select a Dashboard"
          title="PM Toolkit, Architecture & Executive Briefings"
          description="Explore specialized dashboards tailored for programme leadership, technical architecture, and C-suite alignment."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {dashboardDetails.map((dash) => (
            <div
              key={dash.title}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-lg sm:p-8"
            >
              <div>
                <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  {dash.badge}
                </span>

                <h3 className="mt-4 text-xl font-bold text-foreground">
                  {dash.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {dash.description}
                </p>

                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Key Capabilities
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-foreground/80">
                    {dash.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span className="text-brand font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button href={dash.href} className="w-full">
                  {dash.ctaText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
