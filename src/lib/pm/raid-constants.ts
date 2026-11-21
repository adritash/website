import {
  ImpactScore,
  ProbabilityScore,
  ProjectContext,
  ProjectPhase,
  ProjectType,
  RaidCategory,
  RaidRecord,
  RaidStatus,
  RiskLevel,
} from "./raid-types";

export const PROJECT_TYPES: readonly ProjectType[] = [
  "Cloud Migration",
  "Application Development",
  "AI / Automation",
  "Data Platform",
  "ERP Implementation",
  "Infrastructure Modernization",
  "Cybersecurity",
  "Digital Transformation",
  "Other",
] as const;

export const PROJECT_PHASES: readonly ProjectPhase[] = [
  "Initiation",
  "Planning",
  "Execution",
  "Monitoring and Controlling",
  "Closure",
] as const;

export const CATEGORY_STATUSES: Record<RaidCategory, readonly RaidStatus[]> = {
  Risk: [
    "Identified",
    "Under Assessment",
    "Mitigation in Progress",
    "Accepted",
    "Closed",
  ],
  Assumption: ["Unvalidated", "Validated", "Rejected", "Closed"],
  Issue: ["Open", "In Progress", "Resolved", "Closed"],
  Dependency: ["Not Started", "In Progress", "Blocked", "Completed"],
};

export const PROBABILITY_DESCRIPTIONS: Record<ProbabilityScore, { label: string; range: string }> = {
  1: { label: "Rare", range: "< 10%" },
  2: { label: "Unlikely", range: "10% – 30%" },
  3: { label: "Possible", range: "30% – 60%" },
  4: { label: "Likely", range: "60% – 85%" },
  5: { label: "Almost Certain", range: "> 85%" },
};

export const IMPACT_DESCRIPTIONS: Record<ImpactScore, { label: string; desc: string }> = {
  1: { label: "Negligible", desc: "Minimal timeline/cost effect (<2%)" },
  2: { label: "Minor", desc: "Manageable deviation, no milestone slip" },
  3: { label: "Moderate", desc: "Sprint slip, reallocation needed" },
  4: { label: "Major", desc: "Key milestone threatened, budget impact" },
  5: { label: "Severe", desc: "Catastrophic, production outage / breach" },
};

export function calculateRiskScore(
  probability: ProbabilityScore,
  impact: ImpactScore
): { score: number; level: RiskLevel } {
  const score = probability * impact;
  let level: RiskLevel = "Low";

  if (score >= 16) {
    level = "Critical";
  } else if (score >= 10) {
    level = "High";
  } else if (score >= 5) {
    level = "Moderate";
  } else {
    level = "Low";
  }

  return { score, level };
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, {
  bg: string;
  text: string;
  border: string;
  solidBg: string;
  glow: string;
}> = {
  Low: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    solidBg: "bg-emerald-600",
    glow: "shadow-emerald-500/20",
  },
  Moderate: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    solidBg: "bg-amber-600",
    glow: "shadow-amber-500/20",
  },
  High: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    solidBg: "bg-orange-600",
    glow: "shadow-orange-500/20",
  },
  Critical: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    solidBg: "bg-rose-600",
    glow: "shadow-rose-500/20",
  },
};

