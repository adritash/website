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

const CATEGORY_ORDER: { key: RaidCategory; label: string; color: string }[] = [
  { key: "Risk", label: "Risks", color: "#b42318" },
  { key: "Assumption", label: "Assumptions", color: "#0e7490" },
  { key: "Issue", label: "Issues", color: "#b45309" },
  { key: "Dependency", label: "Dependencies", color: "#6d28d9" },
];

const SEVERITY_STYLE: Record<string, string> = {
  Critical: "background:#fde8e8;color:#9b1c1c",
  High: "background:#fdf0e1;color:#9a4a07",
  Moderate: "background:#fdf8e1;color:#7a5d00",
  Low: "background:#e7f5ec;color:#166534",
};

function heatColor(score: number): string {
  if (score >= 15) return "#f4b4b4";
  if (score >= 9) return "#f8d3a6";
  if (score >= 4) return "#f7e8a8";
  return "#cfe9d6";
}

/** Build a self-contained, light-themed, print-ready HTML report of the register. */
export function buildRaidReportHtml(ctx: ProjectContext, records: RaidRecord[]): string {
  const e = escapeHtml;
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const risks = records.filter((r) => r.category === "Risk");

  const stats = [
    { label: "Critical / high risks", value: risks.filter((r) => r.severity === "Critical" || r.severity === "High").length },
    { label: "Unverified assumptions", value: records.filter((r) => r.category === "Assumption" && r.requiresValidation).length },
    { label: "Open issues", value: records.filter((r) => r.category === "Issue" && r.status !== "Closed" && r.status !== "Resolved").length },
    { label: "Blocked dependencies", value: records.filter((r) => r.category === "Dependency" && r.status === "Blocked").length },
  ];

  const meta = [
    ["Type", ctx.projectType],
    ["Phase", ctx.projectPhase],
    ["Project manager", ctx.projectManager],
    ["Sponsor", ctx.projectSponsor],
    ["Business unit", ctx.businessUnit],
    ["Target completion", ctx.targetCompletionDate],
  ].filter(([, v]) => v && String(v).trim());

  // 5x5 matrix: rows = probability 5..1, cols = impact 1..5
  let matrix = "";
  if (risks.length) {
    const rows: string[] = [];
    for (let p = 5; p >= 1; p--) {
      const cells: string[] = [`<th class="axis">${p}</th>`];
      for (let i = 1; i <= 5; i++) {
        const ids = risks.filter((r) => r.probability === p && r.impact === i).map((r) => e(r.id));
        cells.push(`<td style="background:${heatColor(p * i)}">${ids.join("<br>")}</td>`);
      }
      rows.push(`<tr>${cells.join("")}</tr>`);
    }
    matrix = `
      <section class="avoid-break">
        <h2>Risk matrix</h2>
        <table class="matrix">
          <tbody>${rows.join("")}</tbody>
          <tfoot><tr><th></th>${[1, 2, 3, 4, 5].map((i) => `<th class="axis">${i}</th>`).join("")}</tr></tfoot>
        </table>
        <p class="caption">Rows: probability (5 = almost certain). Columns: impact (5 = severe).</p>
      </section>`;
  }

  const sections = CATEGORY_ORDER.map(({ key, label, color }) => {
    const items = records
      .filter((r) => r.category === key)
      .sort((a, b) => b.riskScore - a.riskScore);
    if (!items.length) return "";
    const body = items
      .map(
        (r) => `
        <tr>
          <td class="id">${e(r.id)}</td>
          <td>
            <strong>${e(r.title)}</strong>
            <div class="muted">${e(r.description)}</div>
            ${r.mitigation ? `<div class="sub"><b>Mitigation:</b> ${e(r.mitigation)}</div>` : ""}
            ${r.actionItems?.length ? `<div class="sub"><b>Actions:</b> ${r.actionItems.map(e).join("; ")}</div>` : ""}
          </td>
          <td class="nowrap"><span class="pill" style="${SEVERITY_STYLE[r.severity] ?? ""}">${e(r.severity)}</span><div class="muted">${e(r.probability)}×${e(r.impact)} = ${e(r.riskScore)}</div></td>
          <td>${e(r.owner)}<div class="muted">${e(r.suggestedOwnerRole)}</div></td>
          <td class="nowrap">${e(r.status)}${r.dueDate ? `<div class="muted">Due ${e(r.dueDate)}</div>` : ""}</td>
        </tr>`
      )
      .join("");
    return `
      <section>
        <h2 style="border-color:${color}">${label} <span class="count">${items.length}</span></h2>
        <table class="register">
          <thead><tr><th>ID</th><th>Item</th><th>Severity</th><th>Owner</th><th>Status</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </section>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${e(ctx.projectName || "RAID register")} - RAID register</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font: 10pt/1.45 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1f1e; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #e3a95f; padding-bottom: 10px; margin-bottom: 16px; }
  .brand { font-weight: 800; letter-spacing: .18em; font-size: 9pt; color: #8a5a1e; }
  h1 { margin: 4px 0 0; font-size: 20pt; line-height: 1.2; }
  .date { color: #5b6664; font-size: 9pt; text-align: right; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 20px; margin: 0 0 12px; color: #3d4645; }
  .meta b { color: #1a1f1e; }
  .goal { background: #f6f3ee; border-left: 3px solid #e3a95f; padding: 8px 12px; margin: 0 0 14px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .stat { border: 1px solid #e2e2dd; border-radius: 6px; padding: 8px 12px; }
  .stat .v { font-size: 18pt; font-weight: 800; }
  .stat .l { color: #5b6664; font-size: 8.5pt; }
  h2 { font-size: 12pt; margin: 18px 0 8px; padding-left: 8px; border-left: 4px solid #e3a95f; break-after: avoid; page-break-after: avoid; }
  .register tbody tr:first-child { break-before: avoid; }
  .register { table-layout: fixed; }
  .register th:nth-child(1) { width: 9%; } .register th:nth-child(3) { width: 11%; } .register th:nth-child(4) { width: 17%; } .register th:nth-child(5) { width: 15%; }
  .count { color: #5b6664; font-weight: 500; }
  table { border-collapse: collapse; width: 100%; }
  .register th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .05em; color: #5b6664; border-bottom: 1.5px solid #1a1f1e; padding: 5px 6px; }
  .register td { vertical-align: top; border-bottom: 1px solid #e2e2dd; padding: 6px; }
  .register tr { break-inside: avoid; }
  .register thead { display: table-header-group; }
  .id { font-family: ui-monospace, Menlo, monospace; font-size: 8.5pt; white-space: nowrap; }
  .muted { color: #5b6664; font-size: 8.5pt; }
  .sub { font-size: 8.5pt; margin-top: 3px; }
  .nowrap { white-space: nowrap; }
  .pill { display: inline-block; border-radius: 10px; padding: 1px 8px; font-size: 8pt; font-weight: 700; }
  .matrix { width: auto; }
  .matrix td { width: 72px; height: 34px; border: 1px solid #fff; text-align: center; font: 7.5pt ui-monospace, Menlo, monospace; }
  .matrix .axis { font-size: 8pt; color: #5b6664; padding: 2px 6px; }
  .caption { color: #5b6664; font-size: 8pt; margin: 4px 0 0; }
  .avoid-break { break-inside: avoid; }
  footer { margin-top: 20px; color: #8a9391; font-size: 8pt; border-top: 1px solid #e2e2dd; padding-top: 6px; }
  .empty { color: #5b6664; padding: 24px 0; }
</style>
</head>
<body>
  <header>
    <div>
      <div class="brand">ADRITASH · RAID REGISTER</div>
      <h1>${e(ctx.projectName || "Untitled project")}</h1>
    </div>
    <div class="date">${e(today)}<br>${records.length} items</div>
  </header>
  ${meta.length ? `<div class="meta">${meta.map(([k, v]) => `<span><b>${e(k)}:</b> ${e(v)}</span>`).join("")}</div>` : ""}
  ${ctx.projectObjective ? `<div class="goal"><b>Goal:</b> ${e(ctx.projectObjective)}</div>` : ""}
  <div class="stats">${stats.map((s) => `<div class="stat"><div class="v">${s.value}</div><div class="l">${e(s.label)}</div></div>`).join("")}</div>
  ${matrix}
  ${sections || `<p class="empty">No items in the register yet.</p>`}
  <footer>Generated with the ADRITASH RAID Generator. AI-generated items should be reviewed by the project team.</footer>
</body>
</html>`;
}

/**
 * Print the report from a hidden iframe so the browser's print dialog
 * (including "Save as PDF") shows only the report, not the app UI.
 */
export function printRaidReport(ctx: ProjectContext, records: RaidRecord[]): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "RAID report";
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) return cleanup();
    win.addEventListener("afterprint", () => setTimeout(cleanup, 500));
    // Fallback cleanup in case afterprint never fires.
    setTimeout(cleanup, 5 * 60 * 1000);
    win.focus();
    win.print();
  };

  iframe.srcdoc = buildRaidReportHtml(ctx, records);
  document.body.appendChild(iframe);
}

