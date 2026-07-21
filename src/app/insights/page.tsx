import Link from "next/link";
import PageHero from "@/components/sections/PageHero";

const blog = [
  {
    slug: "enterprise-architecture-in-the-age-of-ai",
    date: "June 2025",
    tag: "Architecture",
    title: "Enterprise Architecture in the Age of AI",
    excerpt:
      "How AI is changing the assumptions that enterprise architects have held for decades — and what it means for technology strategy.",
  },
  {
    slug: "cloud-migration-what-fails",
    date: "May 2025",
    tag: "Cloud",
    title: "Cloud Migration: What Actually Fails",
    excerpt:
      "Most cloud migrations underdeliver not because of technology but because of governance, skill gaps, and unclear ownership. A pattern analysis.",
  },
];

const caseStudies = [
  {
    title: "Core Banking Modernisation for a Regional Bank",
    industry: "Financial Services",
    outcome: "Reduced time-to-deploy for new products from 18 weeks to 3 weeks.",
  },
  {
    title: "AI-Driven Document Processing for a Government Agency",
    industry: "Government",
    outcome: "Automated 84% of manual document classification, freeing 40 FTE hours weekly.",
  },
];

const whitepapers = [
  {
    title: "The Enterprise Cloud Readiness Framework",
    description: "A structured methodology for assessing and sequencing cloud adoption across complex enterprise environments.",
  },
  {
    title: "AI at Scale: From Pilot to Production",
    description: "Why most enterprise AI pilots fail to scale and the architectural patterns that change that outcome.",
  },
];

const resources = [
  { title: "Enterprise Architecture Assessment Template", type: "Template" },
  { title: "Cloud Migration Decision Matrix", type: "Framework" },
  { title: "AI Readiness Scorecard", type: "Tool" },
  { title: "Technology Roadmap Canvas", type: "Template" },
];

export default function InsightsPage() {
  return (
    <>
      <PageHero
        title="Knowledge & Insights"
        subtitle="Thinking, research, and practical resources on enterprise technology modernisation."
      />

      {/* Blog */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Blog</h2>
          <div className="flex flex-col gap-10">
            {blog.map((post) => (
              <article key={post.slug} className="border-b border-slate-200 pb-10 last:border-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {post.tag}
                  </span>
                  <span className="text-sm text-slate-400">{post.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 hover:text-indigo-600 transition-colors">
                  <Link href={`/insights/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-slate-600 leading-relaxed max-w-2xl">{post.excerpt}</p>
                <Link href={`/insights/${post.slug}`} className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="case-studies" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Case Studies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.map((cs) => (
              <div key={cs.title} className="bg-white border border-slate-200 rounded-2xl p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
                  {cs.industry}
                </p>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{cs.title}</h3>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Outcome</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{cs.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White Papers */}
      <section id="white-papers" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">White Papers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whitepapers.map((wp) => (
              <div key={wp.title} className="border-l-4 border-indigo-500 pl-6 py-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{wp.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{wp.description}</p>
                <button className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Download PDF →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section id="resources" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((r) => (
              <div key={r.title} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">{r.type}</span>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900 leading-snug">{r.title}</h3>
                </div>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 text-left">
                  Download →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
