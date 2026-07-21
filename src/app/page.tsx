import Link from "next/link";

const pillars = [
  {
    label: "Consulting",
    focus: "Architecture",
    href: "/solutions#consulting",
    description:
      "Enterprise architecture assessments, technology roadmaps, and digital transformation strategy that aligns IT with business outcomes.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3h16.5M3.75 3H2.25M20.25 3h1.5M9 3v13.5M15 3v13.5M3.75 20.25h16.5" />
      </svg>
    ),
  },
  {
    label: "AI Solutions",
    focus: "Automation",
    href: "/solutions#ai",
    description:
      "AI strategy, process automation, and intelligent systems that remove friction and create competitive advantage at enterprise scale.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
  },
  {
    label: "Cloud Services",
    focus: "Modernization",
    href: "/solutions#cloud",
    description:
      "Cloud migration, infrastructure modernization, and platform engineering to move enterprises from legacy systems to scalable, resilient architectures.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
];

const insights = [
  { label: "Blog", href: "/insights#blog", description: "Perspectives on enterprise technology and modern engineering." },
  { label: "Case Studies", href: "/insights#case-studies", description: "Real-world transformation outcomes across industries." },
  { label: "White Papers", href: "/insights#white-papers", description: "In-depth research on architecture patterns and cloud strategy." },
  { label: "Resources", href: "/insights#resources", description: "Frameworks, templates, and guides for enterprise teams." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-slate-900 min-h-[88vh] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full py-24">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-6">
            Enterprise Technology
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl">
            Enterprise Architecture.{" "}
            <span className="text-indigo-400">Modern Engineering.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Helping organizations modernize enterprise technology through
            architecture, cloud, and AI.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/solutions"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Explore Solutions
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold text-slate-300 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-white transition-colors"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">
              What We Do
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Three pillars of enterprise modernization
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="group border border-slate-200 rounded-2xl p-8 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {p.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
                    {p.focus}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {p.label}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge & Insights */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">
              Knowledge &amp; Insights
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Thinking on enterprise technology
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {insights.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {item.label}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-indigo-600 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xl sm:text-2xl font-semibold text-white max-w-xl">
            Ready to modernize your enterprise technology?
          </p>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center px-6 py-3 text-sm font-semibold text-indigo-700 bg-white rounded-lg hover:bg-slate-100 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
