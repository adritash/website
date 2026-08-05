export type SkillCategory = {
  id: string;
  name: string;
  description: string;
  skills: string[];
};

export const skillCategories: SkillCategory[] = [
  {
    id: "architecture",
    name: "Enterprise Architecture",
    description: "Designing scalable, resilient systems aligned to business strategy.",
    skills: [
      "Enterprise Architecture Assessment",
      "Technology Roadmap Planning",
      "Digital Transformation Strategy",
      "Architecture Governance",
      "Application Portfolio Management",
    ],
  },
  {
    id: "cloud",
    name: "Cloud",
    description: "Multi-cloud migration and modernisation across AWS, GCP, and Azure.",
    skills: ["AWS", "GCP", "Azure", "Cloud Migration", "Infrastructure Modernisation", "FinOps", "VMware"],
  },
  {
    id: "ai",
    name: "AI & Automation",
    description: "Enterprise AI adoption grounded in real workflows and business value.",
    skills: ["RAG", "LangGraph", "MCP", "LLM Integration", "Process Automation", "Intelligent Document Processing", "Vector DBs"],
  },
  {
    id: "programming",
    name: "Programming",
    description: "Languages and scripting for automation, integration, and platform engineering.",
    skills: ["Python", "Bash", "PowerShell", "TypeScript", "SQL"],
  },
  {
    id: "databases",
    name: "Databases",
    description: "Relational databases, administration, and data platform design.",
    skills: ["PostgreSQL", "SQL Server", "Oracle", "Database Administration", "Data Migration"],
  },
  {
    id: "devops",
    name: "DevOps & Platform",
    description: "CI/CD, infrastructure-as-code, and internal developer platforms.",
    skills: ["Docker", "GitHub Actions", "CI/CD", "Infrastructure as Code", "Platform Engineering", "Monitoring & Observability"],
  },
  {
    id: "enterprise",
    name: "Enterprise Platforms",
    description: "Large-scale enterprise application ecosystems.",
    skills: ["PeopleSoft", "Workday", "Active Directory", "LDAP", "Flexera", "BigFix"],
  },
  {
    id: "leadership",
    name: "Leadership & Delivery",
    description: "Programme management and cross-functional team leadership.",
    skills: [
      "Programme Management",
      "Stakeholder Management",
      "Vendor Management",
      "Agile Delivery",
      "Team Leadership (10–20 people)",
      "FinTech & Regulated Industries",
    ],
  },
];
