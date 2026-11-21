"use client";

import { useState } from "react";
import {
  PROJECT_PHASES,
  PROJECT_STARTER_TEMPLATES,
  PROJECT_TYPES,
  ProjectStarterTemplate,
} from "@/lib/pm/raid-constants";
import { ProjectContext, ProjectPhase, ProjectType } from "@/lib/pm/raid-types";

interface RaidContextFormProps {
  context: ProjectContext;
  onChange: (updated: ProjectContext) => void;
  onReset: () => void;
}

export default function RaidContextForm({
  context,
  onChange,
  onReset,
}: RaidContextFormProps) {
  const [showOptional, setShowOptional] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>("fintech-cloud");

  const updateField = <K extends keyof ProjectContext>(
    key: K,
    value: ProjectContext[K]
  ) => {
    setSelectedTemplateId(null);
    onChange({
      ...context,
      [key]: value,
    });
  };

  const handleSelectTemplate = (template: ProjectStarterTemplate) => {
    setSelectedTemplateId(template.id);
    onChange({ ...template.context });
  };

  const isNameFilled = Boolean(context.projectName?.trim());
  const isObjectiveFilled = Boolean(context.projectObjective?.trim());
  const isDescriptionFilled = Boolean(context.projectDescription?.trim());
  const isReady = isNameFilled && isObjectiveFilled && isDescriptionFilled;

  const filledCount = [isNameFilled, isObjectiveFilled, isDescriptionFilled].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101a18] p-6 shadow-xl backdrop-blur-sm sm:p-7 space-y-6">
      {/* Header & Quick Action Row */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-[11px] font-black text-gold">
              1
            </span>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Step 1: Define Your Project
            </h3>
            {isReady ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                ✓ Ready to Generate
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {filledCount}/3 Required Fields
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-white/70 max-w-2xl leading-relaxed">
            The AI generates Risks, Assumptions, Issues, and Dependencies based on this baseline. Enter your project info below or select a one-click template to get started instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
            title="Clear all fields to type your own from scratch"
          >
            Clear Form
          </button>
        </div>
      </div>

      {/* Quick Template Picker */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
          Quick Start Templates (Click one to auto-fill realistic project details)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PROJECT_STARTER_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "border-gold bg-gold/15 shadow-md shadow-gold/10"
                    : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{tmpl.icon}</span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-gold text-black font-extrabold"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {tmpl.categoryBadge}
                  </span>
                </div>
                <span className="font-bold text-xs text-white mt-1.5 line-clamp-1">
                  {tmpl.name}
                </span>
                <span className="text-[10px] text-white/60 line-clamp-2 mt-0.5">
                  {tmpl.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Core Fields Form */}
      <div className="space-y-4 pt-1">
        {/* Row 1: Project Name & Type */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
                1. Project Name <span className="text-gold font-black">*</span>
              </label>
              {isNameFilled ? (
                <span className="text-[10px] text-emerald-400 font-medium">✓ Provided</span>
              ) : (
                <span className="text-[10px] text-amber-400/80 font-medium">Required</span>
              )}
            </div>
            <input
              type="text"
              value={context.projectName}
              onChange={(e) => updateField("projectName", e.target.value)}
              placeholder="e.g. Next-Gen Mobile Banking & Biometric App"
              className={`mt-1.5 w-full rounded-xl border bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ${
                !isNameFilled ? "border-amber-500/30" : "border-white/15"
              }`}
              required
            />
            <p className="mt-1 text-[11px] text-white/50">
              A recognizable title for your program or initiative.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
              Project Type <span className="text-gold font-black">*</span>
            </label>
            <select
              aria-label="Project type"
              value={context.projectType}
              onChange={(e) => updateField("projectType", e.target.value as ProjectType)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#101a18] text-white">
                  {type}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-white/50">
              Helps AI tailor domain risks.
            </p>
          </div>
        </div>

        {/* Row 2: Objective & Phase */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
                2. Strategic Objective / Success Criteria <span className="text-gold font-black">*</span>
              </label>
              {isObjectiveFilled ? (
                <span className="text-[10px] text-emerald-400 font-medium">✓ Provided</span>
              ) : (
                <span className="text-[10px] text-amber-400/80 font-medium">Required</span>
              )}
            </div>
            <input
              type="text"
              value={context.projectObjective}
              onChange={(e) => updateField("projectObjective", e.target.value)}
              placeholder="e.g. Cut settlement latency from 4 hours to < 90s, pass SOX audit, and achieve zero data loss"
              className={`mt-1.5 w-full rounded-xl border bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ${
                !isObjectiveFilled ? "border-amber-500/30" : "border-white/15"
              }`}
              required
            />
            <p className="mt-1 text-[11px] text-white/50">
              What does success look like? What target metrics or dates matter?
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
              Delivery Phase <span className="text-gold font-black">*</span>
            </label>
            <select
              aria-label="Project phase"
              value={context.projectPhase}
              onChange={(e) => updateField("projectPhase", e.target.value as ProjectPhase)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {PROJECT_PHASES.map((phase) => (
                <option key={phase} value={phase} className="bg-[#101a18] text-white">
                  {phase}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-white/50">
              Current lifecycle stage.
            </p>
          </div>
        </div>

        {/* Row 3: Comprehensive Description */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/90">
              3. Project Scope & Architecture Details <span className="text-gold font-black">*</span>
            </label>
            {isDescriptionFilled ? (
              <span className="text-[10px] text-emerald-400 font-medium">✓ Provided</span>
            ) : (
              <span className="text-[10px] text-amber-400/80 font-medium">Required</span>
            )}
          </div>
          <textarea
            rows={3}
            value={context.projectDescription}
            onChange={(e) => updateField("projectDescription", e.target.value)}
            placeholder="Describe the systems involved, key teams, external vendors, migration strategy, regulatory constraints, and target technology stack..."
            className={`mt-1.5 w-full rounded-xl border bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ${
              !isDescriptionFilled ? "border-amber-500/30" : "border-white/15"
            }`}
            required
          />
          <p className="mt-1 text-[11px] text-white/50">
            The more context you give here, the more realistic and specific the AI risks, dependencies, and assumptions will be.
          </p>
        </div>

        {/* Optional Collapsible Section */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gold hover:bg-white/10 transition-colors"
          >
            <span>{showOptional ? "▲ Hide" : "▼ Show"} Advanced Enterprise Fields (Optional: Budget, Dates, Stakeholders, Constraints)</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
              11 fields
            </span>
          </button>

          {showOptional && (
            <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/20 p-5 transition-all">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-white/70">Project Manager</label>
                  <input
                    type="text"
                    value={context.projectManager || ""}
                    onChange={(e) => updateField("projectManager", e.target.value)}
                    placeholder="e.g. Sarah Jenkins, PMP"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Project Sponsor</label>
                  <input
                    type="text"
                    value={context.projectSponsor || ""}
                    onChange={(e) => updateField("projectSponsor", e.target.value)}
                    placeholder="e.g. Chief Information Officer"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Business Unit</label>
                  <input
                    type="text"
                    value={context.businessUnit || ""}
                    onChange={(e) => updateField("businessUnit", e.target.value)}
                    placeholder="e.g. Global Payments & Clearing"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-white/70">Start Date</label>
                  <input
                    type="date"
                    value={context.startDate || ""}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Target Completion Date</label>
                  <input
                    type="date"
                    value={context.targetCompletionDate || ""}
                    onChange={(e) => updateField("targetCompletionDate", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70">Key Stakeholders</label>
                <input
                  type="text"
                  value={context.stakeholders || ""}
                  onChange={(e) => updateField("stakeholders", e.target.value)}
                  placeholder="e.g. Enterprise Architecture, InfoSec, Regulators, Cloud Ops, 3rd Party Vendors"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70">Technology Stack</label>
                <input
                  type="text"
                  value={context.technologyStack || ""}
                  onChange={(e) => updateField("technologyStack", e.target.value)}
                  placeholder="e.g. AWS EKS, Kafka, Aurora Postgres, Terraform, Spring Boot, Datadog"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70">Key Deliverables & Milestones</label>
                <input
                  type="text"
                  value={context.keyDeliverables || ""}
                  onChange={(e) => updateField("keyDeliverables", e.target.value)}
                  placeholder="e.g. Phase 1: Shadow ledger; Phase 2: Dual-run testing; Phase 3: Traffic cutover"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-white/70">Known Challenges</label>
                  <textarea
                    rows={2}
                    value={context.knownChallenges || ""}
                    onChange={(e) => updateField("knownChallenges", e.target.value)}
                    placeholder="e.g. Legacy batch scripts lack documentation; stringent RPO=0 SLA"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Project Constraints & Deadlines</label>
                  <textarea
                    rows={2}
                    value={context.projectConstraints || ""}
                    onChange={(e) => updateField("projectConstraints", e.target.value)}
                    placeholder="e.g. Budget envelope $3.5M; Q4 holiday change freeze; dual-run compliance"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70">Additional Context / Special Notes</label>
                <input
                  type="text"
                  value={context.additionalContext || ""}
                  onChange={(e) => updateField("additionalContext", e.target.value)}
                  placeholder="e.g. 3rd-party gateway vendor releases API v2 breaking change next month"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
