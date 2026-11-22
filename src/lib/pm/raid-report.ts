/**
 * Executive RAID report: builds a self-contained HTML document, paginates it
 * into fixed A4 pages in the browser (so the on-screen preview and the printed
 * PDF are the same pages), and prints it from an iframe.
 *
 * No PDF library is used: the browser's own "Save as PDF" renders the pages.
 */
import { assets, siteConfig } from "@/lib/site";
import { IMPACT_DESCRIPTIONS, PROBABILITY_DESCRIPTIONS } from "@/lib/pm/raid-constants";
import {
  analyseReport,
  DUE_SOON_DAYS,
  formatDate,
  ItemAnalysis,
  ItemFlag,
  ReportAnalysis,
  scoreBand,
} from "@/lib/pm/raid-report-data";
import { ProjectContext, RaidCategory, RaidRecord } from "@/lib/pm/raid-types";

/** Escape text before placing it inside generated HTML (records can come from the AI or user input). */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function raidFileSlug(projectName: string): string {
  return (
    (projectName || "raid-register")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "raid-register"
  );
}

export const REPORT_TITLE = "RAID Register & Risk Report";

export const CLASSIFICATIONS = ["Confidential", "Internal", "Restricted", "None"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export interface ReportOptions {
  /** Data URL (or absolute URL) of the official lockup logo. */
  logoSrc: string;
  classification: Classification;
  now?: Date;
}

const e = escapeHtml;
const NA = `<span class="na">Not available</span>`;

const CATEGORY_META: Record<RaidCategory, { title: string; cls: string }> = {
  Risk: { title: "Risks", cls: "c-risk" },
  Assumption: { title: "Assumptions", cls: "c-asm" },
  Issue: { title: "Issues", cls: "c-iss" },
  Dependency: { title: "Dependencies", cls: "c-dep" },
};

const SEVERITY_ORDER = ["Critical", "High", "Moderate", "Low"] as const;

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function textOrNA(v: string | undefined | null): string {
  return v && String(v).trim() ? e(v) : NA;
}

function para(v: string | undefined | null): string {
  return v && String(v).trim() ? e(v).replace(/\n+/g, "<br>") : NA;
}

function sevBadge(sev: string): string {
  return `<span class="badge sev-${e(String(sev).toLowerCase())}">${e(sev)}</span>`;
}

function statusBadge(it: ItemAnalysis): string {
  const cls = it.blocked ? "st-blocked" : it.isOpen ? "st-open" : "st-closed";
  return `<span class="badge ${cls}">${e(it.record.status)}</span>`;
}

function dueText(it: ItemAnalysis): string {
  const raw = it.record.dueDate;
  if (!raw || !raw.trim()) return NA;
  if (!it.due) return `${e(raw)}<div class="sub">Not a calendar date</div>`;
  return e(formatDate(it.due));
}

function dueBadge(days: number, overdue: boolean): string {
  if (overdue) return `<span class="badge flag-overdue">Overdue ${plural(days, "day")}</span>`;
  return `<span class="badge flag-soon">${days === 0 ? "Due today" : `Due in ${plural(days, "day")}`}</span>`;
}

function timingBadge(it: ItemAnalysis): string {
  if (it.overdueDays !== null) return dueBadge(it.overdueDays, true);
  if (it.dueInDays !== null && it.dueInDays <= DUE_SOON_DAYS) return dueBadge(it.dueInDays, false);
  return "";
}

function flagBadge(f: ItemFlag): string {
  switch (f.kind) {
    case "overdue":
      return dueBadge(f.days, true);
    case "dueSoon":
      return dueBadge(f.days, false);
    case "blocked":
      return `<span class="badge st-blocked">Blocked</span>`;
    case "criticalSeverity":
      return `<span class="badge sev-critical">Critical severity</span>`;
    case "highPriority":
      return `<span class="badge pri">${e(f.priority)} priority</span>`;
  }
}

function ownerText(r: RaidRecord): string {
  const owner = r.owner?.trim();
  const role = r.suggestedOwnerRole?.trim();
  if (!owner && !role) return NA;
  if (!owner) return `${NA}<div class="sub">${e(role)}</div>`;
  return `${e(owner)}${role && role !== owner ? `<div class="sub">${e(role)}</div>` : ""}`;
}

function pxi(r: RaidRecord): string {
  return `${e(r.probability)} × ${e(r.impact)} = <b>${e(r.riskScore)}</b>`;
}

function ref(id: string): string {
  return `<a class="ref" href="#item-${e(id)}">${e(id)}</a>`;
}

// ---------------------------------------------------------------------------
// Blocks. Each top-level `.blk` is placed whole on a page by the paginator.
// data-keep="next" keeps a block on the same page as the block after it.
// data-trow="<id>" marks a table row; the matching header template is repeated
// at the top of every page the table continues on.
// ---------------------------------------------------------------------------

function sectionHead(letter: string, title: string, intro?: string): string {
  return `
  <div class="blk sec-head" data-keep="next">
    <div class="sec-title"><span class="sec-letter">${letter}</span><h2>${e(title)}</h2></div>
    ${intro ? `<p class="sec-intro">${intro}</p>` : ""}
  </div>`;
}

function coverBlocks(ctx: ProjectContext, a: ReportAnalysis, opts: ReportOptions): string {
  let targetVal = NA;
  if (a.target) {
    const d = a.target.daysRemaining;
    const rel = d > 0 ? `${plural(d, "day")} remaining` : d === 0 ? "Due today" : `Passed ${plural(-d, "day")} ago`;
    targetVal = `${e(formatDate(a.target.date))}<div class="sub">${rel}</div>`;
  } else if (a.targetText) {
    targetVal = `${e(a.targetText)}<div class="sub">Not a calendar date</div>`;
  }

  const c = a.byCategory;
  const meta: [string, string][] = [
    ["Project type", textOrNA(ctx.projectType)],
    ["Phase", textOrNA(ctx.projectPhase)],
    ["Project manager", textOrNA(ctx.projectManager)],
    ["Project sponsor", textOrNA(ctx.projectSponsor)],
    ["Business unit", textOrNA(ctx.businessUnit)],
    ["Target completion", targetVal],
    ["Report date", e(formatDate(a.generatedAt))],
    [
      "Register size",
      `${plural(a.items.length, "item")}<div class="sub">${c.Risk.items.length} R · ${c.Assumption.items.length} A · ${c.Issue.items.length} I · ${c.Dependency.items.length} D</div>`,
    ],
  ];

  return `
  <div class="blk cover">
    <div class="cover-band">
      <div class="cover-top">
        <img class="lockup" src="${e(opts.logoSrc)}" alt="Adritash">
        <div class="cover-tagline">${e(siteConfig.tagline)}</div>
      </div>
      <div class="cover-kicker">${e(REPORT_TITLE)}</div>
      <h1>${e(ctx.projectName?.trim() || "Untitled project")}</h1>
      <div class="cover-rule"></div>
    </div>
  </div>
  <div class="blk meta-grid">
    ${meta.map(([k, v]) => `<div class="meta"><div class="lbl">${e(k)}</div><div class="val">${v}</div></div>`).join("")}
  </div>
  <div class="blk objective">
    <div class="lbl">Project objective</div>
    <p>${para(ctx.projectObjective)}</p>
  </div>`;
}

function overviewBlocks(a: ReportAnalysis): string {
  const idList = (list: ItemAnalysis[], max = 4) =>
    list
      .slice(0, max)
      .map((i) => ref(i.record.id))
      .join(", ") + (list.length > max ? ` and ${list.length - max} more` : "");
  const kpi = (tone: string, label: string, value: string, ctx: string) =>
    `<div class="kpi tone-${tone}"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-ctx">${ctx}</div></div>`;
  const naValue = `<span class="small">Not available</span>`;

  const cards: string[] = [];

  // 1. Overall health (rule printed in the footnote)
  if (a.health) {
    const tone = a.health.rating === "Red" ? "red" : a.health.rating === "Amber" ? "amber" : "green";
    cards.push(kpi(tone, "Overall RAID health", `<span class="dot"></span>${a.health.rating}`, a.health.reasons.map(e).join("; ")));
  } else {
    cards.push(kpi("neutral", "Overall RAID health", naValue, "The register has no items."));
  }

  // 2. Critical / high risks
  const riskTotal = a.byCategory.Risk.items.length;
  cards.push(
    kpi(
      a.criticalRisks ? "red" : a.highRisks ? "amber" : "neutral",
      "Critical / high risks",
      riskTotal ? String(a.criticalRisks + a.highRisks) : naValue,
      riskTotal
        ? `${a.criticalRisks} critical · ${a.highRisks} high, of ${plural(a.openRisks.length, "open risk")}`
        : "No risks recorded."
    )
  );

  // 3. Overdue
  const datedOpen = a.items.filter((i) => i.isOpen && i.due).length;
  const oldest = a.mostUrgentOverdue;
  const undated = a.itemsWithoutCalendarDue
    ? ` ${plural(a.itemsWithoutCalendarDue, "open item has", "open items have")} no calendar due date.`
    : "";
  if (!datedOpen && !a.overdue.length) {
    cards.push(kpi("neutral", "Overdue items", naValue, `No open item has a calendar due date.`));
  } else {
    cards.push(
      kpi(
        a.overdue.length ? "amber" : "green",
        "Overdue items",
        String(a.overdue.length),
        (oldest
          ? `Oldest: ${ref(oldest.record.id)}, ${plural(oldest.overdueDays ?? 0, "day")} overdue.`
          : "Nothing is past its due date.") + undated
      )
    );
  }

  // 4. Open issues
  const issueTotal = a.byCategory.Issue.items.length;
  cards.push(
    kpi(
      a.criticalPriorityIssues ? "red" : a.openIssues ? "amber" : "neutral",
      "Open issues",
      String(a.openIssues),
      issueTotal
        ? `${a.criticalPriorityIssues} critical priority · ${plural(issueTotal, "issue")} in total`
        : "No issues recorded."
    )
  );

  // 5. Blocked dependencies
  cards.push(
    kpi(
      a.blockedDependencies ? "red" : "neutral",
      "Blocked dependencies",
      String(a.blockedDependencies),
      a.dependencies ? `of ${plural(a.dependencies, "dependency", "dependencies")} recorded` : "No dependencies recorded."
    )
  );

  // 6. Attention
  cards.push(
    kpi(
      a.attention.length ? "amber" : "green",
      "Needs management attention",
      String(a.attention.length),
      a.attention.length ? idList(a.attention) : "No items meet the criteria."
    )
  );

  // Highlights
  const hr = a.highestRisk;
  const owner = (r: RaidRecord) => (r.owner?.trim() ? e(r.owner) : "Not available");
  const riskStatus = hr
    ? `${e(scoreBand(hr.record.riskScore))} exposure<div class="sub">Set by the highest open risk score: ${e(hr.record.riskScore)} of 25.</div>`
    : `${NA}<div class="sub">No open risks to assess.</div>`;
  const highest = hr
    ? `${ref(hr.record.id)} ${e(hr.record.title)}<div class="sub">P × I ${pxi(hr.record)} · ${e(hr.record.severity)} · Owner: ${owner(hr.record)}</div>`
    : `${NA}<div class="sub">No open risks in the register.</div>`;
  const urgent = oldest
    ? `${ref(oldest.record.id)} ${e(oldest.record.title)}<div class="sub">${plural(oldest.overdueDays ?? 0, "day")} overdue (due ${e(formatDate(oldest.due as Date))}) · ${e(oldest.record.severity)} · Owner: ${owner(oldest.record)}</div>`
    : datedOpen
      ? `No overdue items<div class="sub">All open items with calendar due dates are on time.</div>`
      : `${NA}<div class="sub">No open item has a calendar due date.</div>`;
  const decision = `${NA}<div class="sub">The register does not record decisions.${
    a.attention.length ? ` ${plural(a.attention.length, "item meets", "items meet")} the escalation criteria (Section E).` : ""
  }</div>`;

  return `
  ${sectionHead("A", "Executive overview")}
  <div class="blk kpi-grid">${cards.join("")}</div>
  <div class="blk highlights">
    <div class="hl"><div class="lbl">Overall project risk status</div><div class="val">${riskStatus}</div></div>
    <div class="hl"><div class="lbl">Highest-rated open risk</div><div class="val">${highest}</div></div>
    <div class="hl"><div class="lbl">Most urgent overdue item</div><div class="val">${urgent}</div></div>
    <div class="hl"><div class="lbl">Key decision or escalation</div><div class="val">${decision}</div></div>
  </div>
  <div class="blk kpi-note">Definitions for these measures are on the last page.</div>`;
}

function heatmapBlocks(a: ReportAnalysis): string {
  const risks = a.byCategory.Risk.items;
  if (!risks.length) {
    return `${sectionHead("B", "Risk heatmap")}
    <div class="blk empty-panel">No risks are recorded in this register, so there is no heatmap to show.</div>`;
  }

  const rows: string[] = [];
  for (let p = 5; p >= 1; p--) {
    const cells = [
      `<th class="ax-y"><b>${p}</b><span>${e(PROBABILITY_DESCRIPTIONS[p as 1].label)}</span></th>`,
    ];
    for (let i = 1; i <= 5; i++) {
      const band = scoreBand(p * i).toLowerCase();
      const chips = risks
        .filter((r) => r.record.probability === p && r.record.impact === i)
        .sort((x, y) => Number(y.isOpen) - Number(x.isOpen) || x.record.id.localeCompare(y.record.id))
        .map((r) => `<a class="chip${r.isOpen ? "" : " chip-closed"}" href="#item-${e(r.record.id)}">${e(r.record.id)}</a>`)
        .join("");
      cells.push(`<td class="hc band-${band}"><span class="hc-score">${p * i}</span>${chips}</td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  const xAxis = [1, 2, 3, 4, 5]
    .map((i) => `<th class="ax-x"><b>${i}</b><span>${e(IMPACT_DESCRIPTIONS[i as 1].label)}</span></th>`)
    .join("");
  const closed = risks.filter((r) => !r.isOpen).length;
  // Risks with values outside 1-5 cannot be plotted; say so instead of hiding them.
  const offGrid = risks.filter(
    (r) => ![1, 2, 3, 4, 5].includes(r.record.probability) || ![1, 2, 3, 4, 5].includes(r.record.impact)
  );

  const heat = `
  <div class="blk heat-block">
    <div class="heat-grid">
      <div class="heat-ylab"><span>Probability</span></div>
      <table class="heat">
        <tbody>${rows.join("")}</tbody>
        <tfoot><tr><th></th>${xAxis}</tr></tfoot>
      </table>
    </div>
    <div class="heat-xlab">Impact</div>
    <div class="legend">
      <span><i class="sw band-low"></i>Low (1–4)</span>
      <span><i class="sw band-moderate"></i>Moderate (5–9)</span>
      <span><i class="sw band-high"></i>High (10–15)</span>
      <span><i class="sw band-critical"></i>Critical (16–25)</span>
      ${closed ? `<span><i class="chip chip-closed chip-legend">ID</i>Closed risk</span>` : ""}
      <span class="legend-note">Score = probability × impact. Each ID links to its entry in Section C.${
        offGrid.length ? ` Not plotted (values outside 1–5): ${offGrid.map((r) => e(r.record.id)).join(", ")}.` : ""
      }</span>
    </div>
  </div>`;

  const ranked = [...risks].sort(
    (x, y) => Number(y.isOpen) - Number(x.isOpen) || y.record.riskScore - x.record.riskScore || x.record.id.localeCompare(y.record.id)
  );
  const head = `<div class="blk trow thead t-rank">
      <div>ID</div><div>Risk</div><div>P × I = score</div><div>Severity</div><div>Owner</div><div>Status</div>
    </div>`;
  const body = ranked
    .map(
      (r) => `<div class="blk trow t-rank" data-trow="rank">
      <div class="mono">${ref(r.record.id)}</div>
      <div>${e(r.record.title)}</div>
      <div class="nowrap">${pxi(r.record)}</div>
      <div>${sevBadge(r.record.severity)}</div>
      <div>${r.record.owner?.trim() ? e(r.record.owner) : NA}</div>
      <div>${statusBadge(r)}${timingBadge(r) ? `<div class="mt">${timingBadge(r)}</div>` : ""}</div>
    </div>`
    )
    .join("");

  return `
  ${sectionHead("B", "Risk heatmap", `${plural(risks.length, "risk")} plotted by probability and impact${closed ? `, including ${closed} closed` : ""}.`)}
  ${heat}
  <div class="blk sub-head" data-keep="next"><h3>Risk ranking</h3></div>
  <template data-thead-src="rank">${head}</template>
  ${body}`;
}

function categorySummary(cat: RaidCategory, list: ItemAnalysis[]): string {
  const chips: string[] = [];
  const count = (pred: (i: ItemAnalysis) => boolean) => list.filter(pred).length;
  if (cat === "Risk") {
    SEVERITY_ORDER.forEach((s) => {
      const n = count((i) => i.record.severity === s);
      if (n) chips.push(`${sevBadge(s)}<span class="n">${n}</span>`);
    });
    const avg = list.reduce((acc, i) => acc + i.record.riskScore, 0) / list.length;
    chips.push(`<span class="sum-txt">Average score ${avg.toFixed(1)} of 25</span>`);
  } else if (cat === "Assumption") {
    chips.push(`<span class="badge flag-validate">${count((i) => i.record.requiresValidation)} awaiting validation</span>`);
    chips.push(`<span class="sum-txt">${count((i) => i.record.status === "Validated")} validated</span>`);
  } else if (cat === "Issue") {
    chips.push(`<span class="sum-txt">${count((i) => i.isOpen)} open · ${count((i) => !i.isOpen)} closed</span>`);
    (["Critical", "High"] as const).forEach((p) => {
      const n = count((i) => i.isOpen && i.record.priority === p);
      if (n) chips.push(`<span class="badge pri">${p} priority</span><span class="n">${n}</span>`);
    });
  } else {
    const blocked = count((i) => i.blocked);
    chips.push(`<span class="badge ${blocked ? "st-blocked" : "st-open"}">${blocked} blocked</span>`);
    chips.push(`<span class="sum-txt">${count((i) => i.isOpen && !i.blocked)} active · ${count((i) => !i.isOpen)} completed</span>`);
  }
  const overdue = count((i) => i.overdueDays !== null);
  if (overdue) chips.push(`<span class="badge flag-overdue">${overdue} overdue</span>`);
  return chips.join(`<span class="sep"></span>`);
}

function itemCard(it: ItemAnalysis): string {
  const r = it.record;
  const meta = CATEGORY_META[r.category];

  const metaCells: [string, string][] = [
    ["Owner", ownerText(r)],
    ["Due date", dueText(it)],
    ["Priority", textOrNA(r.priority)],
  ];
  if (r.category === "Issue") {
    metaCells.push(["Impact", `${e(r.impact)} of 5<div class="sub">${e(IMPACT_DESCRIPTIONS[r.impact]?.label ?? "")}</div>`]);
  } else {
    metaCells.push(["Probability × impact", `${pxi(r)}<div class="sub">Score out of 25</div>`]);
  }
  metaCells.push(["Confidence", textOrNA(r.confidence)]);

  const sections: string[] = [];
  sections.push(
    `<div class="card-sec"><div class="lbl">${r.category === "Assumption" ? "Assumption" : "Description"}</div><p>${para(r.description)}</p></div>`
  );

  const causeLabel = r.category === "Issue" ? "Root cause" : r.category === "Dependency" ? "Context" : "Cause";
  const impactLabel = r.category === "Assumption" ? "Impact if this proves false" : "Impact";
  if (r.cause?.trim() || r.impactDescription?.trim()) {
    sections.push(`<div class="card-sec two">
      <div><div class="lbl">${causeLabel}</div><p>${para(r.cause)}</p></div>
      <div><div class="lbl">${impactLabel}</div><p>${para(r.impactDescription)}</p></div>
    </div>`);
  }

  if (r.requiresValidation || r.category === "Assumption") {
    sections.push(`<div class="card-sec validate">
      <div class="lbl">Validation ${r.requiresValidation ? `<span class="badge flag-validate">Pending</span>` : `<span class="badge st-closed">Not pending</span>`}</div>
      <p>${para(r.validationNotes)}</p>
    </div>`);
  } else if (r.validationNotes?.trim()) {
    sections.push(`<div class="card-sec val-line"><span class="lbl">Validation</span> <span class="badge st-closed">Not pending</span> ${e(r.validationNotes)}</div>`);
  }

  const planLabel =
    r.category === "Issue" ? "Resolution plan" : r.category === "Dependency" ? "Mitigation / fallback" : "Mitigation plan";
  sections.push(`<div class="card-sec plans">
    <div class="plan plan-main"><div class="lbl">${planLabel}</div><p>${para(r.mitigation)}</p></div>
    <div class="plan"><div class="lbl">Contingency plan</div><p>${para(r.contingencyPlan)}</p></div>
  </div>`);

  const actions = (r.actionItems ?? []).filter((x) => String(x).trim());
  sections.push(`<div class="card-sec actions">
    <div class="lbl">Actions${actions.length ? ` (${actions.length})` : ""}</div>
    ${actions.length ? `<ol>${actions.map((x) => `<li>${e(x)}</li>`).join("")}</ol>` : `<p>${NA}</p>`}
  </div>`);

  if (it.reviewNotes.length) {
    sections.push(
      `<div class="card-sec review"><div class="lbl">Flagged for review</div><ul>${it.reviewNotes.map((n) => `<li>${e(n)}</li>`).join("")}</ul></div>`
    );
  }

  const badges = [sevBadge(r.severity), statusBadge(it), timingBadge(it)].filter(Boolean).join("");

  return `
  <article class="blk card ${meta.cls}" id="item-${e(r.id)}" data-split="card">
    <div class="card-top">
      <div class="card-head">
        <span class="card-id">${e(r.id)}</span>
        <span class="card-badges">${badges}</span>
      </div>
      <h4 class="card-title">${e(r.title)}</h4>
      <div class="card-meta">${metaCells.map(([k, v]) => `<div><div class="lbl">${e(k)}</div><div class="val">${v}</div></div>`).join("")}</div>
    </div>
    ${sections.join("")}
  </article>`;
}

function registerBlocks(a: ReportAnalysis): string {
  const cats: RaidCategory[] = ["Risk", "Assumption", "Issue", "Dependency"];
  const sortItems = (list: ItemAnalysis[]) =>
    [...list].sort(
      (x, y) => Number(y.isOpen) - Number(x.isOpen) || y.record.riskScore - x.record.riskScore || x.record.id.localeCompare(y.record.id)
    );

  const parts = cats.map((cat) => {
    const meta = CATEGORY_META[cat];
    const list = a.byCategory[cat].items;
    if (!list.length) {
      return `<div class="blk cat-head ${meta.cls} cat-empty">
        <h3>${meta.title} <span class="count">0</span></h3>
        <div class="cat-sum"><span class="sum-txt">No ${meta.title.toLowerCase()} are recorded in this register.</span></div>
      </div>`;
    }
    return `
    <div class="blk cat-head ${meta.cls}" data-keep="next">
      <h3>${meta.title} <span class="count">${list.length}</span></h3>
      <div class="cat-sum">${categorySummary(cat, list)}</div>
    </div>
    ${sortItems(list).map(itemCard).join("")}`;
  });

  return `
  ${sectionHead("C", "RAID register", "Each entry is shown exactly as recorded. Within each section, open items come first, then higher scores.")}
  ${parts.join("")}`;
}

function actionBlocks(a: ReportAnalysis): string {
  const list = a.actionItems;
  const n = (k: ItemFlag["kind"]) => list.filter((i) => i.flags.some((f) => f.kind === k)).length;
  const intro = `Open items that are overdue, due within ${DUE_SOON_DAYS} days, blocked, critical severity or high/critical priority. Actions, owners and due dates are those recorded on each item.`;

  if (!list.length) {
    return `${sectionHead("E", "Action and escalation summary", intro)}
    <div class="blk empty-panel">No open items are overdue, due soon, blocked, critical severity or high priority.</div>`;
  }

  const head = `<div class="blk trow thead t-act">
    <div>Item</div><div>Recorded actions</div><div>Owner</div><div>Due</div><div>Why it is listed</div>
  </div>`;
  const rows = list
    .map((it) => {
      const r = it.record;
      const acts = (r.actionItems ?? []).filter((x) => String(x).trim());
      return `<div class="blk trow t-act" data-trow="act">
        <div>${ref(r.id)}<div class="sub strong">${e(r.title)}</div></div>
        <div>${acts.length ? `<ul class="act-list">${acts.map((x) => `<li>${e(x)}</li>`).join("")}</ul>` : `<span class="na">No actions recorded</span>`}</div>
        <div>${r.owner?.trim() ? e(r.owner) : NA}</div>
        <div>${dueText(it)}</div>
        <div class="flags">${it.flags.map(flagBadge).join("")}</div>
      </div>`;
    })
    .join("");

  const counts = [
    `${n("overdue")} overdue`,
    `${n("dueSoon")} due within ${DUE_SOON_DAYS} days`,
    `${n("blocked")} blocked`,
    `${n("criticalSeverity")} critical severity`,
    `${n("highPriority")} high or critical priority`,
  ].join(" · ");

  return `
  ${sectionHead("E", "Action and escalation summary", intro)}
  <div class="blk counts-line" data-keep="next">${plural(list.length, "item")} listed: ${counts}</div>
  <template data-thead-src="act">${head}</template>
  ${rows}`;
}

function methodBlocks(a: ReportAnalysis): string {
  return `
  <div class="blk sub-head" data-keep="next"><h3>How the measures are calculated</h3></div>
  <div class="blk footnote">
    <p><b>RAID health</b> is Red if any open item is critical severity or any high/critical item is overdue; Amber if any open item is high severity, any item is overdue or a dependency is blocked; otherwise Green.</p>
    <p><b>Overdue</b> means an open item whose calendar due date is before the report date (${e(formatDate(a.generatedAt))}). Closed, resolved, completed, validated and rejected items are never overdue, and due dates written as text are not counted. Overdue status is separate from severity.</p>
    <p><b>Needs management attention</b> covers open items that are critical severity or critical priority, overdue or blocked. <b>Due soon</b> means due within ${DUE_SOON_DAYS} days.</p>
    <p><b>Risk score</b> is probability × impact (1–25), banded Low 1–4, Moderate 5–9, High 10–15 and Critical 16–25. Recorded scores and severities are shown as entered; differences are listed under data review notes.</p>
    <p class="end-note">End of report · Prepared with the ${e(siteConfig.brand)} RAID Generator. AI-generated content should be reviewed by the project team before decisions are made.</p>
  </div>`;
}

function reviewBlocks(a: ReportAnalysis): string {
  if (!a.reviewNotes.length) return "";
  const rows = a.reviewNotes
    .map(
      (n) =>
        `<div class="blk review-row">${n.itemId ? `<span class="mono">${ref(n.itemId)}</span>` : `<span class="mono">Project</span>`}<span>${e(n.text)}</span></div>`
    )
    .join("");
  return `
  <div class="blk sub-head review-head" data-keep="next">
    <h3>Data review notes</h3>
    <p class="sec-intro">These values look inconsistent. They are shown exactly as recorded and have not been changed.</p>
  </div>
  ${rows}`;
}

const STYLES = `
@page { size: A4 portrait; margin: 0; }
:root {
  --ink: #13201e; --teal: #123a38; --text: #222a29; --muted: #5c6765; --faint: #868f8d;
  --line: #e3dfd6; --panel: #f7f4ee; --bronze: #9a6a26; --gold: #d9a15a;
  --red: #a3312a; --red-bg: #f7e3e0; --amber: #8f540c; --amber-bg: #fbecd8;
  --yel-bg: #f8efc8; --yel: #6a5605; --green: #2f6b45; --green-bg: #e2efe4;
  --c-risk: #a3312a; --c-asm: #1f6b78; --c-iss: #b0701c; --c-dep: #5b4a8b;
}
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; }
body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 9.4pt; line-height: 1.45; color: var(--text); }
a { color: inherit; text-decoration: none; }
p { margin: 0; overflow-wrap: anywhere; }
.mono, .card-id, .chip { font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace; }
.na { color: var(--faint); font-style: italic; font-weight: 400; }
.sub { color: var(--muted); font-size: 8.2pt; font-weight: 400; margin-top: 0.4mm; }
.sub.strong { color: var(--text); font-size: 8.6pt; }
.nowrap { white-space: nowrap; }
.mt { margin-top: 1mm; }
.lbl { font-size: 7.6pt; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.7mm; }

/* Pages */
#src, #measure { position: absolute; left: -10000px; top: 0; visibility: hidden; }
.page { width: 210mm; height: 296.5mm; background: #fff; display: flex; flex-direction: column; overflow: hidden; position: relative; break-after: page; page-break-after: always; }
.page:last-child { break-after: auto; page-break-after: auto; }
.run-head { flex: none; height: 12mm; background: var(--ink); display: flex; align-items: center; justify-content: space-between; gap: 6mm; padding: 0 16mm; border-bottom: 0.7mm solid var(--gold); }
.run-head img { height: 5.2mm; width: auto; display: block; }
.run-head .rh-txt { color: #e9e2d4; font-size: 7.8pt; letter-spacing: .03em; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.page-body { flex: 1 1 auto; padding: 7mm 16mm 1mm; overflow: hidden; }
.page.first .page-body { padding-top: 0; }
.run-foot { flex: none; height: 12mm; margin: 0 16mm; border-top: 0.3mm solid var(--gold); display: grid; grid-template-columns: 1fr auto auto; gap: 6mm; align-items: center; font-size: 7.6pt; color: var(--muted); }
.run-foot .rf-l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.run-foot .rf-c { font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--bronze); }
.run-foot .rf-r { white-space: nowrap; }

/* Blocks are spaced with padding, never margins, so measured heights add up exactly. */
.blk { padding-bottom: 4.4mm; }

/* Cover */
.cover { margin: 0 -16mm; }
.cover.blk { padding-bottom: 4.5mm; }
.cover-band { background: linear-gradient(135deg, #0b1413 0%, #13221f 60%, #1b2e2a 100%); color: #f2ece1; padding: 9mm 16mm 8mm; }
.cover-top { display: flex; align-items: center; justify-content: space-between; gap: 8mm; }
.cover .lockup { height: 11mm; width: auto; display: block; }
.cover-tagline { font-size: 8pt; letter-spacing: .06em; color: #cdb48d; text-align: right; }
.cover-kicker { margin-top: 8mm; font-size: 8.4pt; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--gold); }
.cover h1 { margin: 2.5mm 0 0; font-size: 22pt; line-height: 1.18; font-weight: 700; color: #fff; letter-spacing: -.01em; overflow-wrap: anywhere; }
.cover-rule { margin-top: 4.5mm; height: 0.6mm; width: 28mm; background: linear-gradient(90deg, var(--gold), #f6cf93); }

.meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.3mm solid var(--line); }
.meta { padding: 2mm 3mm 2mm 0; border-bottom: 0.3mm solid var(--line); min-width: 0; }
.meta .val { font-size: 9.3pt; font-weight: 600; color: var(--ink); overflow-wrap: anywhere; }
.objective p { background: var(--panel); border-left: 0.9mm solid var(--gold); padding: 3mm 4mm; font-size: 9.8pt; color: var(--ink); }

/* Section heads */
.sec-head { padding-top: 1mm; }
.sec-head.blk { padding-bottom: 3.6mm; }
.sec-title { display: flex; align-items: center; gap: 3mm; border-bottom: 0.4mm solid var(--ink); padding-bottom: 1.8mm; }
.sec-letter { display: inline-flex; align-items: center; justify-content: center; width: 6.5mm; height: 6.5mm; border-radius: 1mm; background: var(--ink); color: var(--gold); font-weight: 700; font-size: 9pt; }
.sec-head h2 { margin: 0; font-size: 14pt; color: var(--ink); font-weight: 700; }
.sec-intro { margin-top: 1.8mm; color: var(--muted); font-size: 8.8pt; }
.sub-head h3 { margin: 0; font-size: 11pt; color: var(--ink); }
.sub-head.blk { padding-bottom: 2.2mm; }

/* KPI cards */
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3.5mm; }
.kpi { border: 0.3mm solid var(--line); border-top: 1.2mm solid #b9b3a8; border-radius: 1.2mm; padding: 2.6mm 3.4mm 2.8mm; background: #fff; min-width: 0; }
.kpi-label { font-size: 7.8pt; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); }
.kpi-value { font-size: 20pt; font-weight: 700; color: var(--ink); line-height: 1.1; margin: 1mm 0 1mm; display: flex; align-items: center; gap: 2mm; }
.kpi-value .small { font-size: 12pt; color: var(--faint); font-weight: 600; }
.kpi-ctx { font-size: 8.4pt; color: var(--muted); line-height: 1.4; }
.kpi .dot { width: 3.4mm; height: 3.4mm; border-radius: 50%; background: currentColor; display: inline-block; }
.tone-red { border-top-color: var(--red); } .tone-red .kpi-value { color: var(--red); }
.tone-amber { border-top-color: #d08a2e; } .tone-amber .kpi-value { color: var(--amber); }
.tone-green { border-top-color: #5c9a6f; } .tone-green .kpi-value { color: var(--green); }

.highlights { display: grid; grid-template-columns: 1fr 1fr; column-gap: 6mm; }
.hl { background: var(--panel); border-radius: 1.2mm; padding: 2.4mm 3.2mm; margin-bottom: 2.4mm; }
.highlights.blk { padding-bottom: 1.8mm; }
.hl .val { font-size: 9.3pt; color: var(--ink); font-weight: 600; overflow-wrap: anywhere; }
.footnote { font-size: 8.4pt; color: var(--muted); line-height: 1.5; }
.footnote p { margin-bottom: 1.6mm; }
.kpi-grid.blk { padding-bottom: 1.6mm; }
.kpi-note { font-size: 7.8pt; color: var(--faint); }
.kpi-note.blk { padding-bottom: 3.4mm; }
.footnote b { color: var(--text); }
.ref { color: var(--teal); font-weight: 700; border-bottom: 0.25mm solid rgba(168,116,44,.55); }

/* Heatmap */
.heat-grid { display: grid; grid-template-columns: 7mm 1fr; align-items: stretch; }
.heat-ylab { display: flex; align-items: center; justify-content: center; }
.heat-ylab span { transform: rotate(-90deg); white-space: nowrap; font-size: 8pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.heat { width: 100%; border-collapse: separate; border-spacing: 1.2mm; table-layout: fixed; }
.heat th.ax-y { width: 24mm; text-align: right; padding-right: 1.5mm; font-weight: 400; vertical-align: middle; }
.heat th b, .heat th span { display: block; }
.heat th b { font-size: 11pt; color: var(--ink); }
.heat th span { font-size: 7.6pt; color: var(--muted); }
.heat th.ax-x { text-align: center; padding-top: 0.6mm; font-weight: 400; }
.hc { height: 20mm; vertical-align: top; border-radius: 1mm; padding: 1.6mm 1.6mm 4mm; position: relative; }
.hc-score { position: absolute; right: 1.6mm; bottom: 1mm; font-size: 7.4pt; font-weight: 600; color: rgba(0,0,0,.34); }
.band-low { background: #d9e9da; } .band-moderate { background: #f5ebbf; } .band-high { background: #f3cd9d; } .band-critical { background: #ebb2a8; }
.chip { display: inline-block; background: #fff; border: 0.3mm solid rgba(19,32,30,.38); border-radius: 0.8mm; padding: 0.3mm 1.2mm; margin: 0 0.8mm 0.8mm 0; font-size: 7.6pt; font-weight: 700; color: var(--ink); line-height: 1.35; }
.chip-closed { border-style: dashed; color: var(--muted); background: rgba(255,255,255,.65); font-weight: 500; }
.chip-legend { font-style: normal; margin: 0 1.4mm 0 0; }
.heat-xlab { text-align: center; font-size: 8pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); padding-left: 33mm; }
.legend { display: flex; flex-wrap: wrap; align-items: center; gap: 2mm 5mm; margin-top: 3mm; font-size: 8pt; color: var(--text); }
.legend span { display: inline-flex; align-items: center; }
.sw { display: inline-block; width: 4mm; height: 4mm; border-radius: 0.8mm; margin-right: 1.4mm; }
.legend-note { color: var(--muted); flex-basis: 100%; }

/* Grid tables */
.trow { display: grid; gap: 3mm; border-bottom: 0.3mm solid var(--line); align-items: start; font-size: 8.8pt; padding-top: 2.2mm; }
.trow.blk { padding-bottom: 2.2mm; }
.trow > div { min-width: 0; overflow-wrap: anywhere; }
.thead { font-size: 7.4pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); border-bottom: 0.45mm solid var(--ink); padding-top: 0.5mm; }
.thead.blk { padding-bottom: 1.6mm; }
.t-rank { grid-template-columns: 17mm 1fr 25mm 19mm 30mm 32mm; }
.t-act { grid-template-columns: 34mm 1fr 27mm 22mm 32mm; }
.act-list { margin: 0; padding-left: 4mm; }
.act-list li { margin-bottom: 0.6mm; }
.flags { display: flex; flex-wrap: wrap; gap: 1mm; }
.counts-line { font-size: 8.6pt; color: var(--text); font-weight: 600; }
.counts-line.blk { padding-bottom: 2mm; }

/* Badges */
.badge { display: inline-block; font-size: 7.4pt; font-weight: 600; line-height: 1.3; padding: 0.35mm 1.6mm; border-radius: 0.9mm; border: 0.25mm solid transparent; white-space: nowrap; }
.sev-critical { background: var(--red-bg); color: var(--red); border-color: #e3b5af; }
.sev-high { background: var(--amber-bg); color: var(--amber); border-color: #ecc895; }
.sev-moderate { background: var(--yel-bg); color: var(--yel); border-color: #e6d690; }
.sev-low { background: var(--green-bg); color: var(--green); border-color: #b9d6c0; }
.st-open { background: #eef1f0; color: #34403e; border-color: #d4dad8; }
.st-closed { background: #fff; color: var(--green); border-color: #b9d6c0; }
.st-blocked { background: #fff; color: var(--red); border-color: var(--red); }
.flag-overdue { background: var(--red); color: #fff; }
.flag-soon { background: #fff; color: var(--amber); border-color: #d08a2e; }
.flag-validate { background: #fff; color: var(--c-asm); border-color: #8fbcc3; }
.pri { background: #fff; color: var(--ink); border-color: #b9b3a8; }

/* Category heads */
.cat-head { border-left: 1.4mm solid var(--ink); padding-left: 3mm; padding-top: 0.6mm; }
.cat-head.blk { padding-bottom: 3.4mm; }
.cat-head h3 { margin: 0; font-size: 12.5pt; color: var(--ink); }
.cat-head .count { display: inline-block; margin-left: 1.5mm; font-size: 9pt; font-weight: 600; color: #fff; background: var(--ink); border-radius: 1mm; padding: 0 1.6mm; vertical-align: 2px; }
.cat-sum { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2mm; margin-top: 1.3mm; font-size: 8.4pt; color: var(--text); }
.cat-sum .n { font-weight: 700; margin-right: 1mm; }
.cat-sum .sep { width: 1.5mm; }
.sum-txt { color: var(--muted); }
.cat-empty h3 { color: var(--muted); }
.c-risk.cat-head { border-left-color: var(--c-risk); } .c-asm.cat-head { border-left-color: var(--c-asm); } .c-iss.cat-head { border-left-color: var(--c-iss); } .c-dep.cat-head { border-left-color: var(--c-dep); }

/* Item cards: the gap between cards is the block padding, so use a wrapper border via box-shadow-free inner box */
.card { padding-bottom: 4.4mm; }
.card > .card-top, .card > .card-sec, .card > .card-cont-label { border-left: 1.2mm solid var(--ink); border-right: 0.3mm solid var(--line); padding-left: 4mm; padding-right: 4mm; margin: 0; }
.c-risk.card > * { border-left-color: var(--c-risk) !important; } .c-asm.card > * { border-left-color: var(--c-asm) !important; }
.c-iss.card > * { border-left-color: var(--c-iss) !important; } .c-dep.card > * { border-left-color: var(--c-dep) !important; }
.card > :first-child { border-top: 0.3mm solid var(--line); border-top-right-radius: 1.2mm; padding-top: 3.2mm; }
.card > :last-child { border-bottom: 0.3mm solid var(--line); border-bottom-right-radius: 1.2mm; padding-bottom: 3.4mm; }
.card > .card-sec { padding-top: 2.1mm; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 3mm; }
.card-id { font-size: 9pt; font-weight: 700; color: #fff; background: var(--ink); border-radius: 0.9mm; padding: 0.4mm 1.8mm; white-space: nowrap; }
.card-badges { display: flex; flex-wrap: wrap; gap: 1.2mm; justify-content: flex-end; }
.card-title { margin: 1.6mm 0 1.8mm; font-size: 11.2pt; line-height: 1.3; color: var(--ink); font-weight: 700; overflow-wrap: anywhere; }
.card-meta { display: grid; grid-template-columns: 1.45fr 1fr 0.75fr 1.15fr 0.8fr; gap: 2.5mm; background: var(--panel); border-radius: 1mm; padding: 1.8mm 3mm; }
.card-meta > div { min-width: 0; }
.card-meta .val { font-size: 8.8pt; color: var(--ink); font-weight: 600; overflow-wrap: anywhere; }
.card-sec p { font-size: 9.1pt; }
.card-sec.two > div, .card-sec.plans > div { min-width: 0; }
.card-sec.two, .card-sec.plans { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.plan { border: 0.3mm solid var(--line); border-radius: 1mm; padding: 1.8mm 2.6mm; }
.plan-main { border-color: #e1cfae; background: #fdf9f1; }
.validate > .lbl, .validate > p { background: #f3f9fa; }
.validate > .lbl { display: flex; align-items: center; gap: 1.5mm; margin: 0; padding: 2.2mm 2.8mm 0.8mm; border: 0.3mm solid #c6dfe3; border-bottom: 0; border-radius: 1mm 1mm 0 0; }
.validate > p { padding: 0 2.8mm 2.2mm; border: 0.3mm solid #c6dfe3; border-top: 0; border-radius: 0 0 1mm 1mm; }
.actions ol { margin: 0; padding-left: 5mm; font-size: 9pt; }
.actions li { margin-bottom: 0.8mm; padding-left: 0.6mm; overflow-wrap: anywhere; }
.val-line { font-size: 8.6pt; color: var(--muted); }
.val-line .lbl { display: inline; margin-right: 1mm; }
.review ul { margin: 0; padding-left: 4mm; font-size: 8.4pt; color: var(--amber); }
.card-cont-label { font-size: 7.6pt; color: var(--faint); padding-top: 2.4mm; }

.empty-panel { background: var(--panel); border-radius: 1.2mm; padding: 4mm 5mm; color: var(--muted); font-size: 9pt; margin-bottom: 4.4mm; }
.empty-panel.blk { padding-bottom: 4mm; }
.review-head .sec-intro { margin-top: 1mm; }
.review-row { display: grid; grid-template-columns: 22mm 1fr; gap: 3mm; font-size: 8.6pt; border-bottom: 0.3mm solid var(--line); padding-top: 1.6mm; }
.review-row.blk { padding-bottom: 1.6mm; }
.end-note { text-align: center; color: var(--faint); font-size: 8pt; padding-top: 3mm; }

/* Screen preview */
@media screen {
  body { background: #d9d5cc; padding: 20px 0 4px; }
  .page { margin: 0 auto 20px; box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.12); }
}
@media print {
  body { background: #fff; padding: 0; zoom: 1 !important; }
  .page { margin: 0; box-shadow: none; }
}
`;

/** Build the full report document. Pagination happens afterwards in layoutReport(). */
export function buildReportHtml(ctx: ProjectContext, records: RaidRecord[], opts: ReportOptions): string {
  const a = analyseReport(ctx, records, opts.now);
  const project = ctx.projectName?.trim() || "Untitled project";
  const date = formatDate(a.generatedAt);
  const cls = opts.classification === "None" ? "" : opts.classification;

  const blocks = `
    ${coverBlocks(ctx, a, opts)}
    ${overviewBlocks(a)}
    ${heatmapBlocks(a)}
    ${registerBlocks(a)}
    ${actionBlocks(a)}
    ${reviewBlocks(a)}
    ${methodBlocks(a)}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(project)} - ${e(REPORT_TITLE)} - ${e(date)}</title>
<style>${STYLES}</style>
</head>
<body>
<template id="tpl-head">
  <div class="run-head"><img src="${e(opts.logoSrc)}" alt="Adritash"><span class="rh-txt">${e(REPORT_TITLE)} · ${e(project)}</span></div>
</template>
<template id="tpl-foot">
  <div class="run-foot">
    <div class="rf-l">${e(REPORT_TITLE)} · ${e(project)} · ${e(date)}</div>
    <div class="rf-c">${e(cls)}</div>
    <div class="rf-r">Page <span class="pg-n"></span> of <span class="pg-t"></span></div>
  </div>
</template>
<div id="src">${blocks}</div>
<div id="pages"></div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

interface CardInfo {
  /** The full original card. */
  src: HTMLElement;
  /** Index of the first section this block holds (0 = starts with the card header). */
  from: number;
  sections: number;
}

interface Block {
  el: HTMLElement;
  h: number;
  keepNext: boolean;
  table?: string;
  /** Set for item cards (and card continuations), which may break between sections. */
  card?: CardInfo;
}

/**
 * Build part of an item card holding sections [from, to). The first part keeps
 * the card header and anchor id; later parts get a small "continued" label.
 */
function cardPart(card: HTMLElement, from: number, to: number): HTMLElement {
  const doc = card.ownerDocument;
  const secs = Array.from(card.querySelectorAll(":scope > .card-sec"));
  const el = doc.createElement("article");
  el.className = card.className;
  if (from === 0) {
    el.id = card.id;
    const top = card.querySelector(":scope > .card-top");
    if (top) el.appendChild(top.cloneNode(true));
  } else {
    const lbl = doc.createElement("div");
    lbl.className = "card-cont-label";
    lbl.textContent = `${card.querySelector(".card-id")?.textContent ?? ""} continued`;
    el.appendChild(lbl);
  }
  secs.slice(from, to).forEach((sec) => el.appendChild(sec.cloneNode(true)));
  return el;
}

async function waitForAssets(doc: Document): Promise<void> {
  const imgs = Array.from(doc.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          })
    )
  );
  if (doc.fonts?.ready) await doc.fonts.ready;
}

/**
 * Lay the source blocks out onto fixed A4 pages with a running header and footer.
 * Returns the number of pages. Call once per freshly loaded document.
 */
export async function layoutReport(doc: Document): Promise<number> {
  const src = doc.getElementById("src") as HTMLElement | null;
  if (!src) return Number(doc.body.dataset.pages ?? 0);
  // Logos inside <template>s are not loaded until cloned; preload the source image.
  const logoSrc = (doc.querySelector("#src img") as HTMLImageElement | null)?.src;
  if (logoSrc) {
    const img = new (doc.defaultView as Window & typeof globalThis).Image();
    img.src = logoSrc;
    await img.decode().catch(() => undefined);
  }
  await waitForAssets(doc);

  const pagesEl = doc.getElementById("pages") as HTMLElement;
  const headTpl = doc.getElementById("tpl-head") as HTMLTemplateElement;
  const footTpl = doc.getElementById("tpl-foot") as HTMLTemplateElement;

  const theadTpls = new Map<string, HTMLElement>();
  src.querySelectorAll<HTMLTemplateElement>("template[data-thead-src]").forEach((t) => {
    const el = t.content.firstElementChild as HTMLElement | null;
    if (el) theadTpls.set(t.dataset.theadSrc as string, el);
    t.remove();
  });

  const newPage = (first: boolean) => {
    const page = doc.createElement("section");
    page.className = `page${first ? " first" : ""}`;
    if (!first) page.appendChild(headTpl.content.cloneNode(true));
    const body = doc.createElement("div");
    body.className = "page-body";
    page.appendChild(body);
    page.appendChild(footTpl.content.cloneNode(true));
    pagesEl.appendChild(page);
    return { page, body };
  };

  const capacityOf = (body: HTMLElement) => {
    const cs = doc.defaultView!.getComputedStyle(body);
    return body.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  };

  const probeFirst = newPage(true);
  const probe = newPage(false);
  const capFirst = capacityOf(probeFirst.body);
  const capOther = capacityOf(probe.body);

  const measure = doc.createElement("div");
  measure.id = "measure";
  measure.className = "page-body";
  measure.style.width = `${probe.body.getBoundingClientRect().width}px`;
  measure.style.height = "auto";
  measure.style.overflow = "visible";
  doc.body.appendChild(measure);
  probeFirst.page.remove();
  probe.page.remove();

  const measureEl = (el: HTMLElement): number => {
    measure.appendChild(el);
    const h = el.getBoundingClientRect().height;
    measure.removeChild(el);
    return h;
  };

  const theadH = new Map<string, number>();
  theadTpls.forEach((el, key) => theadH.set(key, measureEl(el.cloneNode(true) as HTMLElement)));

  const blocks: Block[] = [];
  for (const el of Array.from(src.children) as HTMLElement[]) {
    el.remove();
    const h = measureEl(el);
    const block: Block = { el, h, keepNext: el.dataset.keep === "next", table: el.dataset.trow };
    if (el.dataset.split === "card") {
      const sections = el.querySelectorAll(":scope > .card-sec").length;
      if (sections > 1) block.card = { src: el, from: 0, sections };
    }
    blocks.push(block);
  }

  const needFor = (b: Block, tableOpen: string | undefined) =>
    b.h + (b.table && b.table !== tableOpen ? theadH.get(b.table) ?? 0 : 0);

  // Card parts are measured on demand and cached.
  // Keyed by the card element itself, so duplicate item IDs cannot collide.
  const partCache = new WeakMap<HTMLElement, Map<string, { el: HTMLElement; h: number }>>();
  const part = (c: CardInfo, to: number) => {
    let cache = partCache.get(c.src);
    if (!cache) partCache.set(c.src, (cache = new Map()));
    const key = `${c.from}|${to}`;
    let hit = cache.get(key);
    if (!hit) {
      const el = cardPart(c.src, c.from, to);
      hit = { el, h: measureEl(el) };
      cache.set(key, hit);
    }
    return hit;
  };
  // Break a card between pages only when that avoids leaving a large gap,
  // or when the card is taller than a whole page.
  const MIN_GAP_TO_SPLIT = 0.3;
  const canSplit = (b: Block, room: number, pageHasContent: boolean) =>
    Boolean(b.card) &&
    b.card!.sections - b.card!.from > 1 &&
    (b.h > capOther || (pageHasContent && room >= capOther * MIN_GAP_TO_SPLIT));

  let current = newPage(true);
  const pages = [current];
  let remaining = capFirst;
  let hasContent = false;
  let openTable: string | undefined;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // A block marked keep-next must share its page with the next block (chains allowed).
    // If the next block is a card that may break here, only its first section has to fit.
    let need = needFor(b, openTable);
    let chainTable = b.table ?? openTable;
    for (let j = i; blocks[j]?.keepNext && blocks[j + 1]; j++) {
      const next = blocks[j + 1];
      const room = remaining - need;
      need += canSplit(next, room, true) && part(next.card!, next.card!.from + 1).h <= room
        ? part(next.card!, next.card!.from + 1).h
        : needFor(next, chainTable);
      chainTable = next.table ?? chainTable;
    }

    // A card that does not fit: place as many sections as fit and continue the rest.
    if (need > remaining + 0.5 && canSplit(b, remaining, hasContent)) {
      const c = b.card!;
      let best = -1;
      for (let k = c.from + 1; k < c.sections; k++) {
        if (part(c, k).h <= remaining + 0.5) best = k;
        else break;
      }
      if (best > 0) {
        const head = part(c, best);
        current.body.appendChild(head.el);
        remaining -= head.h;
        hasContent = true;
        openTable = undefined;
        const restCard: CardInfo = { src: c.src, from: best, sections: c.sections };
        const rest = part(restCard, c.sections);
        blocks[i] = { el: rest.el, h: rest.h, keepNext: false, card: restCard };
        i--;
        continue;
      }
    }

    if (need > remaining + 0.5 && hasContent) {
      current = newPage(false);
      pages.push(current);
      remaining = capOther;
      hasContent = false;
      openTable = undefined;
    }

    if (b.table && b.table !== openTable) {
      const tpl = theadTpls.get(b.table);
      if (tpl) {
        current.body.appendChild(tpl.cloneNode(true));
        remaining -= theadH.get(b.table) ?? 0;
      }
      openTable = b.table;
    } else if (!b.table) {
      openTable = undefined;
    }

    current.body.appendChild(b.el);
    remaining -= b.h;
    hasContent = true;
  }

  measure.remove();
  src.remove();

  const total = pages.length;
  pages.forEach((p, idx) => {
    p.page.querySelectorAll(".pg-n").forEach((n) => (n.textContent = String(idx + 1)));
    p.page.querySelectorAll(".pg-t").forEach((n) => (n.textContent = String(total)));
  });
  await waitForAssets(doc);

  doc.body.dataset.pages = String(total);
  doc.body.dataset.ready = "1";
  return total;
}

/** Scale the preview so a whole page fits the frame width (screen only; print resets it). */
export function fitReportToWidth(doc: Document): void {
  const win = doc.defaultView;
  const page = doc.querySelector(".page") as HTMLElement | null;
  if (!win || !page) return;
  const scale = Math.min(1, (win.innerWidth - 24) / page.offsetWidth);
  doc.body.style.setProperty("zoom", String(Math.max(0.3, scale)));
}

// ---------------------------------------------------------------------------
// Logo + printing helpers
// ---------------------------------------------------------------------------

let logoCache: Promise<string> | null = null;

/** Load the official lockup logo once as a data URL so it is embedded in the PDF. */
export function loadLogoDataUrl(): Promise<string> {
  if (!logoCache) {
    logoCache = fetch(assets.lockup)
      .then((res) => {
        if (!res.ok) throw new Error(`Logo request failed (${res.status})`);
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => {
        logoCache = null;
        return new URL(assets.lockup, window.location.origin).toString();
      });
  }
  return logoCache;
}

/** Print an already laid-out report iframe ("Save as PDF" in the dialog). */
export function printReportFrame(iframe: HTMLIFrameElement): void {
  const win = iframe.contentWindow;
  if (!win) return;
  win.focus();
  win.print();
}