export const CATEGORY_BADGES: Record<RaidCategory, {
  code: string;
  bg: string;
  text: string;
  border: string;
}> = {
  Risk: {
    code: "RSK",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  Assumption: {
    code: "ASM",
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  Issue: {
    code: "ISS",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Dependency: {
    code: "DEP",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
};

export const SAMPLE_PROJECT_CONTEXT: ProjectContext = {
  projectName: "Global Core Banking Cloud Migration & Modernization",
  projectDescription:
    "End-to-end migration of legacy mainframe core ledger systems to AWS microservices and Aurora PostgreSQL. The program spans multi-region active-active transaction processing, real-time Kafka event streams, and rigorous PCI-DSS and SOX compliance boundaries across 14 enterprise micro-services.",
  projectType: "Cloud Migration",
  projectObjective:
    "Decouple monolithic core ledger, reduce batch settlement latency from 4 hours to < 90 seconds, and eliminate single points of failure across global payments infrastructure by Q4.",
  projectPhase: "Execution",
  projectManager: "Sarah Jenkins, PMP",
  projectSponsor: "Chief Information Officer, Global Payments",
  businessUnit: "Enterprise Financial Infrastructure",
  startDate: "2026-03-01",
  targetCompletionDate: "2026-11-30",
  stakeholders:
    "VP Enterprise Architecture, Lead Payments Architect, InfoSec Director, Head of Regulatory Compliance, 3rd Party Payment Gateways",
  technologyStack:
    "AWS EKS, Aurora PostgreSQL, Apache Kafka, Terraform, Docker, Java Spring Boot, Datadog",
  keyDeliverables:
    "Phase 1: Shadow ledger replication; Phase 2: Dual-run transaction verification; Phase 3: Traffic cutover and mainframe decommission.",
  knownChallenges:
    "Stringent regulatory reporting windows; zero data loss SLA (RPO=0, RTO<5m); legacy batch ledger undocumented business rules.",
  projectConstraints:
    "Strict regulatory audit in October; max budget envelope capped at $4.2M; change-freeze window over Black Friday.",
  additionalContext:
    "External clearinghouse APIs have intermittent 300ms latency spikes during peak Asian trading hours.",
};

export interface ProjectStarterTemplate {
  id: string;
  name: string;
  categoryBadge: string;
  icon: string;
  description: string;
  context: ProjectContext;
}

export const PROJECT_STARTER_TEMPLATES: ProjectStarterTemplate[] = [
  {
    id: "fintech-cloud",
    name: "Core Banking Migration",
    categoryBadge: "Enterprise FinTech",
    icon: "🏦",
    description: "Mainframe decoupling to AWS Aurora & Kafka with zero data-loss RPO",
    context: SAMPLE_PROJECT_CONTEXT,
  },
  {
    id: "mobile-app",
    name: "Mobile Banking App Launch",
    categoryBadge: "Consumer Mobile",
    icon: "📱",
    description: "Native iOS/Android biometric banking app with instant P2P payments",
    context: {
      projectName: "Next-Gen Mobile Banking & Biometric App",
      projectDescription:
        "Designing and developing native iOS and Android banking apps to replace legacy customer web views. Features include FaceID/biometric login, push notifications, real-time transaction tracking, and instant peer-to-peer payments via FedNow.",
      projectType: "Application Development",
      projectObjective:
        "Deliver intuitive, secure mobile banking apps with sub-second balance refresh, 99.99% uptime, and zero security vulnerabilities by Q4.",
      projectPhase: "Planning",
      projectManager: "David Chen, Senior PM",
      projectSponsor: "Head of Digital Channels",
      businessUnit: "Consumer Banking Experience",
      startDate: "2026-04-01",
      targetCompletionDate: "2026-12-15",
      stakeholders:
        "UX/UI Design Leads, Mobile Engineers, InfoSec, App Store Compliance Team, Core Banking API Team",
      technologyStack:
        "React Native, Swift, Kotlin, Node.js GraphQL Gateway, AWS DynamoDB, Firebase Cloud Messaging",
      keyDeliverables:
        "Design System, Biometric Security Audit, Beta TestFlight Rollout, Public App Store & Google Play Release",
      knownChallenges:
        "App Store approval cycles, Android device fragmentation, and legacy backend API latency",
      projectConstraints:
        "Hard launch deadline before the holiday freeze; strict compliance with WCAG 2.1 AA accessibility",
      additionalContext:
        "Biometric tokens must be stored in hardware Secure Enclave / KeyStore only.",
    },
  },
  {
    id: "ecommerce-replatform",
    name: "E-Commerce Replatforming",
    categoryBadge: "Retail & Omnichannel",
    icon: "🛍️",
    description: "Migrating from legacy Magento to Shopify Plus & headless Next.js frontend",
    context: {
      projectName: "Omnichannel Headless E-Commerce Replatforming",
      projectDescription:
        "Migrating an aging on-premise Magento store to Shopify Plus with a custom Next.js storefront. Integrates real-time inventory synchronization across 85 retail locations, warehouse 3PL systems, and SAP S/4HANA ERP.",
      projectType: "Digital Transformation",
      projectObjective:
        "Cut mobile site load time under 1.2s, handle 5,000 orders/minute on Black Friday with zero downtime, and lift checkout conversion by 18%.",
      projectPhase: "Execution",
      projectManager: "Elena Rostova",
      projectSponsor: "VP of Global Digital Commerce",
      businessUnit: "Direct-to-Consumer & Retail Ops",
      startDate: "2026-02-15",
      targetCompletionDate: "2026-10-31",
      stakeholders:
        "Store Operations, Logistics, Digital Marketing, Payment Gateway Providers, SAP Technical Lead",
      technologyStack:
        "Next.js, Shopify Plus Storefront API, Algolia Search, Stripe, SAP S/4HANA, Vercel",
      keyDeliverables:
        "Product Catalog Migration, Headless Frontend, SAP Inventory Connector, Payment Gateway Cutover",
      knownChallenges:
        "Complex legacy B2B customer tier discounts in SAP; reconciling catalog data across 50,000 SKUs",
      projectConstraints:
        "Must achieve final launch before October 31 to avoid Q4 peak retail freeze window",
      additionalContext:
        "Warehouse 3PL logistics provider operates on legacy SOAP XML webhooks with 15-minute polling intervals.",
    },
  },
  {
    id: "ai-copilot",
    name: "Customer Support AI Copilot",
    categoryBadge: "AI & Automation",
    icon: "🤖",
    description: "Autonomous customer triage & resolution copilot powered by Gemini",
    context: {
      projectName: "Enterprise Customer Support AI Copilot & Automated Triage",
      projectDescription:
        "Deploying an enterprise AI copilot built on Google Gemini 3.8 Flash to ingest incoming customer tickets, verify warranty entitlements, summarize case histories, and autonomously resolve tier-1 queries with human agent oversight.",
      projectType: "AI / Automation",
      projectObjective:
        "Safely automate resolution of 45% of incoming tier-1 tickets, reduce average first-response time from 4 hours to 30 seconds, and maintain 95%+ CSAT satisfaction.",
      projectPhase: "Initiation",
      projectManager: "Marcus Vance",
      projectSponsor: "Chief Customer Experience Officer",
      businessUnit: "Global Support & Customer Success",
      startDate: "2026-05-01",
      targetCompletionDate: "2026-11-15",
      stakeholders:
        "Customer Support Leads, AI Ethics & Legal Counsel, InfoSec Director, Zendesk Administrators",
      technologyStack:
        "Google Gemini 3.8 Flash, Pinecone Vector DB, Python FastAPI, Zendesk REST API, GCP Cloud Run",
      keyDeliverables:
        "RAG Document Retrieval Pipeline, Zendesk App Plugin, Hallucination Benchmark Suite, Agent Dashboard",
      knownChallenges:
        "Strict PII redacting in free-text tickets, prompt injection prevention, tone calibration across languages",
      projectConstraints:
        "Full GDPR / CCPA compliance; customer support data must never be used to train foundation models",
      additionalContext:
        "120 global support agents need onboarding and confidence scoring training prior to phase 2 cutover.",
    },
  },
];

export const INITIAL_SAMPLE_RECORDS: RaidRecord[] = [
  {
    id: "RSK-001",
    category: "Risk",
    title: "Downstream Core Ledger Sync Latency Under Peak Batch Load",
    description:
      "Legacy synchronous CDC pipeline may exceed the 90-second SLA during end-of-day settlement surges, causing downstream reporting delays.",
    cause:
      "Legacy batch queue architecture lacks dynamic horizontal backpressure partitioning.",
    impactDescription:
      "Could trigger regulatory audit notifications and delay multi-currency merchant settlements.",
    probability: 4,
    impact: 4,
    severity: "High",
    riskScore: 16,
    priority: "Critical",
    owner: "Core Platform Lead",
    suggestedOwnerRole: "Lead Platform Architect",
    mitigation:
      "Implement partitioned Apache Kafka FIFO queues with reactive rate-limiting and auto-scaling consumer pods.",
    contingencyPlan:
      "Failover to asynchronous write-behind staging cache with secondary reconciler.",
    actionItems: [
      "Benchmark Kafka consumer throughput at 50,000 TPS",
      "Deploy dead-letter queue circuit breakers in staging",
    ],
    dueDate: "2026-09-15",
    status: "Mitigation in Progress",
    confidence: "High",
    requiresValidation: false,
    validationNotes:
      "Architecture reviewed and approved during Sprint 12 Tech Review.",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-10T14:30:00Z",
  },
  {
    id: "ASM-001",
    category: "Assumption",
    title: "Clearinghouse Sandbox Accurately Reflects Production Latency",
    description:
      "Team assumes the 3rd-party sandbox gateway mirrors production throughput, throttling limits, and TLS mutual handshake overhead.",
    cause:
      "Vendor documentation indicates sandbox parity with production endpoints.",
    impactDescription:
      "If sandbox differs from production, cutover load tests will yield false positives.",
    probability: 3,
    impact: 3,
    severity: "Moderate",
    riskScore: 9,
    priority: "Medium",
    owner: "Integration Architect",
    suggestedOwnerRole: "Third-Party Integration Lead",
    mitigation:
      "Request certified load test telemetry logs from clearinghouse vendor and run synthetic probe tests on isolated staging endpoints.",
    contingencyPlan:
      "Establish direct bilateral VPN interconnect prior to final cutover.",
    actionItems: [
      "Send vendor validation questionnaire to Clearinghouse Tech Lead",
      "Capture packet latency distributions over 72-hour burn-in period",
    ],
    dueDate: "2026-08-30",
    status: "Unvalidated",
    confidence: "Medium",
    requiresValidation: true,
    validationNotes:
      "Pending written confirmation from clearinghouse compliance officer.",
    createdAt: "2026-08-02T11:15:00Z",
    updatedAt: "2026-08-02T11:15:00Z",
  },
  {
    id: "ISS-001",
    category: "Issue",
    title: "Staging Aurora PostgreSQL Replica Lag Exceeding 120 Seconds",
    description:
      "During replay of historical batch files, cross-region read replicas in EU-West-1 are falling out of sync with primary US-East-1 instance.",
    cause:
      "High volume of unindexed mass-update transactions during bulk customer onboarding simulation.",
    impactDescription:
      "Read-heavy microservices serving customer balance lookups are returning stale balances.",
    probability: 5,
    impact: 4,
    severity: "Critical",
    riskScore: 20,
    priority: "Critical",
    owner: "Principal DBA",
    suggestedOwnerRole: "Database Administrator / SRE",
    mitigation:
      "Refactor bulk batch scripts to chunk updates in 5,000-row transactional windows and tune Aurora replica sync buffer sizes.",
    contingencyPlan:
      "Direct balance inquiries to primary writer instance during large scale batch executions.",
    actionItems: [
      "Apply composite indexing on transaction_id + settlement_date",
      "Benchmark replica lag under synthetic 2x volume test",
    ],
    dueDate: "2026-08-25",
    status: "In Progress",
    confidence: "High",
    requiresValidation: false,
    validationNotes: "Active P1 ticket #DB-4409 assigned to SRE strike team.",
    createdAt: "2026-08-05T08:20:00Z",
    updatedAt: "2026-08-12T09:45:00Z",
  },
  {
    id: "DEP-001",
    category: "Dependency",
    title: "Infosec Sign-off on HSM Cloud Key Management Hierarchy",
    description:
      "Production deployment is gated on formal Infosec and Risk committee sign-off of AWS CloudHSM multi-tier key ceremony.",
    cause:
      "PCI-DSS 4.0 Requirement 3.5 mandates dual-control custodian verification.",
    impactDescription:
      "Production cutover scheduled for Q4 cannot proceed without verified HSM attestation.",
    probability: 2,
    impact: 5,
    severity: "High",
    riskScore: 10,
    priority: "High",
    owner: "InfoSec Liaison",
    suggestedOwnerRole: "Chief Information Security Officer / Compliance Lead",
    mitigation:
      "Schedule key ceremony rehearsal with custodians 3 weeks before formal sign-off deadline.",
    contingencyPlan:
      "Utilize existing on-premise Thales Luna HSM with Direct Connect gateway as temporary bridge.",
    actionItems: [
      "Finalize key custodian appointment roster",
      "Complete dry-run audit walk-through with external QSA auditor",
    ],
    dueDate: "2026-09-30",
    status: "In Progress",
    confidence: "High",
    requiresValidation: false,
    validationNotes:
      "Audit dry-run scheduled for August 28th with PwC QSA team.",
    createdAt: "2026-08-01T14:00:00Z",
    updatedAt: "2026-08-08T16:00:00Z",
  },
];
