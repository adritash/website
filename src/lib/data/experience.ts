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
    id: "ssc",
    role: "Senior Project Manager / Application Architect",
    company: "SS&C Technologies Ltd",
    location: "Pune",
    period: "2018 – Present",
    impact: "15+ apps migrated · ~25% cost reduction · 99.9% uptime",
    highlights: [
      "Directed large-scale FinTech transformation programmes and cloud modernisation initiatives",
      "Migrated 15+ enterprise applications to AWS, GCP, and private cloud",
      "Established DR and business continuity achieving 99.9% uptime for mission-critical platforms",
      "Implemented automation improving operational efficiency by 30–40%",
      "Led cross-functional teams of 10–20 engineers, architects, and vendor partners",
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
      "Led application support and delivery teams for enterprise clients",
      "Managed requirements, release planning, and stakeholder communication",
      "Worked on PeopleSoft Financials, Workday Finance, Jira, Asana, and Qualys",
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
      "Delivered enterprise production support and migrations for global clients",
      "Improved system performance and ensured business continuity",
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
      "Implemented PeopleSoft HCM, FSCM & CS solutions for enterprise and university clients",
      "Led upgrades, database refreshes, automation, and operational support",
    ],
  },
];
