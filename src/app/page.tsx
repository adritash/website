import Link from "next/link";

/* ─── Credibility items ─── */
const credibility = [
  {
    stat: "15+",
    label: "Years Experience",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    stat: null,
    label: "Enterprise Applications",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    stat: null,
    label: "Cloud Transformation",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
  {
    stat: null,
    label: "FinTech",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    stat: null,
    label: "Application Architecture",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    stat: null,
    label: "AI Solutions",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
  },
];

/* ─── Who we help ─── */
const whoWeHelp = [
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "SaaS Companies",
];

/* ─── Service cards ─── */
const services = [
  {
    title: "Enterprise Architecture",
    description:
      "Design scalable, resilient enterprise systems — from current-state assessments to target-state blueprints and governance frameworks.",
    href: "/services#architecture",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    title: "Cloud Migration",
    description:
      "AWS, Azure, and hybrid cloud modernisation — lift-and-shift through full re-architecture, with DevOps and platform engineering built in.",
    href: "/services#cloud",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
  {
    title: "AI & Automation",
    description:
      "Enterprise AI adoption, process automation, and intelligent workflows — grounded in your data and aligned to real business outcomes.",
    href: "/services#ai",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
  },
];

/* ─── Why Adritash ─── */
const whyUs = [
  {
    title: "Enterprise-First Approach",
    body: "Architecture aligned with business goals — not just technical best practices in isolation.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Technology Agnostic",
    body: "Recommendations based on your needs and constraints, not vendor relationships or tooling preferences.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
      </svg>
    ),
  },
  {
    title: "Delivery Focused",
    body: "From strategy to implementation — I stay engaged through delivery, not just the advisory phase.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

/* ─── Process steps ─── */
const process = [
  { step: "01", title: "Discovery", body: "Understanding your current technology landscape, constraints, and strategic goals." },
  { step: "02", title: "Assessment", body: "Evaluating architecture maturity, gaps, risks, and modernisation opportunities." },
  { step: "03", title: "Architecture & Planning", body: "Designing the target state and a sequenced, business-aligned delivery roadmap." },
  { step: "04", title: "Delivery & Optimisation", body: "Implementing the plan, measuring outcomes, and continuously refining." },
];

export default function Home() {
  return (
    <>
      {/* ── 1. Hero ── */}
      <section className="bg-slate-900 min-h-[90vh] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full py-28">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-8">
            Dwaipayan Rajguru · Independent Technology Consultant
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="block text-white">Enterprise Architecture</span>
            <span className="block text-white mt-2">Cloud Modernization</span>
            <span className="block text-indigo-400 mt-2">AI-Powered Transformation</span>
          </h1>
          <p className="mt-8 text-lg text-slate-400 max-w-2xl leading-relaxed">
            I help organizations modernize critical business applications, migrate to the cloud,
            and deliver enterprise-scale technology solutions — without the overhead of a large consultancy.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Work with Me
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-slate-300 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-white transition-colors"
            >
              View My Work
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Credibility ── */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {credibility.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="text-indigo-600">{item.icon}</div>
                {item.stat && (
                  <p className="text-2xl font-bold text-slate-900">{item.stat}</p>
                )}
                <p className="text-xs font-medium text-slate-600 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Who We Help ── */}
      <section className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">Who I Work With</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            Built for complex, regulated, high-stakes environments.
          </h2>
          <div className="flex flex-wrap gap-3">
            {whoWeHelp.map((industry) => (
              <span
                key={industry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Service Cards ── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">Services</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12">
            What I do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((s) => (
              <div
                key={s.title}
                className="border border-slate-200 rounded-2xl p-8 flex flex-col gap-5 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                </div>
                <Link
                  href={s.href}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Why Adritash ── */}
      <section className="bg-slate-900 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Why work with me?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-14">
            My approach to every engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {whyUs.map((item) => (
              <div key={item.title} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Process ── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">How I Work</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-14">
            From first call to delivered outcome
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {process.map((p, i) => (
              <div key={p.step} className="relative flex flex-col gap-4 pr-8">
                {/* connector line */}
                {i < process.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-1.5rem)] w-8 border-t-2 border-dashed border-indigo-200 z-10" />
                )}
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {p.step}
                  </span>
                  <div className="h-px flex-1 border-t-2 border-dashed border-slate-100 lg:hidden" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Contact CTA ── */}
      <section className="bg-indigo-600 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white max-w-2xl leading-tight">
            Let&apos;s work together
          </h2>
          <p className="text-indigo-100 max-w-xl leading-relaxed">
            Whether you have a defined programme or are just starting to think about modernisation,
            I&apos;m happy to start with a conversation — no sales pitch, just straight talk.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-indigo-700 bg-white rounded-lg hover:bg-slate-100 transition-colors"
            >
              Hire Me
            </Link>
            <div className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white border border-indigo-400 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              drajguru28@gmail.com
            </div>
            <a
              href="https://www.linkedin.com/in/dwaipayanrajguru/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white border border-indigo-400 rounded-lg hover:border-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
            <a
              href="https://www.credly.com/users/dwaipayan_rajguru/badges/credly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white border border-indigo-400 rounded-lg hover:border-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              My Badges
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
