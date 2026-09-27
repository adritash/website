export type Project = {
  id: string;
  title: string;
  industry: string;
  problem: string;
  solution: string;
  impact: string;
  tags: string[];
  tech: string[];
  referenceHref?: string;
};

export const projects: Project[] = [
  {
    id: "fintech-data-modernization",
    title: "FinTech Data Platform Modernisation",
    industry: "FinTech / Financial Services",
    problem: "Finance and operations relied on fragmented extracts and manual reconciliation for payments, invoices, and customer reporting.",
    solution: "Led a cross-functional data-modernisation workstream, coordinating engineers, platform administrators, finance stewards, and business owners around a governed Bronze/Silver/Gold platform and release controls.",
    impact: "Established a scalable foundation for trusted collections, receivables, and customer analytics with a clear cloud migration roadmap.",
    tags: ["Data Transformation", "Programme Delivery", "Data Governance"],
    tech: ["AWS", "S3", "Snowflake", "dbt", "Airflow", "CI/CD"],
    referenceHref: "/architecture#fintech-data-modernization",
  },
  {
    id: "fintech-fraud-monitoring",
    title: "FinTech Fraud Monitoring & Risk Operations",
    industry: "FinTech / Risk & Compliance",
    problem: "Risk teams needed a faster, explainable way to prioritise suspicious payment activity and manage analyst investigation.",
    solution: "Led delivery across risk operations, compliance, data engineering, and platform operations; defined event-to-alert controls, severity scoring, ownership, and the real-time target architecture.",
    impact: "Created an explainable fraud-control foundation with measurable rule effectiveness and a path to seconds-level alerting.",
    tags: ["Risk Data Product", "Real-time Architecture", "Fraud Operations"],
    tech: ["AWS", "Kinesis", "Lambda", "DynamoDB", "EventBridge"],
    referenceHref: "/architecture#fintech-fraud-monitoring",
  },
  {
    id: "fintech-customer-360",
    title: "FinTech Customer 360 & Retention Analytics",
    industry: "FinTech / Customer Data",
    problem: "CRM, product, payment, and support teams worked from inconsistent customer views, limiting retention actioning.",
    solution: "Led the Customer 360 workstream, aligning source owners and the engineering team around mastered identity, conformed metrics, privacy controls, and customer-health outputs.",
    impact: "Enabled a trusted customer-level view for prioritising high-value relationships and service-risk interventions.",
    tags: ["Customer 360", "Data Product", "Retention Analytics"],
    tech: ["GCP", "Pub/Sub", "BigQuery", "dbt", "Looker"],
    referenceHref: "/architecture#fintech-customer-360",
  },
  {
    id: "fintech-payment-reconciliation",
    title: "FinTech Payment Reconciliation & Controls",
    industry: "FinTech / Finance Controls",
    problem: "Manual matching of ledger records and processor settlements delayed close and obscured financial exceptions.",
    solution: "Led a finance-control workstream with engineers, payments operations, and controllers to define transaction-level matching, break ownership, sign-off, and audit evidence.",
    impact: "Created a traceable reconciliation model that makes exceptions visible, prioritised, and accountable.",
    tags: ["Reconciliation", "Financial Controls", "Auditability"],
    tech: ["AWS", "S3", "Step Functions", "Aurora", "QuickSight"],
    referenceHref: "/architecture#fintech-payment-reconciliation",
  },
  {
    id: "fintech-data-observability",
    title: "FinTech Data Observability Control Tower",
    industry: "FinTech / Data Operations",
    problem: "Critical data products lacked shared visibility of freshness, volume, quality, and SLA performance.",
    solution: "Led data-reliability delivery with engineers, administrators, and business data owners; established health classifications, incident routing, runbooks, and reliability governance.",
    impact: "Turned data reliability into a measurable service-level commitment with early visibility of operational risk.",
    tags: ["Data Observability", "SLA Management", "Data Quality"],
    tech: ["GCP", "Cloud Composer", "BigQuery", "Pub/Sub", "Cloud Monitoring"],
    referenceHref: "/architecture#fintech-data-observability",
  },
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
