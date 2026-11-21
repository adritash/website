export type RaidCategory = "Risk" | "Assumption" | "Issue" | "Dependency";

export type RiskStatus =
  | "Identified"
  | "Under Assessment"
  | "Mitigation in Progress"
  | "Accepted"
  | "Closed";

export type AssumptionStatus =
  | "Unvalidated"
  | "Validated"
  | "Rejected"
  | "Closed";

export type IssueStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type DependencyStatus =
  | "Not Started"
  | "In Progress"
  | "Blocked"
  | "Completed";

export type RaidStatus =
  | RiskStatus
  | AssumptionStatus
  | IssueStatus
  | DependencyStatus;

export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type ProbabilityScore = 1 | 2 | 3 | 4 | 5;
export type ImpactScore = 1 | 2 | 3 | 4 | 5;

export type ProjectType =
  | "Application Development"
  | "Cloud Migration"
  | "ERP Implementation"
  | "Infrastructure Modernization"
  | "AI / Automation"
  | "Cybersecurity"
  | "Data Platform"
  | "Digital Transformation"
  | "Other";

export type ProjectPhase =
  | "Initiation"
  | "Planning"
  | "Execution"
  | "Monitoring and Controlling"
  | "Closure";

export type GenerationDepth = "Standard" | "Detailed";

export interface ProjectContext {
  id?: string;
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  projectObjective: string;
  projectPhase: ProjectPhase;
  // Optional fields
  projectManager?: string;
  projectSponsor?: string;
  businessUnit?: string;
  startDate?: string;
  targetCompletionDate?: string;
  stakeholders?: string;
  technologyStack?: string;
  keyDeliverables?: string;
  knownChallenges?: string;
  projectConstraints?: string;
  additionalContext?: string;
}

export interface RaidRecord {
  id: string;
  projectId?: string;
  category: RaidCategory;
  title: string;
  description: string;
  cause: string;
  impactDescription?: string;
  probability: ProbabilityScore;
  impact: ImpactScore;
  severity: RiskLevel;
  riskScore: number; // probability * impact (1 - 25)
  priority: PriorityLevel;
  owner: string;
  suggestedOwnerRole: string;
  mitigation: string;
  contingencyPlan: string;
  actionItems: string[];
  dueDate: string;
  status: RaidStatus;
  confidence: ConfidenceLevel;
  requiresValidation: boolean;
  validationNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRaidRequest {
  projectContext: ProjectContext;
  categoryFilter?: "all" | RaidCategory;
  recordCount?: 5 | 10 | 15 | 20;
  depth?: GenerationDepth;
}

export interface GenerateRaidResponse {
  success: boolean;
  records: RaidRecord[];
  summary?: string;
  error?: string;
}

export interface RaidFilterState {
  searchQuery: string;
  selectedCategory: "All" | RaidCategory;
  selectedStatus: string;
  selectedPriority: string;
  selectedRiskLevel: string;
  matrixCellFilter: { probability: number; impact: number } | null;
  onlyRequiresValidation: boolean;
}
