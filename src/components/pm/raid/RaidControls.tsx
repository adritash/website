"use client";

import { GenerationDepth, RaidCategory } from "@/lib/pm/raid-types";

interface RaidControlsProps {
  selectedCategory: "all" | RaidCategory;
  onCategoryChange: (cat: "all" | RaidCategory) => void;
  recordCount: 5 | 10 | 15 | 20;
  onRecordCountChange: (count: 5 | 10 | 15 | 20) => void;
  depth: GenerationDepth;
  onDepthChange: (depth: GenerationDepth) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onAddManual: () => void;
  hasExistingRecords: boolean;
  replaceMode: boolean;
  onToggleReplaceMode: (replace: boolean) => void;
  isReadyToGenerate?: boolean;
  projectName?: string;
}

export default function RaidControls({
  selectedCategory,
  onCategoryChange,
  recordCount,
  onRecordCountChange,
  depth,
  onDepthChange,
  isGenerating,
  onGenerate,
  onAddManual,
  hasExistingRecords,
  replaceMode,
  onToggleReplaceMode,
  isReadyToGenerate = true,
  projectName,
}: RaidControlsProps) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-[#101a18] via-[#14201e] to-[#101a18] p-6 shadow-xl backdrop-blur-sm sm:p-7 space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-[11px] font-black text-gold">
            2
          </span>
          <h3 className="text-base font-bold tracking-tight text-white">
            Step 2: Choose Report Settings &amp; Synthesize with AI
          </h3>
        </div>
        <span className="text-[11px] font-medium text-white/50">
          Target: {projectName ? <span className="text-gold font-semibold">{projectName}</span> : "Current Project"}
        </span>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Configuration options */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6 flex-1">
          {/* Target Scope */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gold">
                A. Category Scope
              </label>
            </div>
            <select
              aria-label="Category scope"
              value={selectedCategory}
              onChange={(e) =>
                onCategoryChange(e.target.value as "all" | RaidCategory)
              }
              disabled={isGenerating}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-medium text-white focus:border-gold focus:outline-none"
            >
              <option value="all" className="bg-[#101a18]">
                All RAID (R, A, I, D Balanced Mix)
              </option>
              <option value="Risk" className="bg-[#101a18]">
                Risks Only (Threats &amp; What Could Go Wrong)
              </option>
              <option value="Assumption" className="bg-[#101a18]">
                Assumptions Only (Beliefs Needing Proof)
              </option>
              <option value="Issue" className="bg-[#101a18]">
                Issues Only (Active Problems Happening Now)
              </option>
              <option value="Dependency" className="bg-[#101a18]">
                Dependencies Only (External Systems &amp; Teams)
              </option>
            </select>
            <span className="mt-1 block text-[10px] text-white/50">
              Balanced mix is recommended for a full audit log.
            </span>
          </div>

          {/* Record Count */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gold">
                B. Number of Items
              </label>
              <span className="text-[10px] text-white/50">{recordCount} records</span>
            </div>
            <div className="mt-1.5 flex rounded-xl border border-white/15 bg-black/50 p-1">
              {([5, 10, 15, 20] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onRecordCountChange(num)}
                  disabled={isGenerating}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    recordCount === num
                      ? "bg-gold text-black shadow font-bold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="mt-1 block text-[10px] text-white/50">
              {recordCount === 5 ? "Quick snapshot" : recordCount === 10 ? "Standard PM baseline (Recommended)" : "In-depth comprehensive scan"}
            </span>
          </div>

          {/* Generation Depth */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gold">
                C. Analytical Depth
              </label>
              <span className="text-[10px] text-white/50">{depth}</span>
            </div>
            <div className="mt-1.5 flex rounded-xl border border-white/15 bg-black/50 p-1">
              {(["Standard", "Detailed"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDepthChange(d)}
                  disabled={isGenerating}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    depth === d
                      ? "bg-gold text-black shadow font-bold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <span className="mt-1 block text-[10px] text-white/50">
              {depth === "Standard" ? "Concise, actionable bullet points" : "Deep root-cause, prevention & rollback actions"}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
          {hasExistingRecords && (
            <div className="flex items-center gap-2 text-xs text-white/70">
              <input
                id="replace-mode"
                type="checkbox"
                checked={replaceMode}
                onChange={(e) => onToggleReplaceMode(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-black/50 accent-gold"
              />
              <label htmlFor="replace-mode" className="cursor-pointer select-none">
                Replace existing items (uncheck to append)
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onAddManual}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30 disabled:opacity-50"
              title="Add a custom item manually without AI"
            >
              <svg
                className="h-4 w-4 text-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>+ Manual Entry</span>
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !isReadyToGenerate}
              className={`inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-lg sm:flex-none ${
                !isReadyToGenerate
                  ? "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
                  : "bg-gradient-to-r from-gold via-gold-light to-gold text-black shadow-gold/20 hover:brightness-110 active:scale-[0.98]"
              }`}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Synthesizing with Gemini 3.8 Flash...</span>
                </>
              ) : !isReadyToGenerate ? (
                <>
                  <span>⚠️ Complete Step 1 First</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                    />
                  </svg>
                  <span>✨ Generate RAID with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
