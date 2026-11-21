"use client";

import { useState } from "react";
import {
  calculateRiskScore,
  CATEGORY_STATUSES,
  IMPACT_DESCRIPTIONS,
  PROBABILITY_DESCRIPTIONS,
} from "@/lib/pm/raid-constants";
import {
  ImpactScore,
  PriorityLevel,
  ProbabilityScore,
  RaidCategory,
  RaidRecord,
  RaidStatus,
} from "@/lib/pm/raid-types";

interface RaidManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: RaidRecord) => void;
  existingCount: number;
}

export default function RaidManualAddModal({
  isOpen,
  onClose,
  onAdd,
  existingCount,
}: RaidManualAddModalProps) {
  const [category, setCategory] = useState<RaidCategory>("Risk");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cause] = useState("");
  const [probability, setProbability] = useState<ProbabilityScore>(3);
  const [impact, setImpact] = useState<ImpactScore>(3);
  const [owner, setOwner] = useState("");
  const [suggestedOwnerRole] = useState("Lead Architect");
  const [mitigation, setMitigation] = useState("");
  const [contingencyPlan] = useState("");
  const [actionItemText] = useState("");
  const [dueDate] = useState("");
  const [status, setStatus] = useState<RaidStatus>("Identified");
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [requiresValidation] = useState(false);
  const [validationNotes] = useState("");

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: RaidCategory) => {
    setCategory(newCat);
    const validStatuses = CATEGORY_STATUSES[newCat];
    setStatus(validStatuses[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const codeMap: Record<RaidCategory, string> = {
      Risk: "RSK",
      Assumption: "ASM",
      Issue: "ISS",
      Dependency: "DEP",
    };
    const newId = `${codeMap[category]}-${String(existingCount + 1).padStart(3, "0")}`;

    const { score, level } = calculateRiskScore(probability, impact);
    const now = new Date().toISOString();

    const record: RaidRecord = {
      id: newId,
      category,
      title: title.trim(),
      description: description.trim(),
      cause: cause.trim() || "Manually identified by PM.",
      probability,
      impact,
      severity: level,
      riskScore: score,
      priority,
      owner: owner.trim() || suggestedOwnerRole,
      suggestedOwnerRole,
      mitigation: mitigation.trim() || "To be reviewed in next weekly cadence.",
      contingencyPlan: contingencyPlan.trim() || "Escalate to Steering Committee.",
      actionItems: actionItemText.trim()
        ? [actionItemText.trim()]
        : ["Review during next delivery checkpoint"],
      dueDate: dueDate || "Pending Review",
      status,
      confidence: "High",
      requiresValidation,
      validationNotes,
      createdAt: now,
      updatedAt: now,
    };

    onAdd(record);
    onClose();
  };

  const allowedStatuses = CATEGORY_STATUSES[category];
  const { score: currentScore, level: currentLevel } = calculateRiskScore(
    probability,
    impact
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#101a18] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
              Manual RAID Entry
            </span>
            <h2 className="text-xl font-bold text-white">
              Add New RAID Record
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
          {/* Row 1: Category & Title */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/80">
                Category *
              </label>
              <select
                aria-label="Category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as RaidCategory)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              >
                <option value="Risk" className="bg-[#101a18]">Risk</option>
                <option value="Assumption" className="bg-[#101a18]">Assumption</option>
                <option value="Issue" className="bg-[#101a18]">Issue</option>
                <option value="Dependency" className="bg-[#101a18]">Dependency</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase tracking-wider text-white/80">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Multi-AZ failover replication lag exceeding 90s"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-white/80">
              Description *
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comprehensive description of the condition, consequence, or requirement..."
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              required
            />
          </div>

          {/* Row 3: 5x5 Probability and Impact */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gold uppercase tracking-wider text-[11px]">
                5×5 Scoring Matrix
              </h4>
              <span className="font-mono text-xs font-bold text-white">
                Score: {currentScore} / 25 ({currentLevel})
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-medium text-white/70 mb-1">
                  Probability: {probability} ({PROBABILITY_DESCRIPTIONS[probability].label})
                </label>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as ProbabilityScore[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProbability(p)}
                      className={`flex-1 rounded py-1.5 font-mono font-bold ${
                        probability === p
                          ? "bg-gold text-black"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-white/70 mb-1">
                  Impact: {impact} ({IMPACT_DESCRIPTIONS[impact].label})
                </label>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as ImpactScore[]).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImpact(i)}
                      className={`flex-1 rounded py-1.5 font-mono font-bold ${
                        impact === i
                          ? "bg-rose-500 text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Owner, Status, Priority */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/80">
                Owner / Role
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Lead SRE / Architect"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-white/80">
                Status
              </label>
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RaidStatus)}
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
              <label className="block font-semibold uppercase tracking-wider text-white/80">
                Priority
              </label>
              <select
                aria-label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
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

          {/* Row 5: Mitigation Plan */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-gold">
              Mitigation / Response Plan
            </label>
            <textarea
              rows={2}
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              placeholder="Specific architectural or process steps to neutralize or manage this item..."
              className="mt-1.5 w-full rounded-lg border border-gold/30 bg-black/40 px-3 py-2 text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold px-6 py-2 font-bold text-black shadow-lg shadow-gold/20 hover:brightness-110"
            >
              Add to Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
