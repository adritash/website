"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildReportHtml,
  Classification,
  CLASSIFICATIONS,
  fitReportToWidth,
  layoutReport,
  loadLogoDataUrl,
  printReportFrame,
} from "@/lib/pm/raid-report";
import { ProjectContext, RaidRecord } from "@/lib/pm/raid-types";

interface RaidReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  projectContext: ProjectContext;
  records: RaidRecord[];
}

const CLASSIFICATION_KEY = "adritash_pm_raid_report_classification_v1";

/**
 * Full-screen preview of the paginated A4 report. The iframe holds the exact
 * document that gets printed, so what you see here is what the PDF contains.
 */
export default function RaidReportPreview({
  isOpen,
  onClose,
  projectContext,
  records,
}: RaidReportPreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [classification, setClassification] = useState<Classification>(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(CLASSIFICATION_KEY) : null;
      if (saved && (CLASSIFICATIONS as readonly string[]).includes(saved)) return saved as Classification;
    } catch {
      /* storage unavailable */
    }
    return "Confidential";
  });

  // Build the document whenever the dialog opens or its inputs change.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    loadLogoDataUrl().then((logoSrc) => {
      if (cancelled) return;
      setPages(null);
      setHtml(buildReportHtml(projectContext, records, { logoSrc, classification }));
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, projectContext, records, classification]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLASSIFICATION_KEY, classification);
    } catch {
      /* storage unavailable */
    }
  }, [classification]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleLoad = useCallback(async () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc || doc.body?.dataset.ready) return;
    const count = await layoutReport(doc);
    fitReportToWidth(doc);
    doc.defaultView?.addEventListener("resize", () => fitReportToWidth(doc));
    // Esc should close the preview even when focus is inside the report frame.
    doc.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") onCloseRef.current();
    });
    setPages(count);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ready = pages !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="raid-preview-title"
      className="fixed inset-0 z-[60] flex flex-col bg-[#0a1211]/95 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 id="raid-preview-title" className="text-base font-bold text-white">
            Report preview
          </h2>
          <p className="text-xs text-white/60" aria-live="polite">
            {ready ? `${pages} A4 page${pages === 1 ? "" : "s"}. This is exactly what the PDF will contain.` : "Laying out pages…"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-white/70">
            Label
            <select
              value={classification}
              onChange={(ev) => setClassification(ev.target.value as Classification)}
              className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-2 text-xs font-medium text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c} className="bg-[#101a18]">
                  {c === "None" ? "No label" : c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => frameRef.current && printReportFrame(frameRef.current)}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-gold/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-lg border border-white/15 bg-white/5 p-2.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <p className="border-b border-white/10 bg-black/30 px-4 py-2 text-[11px] text-white/55 sm:px-6">
        In the print dialog, choose <span className="font-semibold text-white/80">Save as PDF</span> as the destination. Paper size and margins are set by the report (A4, no extra margins).
      </p>

      <div className="relative flex-1 bg-[#d9d5cc]">
        {html && (
          <iframe
            ref={frameRef}
            title="RAID report preview"
            srcDoc={html}
            onLoad={handleLoad}
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
        {!ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#d9d5cc]">
            <span className="rounded-lg bg-white/80 px-4 py-2 text-sm font-medium text-[#13201e] shadow">Preparing report…</span>
          </div>
        )}
      </div>
    </div>
  );
}
