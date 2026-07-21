import Link from "next/link";
import PageHero from "@/components/sections/PageHero";

const practices = [
  {
    pillar: "Consulting",
    focus: "Architecture",
    services: [
      { name: "Enterprise Architecture Assessment", description: "Current-state analysis across applications, data, and infrastructure. Delivered as a documented landscape with gap analysis and prioritised recommendations." },
      { name: "Technology Roadmap Planning", description: "A phased, business-aligned plan for modernisation investments. Sequenced by impact, risk, and dependency." },
      { name: "Digital Transformation Strategy", description: "Programme-level strategy from business case to governance model, covering change management and delivery approach." },
      { name: "Architecture Governance", description: "Review processes, principles, and tooling to keep architecture decisions consistent as organisations scale." },
    ],
  },
  {
    pillar: "AI Solutions",
    focus: "Automation",
    services: [
      { name: "AI Strategy & Readiness Assessment", description: "Identifying automation opportunities, evaluating data maturity, and defining a sequenced AI roadmap tied to business value." },
      { name: "Process Automation", description: "End-to-end automation of high-volume workflows using RPA, orchestration platforms, and custom integrations." },
      { name: "LLM & Generative AI Integration", description: "Embedding large language models into internal tools, customer experiences, and knowledge management workflows." },
      { name: "Intelligent Document Processing", description: "Automated extraction, classification, validation, and routing of unstructured documents at enterprise volume." },
    ],
  },
  {
    pillar: "Cloud Services",
    focus: "Modernization",
    services: [
      { name: "Cloud Migration", description: "Strategy, planning, and execution across lift-and-shift, re-platform, and re-architect patterns on AWS, Azure, and GCP." },
      { name: "Infrastructure Modernisation", description: "Replacing legacy on-premise infrastructure with cloud-native, resilient, and observable equivalents." },
      { name: "DevOps & Platform Engineering", description: "CI/CD pipelines, internal developer platforms, and infrastructure-as-code frameworks that accelerate engineering teams." },
      { name: "FinOps & Cloud Cost Optimisation", description: "Rightsizing, reserved capacity planning, tagging governance, and tooling to bring cloud spend under control." },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Services"
        subtitle="Delivery-level services across our three enterprise technology practices."
      />
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-20">
          {practices.map((practice, i) => (
            <div key={practice.pillar}>
              <div className="flex items-baseline gap-4 mb-10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  0{i + 1}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{practice.pillar}</h2>
                  <p className="text-indigo-500 text-sm font-medium">{practice.focus}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {practice.services.map((s) => (
                  <div key={s.name} className="border border-slate-200 rounded-2xl p-7">
                    <h3 className="text-base font-semibold text-slate-900 mb-3">{s.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-16 bg-indigo-50 rounded-2xl p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-slate-800 font-medium max-w-lg">
            Not sure which service fits your situation? Let&apos;s start with a
            conversation about your goals.
          </p>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Talk to us
          </Link>
        </div>
      </section>
    </>
  );
}
