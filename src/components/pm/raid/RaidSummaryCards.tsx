"use client";

import { RaidCategory, RaidRecord } from "@/lib/pm/raid-types";

interface RaidSummaryCardsProps {
  records: RaidRecord[];
  onSelectCategory: (cat: "All" | RaidCategory) => void;
  onSelectValidationOnly: () => void;
  selectedCategory: "All" | RaidCategory;
  onlyRequiresValidation: boolean;
}

export default function RaidSummaryCards({
  records,
  onSelectCategory,
  onSelectValidationOnly,
  selectedCategory,
  onlyRequiresValidation,
}: RaidSummaryCardsProps) {
  const total = records.length;
  const risks = records.filter((r) => r.category === "Risk");
  const assumptions = records.filter((r) => r.category === "Assumption");
  const issues = records.filter((r) => r.category === "Issue");
  const dependencies = records.filter((r) => r.category === "Dependency");

  const criticalAndHighRisks = risks.filter(
    (r) => r.severity === "Critical" || r.severity === "High"
  ).length;

  const openIssues = issues.filter((i) => i.status !== "Closed" && i.status !== "Resolved").length;
  const unvalidatedAssumptions = assumptions.filter((a) => a.requiresValidation || a.status === "Unvalidated").length;
  const blockedDependencies = dependencies.filter((d) => d.status === "Blocked").length;

  const avgRiskScore =
    risks.length > 0
      ? (
          risks.reduce((acc, curr) => acc + curr.riskScore, 0) / risks.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {/* 1. Total Portfolio */}
      <button
        type="button"
        onClick={() => onSelectCategory("All")}
        className={`group text-left rounded-2xl border p-4 transition-all duration-200 ${
          selectedCategory === "All" && !onlyRequiresValidation
            ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
            : "border-white/10 bg-[#101a18] hover:border-white/20 hover:bg-[#14201e]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
            Total RAID
          </span>
          <span className="h-2 w-2 rounded-full bg-white/40 group-hover:bg-gold" />
        </div>
        <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
          {total}
        </p>
        <p className="mt-1 text-[11px] font-medium text-white/50">
          Portfolio Items
        </p>
      </button>

      {/* 2. Risks */}
      <button
        type="button"
        onClick={() => onSelectCategory("Risk")}
        className={`group text-left rounded-2xl border p-4 transition-all duration-200 ${
          selectedCategory === "Risk"
            ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10"
            : "border-white/10 bg-[#101a18] hover:border-rose-500/30 hover:bg-[#14201e]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
            Risks (R)
          </span>
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-black text-white sm:text-3xl">
            {risks.length}
          </p>
          {criticalAndHighRisks > 0 && (
            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
              {criticalAndHighRisks} Crit/High
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] font-medium text-white/50">
          Avg Score: <span className="text-rose-400 font-semibold">{avgRiskScore} / 25</span>
        </p>
      </button>

      {/* 3. Assumptions */}
      <button
        type="button"
        onClick={() => onSelectCategory("Assumption")}
        className={`group text-left rounded-2xl border p-4 transition-all duration-200 ${
          selectedCategory === "Assumption"
            ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
            : "border-white/10 bg-[#101a18] hover:border-cyan-500/30 hover:bg-[#14201e]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Assumptions (A)
          </span>
          <span className="h-2 w-2 rounded-full bg-cyan-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-black text-white sm:text-3xl">
            {assumptions.length}
          </p>
          {unvalidatedAssumptions > 0 && (
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
              {unvalidatedAssumptions} Unchecked
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] font-medium text-white/50">
          Beliefs to Validate
        </p>
      </button>

      {/* 4. Issues */}
      <button
        type="button"
        onClick={() => onSelectCategory("Issue")}
        className={`group text-left rounded-2xl border p-4 transition-all duration-200 ${
          selectedCategory === "Issue"
            ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
            : "border-white/10 bg-[#101a18] hover:border-amber-500/30 hover:bg-[#14201e]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Issues (I)
          </span>
          <span className="h-2 w-2 rounded-full bg-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-black text-white sm:text-3xl">
            {issues.length}
          </p>
          {openIssues > 0 && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              {openIssues} Active
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] font-medium text-white/50">
          Current Blockers
        </p>
      </button>

      {/* 5. Dependencies */}
      <button
        type="button"
        onClick={() => onSelectCategory("Dependency")}
        className={`group text-left rounded-2xl border p-4 transition-all duration-200 ${
          selectedCategory === "Dependency"
            ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
            : "border-white/10 bg-[#101a18] hover:border-purple-500/30 hover:bg-[#14201e]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
            Dependencies (D)
          </span>
          <span className="h-2 w-2 rounded-full bg-purple-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-black text-white sm:text-3xl">
            {dependencies.length}
          </p>
          {blockedDependencies > 0 && (
            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
              {blockedDependencies} Blocked
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] font-medium text-white/50">
          Cross-Team Couplings
        </p>
      </button>

      {/* 6. Human Validation Needed */}
      <button
        type="button"
        onClick={onSelectValidationOnly}
        className={`group text-left rounded-2xl border p-4 transition-all duration-200 ${
          onlyRequiresValidation
            ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
            : "border-white/10 bg-[#101a18] hover:border-amber-400/30 hover:bg-[#14201e]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
            Validation Gate
          </span>
          <span className="h-2 w-2 rounded-full bg-gold" />
        </div>
        <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
          {records.filter((r) => r.requiresValidation).length}
        </p>
        <p className="mt-1 text-[11px] font-medium text-white/50">
          Needs PM Sign-Off
        </p>
      </button>
    </div>
  );
}
