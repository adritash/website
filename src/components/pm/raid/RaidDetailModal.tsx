"use client";

import { useState } from "react";
import {
  calculateRiskScore,
  CATEGORY_BADGES,
  CATEGORY_STATUSES,
  IMPACT_DESCRIPTIONS,
  PROBABILITY_DESCRIPTIONS,
  RISK_LEVEL_COLORS,
} from "@/lib/pm/raid-constants";
import {
  ImpactScore,
  PriorityLevel,
  ProbabilityScore,
  RaidCategory,
  RaidRecord,
  RaidStatus,
} from "@/lib/pm/raid-types";

interface RaidDetailModalProps {
  record: RaidRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: RaidRecord) => void;
}

export default function RaidDetailModal({
  record,
  isOpen,
  onClose,
  onSave,
}: RaidDetailModalProps) {
  const [formData, setFormData] = useState<RaidRecord | null>(null);
  const [newActionItem, setNewActionItem] = useState("");

  // Reset formData whenever a new record is passed in, without a useEffect
  // (React's recommended "adjusting state during render" pattern).
  const [prevRecord, setPrevRecord] = useState(record);
  if (record !== prevRecord) {
    setPrevRecord(record);
    setFormData(record ? { ...record } : null);
  }

  if (!isOpen || !formData) return null;

  const handleProbabilityChange = (prob: ProbabilityScore) => {
    const { score, level } = calculateRiskScore(prob, formData.impact);
    setFormData({
      ...formData,
      probability: prob,
      riskScore: score,
      severity: level,
    });
  };

  const handleImpactChange = (imp: ImpactScore) => {
    const { score, level } = calculateRiskScore(formData.probability, imp);
    setFormData({
      ...formData,
      impact: imp,
      riskScore: score,
      severity: level,
    });
  };

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return;
    setFormData({
      ...formData,
      actionItems: [...formData.actionItems, newActionItem.trim()],
    });
    setNewActionItem("");
  };

  const handleRemoveActionItem = (index: number) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems.filter((_, i) => i !== index),
    });
  };

  const handleCategoryChange = (cat: RaidCategory) => {
    const newStatuses = CATEGORY_STATUSES[cat];
    setFormData({
      ...formData,
      category: cat,
      status: newStatuses[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const riskColors = RISK_LEVEL_COLORS[formData.severity];
  const categoryBadge = CATEGORY_BADGES[formData.category];
  const allowedStatuses = CATEGORY_STATUSES[formData.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#101a18] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-bold ${categoryBadge.bg} ${categoryBadge.text} ${categoryBadge.border}`}
              >
                {formData.category}
              </span>
              <span className="font-mono text-xs font-bold text-white/60">
                {formData.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${riskColors.bg} ${riskColors.text} ${riskColors.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${riskColors.solidBg}`} />
                {formData.severity} (Score: {formData.riskScore} / 25)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Edit RAID Record Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
          {/* Row 1: Category & Title */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Category
              </label>
              <select
                aria-label="Category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as RaidCategory)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              >
                <option value="Risk" className="bg-[#101a18]">Risk</option>
                <option value="Assumption" className="bg-[#101a18]">Assumption</option>
                <option value="Issue" className="bg-[#101a18]">Issue</option>
                <option value="Dependency" className="bg-[#101a18]">Dependency</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-white/70">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              required
            />
          </div>

          {/* Row 3: Root Cause & Impact Description */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Underlying Root Cause / Context
              </label>
              <textarea
                rows={2}
                value={formData.cause}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Impact Description / Exposure
              </label>
              <textarea
                rows={2}
                value={formData.impactDescription || ""}
                onChange={(e) =>
                  setFormData({ ...formData, impactDescription: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: 5x5 Probability and Impact Scoring Adjusters */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h4 className="font-bold text-gold uppercase tracking-wider text-[11px] mb-3">
              Risk Assessment Scoring (Deterministic Model: Probability × Impact)
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Probability Selector */}
              <div>
                <label className="block font-medium text-white/80 mb-1.5">
                  Probability:{" "}
                  <strong className="text-white">
                    {formData.probability} — {PROBABILITY_DESCRIPTIONS[formData.probability].label}
                  </strong>{" "}
                  <span className="text-white/50">({PROBABILITY_DESCRIPTIONS[formData.probability].range})</span>
                </label>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4, 5] as ProbabilityScore[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProbabilityChange(p)}
                      className={`flex-1 rounded-lg py-2 font-mono font-bold transition-all ${
                        formData.probability === p
                          ? "bg-gold text-black shadow-md"
                          : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Selector */}
              <div>
                <label className="block font-medium text-white/80 mb-1.5">
                  Impact:{" "}
                  <strong className="text-white">
                    {formData.impact} — {IMPACT_DESCRIPTIONS[formData.impact].label}
                  </strong>
                </label>
                <div className="flex gap-1.5">
                  {([1, 2, 3, 4, 5] as ImpactScore[]).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleImpactChange(i)}
                      className={`flex-1 rounded-lg py-2 font-mono font-bold transition-all ${
                        formData.impact === i
                          ? "bg-rose-500 text-white shadow-md"
                          : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Owner, Role, Due Date, Status, Priority */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Assigned Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Suggested Role
              </label>
              <input
                type="text"
                value={formData.suggestedOwnerRole}
                onChange={(e) =>
                  setFormData({ ...formData, suggestedOwnerRole: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Status
              </label>
              <select
                aria-label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as RaidStatus })
                }
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              >
                {allowedStatuses.map((st) => (
                  <option key={st} value={st} className="bg-[#101a18]">
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Priority
              </label>
              <select
                aria-label="Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as PriorityLevel,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              >
                {(["Low", "Medium", "High", "Critical"] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p} className="bg-[#101a18]">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Mitigation & Contingency Plans */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-gold">
                Mitigation / Response Plan
              </label>
              <textarea
                rows={3}
                value={formData.mitigation}
                onChange={(e) =>
                  setFormData({ ...formData, mitigation: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-gold/30 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/70">
                Fallback / Contingency Plan
              </label>
              <textarea
                rows={3}
                value={formData.contingencyPlan}
                onChange={(e) =>
                  setFormData({ ...formData, contingencyPlan: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Row 7: Action Items Checklist */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-white/70 mb-2">
              Action Items & Verification Steps
            </label>
            <div className="space-y-2">
              {formData.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  <span className="text-white/90">• {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActionItem(idx)}
                    className="text-white/40 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddActionItem();
                  }
                }}
                placeholder="Add actionable verification step or remediation task..."
                className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white placeholder-white/30 focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddActionItem}
                className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 font-semibold text-gold hover:bg-gold/20"
              >
                + Add Step
              </button>
            </div>
          </div>

          {/* Row 8: Validation Gateway */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-300">
                  PM Validation Gate
                </span>
                <p className="text-[11px] text-white/60">
                  Indicates whether this record requires formal confirmation or factual sign-off.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresValidation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresValidation: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-amber-500 bg-black accent-amber-500"
                />
                <span className="font-semibold text-white">
                  Requires Stakeholder Validation
                </span>
              </label>
            </div>

            {formData.requiresValidation && (
              <div className="mt-3">
                <label className="block text-[11px] font-medium text-amber-200/80 mb-1">
                  Validation Notes & Instructions:
                </label>
                <input
                  type="text"
                  value={formData.validationNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, validationNotes: e.target.value })
                  }
                  placeholder="e.g. Confirm 3rd-party sandbox latency with vendor architect before cutover"
                  className="w-full rounded-lg border border-amber-500/40 bg-black/60 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold px-6 py-2.5 font-bold text-black shadow-lg shadow-gold/20 hover:brightness-110"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
