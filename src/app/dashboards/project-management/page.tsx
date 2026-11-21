import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { createPageMetadata } from "@/lib/metadata";
import { pmStatusLabel, pmTools } from "@/lib/pm/tools";

export const metadata: Metadata = createPageMetadata({
  title: "PM Toolkit",
  description:
    "Enterprise IT portfolio delivery dashboard — milestone tracking, cross-functional engineering governance, risk management, and outcome metrics.",
  path: "/dashboards/project-management",
});

const portfolioKpis = [
  { label: "Sample Programmes", value: "5", change: "Across Cloud, AI & FinTech", positive: true },
  { label: "Milestone On-Time Rate", value: "94.6%", change: "Sample figure", positive: true },
  { label: "Cross-Functional Headcount", value: "50", change: "Sample team size", positive: true },
  { label: "Budget Variance", value: "-4.8%", change: "Sample figure", positive: true },
] as const;

const programs = [
  {
    id: "fintech-data-modernization",
    name: "FinTech Data Platform Modernisation",
    category: "Cloud Transformation",
    lead: "Dwaipayan Rajguru (Programme Lead)",
    stage: "Phase 3: Production Cutover",
    status: "On Track",
    statusColor: "emerald",
    progress: 92,
    budget: "$3.2M",
    timeline: "Q1 - Q4",
    milestone: "Gold Layer BI Certification Complete",
    risks: "0 Critical / 1 Monitored",
    architectureLink: "/architecture#fintech-data-modernization",
    teamSize: "14 Engineers & Analysts",
  },
  {
    id: "fintech-fraud-monitoring",
    name: "Real-Time Fraud Monitoring & Risk Engine",
    category: "AI & Automation",
    lead: "Dwaipayan Rajguru (Architecture & Delivery)",
    stage: "Phase 2: Event Stream Integration",
    status: "On Track",
    statusColor: "emerald",
    progress: 78,
    budget: "$2.4M",
    timeline: "Q2 - Q1 (+1)",
    milestone: "Sub-second decisioning pipeline landed",
    risks: "0 Critical / 2 Monitored",
    architectureLink: "/architecture#fintech-fraud-monitoring",
    teamSize: "12 Engineers",
  },
  {
    id: "fintech-customer-360",
    name: "Mastered Customer 360 & Retention Analytics",
    category: "Data Platforms",
    lead: "Dwaipayan Rajguru (Technical Director)",
    stage: "Phase 4: Operationalised",
    status: "Completed",
    statusColor: "blue",
    progress: 100,
    budget: "$1.8M",
    timeline: "Delivered",
    milestone: "Enterprise CRM & MarTech Sync Live",
    risks: "Closed",
    architectureLink: "/architecture#fintech-customer-360",
    teamSize: "9 Engineers",
  },
  {
    id: "fintech-payment-reconciliation",
    name: "Automated Payment Reconciliation & Controls",
    category: "Governance & Finance",
    lead: "Dwaipayan Rajguru (Programme Lead)",
    stage: "Phase 2: Exception Triage Workflow",
    status: "Attention",
    statusColor: "amber",
    progress: 65,
    budget: "$1.5M",
    timeline: "Q3 - Q2 (+1)",
    milestone: "Multi-currency settlement engine in testing",
    risks: "1 Open / Partner API Latency",
    architectureLink: "/architecture#fintech-payment-reconciliation",
    teamSize: "8 Engineers",
  },
  {
    id: "fintech-data-observability",
    name: "Data Observability & Control Tower",
    category: "DevOps & SRE",
    lead: "Dwaipayan Rajguru (Lead Architect)",
    stage: "Phase 3: Automated Remediation",
    status: "On Track",
    statusColor: "emerald",
    progress: 85,
    budget: "$1.1M",
    timeline: "Q2 - Q4",
    milestone: "Anomaly detection alerts integrated with PagerDuty",
    risks: "0 Critical",
    architectureLink: "/architecture#fintech-data-observability",
    teamSize: "7 Engineers",
  },
];

const raidItems = [
  {
    type: "Risk",
    id: "RSK-104",
    title: "Downstream core banking ledger sync latency under peak batch load",
    severity: "Medium",
    mitigation: "Partitioned queuing with SQS FIFO and backpressure buffers implemented.",
    owner: "Architecture Lead",
    status: "Mitigated",
  },
  {
    type: "Dependency",
    id: "DEP-082",
    title: "Partner payment gateway settlement API v2 deprecation",
    severity: "High",
    mitigation: "Dual-adapter ingestion layer built to swallow breaking schema changes.",
    owner: "Integration Lead",
    status: "Active",
  },
  {
    type: "Action",
    id: "ACT-215",
    title: "Formal sign-off on SOX compliance evidence and audit trails",
    severity: "Low",
    mitigation: "Automated tamper-evident audit logs landed in S3 Object Lock.",
    owner: "Compliance Officer",
    status: "Closed",
  },
];

