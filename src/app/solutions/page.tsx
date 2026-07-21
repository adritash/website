import Link from "next/link";
import PageHero from "@/components/sections/PageHero";

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        title="Solutions"
        subtitle="Three integrated practices built for enterprise modernization."
      />

      {/* Consulting / Architecture */}
      <section id="consulting" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Practice 01
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Consulting
                <span className="block text-indigo-500 text-xl font-medium mt-1">Architecture</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Enterprise architecture is the foundation that determines whether technology
                investments compound or cancel each other out. We bring structure to complexity —
                mapping current-state landscapes, identifying gaps, and designing target
                architectures that scale with the business.
              </p>
              <Link href="/contact" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Discuss your architecture →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Enterprise Architecture Assessment", body: "Current-state analysis across applications, data, infrastructure, and integrations." },
                { title: "Technology Roadmap", body: "Multi-year plans that sequence modernization investments by business impact and feasibility." },
                { title: "Digital Transformation Strategy", body: "End-to-end transformation programmes from business case through delivery governance." },
                { title: "Architecture Governance", body: "Frameworks and review boards that keep architecture decisions consistent at scale." },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* AI Solutions / Automation */}
      <section id="ai" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Practice 02
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                AI Solutions
                <span className="block text-indigo-500 text-xl font-medium mt-1">Automation</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                AI delivers enterprise value when it is grounded in real workflows, not
                technology-first experiments. We identify the highest-leverage automation
                opportunities, build the data foundations required, and implement AI systems
                that teams actually use.
              </p>
              <Link href="/contact" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Explore AI opportunities →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "AI Strategy & Readiness", body: "Identifying where AI creates measurable leverage and what data foundations are needed." },
                { title: "Process Automation", body: "End-to-end automation of high-volume, rule-based workflows across business units." },
                { title: "LLM Integration", body: "Embedding large language models into internal tools, products, and knowledge workflows." },
                { title: "Intelligent Document Processing", body: "Automated extraction, classification, and routing of unstructured enterprise documents." },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* Cloud Services / Modernization */}
      <section id="cloud" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Practice 03
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Cloud Services
                <span className="block text-indigo-500 text-xl font-medium mt-1">Modernization</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Legacy infrastructure is a ceiling on what organizations can do with data and
                software. We design and execute cloud migrations and modernization programmes
                that reduce cost, improve reliability, and unlock platform capabilities that
                on-premise stacks cannot provide.
              </p>
              <Link href="/contact" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Plan your migration →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Cloud Migration", body: "Lift-and-shift through re-platform and re-architect strategies matched to business urgency." },
                { title: "Infrastructure Modernization", body: "Replacing brittle on-premise infrastructure with cloud-native, resilient equivalents." },
                { title: "DevOps & Platform Engineering", body: "CI/CD pipelines, internal developer platforms, and infrastructure-as-code at enterprise scale." },
                { title: "FinOps & Cost Optimization", body: "Rightsizing, reserved capacity planning, and governance tooling to control cloud spend." },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
