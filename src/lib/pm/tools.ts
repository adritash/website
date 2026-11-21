export type PmToolStatus = "live" | "beta" | "soon";

export type PmTool = {
  slug: string;
  name: string;
  href: string;
  status: PmToolStatus;
  summary: string;
  bullets: string[];
};

/** Single source of truth for the PM Toolkit: used by the landing page, hub and tool shell. */
export const pmTools: PmTool[] = [
  {
    slug: "raid-generator",
    name: "RAID Generator",
    href: "/dashboards/project-management/raid-generator",
    status: "live",
    summary:
      "Generate, score and manage project Risks, Assumptions, Issues and Dependencies with AI.",
    bullets: ["5×5 risk matrix", "Deterministic scoring", "Excel, CSV and JSON export"],
  },
  {
    slug: "status-report",
    name: "Weekly Status Report",
    href: "/dashboards/project-management",
    status: "soon",
    summary:
      "Turn raw notes or a RAID export into an executive RAG status report with decisions needed.",
    bullets: ["RAG summary", "Top risks and next steps", "Email, Word and PDF export"],
  },
  {
    slug: "meeting-minutes",
    name: "Meeting Minutes to Actions",
    href: "/dashboards/project-management",
    status: "soon",
    summary:
      "Paste a transcript and get decisions, owned actions and new RAID items ready to log.",
    bullets: ["Decisions and actions", "Owners and due dates", "Feeds the RAID register"],
  },
  {
    slug: "health-check",
    name: "Project Health Check",
    href: "/dashboards/project-management",
    status: "soon",
    summary: "A short self-assessment that scores delivery health and suggests next steps.",
    bullets: ["20 questions", "Scored by area", "Shareable result"],
  },
  {
    slug: "charter",
    name: "Project Charter Generator",
    href: "/dashboards/project-management",
    status: "soon",
    summary: "Turn a brief into a charter covering scope, objectives, success criteria and governance.",
    bullets: ["Scope and objectives", "Success criteria", "Governance outline"],
  },
  {
    slug: "stakeholder-map",
    name: "Stakeholder Map and Comms Plan",
    href: "/dashboards/project-management",
    status: "soon",
    summary: "Power and interest grid with a RACI and a communications cadence.",
    bullets: ["Power/interest grid", "RACI", "Comms cadence"],
  },
];

export const pmStatusLabel: Record<PmToolStatus, string> = {
  live: "Live",
  beta: "Beta",
  soon: "Coming soon",
};