export default function ProjectManagementDashboardPage() {
  return (
    <>
      <PageHero
        eyebrow="Project Management"
        title="ADRITASH PM Toolkit"
        description="AI-assisted tools for project and programme delivery, plus a sample portfolio view of milestone health and governance."
      />

      {/* PM Toolkit: tool grid */}
      <Section background="white">
        <SectionHeader
          eyebrow="ADRITASH PM Toolkit"
          title="AI tools for delivery teams"
          description="Practical project-management tools built on the same engine as the RAID Generator. One is live today; the rest are on the roadmap."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pmTools.map((tool) => (
            <article
              key={tool.slug}
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all ${
                tool.status === "live"
                  ? "border-gold/50 bg-surface-elevated hover:shadow-md"
                  : "border-border bg-surface-elevated/60"
              }`}
            >
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    tool.status === "live"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400"
                      : "bg-surface text-muted"
                  }`}
                >
                  {pmStatusLabel[tool.status]}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{tool.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{tool.summary}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-foreground/80">
                  {tool.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="font-bold text-gold-ink" aria-hidden="true">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                {tool.status === "live" ? (
                  <Button href={tool.href} className="w-full">
                    Open {tool.name} →
                  </Button>
                ) : (
                  <p className="text-xs font-medium text-muted">On the roadmap</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Sample portfolio KPIs */}
      <Section background="surface" className="py-8 sm:py-12">
        <p
          role="note"
          className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-medium text-foreground"
        >
          <strong>Illustrative sample data.</strong> The portfolio figures, programmes and RAID
          entries below are an example of what this dashboard shows. They are not live or
          client-reported numbers. The RAID Generator is a working tool.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portfolioKpis.map((kpi) => (
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
                {kpi.change}
              </p>
            </div>
          ))}
        </div>
      </Section>


      {/* Program Portfolio Table / Cards */}
      <Section background="white">
        <SectionHeader
          eyebrow="Sample Portfolio"
          title="Transformation Portfolio Health (Sample)"
          description="Example execution status across cloud migration, AI transformation, and FinTech initiatives."
        />

        <div className="space-y-6">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md sm:p-7"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold-ink">
                      {prog.category}
                    </span>
                    <span className="text-muted/40">•</span>
                    <span className="text-xs text-muted">{prog.lead}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {prog.name}
                  </h3>
                  <p className="text-sm text-muted">
                    <span className="font-medium text-foreground">Next Milestone:</span>{" "}
                    {prog.milestone}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      prog.status === "On Track"
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30"
                        : prog.status === "Completed"
                        ? "bg-blue-500/15 text-blue-800 dark:text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {prog.status}
                  </span>

                  <Button href={prog.architectureLink} variant="secondary" size="sm">
                    View Architecture →
                  </Button>
                </div>
              </div>

              {/* Progress & Metadata Bar */}
              <div className="mt-6 border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
                  <span>{prog.stage}</span>
                  <span className="font-semibold text-foreground">{prog.progress}% Complete</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${prog.progress}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-muted">Budget:</span>{" "}
                    <span className="font-semibold text-foreground">{prog.budget}</span>
                  </div>
                  <div>
                    <span className="text-muted">Timeline:</span>{" "}
                    <span className="font-semibold text-foreground">{prog.timeline}</span>
                  </div>
                  <div>
                    <span className="text-muted">Team:</span>{" "}
                    <span className="font-semibold text-foreground">{prog.teamSize}</span>
                  </div>
                  <div>
                    <span className="text-muted">Risks:</span>{" "}
                    <span className="font-semibold text-foreground">{prog.risks}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* RAID Log & Governance */}
      <Section background="surface">
        <SectionHeader
          eyebrow="Governance & Risk Matrix"
          title="RAID Log Oversight"
          description="Sample extract of active risk triaging and architectural mitigation protocols applied across programmes."
        />

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3.5">Type & ID</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Severity</th>
                <th className="px-5 py-3.5">Mitigation & Action</th>
                <th className="px-5 py-3.5">Owner</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {raidItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-foreground">
                    <span className="rounded bg-brand/10 px-2 py-0.5 text-xs text-brand">
                      {item.type}
                    </span>{" "}
                    <span className="text-xs text-muted">{item.id}</span>
                  </td>
                  <td className="max-w-xs px-5 py-4 font-medium text-foreground">
                    {item.title}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                        item.severity === "High"
                          ? "bg-rose-500/15 text-rose-800 dark:text-rose-400"
                          : item.severity === "Medium"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-400"
                          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-4 text-xs leading-relaxed text-muted">
                    {item.mitigation}
                  </td>
                  <td className="px-5 py-4 text-xs text-muted">{item.owner}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-foreground">
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/dashboards/project-management/raid-generator"
            className="inline-flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/5 px-5 py-2.5 text-xs font-bold text-brand hover:bg-brand/10 transition-colors"
          >
            <span>Launch Full Interactive RAID Generator &amp; 5×5 Matrix</span>
            <span>→</span>
          </Link>
        </div>
      </Section>

      {/* Action Strip */}
      <section className="border-t border-border bg-surface-dark py-14">
        <Container className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Need technical programme leadership?
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Available for interim architecture advisory, PMO governance, and high-stakes migrations.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button href="/contact" variant="inverse">
              Schedule Discussion
            </Button>
            <Button href="/projects" variant="ghost" className="border-white/40 text-white hover:border-white">
              View Case Studies
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
