/**
 * Pure analysis for the RAID report. Nothing here modifies records: every value
 * shown in the report is either copied from the register or derived by a rule
 * that is stated in the report itself.
 */
import { ProjectContext, RaidCategory, RaidRecord, RiskLevel } from "@/lib/pm/raid-types";

/** Statuses that mean an item needs no further action (never counted as overdue). */
export const CLOSED_STATUSES = new Set<string>([
  "Closed",
  "Resolved",
  "Completed",
  "Validated",
  "Rejected",
]);

/** Window used for "due soon". */
export const DUE_SOON_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

const SEVERITY_RANK: Record<string, number> = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
const PRIORITY_RANK: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

/** Same banding as calculateRiskScore() in raid-constants. */
export function scoreBand(score: number): RiskLevel {
  if (score >= 16) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Moderate";
  return "Low";
}

/** Parse a strict YYYY-MM-DD calendar date as local midnight; anything else returns null. */
export function parseCalendarDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysFrom(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export type ItemFlag =
  | { kind: "overdue"; days: number }
  | { kind: "dueSoon"; days: number }
  | { kind: "blocked" }
  | { kind: "criticalSeverity" }
  | { kind: "highPriority"; priority: string };

export interface ReviewNote {
  itemId?: string;
  text: string;
}

export interface ItemAnalysis {
  record: RaidRecord;
  isOpen: boolean;
  due: Date | null;
  /** Due date text exists but is not a calendar date (e.g. "Pending Review"). */
  dueIsText: boolean;
  overdueDays: number | null;
  dueInDays: number | null;
  blocked: boolean;
  needsAttention: boolean;
  flags: ItemFlag[];
  reviewNotes: string[];
}

export interface CategorySummary {
  category: RaidCategory;
  items: ItemAnalysis[];
  open: number;
  overdue: number;
}

export type HealthRating = "Red" | "Amber" | "Green";

export interface ReportAnalysis {
  generatedAt: Date;
  items: ItemAnalysis[];
  byCategory: Record<RaidCategory, CategorySummary>;
  health: { rating: HealthRating; reasons: string[] } | null;
  openRisks: ItemAnalysis[];
  criticalRisks: number;
  highRisks: number;
  overdue: ItemAnalysis[];
  itemsWithoutCalendarDue: number;
  openIssues: number;
  criticalPriorityIssues: number;
  blockedDependencies: number;
  dependencies: number;
  attention: ItemAnalysis[];
  highestRisk: ItemAnalysis | null;
  mostUrgentOverdue: ItemAnalysis | null;
  actionItems: ItemAnalysis[];
  target: { date: Date; daysRemaining: number } | null;
  targetText: string | null;
  start: Date | null;
  reviewNotes: ReviewNote[];
}

function bySeverityThenScore(a: ItemAnalysis, b: ItemAnalysis): number {
  return (
    (SEVERITY_RANK[b.record.severity] ?? 0) - (SEVERITY_RANK[a.record.severity] ?? 0) ||
    b.record.riskScore - a.record.riskScore ||
    a.record.id.localeCompare(b.record.id)
  );
}

export function analyseReport(
  ctx: ProjectContext,
  records: RaidRecord[],
  now: Date = new Date()
): ReportAnalysis {
  const today = startOfDay(now);
  const target = parseCalendarDate(ctx.targetCompletionDate);
  const start = parseCalendarDate(ctx.startDate);
  const reviewNotes: ReviewNote[] = [];

  if (ctx.targetCompletionDate?.trim() && !target) {
    reviewNotes.push({ text: `Project target completion date "${ctx.targetCompletionDate}" is not a valid calendar date.` });
  }
  if (ctx.startDate?.trim() && !start) {
    reviewNotes.push({ text: `Project start date "${ctx.startDate}" is not a valid calendar date.` });
  }
  if (start && target && start > target) {
    reviewNotes.push({ text: `Project start date (${formatDate(start)}) is after the target completion date (${formatDate(target)}).` });
  }

  const seenIds = new Map<string, number>();
  records.forEach((r) => seenIds.set(r.id, (seenIds.get(r.id) ?? 0) + 1));

  const items: ItemAnalysis[] = records.map((r) => {
    const isOpen = !CLOSED_STATUSES.has(r.status);
    const due = parseCalendarDate(r.dueDate);
    const dueIsText = Boolean(r.dueDate?.trim()) && !due;
    const diff = due ? daysFrom(today, due) : null;
    const overdueDays = isOpen && diff !== null && diff < 0 ? -diff : null;
    const dueInDays = isOpen && diff !== null && diff >= 0 ? diff : null;
    const blocked = r.status === "Blocked";
    const notes: string[] = [];

    const expected = r.probability * r.impact;
    if (Number.isFinite(expected) && r.riskScore !== expected) {
      notes.push(`Recorded score ${r.riskScore} differs from probability × impact (${r.probability} × ${r.impact} = ${expected}).`);
    } else if (r.category === "Risk" && scoreBand(r.riskScore) !== r.severity) {
      notes.push(`Recorded severity "${r.severity}" differs from the score band for ${r.riskScore} ("${scoreBand(r.riskScore)}").`);
    }
    if (dueIsText && /^\d{4}-\d{1,2}-\d{1,2}$/.test(r.dueDate.trim())) {
      notes.push(`Due date "${r.dueDate}" looks like a date but is not a valid calendar date.`);
    }
    if (due && target && due > target) {
      notes.push(`Due date ${formatDate(due)} is after the project target completion date ${formatDate(target)}.`);
    }
    if (due && start && due < start) {
      notes.push(`Due date ${formatDate(due)} is before the project start date ${formatDate(start)}.`);
    }
    if ((seenIds.get(r.id) ?? 0) > 1) {
      notes.push(`ID ${r.id} is used by more than one item.`);
    }

    const flags: ItemFlag[] = [];
    if (overdueDays !== null) flags.push({ kind: "overdue", days: overdueDays });
    if (dueInDays !== null && dueInDays <= DUE_SOON_DAYS) flags.push({ kind: "dueSoon", days: dueInDays });
    if (isOpen && blocked) flags.push({ kind: "blocked" });
    if (isOpen && r.severity === "Critical") flags.push({ kind: "criticalSeverity" });
    if (isOpen && (r.priority === "Critical" || r.priority === "High")) flags.push({ kind: "highPriority", priority: r.priority });

    const needsAttention =
      isOpen && (r.severity === "Critical" || r.priority === "Critical" || overdueDays !== null || blocked);

    return { record: r, isOpen, due, dueIsText, overdueDays, dueInDays, blocked, needsAttention, flags, reviewNotes: notes };
  });

  items.forEach((it) => it.reviewNotes.forEach((text) => reviewNotes.push({ itemId: it.record.id, text })));

  const cats: RaidCategory[] = ["Risk", "Assumption", "Issue", "Dependency"];
  const byCategory = Object.fromEntries(
    cats.map((c) => {
      const list = items.filter((i) => i.record.category === c);
      return [
        c,
        {
          category: c,
          items: list,
          open: list.filter((i) => i.isOpen).length,
          overdue: list.filter((i) => i.overdueDays !== null).length,
        },
      ];
    })
  ) as Record<RaidCategory, CategorySummary>;

  const openRisks = byCategory.Risk.items.filter((i) => i.isOpen);
  const overdue = items
    .filter((i) => i.overdueDays !== null)
    .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0) || bySeverityThenScore(a, b));
  const attention = items.filter((i) => i.needsAttention).sort(bySeverityThenScore);

  const highestRisk = openRisks.length
    ? [...openRisks].sort((a, b) => b.record.riskScore - a.record.riskScore || bySeverityThenScore(a, b))[0]
    : null;

  // Rule-based RAID health; the rule is printed in the report.
  let health: ReportAnalysis["health"] = null;
  if (items.length) {
    const openCritical = items.filter((i) => i.isOpen && i.record.severity === "Critical").length;
    const overdueSevere = overdue.filter((i) => i.record.severity === "Critical" || i.record.severity === "High").length;
    const openHigh = items.filter((i) => i.isOpen && i.record.severity === "High").length;
    const blockedDeps = byCategory.Dependency.items.filter((i) => i.isOpen && i.blocked).length;
    const reasons: string[] = [];
    let rating: HealthRating = "Green";
    if (openCritical || overdueSevere) {
      rating = "Red";
      if (openCritical) reasons.push(`${openCritical} open critical-severity item${openCritical === 1 ? "" : "s"}`);
      if (overdueSevere) reasons.push(`${overdueSevere} overdue high/critical item${overdueSevere === 1 ? "" : "s"}`);
    } else if (openHigh || overdue.length || blockedDeps) {
      rating = "Amber";
      if (openHigh) reasons.push(`${openHigh} open high-severity item${openHigh === 1 ? "" : "s"}`);
      if (overdue.length) reasons.push(`${overdue.length} overdue item${overdue.length === 1 ? "" : "s"}`);
      if (blockedDeps) reasons.push(`${blockedDeps} blocked dependenc${blockedDeps === 1 ? "y" : "ies"}`);
    } else {
      reasons.push("No open critical or high items, nothing overdue or blocked");
    }
    health = { rating, reasons };
  }

  const actionItems = items
    .filter((i) => i.isOpen && i.flags.length > 0)
    .sort((a, b) => {
      const rank = (x: ItemAnalysis) =>
        x.overdueDays !== null ? 0 : x.blocked ? 1 : x.dueInDays !== null && x.dueInDays <= DUE_SOON_DAYS ? 2 : 3;
      return (
        rank(a) - rank(b) ||
        (b.overdueDays ?? 0) - (a.overdueDays ?? 0) ||
        (a.dueInDays ?? 9999) - (b.dueInDays ?? 9999) ||
        (PRIORITY_RANK[b.record.priority] ?? 0) - (PRIORITY_RANK[a.record.priority] ?? 0) ||
        bySeverityThenScore(a, b)
      );
    });

  return {
    generatedAt: now,
    items,
    byCategory,
    health,
    openRisks,
    criticalRisks: openRisks.filter((i) => i.record.severity === "Critical").length,
    highRisks: openRisks.filter((i) => i.record.severity === "High").length,
    overdue,
    itemsWithoutCalendarDue: items.filter((i) => i.isOpen && !i.due).length,
    openIssues: byCategory.Issue.open,
    criticalPriorityIssues: byCategory.Issue.items.filter((i) => i.isOpen && i.record.priority === "Critical").length,
    blockedDependencies: byCategory.Dependency.items.filter((i) => i.isOpen && i.blocked).length,
    dependencies: byCategory.Dependency.items.length,
    attention,
    highestRisk,
    mostUrgentOverdue: overdue[0] ?? null,
    actionItems,
    target: target ? { date: target, daysRemaining: daysFrom(today, target) } : null,
    targetText: ctx.targetCompletionDate?.trim() || null,
    start,
    reviewNotes,
  };
}
