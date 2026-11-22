"use client";

import { useId } from "react";
import { GenerationDepth, RaidCategory } from "@/lib/pm/raid-types";

interface RaidControlsProps {
  selectedCategory: "all" | RaidCategory;
  onCategoryChange: (cat: "all" | RaidCategory) => void;
  recordCount: 5 | 10 | 15 | 20;
  onRecordCountChange: (count: 5 | 10 | 15 | 20) => void;
  depth: GenerationDepth;
  onDepthChange: (depth: GenerationDepth) => void;
  isGenerating: boolean;
  hasExistingRecords: boolean;
  replaceMode: boolean;
  onToggleReplaceMode: (replace: boolean) => void;
}

const CATEGORY_LABELS: Record<"all" | RaidCategory, string> = {
  all: "All four (balanced)",
  Risk: "Risks only",
  Assumption: "Assumptions only",
  Issue: "Issues only",
  Dependency: "Dependencies only",
};

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-1.5 flex rounded-lg border border-white/15 bg-black/40 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          disabled={disabled}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            value === opt ? "bg-gold text-black" : "text-white/65 hover:text-white"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** Generation settings, tucked behind a disclosure with sensible defaults. */
export default function RaidControls({
  selectedCategory,
  onCategoryChange,
  recordCount,
  onRecordCountChange,
  depth,
  onDepthChange,
  isGenerating,
  hasExistingRecords,
  replaceMode,
  onToggleReplaceMode,
}: RaidControlsProps) {
  const id = useId();
  const summary = `${CATEGORY_LABELS[selectedCategory]} · ${recordCount} items · ${depth}${
    hasExistingRecords && !replaceMode ? " · add to existing" : ""
  }`;

  return (
    <details className="group rounded-xl border border-white/10 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden">
        <span>
          Options <span className="text-white/50">({summary})</span>
        </span>
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-white/50 transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>

      <div className="grid grid-cols-1 gap-4 border-t border-white/10 p-4 sm:grid-cols-3">
        <div>
          <label htmlFor={`${id}-scope`} className="block text-xs font-medium text-white/70">
            What to generate
          </label>
          <select
            id={`${id}-scope`}
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as "all" | RaidCategory)}
            disabled={isGenerating}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {(Object.keys(CATEGORY_LABELS) as ("all" | RaidCategory)[]).map((key) => (
              <option key={key} value={key} className="bg-[#101a18]">
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-medium text-white/70">Number of items</span>
          <Segmented
            label="Number of items"
            options={[5, 10, 15, 20] as const}
            value={recordCount}
            onChange={onRecordCountChange}
            disabled={isGenerating}
          />
        </div>

        <div>
          <span className="block text-xs font-medium text-white/70">Detail level</span>
          <Segmented
            label="Detail level"
            options={["Standard", "Detailed"] as const}
            value={depth}
            onChange={onDepthChange}
            disabled={isGenerating}
          />
        </div>

        {hasExistingRecords && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white/75 sm:col-span-3">
            <input
              type="checkbox"
              checked={!replaceMode}
              onChange={(e) => onToggleReplaceMode(!e.target.checked)}
              disabled={isGenerating}
              className="h-4 w-4 rounded border-white/20 bg-black/50 accent-gold"
            />
            Add to the current register instead of replacing it
          </label>
        )}
      </div>
    </details>
  );
}
