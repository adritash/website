import Link from "next/link";
import PageHero from "@/components/sections/PageHero";

const experience = [
  {
    role: "Senior Project Manager / Application Architect",
    company: "SS&C Technologies Ltd",
    location: "Pune",
    period: "2018 – Present",
    highlights: [
      "Directed large-scale FinTech transformation programmes and cloud modernisation initiatives",
      "Migrated 15+ enterprise applications to AWS, GCP, and private cloud — reducing costs by ~25%",
      "Established DR and business continuity achieving 99.9% uptime for mission-critical platforms",
      "Implemented automation improving operational efficiency by 30–40%",
      "Led cross-functional teams of 10–20 engineers, architects, and vendor partners",
    ],
  },
  {
    role: "Team Leader",
    company: "Accenture",
    location: "Pune",
    period: "2017 – 2018",
    highlights: [
      "Led application support and delivery teams for enterprise clients",
      "Managed requirements, release planning, and stakeholder communication",
      "Worked on PeopleSoft Financials, Workday Finance, Jira, Asana, and Qualys",
    ],
  },
  {
    role: "Senior Support Consultant",
    company: "Cognizant Technology Solutions",
    location: "Pune",
    period: "2014 – 2017",
    highlights: [
      "Delivered enterprise production support and migrations for global clients",
      "Improved system performance and ensured business continuity",
    ],
  },
  {
    role: "Application Administrator / DBA & Implementation Consultant",
    company: "Hexaware Technologies",
    location: "Navi Mumbai",
    period: "2011 – 2014",
    highlights: [
      "Implemented PeopleSoft HCM, FSCM & CS solutions for enterprise and university clients",
      "Led upgrades, database refreshes, automation, and operational support",
    ],
  },
];

const certifications = [
  { name: "Project Management, AI Essentials, Prompting Essentials", issuer: "Google" },
  { name: "Data Analysis", issuer: "SP Jain Institute of Management" },
  { name: "Introduction to Internet of Things", issuer: "IIT Bombay" },
  { name: "Organizations of the Future", issuer: "IIM Ahmedabad" },
  { name: "PeopleSoft Application Developer", issuer: "Oracle" },
];

const pillars = [
  { name: "Architecture First", body: "Good technology outcomes start with clear thinking about structure. I invest heavily in architecture because it determines what is possible downstream." },
  { name: "Business Outcomes Over Outputs", body: "Delivered software and completed migrations are outputs. I measure success by the business outcomes they unlock — speed, resilience, cost, capability." },
  { name: "Honest Counsel", body: "I tell clients what I believe is true, including when the answer is hard. Advisory relationships only create value when they are built on trust." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About"
        subtitle="15+ years building, migrating, and modernising enterprise technology across FinTech, cloud, and AI."
      />

      {/* Bio */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Who I am</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Dwaipayan Rajguru</h2>
            <div className="space-y-5 text-slate-600 leading-relaxed">
              <p>
                I&apos;m an independent technology consultant based in <strong className="text-slate-900">Pune, India</strong> with 15+ years of experience delivering enterprise-scale IT programmes, digital transformation, and cloud modernisation across FinTech and regulated industries.
              </p>
              <p>
                My background spans enterprise architecture, cloud migration (AWS, GCP, Azure), AI implementation (RAG, LangGraph, MCP), and infrastructure automation — always with a focus on business outcomes rather than technical outputs.
              </p>
              <p>
                I hold an <strong className="text-slate-900">MBA in FinTech</strong> alongside a BE in Engineering, giving me the commercial and technical depth to work effectively with both executive stakeholders and engineering teams.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Work with me
              </Link>
              <a
                href="https://www.linkedin.com/in/dwaipayanrajguru/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:border-slate-500 transition-colors"
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
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:border-slate-500 transition-colors"
              >
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Credly Badges
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { stat: "15+", label: "Years Experience" },
              { stat: "15+", label: "Enterprise Apps Migrated" },
              { stat: "~25%", label: "Avg. Cost Reduction" },
              { stat: "99.9%", label: "Uptime Delivered" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                <p className="text-4xl font-bold text-indigo-600">{item.stat}</p>
                <p className="mt-2 text-sm font-medium text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Experience</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Work history</h2>
          <div className="space-y-0">
            {experience.map((job, i) => (
              <div key={job.company} className="relative flex gap-8 pb-12 last:pb-0">
                {/* Timeline line */}
                {i < experience.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-px bg-slate-200" />
                )}
                <div className="shrink-0 mt-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white ring-1 ring-indigo-200" />
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-7">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{job.role}</h3>
                      <p className="text-indigo-600 font-medium text-sm">{job.company} · {job.location}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full shrink-0">
                      {job.period}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {job.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">How I work</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">My principles</h2>
            <div className="space-y-8">
              {pillars.map((p) => (
                <div key={p.name} className="border-l-2 border-indigo-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{p.name}</h3>
                  <p className="text-slate-600 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education + Certifications */}
          <div className="space-y-10">
            <div>
              <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Education</p>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-7 space-y-4">
                <div>
                  <p className="font-semibold text-slate-900">MBA — FinTech</p>
                  <p className="text-sm text-slate-500 mt-0.5">Specialisation in Financial Technology</p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="font-semibold text-slate-900">BE — Electronics &amp; Communication Engineering</p>
                  <p className="text-sm text-slate-500 mt-0.5">Nagpur University · 2010</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">Certifications</p>
                <a
                  href="https://www.credly.com/users/dwaipayan_rajguru/badges/credly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View all on Credly →
                </a>
              </div>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.name} className="flex items-start gap-3 bg-slate-50 rounded-xl border border-slate-200 px-5 py-4">
                    <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cert.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{cert.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <h2 className="text-2xl font-bold text-white">Ready to work together?</h2>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center px-6 py-3 text-sm font-semibold text-indigo-700 bg-white rounded-lg hover:bg-slate-100 transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
