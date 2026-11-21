"use client";

import { useState } from "react";
import { ProjectContext, RaidRecord } from "@/lib/pm/raid-types";

interface RaidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectContext: ProjectContext;
  records: RaidRecord[];
}

export default function RaidExportModal({
  isOpen,
  onClose,
  projectContext,
  records,
}: RaidExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Generate CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Category",
      "Title",
      "Description",
      "Root Cause",
      "Impact Description",
      "Probability (1-5)",
      "Impact (1-5)",
      "Risk Score (1-25)",
      "Severity Level",
      "Priority",
      "Owner",
      "Suggested Role",
      "Mitigation Plan",
      "Contingency Plan",
      "Action Items",
      "Due Date",
      "Status",
      "Confidence",
      "Requires Validation",
      "Validation Notes",
    ];

    const escapeCsv = (str: string | number | boolean | undefined) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.category),
      escapeCsv(r.title),
      escapeCsv(r.description),
      escapeCsv(r.cause),
      escapeCsv(r.impactDescription || ""),
      r.probability,
      r.impact,
      r.riskScore,
      escapeCsv(r.severity),
      escapeCsv(r.priority),
      escapeCsv(r.owner),
      escapeCsv(r.suggestedOwnerRole),
      escapeCsv(r.mitigation),
      escapeCsv(r.contingencyPlan),
      escapeCsv(r.actionItems.join("; ")),
      escapeCsv(r.dueDate),
      escapeCsv(r.status),
      escapeCsv(r.confidence),
      r.requiresValidation ? "YES" : "NO",
      escapeCsv(r.validationNotes),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = projectContext.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    link.setAttribute("href", url);
    link.setAttribute("download", `adritash-raid-${sanitizedName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Generate Excel (.xlsx compatible HTML Table with XML metadata)
  const handleExportExcel = () => {
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>RAID Register</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #0e1117; color: #c9a84c; font-weight: bold; border: 1px solid #333; padding: 8px; text-align: left; }
          td { border: 1px solid #ddd; padding: 6px; font-family: Calibri, sans-serif; font-size: 11pt; vertical-align: top; }
          .crit { background-color: #fce8e6; color: #c5221f; font-weight: bold; }
          .high { background-color: #fef7e0; color: #b06000; font-weight: bold; }
          .mod { background-color: #fef9e7; color: #7f6000; }
          .low { background-color: #e6f4ea; color: #137333; }
        </style>
      </head>
      <body>
        <h2>ADRITASH PM Copilot • Enterprise RAID Register</h2>
        <p><strong>Project:</strong> ${projectContext.projectName} | <strong>Type:</strong> ${projectContext.projectType} | <strong>Phase:</strong> ${projectContext.projectPhase}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Title</th>
              <th>Description</th>
              <th>Root Cause</th>
              <th>Probability</th>
              <th>Impact</th>
              <th>Risk Score</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Owner</th>
              <th>Role</th>
              <th>Mitigation Plan</th>
              <th>Contingency Plan</th>
              <th>Action Items</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Validation</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map((r) => {
                const scoreClass =
                  r.severity === "Critical"
                    ? "crit"
                    : r.severity === "High"
                    ? "high"
                    : r.severity === "Moderate"
                    ? "mod"
                    : "low";
                return `
              <tr>
                <td><strong>${r.id}</strong></td>
                <td>${r.category}</td>
                <td>${r.title}</td>
                <td>${r.description}</td>
                <td>${r.cause}</td>
                <td>${r.probability}</td>
                <td>${r.impact}</td>
                <td class="${scoreClass}">${r.riskScore}</td>
                <td class="${scoreClass}">${r.severity}</td>
                <td>${r.priority}</td>
                <td>${r.owner}</td>
                <td>${r.suggestedOwnerRole}</td>
                <td>${r.mitigation}</td>
                <td>${r.contingencyPlan}</td>
                <td>${r.actionItems.join("<br/>")}</td>
                <td>${r.dueDate}</td>
                <td>${r.status}</td>
                <td>${r.requiresValidation ? "Pending Validation: " + (r.validationNotes || "") : "Verified"}</td>
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = projectContext.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    link.setAttribute("href", url);
    link.setAttribute("download", `adritash-raid-${sanitizedName}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Print / PDF Executive Report
  const handlePrint = () => {
    window.print();
  };

  // 4. Copy as JSON
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(records, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-white/20 bg-[#101a18] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
              Enterprise Deliverables
            </span>
            <h2 className="text-xl font-bold text-white">
              Export RAID Register
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Export {records.length} records in standard corporate, spreadsheet, or print-ready formats.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Options Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {/* Option 1: Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="group flex flex-col items-start rounded-xl border border-white/10 bg-black/30 p-4 text-left transition-all hover:border-gold hover:bg-black/50"
          >
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 group-hover:bg-emerald-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white group-hover:text-gold">
              Microsoft Excel (.xls)
            </h3>
            <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
              Styled workbook with colored severity columns, gridlines, and formatted headers.
            </p>
          </button>

          {/* Option 2: CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="group flex flex-col items-start rounded-xl border border-white/10 bg-black/30 p-4 text-left transition-all hover:border-gold hover:bg-black/50"
          >
            <div className="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-400 group-hover:bg-cyan-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white group-hover:text-gold">
              Standard CSV
            </h3>
            <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
              RFC 4180 UTF-8 with BOM for import into Jira, ServiceNow, Asana, or Smartsheet.
            </p>
          </button>

          {/* Option 3: Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="group flex flex-col items-start rounded-xl border border-white/10 bg-black/30 p-4 text-left transition-all hover:border-gold hover:bg-black/50"
          >
            <div className="rounded-lg bg-gold/10 p-2.5 text-gold group-hover:bg-gold/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white group-hover:text-gold">
              Executive Print / PDF
            </h3>
            <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
              Optimized for print or Save-as-PDF with official ADRITASH header and executive layout.
            </p>
          </button>

          {/* Option 4: Raw JSON */}
          <button
            type="button"
            onClick={handleCopyJSON}
            className="group flex flex-col items-start rounded-xl border border-white/10 bg-black/30 p-4 text-left transition-all hover:border-gold hover:bg-black/50"
          >
            <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400 group-hover:bg-purple-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white group-hover:text-gold">
              {copied ? "✓ Copied to Clipboard!" : "Copy JSON Payload"}
            </h3>
            <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
              Strongly typed JSON array ready for CI/CD pipelines or programmatic integration.
            </p>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
