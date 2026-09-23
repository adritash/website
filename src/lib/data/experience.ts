export type ExperienceEntry = {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  impact: string;
  highlights: string[];
};

export const experience: ExperienceEntry[] = [
  {
    id: "ssc-architect",
    role: "Application Architect",
    company: "SS&C Technologies Ltd",
    location: "Pune",
    period: "2021 – Present",
    impact: "15+ apps migrated · 20–30% cost reduction · 99.9%+ availability",
    highlights: [
      "Reduced infrastructure costs 20–30% by leading the migration of 15+ enterprise FinTech applications to AWS, GCP, and private cloud environments.",
      "Achieved 99.9%+ availability for mission-critical financial systems by engineering disaster recovery and business continuity protocols.",
      "Improved operational efficiency 30–40% by implementing PowerShell automation and AI integration frameworks using Gemini/OpenAI APIs.",
      "Optimized enterprise software licensing through Flexera FlexNet and IBM ILMT initiatives, improving usage visibility, cost control, and audit readiness.",
    ],
  },
  {
    id: "ssc-tpm",
    role: "Technical Project Manager",
    company: "SS&C Technologies Ltd",
    location: "Pune",
    period: "2018 – 2021",
    impact: "Multi-million-dollar FinTech programmes · 5–10% vendor savings",
    highlights: [
      "Delivered large-scale digital transformation and FinTech modernization programmes by leading cross-functional engineering pods within multi-million-dollar budgets.",
      "Delivered 5–10% annual vendor savings through commercial negotiations, SLA governance, and enterprise software procurement management.",
      "Led and mentored 15+ engineers and architects, strengthening delivery governance and secure, compliant technology operations.",
    ],
  },
  {
    id: "accenture",
    role: "Team Leader",
    company: "Accenture",
    location: "Pune",
    period: "2017 – 2018",
    impact: "Enterprise delivery across financial platforms",
    highlights: [
      "Directed application support and delivery teams for global enterprise clients, strengthening stakeholder alignment across complex technology environments.",
      "Protected high-volume financial operations by administering PeopleSoft and Workday Finance ecosystems and maintaining high transaction availability.",
      "Reduced incident resolution time by strengthening Qualys-based vulnerability management and coordinating Agile delivery, release planning, and resource workflows.",
    ],
  },
  {
    id: "cognizant",
    role: "Senior Support Consultant",
    company: "Cognizant Technology Solutions",
    location: "Pune",
    period: "2014 – 2017",
    impact: "Global production support and migrations",
    highlights: [
      "Sustained business continuity for international clients through enterprise production support and critical platform migrations.",
      "Improved legacy system stability and performance through database tuning, root-cause analysis, and operational automation.",
    ],
  },
  {
    id: "hexaware",
    role: "Application Administrator / DBA & Implementation Consultant",
    company: "Hexaware Technologies",
    location: "Navi Mumbai",
    period: "2011 – 2014",
    impact: "PeopleSoft implementations for enterprise clients",
    highlights: [
      "Delivered PeopleSoft HCM, FSCM, and CS implementations across complex enterprise client environments.",
      "Strengthened operational scalability through infrastructure upgrades, database refreshes, automation deployments, and production support.",
    ],
  },
];
