import Link from "next/link";
import PageHero from "@/components/sections/PageHero";

const projects = [
  {
    title: "Enterprise Application Modernisation & Cloud Transformation",
    industry: "FinTech / Financial Services",
    tags: ["Enterprise Architecture", "Cloud Migration", "AWS", "GCP", "Azure"],
    stats: [
      { value: "15+", label: "Applications migrated" },
      { value: "~25%", label: "Cost reduction" },
      { value: "99.9%", label: "Uptime achieved" },
    ],
    what: [
      "Designed end-to-end cloud migration strategy and target architecture",
      "Cloud architecture planning across AWS, GCP, and private cloud",
      "Application dependency mapping and infrastructure assessment",
      "Disaster recovery and high availability design",
      "Production cutover, cost optimisation, and stakeholder management",
    ],
    tech: ["AWS", "GCP", "Azure", "VMware", "Linux", "Windows Server", "SQL Server", "PostgreSQL", "Docker", "GitHub"],
    outcome: "Migrated 15+ enterprise applications from legacy infrastructure to cloud-native environments, reducing infrastructure costs by ~25% while achieving 99.9% uptime for mission-critical financial systems.",
  },
  {
    title: "AI-Powered Enterprise Knowledge & Automation Platform",
    industry: "Enterprise / Cross-sector",
    tags: ["AI Architecture", "RAG", "LangGraph", "Generative AI"],
    stats: [
      { value: "RAG", label: "Retrieval-Augmented Generation" },
      { value: "Multi", label: "Agent workflows" },
      { value: "Enterprise", label: "Knowledge graph" },
    ],
    what: [
      "Designed AI-powered enterprise assistant for documentation and runbooks",
      "Implemented RAG pipeline with semantic search and vector embeddings",
      "Built multi-agent workflows using LangGraph and MCP",
      "Integrated AI chat, intelligent troubleshooting, and code generation",
      "Deployed on enterprise infrastructure with FastAPI and Next.js frontend",
    ],
    tech: ["LangGraph", "MCP", "Vector DB", "Qdrant", "FastAPI", "Python", "PostgreSQL", "Docker", "Next.js"],
    outcome: "Reduced engineering effort through automated knowledge retrieval, faster onboarding, reduced dependency on SMEs, and significantly faster incident resolution — all grounded in enterprise documentation.",
  },
  {
    title: "Enterprise Infrastructure Automation & Operations Platform",
    industry: "Enterprise IT Operations",
    tags: ["Infrastructure Automation", "Linux Engineering", "Systems Integration"],
    stats: [
      { value: "30–40%", label: "Efficiency improvement" },
      { value: "Multi-OS", label: "Linux · AIX · Windows" },
      { value: "Full", label: "SAM & compliance" },
    ],
    what: [
      "Designed and implemented enterprise automation for infrastructure operations",
      "Linux, AIX, and Windows administration automation using Python, Bash, and PowerShell",
      "Active Directory, Samba, LDAP, Kerberos, NFS, and CIFS integration",
      "Software asset management with Flexera — licence optimisation and compliance",
      "Monitoring, logging, and CI/CD pipeline implementation",
    ],
    tech: ["Python", "Bash", "PowerShell", "Flexera", "BigFix", "Active Directory", "Samba", "LDAP", "GitHub", "CI/CD"],
    outcome: "Eliminated repetitive manual administration tasks, standardised enterprise operations, improved infrastructure reliability, and delivered full software compliance visibility across heterogeneous environments.",
  },
];

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        title="Projects"
        subtitle="A selection of enterprise technology programmes and their outcomes."
      />
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-600 max-w-2xl text-lg leading-relaxed mb-16">
            Each engagement is different. These examples illustrate the kinds of problems
            I work on and the outcomes that matter to my clients.
          </p>

          <div className="space-y-12">
            {projects.map((p, i) => (
              <div key={p.title} className="border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-8 py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
                      {p.industry}
                    </p>
                    <h3 className="text-xl font-semibold text-slate-900">{p.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {p.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-slate-200 shrink-0 hidden sm:block">0{i + 1}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 border-b border-slate-200">
                  {p.stats.map((s) => (
                    <div key={s.label} className="px-6 py-5 text-center border-r border-slate-200 last:border-0">
                      <p className="text-xl font-bold text-indigo-600">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* What I did */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">What I did</p>
                    <ul className="space-y-2">
                      {p.what.map((w) => (
                        <li key={w} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Outcome + tech */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Outcome</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{p.outcome}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {p.tech.map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-md bg-indigo-50 text-xs font-medium text-indigo-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-indigo-50 rounded-2xl p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="text-slate-800 font-medium max-w-lg">
              Want to discuss a similar programme or a challenge in your organisation?
            </p>
            <Link
              href="/contact"
              className="shrink-0 inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Work with me
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
