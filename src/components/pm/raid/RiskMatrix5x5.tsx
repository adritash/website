"use client";

import {
  calculateRiskScore,
  IMPACT_DESCRIPTIONS,
  PROBABILITY_DESCRIPTIONS,
  RISK_LEVEL_COLORS,
} from "@/lib/pm/raid-constants";
import { ImpactScore, ProbabilityScore, RaidRecord, RiskLevel } from "@/lib/pm/raid-types";

interface RiskMatrix5x5Props {
  records: RaidRecord[];
  activeCell: { probability: number; impact: number } | null;
  onCellClick: (cell: { probability: number; impact: number } | null) => void;
}

export default function RiskMatrix5x5({
  records,
  activeCell,
  onCellClick,
}: RiskMatrix5x5Props) {
  // Only evaluate items that are Risks (or all items if desired, but Risk matrix applies to Risks)
  const riskRecords = records.filter((r) => r.category === "Risk");

  // Count items per cell [p][i]
  const cellCounts: Record<string, RaidRecord[]> = {};
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      cellCounts[`${p}-${i}`] = [];
    }
  }

  riskRecords.forEach((r) => {
    const key = `${r.probability}-${r.impact}`;
    if (cellCounts[key]) {
      cellCounts[key].push(r);
    }
  });

  // Level breakdowns
  const breakdown: Record<RiskLevel, number> = {
    Low: 0,
    Moderate: 0,
    High: 0,
    Critical: 0,
  };

  riskRecords.forEach((r) => {
    breakdown[r.severity] = (breakdown[r.severity] || 0) + 1;
  });

  const getCellBgClass = (
    p: ProbabilityScore,
    i: ImpactScore,
    isSelected: boolean
  ) => {
    const { level } = calculateRiskScore(p, i);
    if (isSelected) {
      return "ring-2 ring-white ring-offset-2 ring-offset-ink brightness-125 scale-105 z-10";
    }

    switch (level) {
      case "Critical":
        return "bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-400";
      case "High":
        return "bg-orange-950/40 border-orange-500/40 text-orange-300 hover:bg-orange-900/60 hover:border-orange-400";
      case "Moderate":
        return "bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400";
      case "Low":
      default:
        return "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400";
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101a18] p-6 shadow-xl backdrop-blur-sm sm:p-7">
      {/* Header and Risk posture stats */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-rose-500" />
            <h3 className="text-lg font-bold tracking-tight text-white">
              5×5 Enterprise Risk Matrix
            </h3>
          </div>
          <p className="mt-1 text-xs text-white/60">
            Probability (Y) × Impact (X) deterministic scoring model. Click any cell to filter the register.
          </p>
        </div>

        {/* Level Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["Critical", "High", "Moderate", "Low"] as const).map((lvl) => {
            const count = breakdown[lvl];
            const colors = RISK_LEVEL_COLORS[lvl];
            return (
              <div
                key={lvl}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-semibold ${colors.bg} ${colors.text} ${colors.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${colors.solidBg}`} />
                <span>{lvl}:</span>
                <span className="font-mono font-bold text-white">{count}</span>
              </div>
            );
          })}

          {activeCell && (
            <button
              type="button"
              onClick={() => onCellClick(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-white/20"
            >
              <span>Reset Cell Filter ({activeCell.probability}×{activeCell.impact})</span>
              <span className="text-white/60">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive 5x5 Matrix Grid */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[130px_repeat(5,1fr)] gap-2">
            {/* Top-Left Empty Corner */}
            <div className="flex flex-col justify-end p-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Probability (Y) \ Impact (X)
              </span>
            </div>

            {/* Impact Column Headers (X-Axis: 1 to 5) */}
            {([1, 2, 3, 4, 5] as ImpactScore[]).map((i) => (
              <div
                key={`col-${i}`}
                className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 p-2 text-center"
              >
                <span className="font-mono text-xs font-bold text-gold">
                  {i}
                </span>
                <span className="text-[11px] font-semibold text-white">
                  {IMPACT_DESCRIPTIONS[i].label}
                </span>
              </div>
            ))}

            {/* Matrix Rows: Probability 5 down to 1 */}
            {([5, 4, 3, 2, 1] as ProbabilityScore[]).map((p) => (
              <div key={`row-${p}`} className="contents">
                {/* Probability Row Header (Y-Axis) */}
                <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-gold">
                      {p}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {PROBABILITY_DESCRIPTIONS[p].label}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    {PROBABILITY_DESCRIPTIONS[p].range}
                  </span>
                </div>

                {/* 5 Cells per Row */}
                {([1, 2, 3, 4, 5] as ImpactScore[]).map((i) => {
                  const itemsInCell = cellCounts[`${p}-${i}`] || [];
                  const count = itemsInCell.length;
                  const { score, level } = calculateRiskScore(p, i);
                  const isSelected =
                    activeCell?.probability === p && activeCell?.impact === i;

                  return (
                    <button
                      key={`cell-${p}-${i}`}
                      type="button"
                      onClick={() =>
                        onCellClick(
                          isSelected ? null : { probability: p, impact: i }
                        )
                      }
                      className={`relative flex min-h-[76px] flex-col items-center justify-between rounded-xl border p-2.5 transition-all duration-150 cursor-pointer ${getCellBgClass(
                        p,
                        i,
                        isSelected
                      )}`}
                    >
                      {/* Top cell score info */}
                      <div className="flex w-full items-center justify-between text-[10px]">
                        <span className="font-mono font-medium opacity-60">
                          {score}
                        </span>
                        <span className="font-semibold uppercase tracking-wider text-[9px] opacity-75">
                          {level}
                        </span>
                      </div>

                      {/* Count badge */}
                      <div className="my-1">
                        {count > 0 ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-black shadow-md ring-2 ring-black/40">
                            {count}
                          </span>
                        ) : (
                          <span className="text-xs font-medium opacity-20">—</span>
                        )}
                      </div>

                      {/* Bottom caption */}
                      <span className="text-[9px] font-medium opacity-50">
                        P{p} × I{i}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer Axis Legends */}
          <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-white/5 pt-3 text-[11px] text-white/50 sm:flex-row">
            <div>
              <span className="font-semibold text-white/80">X-Axis (Horizontal):</span> Impact Severity (1 Negligible → 5 Severe / Catastrophic)
            </div>
            <div>
              <span className="font-semibold text-white/80">Y-Axis (Vertical):</span> Occurrence Probability (1 Rare &lt;10% → 5 Almost Certain &gt;85%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
