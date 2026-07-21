import PageHero from "@/components/sections/PageHero";

const industries = [
  {
    name: "Financial Services",
    description:
      "Core banking modernisation, regulatory compliance architecture, cloud migration for financial data, and AI-driven risk and fraud detection systems.",
  },
  {
    name: "Healthcare & Life Sciences",
    description:
      "Clinical workflow automation, health data platform architecture, HIPAA-compliant cloud infrastructure, and AI applications in diagnostics and operations.",
  },
  {
    name: "Manufacturing & Supply Chain",
    description:
      "Legacy ERP modernisation, IoT data platform design, supply chain visibility systems, and predictive maintenance automation.",
  },
  {
    name: "Government & Public Sector",
    description:
      "Secure cloud migration, digital service transformation, enterprise architecture for large departments, and automation of citizen-facing processes.",
  },
  {
    name: "Telecommunications",
    description:
      "Network infrastructure modernisation, BSS/OSS transformation, cloud-native platform engineering, and AI for network operations.",
  },
  {
    name: "Energy & Utilities",
    description:
      "OT/IT convergence architecture, smart grid data platforms, cloud migration for asset management systems, and operational AI.",
  },
];

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        title="Industries"
        subtitle="Deep domain context across the sectors where enterprise technology transformation matters most."
      />
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-600 max-w-2xl text-lg leading-relaxed mb-16">
            Enterprise modernisation is never purely technical. Understanding
            the regulatory environment, operational constraints, and competitive
            pressures of an industry changes what good architecture looks like.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden">
            {industries.map((ind) => (
              <div key={ind.name} className="bg-white p-8 hover:bg-slate-50 transition-colors">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{ind.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{ind.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
