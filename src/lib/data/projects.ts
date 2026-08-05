export type Project = {
  id: string;
  title: string;
  industry: string;
  problem: string;
  solution: string;
  impact: string;
  tags: string[];
  tech: string[];
};

export const projects: Project[] = [
  {
    id: "cloud-transformation",
    title: "Enterprise Application Modernisation & Cloud Transformation",
    industry: "FinTech / Financial Services",
    problem:
      "A financial services organisation needed to migrate 15+ legacy enterprise applications from on-premise infrastructure to the cloud without disrupting mission-critical operations.",
    solution:
      "Designed end-to-end cloud migration strategy and target architecture across AWS, GCP, and private cloud. Led application dependency mapping, DR design, production cutover, and cost optimisation.",
    impact:
      "Migrated 15+ applications with ~25% infrastructure cost reduction and 99.9% uptime for mission-critical financial systems.",
    tags: ["Enterprise Architecture", "Cloud Migration", "AWS", "GCP", "Azure"],
    tech: ["AWS", "GCP", "Azure", "VMware", "Linux", "Windows Server", "SQL Server", "PostgreSQL", "Docker", "GitHub"],
  },
  {
    id: "ai-knowledge-platform",
    title: "AI-Powered Enterprise Knowledge & Automation Platform",
    industry: "Enterprise / Cross-sector",
    problem:
      "Engineering teams spent excessive time searching documentation, depending on SMEs, and manually resolving incidents — slowing onboarding and increasing operational risk.",
    solution:
      "Built an AI-powered enterprise assistant with RAG pipeline, semantic search, multi-agent workflows (LangGraph, MCP), and a Next.js frontend on FastAPI infrastructure.",
    impact:
      "Reduced engineering effort through automated knowledge retrieval, faster onboarding, reduced SME dependency, and significantly faster incident resolution.",
    tags: ["AI Architecture", "RAG", "LangGraph", "Generative AI"],
    tech: ["LangGraph", "MCP", "Vector DB", "Qdrant", "FastAPI", "Python", "PostgreSQL", "Docker", "Next.js"],
  },
  {
    id: "infra-automation",
    title: "Enterprise Infrastructure Automation & Operations Platform",
    industry: "Enterprise IT Operations",
    problem:
      "Heterogeneous infrastructure (Linux, AIX, Windows) required repetitive manual administration, lacked standardisation, and had poor software compliance visibility.",
    solution:
      "Designed and implemented enterprise automation using Python, Bash, and PowerShell. Integrated Active Directory, Samba, LDAP, and Flexera SAM for full compliance visibility.",
    impact:
      "30–40% operational efficiency improvement, standardised enterprise operations, and full software compliance visibility across heterogeneous environments.",
    tags: ["Infrastructure Automation", "Linux Engineering", "Systems Integration"],
    tech: ["Python", "Bash", "PowerShell", "Flexera", "BigFix", "Active Directory", "Samba", "LDAP", "GitHub", "CI/CD"],
  },
];
