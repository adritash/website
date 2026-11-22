"use client";

import { useEffect, useState } from "react";
import { escapeHtml, printRaidReport, raidFileSlug } from "@/lib/pm/raid-report";
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const e = escapeHtml;

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
    const sanitizedName = raidFileSlug(projectContext.projectName);
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
        <p><strong>Project:</strong> ${e(projectContext.projectName)} | <strong>Type:</strong> ${e(projectContext.projectType)} | <strong>Phase:</strong> ${e(projectContext.projectPhase)}</p>
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
                <td><strong>${e(r.id)}</strong></td>
                <td>${e(r.category)}</td>
                <td>${e(r.title)}</td>
                <td>${e(r.description)}</td>
                <td>${e(r.cause)}</td>
                <td>${r.probability}</td>
                <td>${r.impact}</td>
                <td class="${scoreClass}">${r.riskScore}</td>
                <td class="${scoreClass}">${e(r.severity)}</td>
                <td>${e(r.priority)}</td>
                <td>${e(r.owner)}</td>
                <td>${e(r.suggestedOwnerRole)}</td>
                <td>${e(r.mitigation)}</td>
                <td>${e(r.contingencyPlan)}</td>
                <td>${r.actionItems.map(e).join("<br/>")}</td>
                <td>${e(r.dueDate)}</td>
                <td>${e(r.status)}</td>
                <td>${r.requiresValidation ? "Pending Validation: " + e(r.validationNotes || "") : "Verified"}</td>
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
    const sanitizedName = raidFileSlug(projectContext.projectName);
    link.setAttribute("href", url);
    link.setAttribute("download", `adritash-raid-${sanitizedName}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. PDF: print a dedicated light-themed report (not the app UI)
  const handlePrint = () => {
    printRaidReport(projectContext, records);
  };

  // 4. Copy as JSON
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(records, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Could not copy to the clipboard in this browser.");
    }
  };

  const secondary = [
    {
      label: "Excel (.xls)",
      hint: "Spreadsheet with coloured severity",
      onClick: handleExportExcel,
      icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25",
    },
    {
      label: "CSV",
      hint: "For Jira, ServiceNow, Smartsheet",
      onClick: handleExportCSV,
      icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
    },
    {
      label: copied ? "Copied" : "Copy JSON",
      hint: "Raw data for other tools",
      onClick: handleCopyJSON,
      icon: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raid-export-title"
        className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#101a18] p-6 shadow-2xl sm:p-7"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="raid-export-title" className="text-xl font-bold text-white">
              Export register
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {records.length} items from {projectContext.projectName || "this project"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export dialog"
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Primary: PDF report */}
        <button
          type="button"
          onClick={handlePrint}
          autoFocus
          className="mt-6 flex w-full items-center gap-4 rounded-xl bg-gold p-4 text-left text-black shadow-lg shadow-gold/10 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/10">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <span>
            <span className="block text-base font-bold">PDF report</span>
            <span className="block text-xs text-black/70">
              Opens the print dialog. Choose &quot;Save as PDF&quot; as the destination.
            </span>
          </span>
        </button>

        {/* Secondary formats */}
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {secondary.map((opt) => (
            <button
              key={opt.hint}
              type="button"
              onClick={opt.onClick}
              className="flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-black/30 p-3.5 text-left transition hover:border-gold/60 hover:bg-black/50"
            >
              <svg aria-hidden="true" className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
              </svg>
              <span className="text-sm font-semibold text-white">{opt.label}</span>
              <span className="text-[11px] leading-snug text-white/55">{opt.hint}</span>
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">{copied ? "JSON copied to clipboard" : ""}</p>
      </div>
    </div>
  );
}
