export type LinkedInPost = {
  id: string;
  publishedAt: string;
  author: string;
  content: string;
  url: string;
  tags: string[];
  metrics?: {
    reactions?: number;
    comments?: number;
  };
};

export const adritashLinkedInPosts: LinkedInPost[] = [
  {
    id: "post-1",
    publishedAt: "Recent Update",
    author: "ADRITASH",
    content:
      "Modern enterprise architectures cannot be designed in silos. As organisations scale their cloud footprints and experiment with generative AI and agentic systems, the boundary between infrastructure, data mesh, and security must be unified through clear architectural governance.",
    url: "https://www.linkedin.com/company/adritash",
    tags: ["EnterpriseArchitecture", "CloudModernization", "AIStrategy"],
    metrics: {
      reactions: 48,
      comments: 12,
    },
  },
  {
    id: "post-2",
    publishedAt: "Latest Perspective",
    author: "ADRITASH",
    content:
      "Why do so many legacy core platform modernisations stall in Phase 2? It is rarely the choice of cloud provider (AWS vs GCP vs Azure). The real blockers are integration contracts, data reconciliation gates, and stakeholder change fatigue. Here is how we structure phased cutovers that de-risk the journey.",
    url: "https://www.linkedin.com/company/adritash",
    tags: ["FinTech", "CloudMigration", "ProgramLeadership"],
    metrics: {
      reactions: 62,
      comments: 17,
    },
  },
  {
    id: "post-3",
    publishedAt: "Company Briefing",
    author: "ADRITASH",
    content:
      "Architecting intelligence: Integrating LLMs and Model Context Protocol (MCP) into high-throughput enterprise pipelines requires auditability by design. Every agentic decision, tool call, and state mutation must leave a tamper-evident audit trail.",
    url: "https://www.linkedin.com/company/adritash",
    tags: ["AgenticAI", "Governance", "EnterpriseTech"],
    metrics: {
      reactions: 55,
      comments: 14,
    },
  },
];
