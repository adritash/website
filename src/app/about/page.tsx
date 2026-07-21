import Link from "next/link";
import PageHero from "@/components/sections/PageHero";

const pillars = [
  { name: "Architecture First", body: "Good technology outcomes start with clear thinking about structure. We invest heavily in architecture because it determines what is possible downstream." },
  { name: "Business Outcomes Over Outputs", body: "Delivered software and completed migrations are outputs. We measure success by the business outcomes they unlock — speed, resilience, cost, capability." },
  { name: "Honest Counsel", body: "We tell clients what we believe is true, including when the answer is hard. Advisory relationships only create value when they are built on trust." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About"
        subtitle="Enterprise Architecture. Modern Engineering. A consultancy built to help organisations modernise technology without losing themselves in complexity."
      />

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Mission</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Helping organisations modernise enterprise technology through architecture, cloud, and AI.
            </h2>
            <div className="space-y-5 text-slate-600 leading-relaxed">
              <p>
                Adritash was founded by <strong className="text-slate-900">Dwaipayan Rajguru</strong> with
                a single focus: helping large organisations make better technology decisions and
                execute them well.
              </p>
              <p>
                Too many enterprise technology programmes fail not because of a lack of effort or
                budget, but because of a lack of architectural clarity. Systems accumulate. Integrations
                multiply. What began as pragmatic decisions becomes technical debt that constrains
                everything the organisation wants to do next.
              </p>
              <p>
                We work alongside engineering leaders, CTOs, and transformation teams to bring
                structure to that complexity — and to build the foundations that make long-term
                modernisation possible.
              </p>
            </div>
          </div>

          {/* Principles */}
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Principles</p>
            <div className="space-y-8">
              {pillars.map((p) => (
                <div key={p.name} className="border-l-2 border-indigo-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{p.name}</h3>
                  <p className="text-slate-600 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Founder</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Dwaipayan Rajguru</h2>
              <div className="space-y-5 text-slate-600 leading-relaxed">
                <p>
                  Dwaipayan is an enterprise technologist and architect with experience spanning
                  consulting, architecture, cloud strategy, and AI implementation across financial
                  services, healthcare, and the public sector.
                </p>
                <p>
                  His work sits at the intersection of technical depth and business context —
                  translating complex technology decisions into clear outcomes for executive
                  stakeholders, and turning business strategy into executable technology programmes
                  for engineering teams.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Work with us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
