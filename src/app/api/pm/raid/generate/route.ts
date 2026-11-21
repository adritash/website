import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/ai/gemini";
import { GEMINI_MODEL } from "@/lib/ai/config";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  calculateRiskScore,
  CATEGORY_STATUSES,
} from "@/lib/pm/raid-constants";
import {
  GenerateRaidRequest,
  ImpactScore,
  ProbabilityScore,
  RaidCategory,
  RaidRecord,
  RaidStatus,
} from "@/lib/pm/raid-types";

const PM_RATE_LIMIT_WINDOW_MS = 60_000;
const PM_RATE_LIMIT_MAX_REQUESTS = 12;

interface RawAIAssessmentItem {
  id?: string;
  category: RaidCategory;
  title: string;
  description: string;
  cause: string;
  impactDescription?: string;
  probability: number;
  impact: number;
  priority?: "Low" | "Medium" | "High" | "Critical";
  suggestedOwnerRole: string;
  owner?: string;
  mitigation: string;
  contingencyPlan: string;
  actionItems: string[];
  dueDate?: string;
  status?: string;
  confidence?: "High" | "Medium" | "Low";
  requiresValidation?: boolean;
  validationNotes?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous-pm";

    const rateLimit = await applyRateLimit({
      key: `pm-raid-gen:${ip}`,
      limit: PM_RATE_LIMIT_MAX_REQUESTS,
      windowMs: PM_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds} seconds before generating more RAID items.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    // 2. Validate Request Body
    const body: GenerateRaidRequest = await req.json();
    const { projectContext, categoryFilter = "all", recordCount = 10, depth = "Standard" } = body;

    if (!projectContext) {
      return NextResponse.json(
        { success: false, error: "Project context is required." },
        { status: 400 }
      );
    }

    const {
      projectName,
      projectDescription,
      projectType,
      projectObjective,
      projectPhase,
      projectManager,
      projectSponsor,
      businessUnit,
      startDate,
      targetCompletionDate,
      stakeholders,
      technologyStack,
      keyDeliverables,
      knownChallenges,
      projectConstraints,
      additionalContext,
    } = projectContext;

    if (!projectName?.trim() || !projectDescription?.trim() || !projectObjective?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Project Name, Description, and Objective are mandatory required fields.",
        },
        { status: 400 }
      );
    }

    // 3. Build Prompt for Gemini
    const gemini = getGeminiClient();

    const categoryInstruction =
      categoryFilter === "all"
        ? `Generate an evenly distributed portfolio across all 4 categories:
- Risks (R)
- Assumptions (A)
- Issues (I)
- Dependencies (D)
Target total records: ${recordCount} items.`
        : `Generate exclusively items for the "${categoryFilter}" category.
Target total records: ${recordCount} items.`;

    const depthInstruction =
      depth === "Detailed"
        ? `Provide deep architectural and delivery rigor. Include exhaustive technical causes, specific multi-step mitigation actions, concrete fallback/contingency paths, and precise validation checkpoints.`
        : `Provide concise, high-impact executive and engineering-level RAID records focusing on the most critical operational and delivery threats.`;

    const systemPrompt = `You are an elite Principal Enterprise Program Director, Certified Enterprise Risk Manager (PMI-RMP, PMP, TOGAF), and Delivery Partner at ADRITASH.
Your mandate is to perform deep technical and organizational risk triage, identifying high-fidelity, actionable Risks, Assumptions, Issues, and Dependencies (RAID) based strictly on the provided enterprise project context.

Strict Rules:
1. DISTINGUISH CATEGORIES RIGOROUSLY:
   - "Risk": An uncertain event or condition that, if it occurs, has a negative effect on project objectives (future uncertainty).
   - "Assumption": A factor in the planning process considered to be true, real, or certain without empirical proof or demonstration (unvalidated belief).
   - "Issue": A current, active problem or obstacle already affecting project execution, budget, timeline, or quality (present reality).
   - "Dependency": A reliance on an external team, system, deliverable, vendor, or regulatory approval outside direct team control (external coupling).

2. GROUNDING & NO HALLUCINATIONS:
   - Ground every item directly in the provided project description, technology stack, constraints, and known challenges.
   - Do NOT invent specific unconfirmed calendar dates or personal employee names. Suggest standard enterprise roles (e.g., "Lead Cloud Architect", "CISO Delegate", "Core Banking Integration Lead", "Data Governance Officer").
   - Explicitly flag items requiring stakeholder validation with "requiresValidation: true" and provide specific "validationNotes".

3. NUMERICAL 5x5 SCORING:
   - "probability": Integer 1 to 5 (1=Rare <10%, 2=Unlikely 10-30%, 3=Possible 30-60%, 4=Likely 60-85%, 5=Almost Certain >85%).
   - "impact": Integer 1 to 5 (1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Severe/Catastrophic).

4. RESPONSE FORMAT:
   - You MUST respond with ONLY a valid, parseable JSON object matching this exact schema:
{
  "summary": "2-3 sentence executive synthesis of the overall risk posture and primary delivery threats.",
  "items": [
    {
      "category": "Risk" | "Assumption" | "Issue" | "Dependency",
      "title": "Clear, concise imperative or descriptive title",
      "description": "Comprehensive explanation of what might happen or what has occurred",
      "cause": "Underlying root cause, architectural friction, or organizational vulnerability",
      "impactDescription": "Quantifiable or operational fallout if unmitigated",
      "probability": 1 | 2 | 3 | 4 | 5,
      "impact": 1 | 2 | 3 | 4 | 5,
      "priority": "Low" | "Medium" | "High" | "Critical",
      "suggestedOwnerRole": "Specific enterprise organizational role",
      "owner": "Role or unassigned",
      "mitigation": "Concrete proactive mitigation or response plan",
      "contingencyPlan": "Secondary fallback protocol if mitigation fails or risk materializes",
      "actionItems": ["Specific step 1", "Specific step 2"],
      "dueDate": "Recommended timeframe relative to milestone or phase (e.g., 'Prior to Sprint 4 Cutover')",
      "status": "Identified" | "Unvalidated" | "Open" | "Not Started",
      "confidence": "High" | "Medium" | "Low",
      "requiresValidation": true | false,
      "validationNotes": "Concrete advice on what evidence or stakeholder signoff is needed"
    }
  ]
}
Do NOT include markdown formatting wrappers, conversational preamble, or explanations outside the JSON object.`;

    const userPrompt = `PROJECT CONTEXT:
- Project Name: ${projectName}
- Type: ${projectType}
- Phase: ${projectPhase}
- Objective: ${projectObjective}
- Description: ${projectDescription}
${projectManager ? `- Project Manager: ${projectManager}` : ""}
${projectSponsor ? `- Sponsor: ${projectSponsor}` : ""}
${businessUnit ? `- Business Unit: ${businessUnit}` : ""}
${startDate ? `- Start Date: ${startDate}` : ""}
${targetCompletionDate ? `- Target Completion: ${targetCompletionDate}` : ""}
${stakeholders ? `- Key Stakeholders: ${stakeholders}` : ""}
${technologyStack ? `- Tech Stack: ${technologyStack}` : ""}
${keyDeliverables ? `- Key Deliverables: ${keyDeliverables}` : ""}
${knownChallenges ? `- Known Challenges: ${knownChallenges}` : ""}
${projectConstraints ? `- Constraints: ${projectConstraints}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

