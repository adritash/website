import {
  InsightArticle,
  createInsightMetadata,
} from "@/components/sections/InsightArticle";

export const metadata = createInsightMetadata({
  title: "Enterprise Architecture in the Age of AI",
  description:
    "How AI is changing the assumptions that enterprise architects have held for decades — and what it means for technology strategy.",
  slug: "enterprise-architecture-in-the-age-of-ai",
});

export default function EnterpriseArchitectureArticle() {
  return (
    <InsightArticle
      title="Enterprise Architecture in the Age of AI"
      description="How AI is changing the assumptions that enterprise architects have held for decades — and what it means for technology strategy."
      date="June 2025"
      tag="Architecture"
    >
      <p>
        Enterprise architecture has always been about making deliberate choices —
        which systems to integrate, which standards to enforce, which capabilities
        to build versus buy. AI introduces a new layer of complexity: systems that
        learn, adapt, and generate outputs that are probabilistic rather than
        deterministic.
      </p>
      <h2>What changes for architects</h2>
      <p>
        Traditional architecture assumes predictable system behaviour. AI systems
        require architects to think about data pipelines, model governance, prompt
        management, and human-in-the-loop workflows as first-class architectural
        concerns — not afterthoughts bolted onto existing platforms.
      </p>
      <h2>Practical implications</h2>
      <ul>
        <li>Data architecture becomes the foundation for every AI initiative</li>
        <li>Integration patterns must account for non-deterministic outputs</li>
        <li>Governance frameworks need to cover model lifecycle, not just software lifecycle</li>
        <li>Security models must address prompt injection, data leakage, and model access</li>
      </ul>
      <p>
        The organisations that will succeed are those that treat AI as an
        architectural capability — not a feature to be added to individual
        applications in isolation.
      </p>
    </InsightArticle>
  );
}