GENERATION DIRECTIVE:
${categoryInstruction}
${depthInstruction}

Generate structured JSON now:`;

    // 4. Call Gemini
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "";
    if (!responseText.trim()) {
      throw new Error("Received empty response from AI engine.");
    }

    // 5. Defensively Parse JSON
    let parsed: { summary?: string; items?: RawAIAssessmentItem[] };
    try {
      const sanitized = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(sanitized);
    } catch {
      console.error("Failed to parse Gemini JSON output:", responseText);
      throw new Error("Failed to parse structured RAID records from AI response.");
    }

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    if (rawItems.length === 0) {
      throw new Error("AI did not produce any valid RAID records for this context.");
    }

    // 6. Post-Process & Validate Records Deterministically
    const now = new Date().toISOString();
    const counters: Record<RaidCategory, number> = {
      Risk: 1,
      Assumption: 1,
      Issue: 1,
      Dependency: 1,
    };

    const validatedRecords: RaidRecord[] = rawItems.map((item, index) => {
      const category: RaidCategory =
        item.category === "Risk" ||
        item.category === "Assumption" ||
        item.category === "Issue" ||
        item.category === "Dependency"
          ? item.category
          : "Risk";

      // Prefix codes: RSK-001, ASM-001, ISS-001, DEP-001
      const codeMap: Record<RaidCategory, string> = {
        Risk: "RSK",
        Assumption: "ASM",
        Issue: "ISS",
        Dependency: "DEP",
      };
      const count = counters[category]++;
      const recordId = `${codeMap[category]}-${String(count).padStart(3, "0")}`;

      // Probability & Impact clamped 1-5
      const rawProb = Number(item.probability);
      const rawImp = Number(item.impact);
      const probability: ProbabilityScore = (
        isNaN(rawProb) || rawProb < 1 ? 3 : rawProb > 5 ? 5 : Math.round(rawProb)
      ) as ProbabilityScore;
      const impact: ImpactScore = (
        isNaN(rawImp) || rawImp < 1 ? 3 : rawImp > 5 ? 5 : Math.round(rawImp)
      ) as ImpactScore;

      // Deterministic risk scoring
      const { score: riskScore, level: riskLevel } = calculateRiskScore(
        probability,
        impact
      );

      // Default status mapping
      const validStatuses = CATEGORY_STATUSES[category];
      const status: RaidStatus =
        item.status && validStatuses.includes(item.status as RaidStatus)
          ? (item.status as RaidStatus)
          : validStatuses[0];

      // Priority mapping
      const priority =
        item.priority && ["Low", "Medium", "High", "Critical"].includes(item.priority)
          ? item.priority
          : riskLevel === "Critical"
          ? "Critical"
          : riskLevel === "High"
          ? "High"
          : riskLevel === "Moderate"
          ? "Medium"
          : "Low";

      return {
        id: recordId,
        projectId: projectName,
        category,
        title: item.title?.trim() || `Untitled ${category} ${index + 1}`,
        description: item.description?.trim() || "",
        cause: item.cause?.trim() || "Identified during project context analysis.",
        impactDescription: item.impactDescription?.trim() || "",
        probability,
        impact,
        severity: riskLevel,
        riskScore,
        priority,
        owner: item.owner?.trim() || item.suggestedOwnerRole?.trim() || "Unassigned",
        suggestedOwnerRole: item.suggestedOwnerRole?.trim() || "Project Lead",
        mitigation:
          item.mitigation?.trim() ||
          "Establish dedicated monitoring and review at weekly governance checkpoint.",
        contingencyPlan:
          item.contingencyPlan?.trim() ||
          "Escalate to steering committee for resource reallocation.",
        actionItems:
          Array.isArray(item.actionItems) && item.actionItems.length > 0
            ? item.actionItems.map((a) => String(a).trim()).filter(Boolean)
            : ["Assign technical owner and establish review cadence"],
        dueDate: item.dueDate?.trim() || "Pending Review",
        status,
        confidence:
          item.confidence === "High" || item.confidence === "Low" ? item.confidence : "Medium",
        requiresValidation: Boolean(item.requiresValidation),
        validationNotes:
          item.validationNotes?.trim() ||
          (item.requiresValidation
            ? "Requires review and sign-off by designated project lead."
            : ""),
        createdAt: now,
        updatedAt: now,
      };
    });

    return NextResponse.json({
      success: true,
      records: validatedRecords,
      summary:
        parsed.summary ||
        `Identified ${validatedRecords.length} structured RAID records across the ${projectName} initiative.`,
    });
  } catch (error: unknown) {
    console.error("RAID Generation API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected server error occurred.";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate RAID register: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
