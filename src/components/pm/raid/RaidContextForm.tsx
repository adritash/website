"use client";

import { useId, useState } from "react";
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

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-white/35 transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

const labelClass = "block text-sm font-semibold text-white/90";

type OptionalField = {
  key: keyof ProjectContext;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "textarea";
};

const OPTIONAL_FIELDS: OptionalField[] = [
  { key: "projectManager", label: "Project manager", placeholder: "e.g. Sarah Jenkins, PMP" },
  { key: "projectSponsor", label: "Sponsor", placeholder: "e.g. Chief Information Officer" },
  { key: "businessUnit", label: "Business unit", placeholder: "e.g. Global Payments" },
  { key: "startDate", label: "Start date", type: "date" },
  { key: "targetCompletionDate", label: "Target completion", type: "date" },
  { key: "stakeholders", label: "Key stakeholders", placeholder: "e.g. InfoSec, Regulators, Cloud Ops" },
  { key: "technologyStack", label: "Technology stack", placeholder: "e.g. AWS EKS, Kafka, Terraform" },
  { key: "keyDeliverables", label: "Deliverables & milestones", placeholder: "e.g. Phase 1: Shadow ledger; Phase 2: Cutover" },
  { key: "knownChallenges", label: "Known challenges", type: "textarea", placeholder: "e.g. Legacy batch scripts lack documentation" },
  { key: "projectConstraints", label: "Constraints & deadlines", type: "textarea", placeholder: "e.g. $3.5M budget; Q4 change freeze" },
  { key: "additionalContext", label: "Anything else", placeholder: "e.g. Vendor API v2 breaking change next month" },
];

export default function RaidContextForm({
  context,
  onChange,
  onReset,
}: RaidContextFormProps) {
  const id = useId();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>("fintech-cloud");

  const updateField = <K extends keyof ProjectContext>(
    key: K,
    value: ProjectContext[K]
  ) => {
    setSelectedTemplateId(null);
    onChange({ ...context, [key]: value });
  };

  const handleSelectTemplate = (template: ProjectStarterTemplate) => {
    setSelectedTemplateId(template.id);
    onChange({ ...template.context });
  };

  const optionalFilled = OPTIONAL_FIELDS.filter((f) =>
    String(context[f.key] ?? "").trim()
  ).length;

  return (
    <div className="space-y-6">
      {/* Example picker */}
      <fieldset>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <legend className="text-sm font-semibold text-white/90">
            Start from an example{" "}
            <span className="font-normal text-white/50">or write your own below</span>
          </legend>
          <button
            type="button"
            onClick={() => {
              setSelectedTemplateId(null);
              onReset();
            }}
            className="text-xs font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            Clear fields
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PROJECT_STARTER_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                aria-pressed={isSelected}
                title={tmpl.description}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-gold bg-gold/15 text-white"
                    : "border-white/15 bg-black/30 text-white/75 hover:border-white/30 hover:text-white"
                }`}
              >
                <span aria-hidden="true">{tmpl.icon}</span>
                {tmpl.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Required fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            Project name <span className="text-gold" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-name`}
            type="text"
            value={context.projectName}
            onChange={(e) => updateField("projectName", e.target.value)}
            placeholder="e.g. Mobile Banking App Launch"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor={`${id}-objective`} className={labelClass}>
            Goal <span className="text-gold" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-objective`}
            type="text"
            value={context.projectObjective}
            onChange={(e) => updateField("projectObjective", e.target.value)}
            placeholder="What does success look like? e.g. Launch by Q4 with 99.99% uptime"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor={`${id}-description`} className={labelClass}>
            Scope <span className="text-gold" aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${id}-description`}
            rows={4}
            value={context.projectDescription}
            onChange={(e) => updateField("projectDescription", e.target.value)}
            placeholder="Systems involved, teams, vendors, approach, regulatory constraints..."
            aria-describedby={`${id}-description-hint`}
            className={inputClass}
            required
          />
          <p id={`${id}-description-hint`} className="mt-1 text-xs text-white/50">
            More detail here gives more specific results.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-type`} className={labelClass}>
              Project type
            </label>
            <select
              id={`${id}-type`}
              value={context.projectType}
              onChange={(e) => updateField("projectType", e.target.value as ProjectType)}
              className={inputClass}
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#101a18] text-white">
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-phase`} className={labelClass}>
              Current phase
            </label>
            <select
              id={`${id}-phase`}
              value={context.projectPhase}
              onChange={(e) => updateField("projectPhase", e.target.value as ProjectPhase)}
              className={inputClass}
            >
              {PROJECT_PHASES.map((phase) => (
                <option key={phase} value={phase} className="bg-[#101a18] text-white">
                  {phase}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Optional details (progressive disclosure) */}
      <details className="group rounded-xl border border-white/10 bg-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden">
          <span>
            More details{" "}
            <span className="text-white/50">
              (optional{optionalFilled > 0 ? `, ${optionalFilled} filled` : ""})
            </span>
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
        <div className="grid grid-cols-1 gap-4 border-t border-white/10 p-4 sm:grid-cols-2">
          {OPTIONAL_FIELDS.map((f) => {
            const fieldId = `${id}-${f.key}`;
            const value = String(context[f.key] ?? "");
            const wide = f.type === "textarea" || f.key === "stakeholders" || f.key === "technologyStack" || f.key === "keyDeliverables" || f.key === "additionalContext";
            return (
              <div key={f.key} className={wide ? "sm:col-span-2" : undefined}>
                <label htmlFor={fieldId} className="block text-xs font-medium text-white/70">
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    id={fieldId}
                    rows={2}
                    value={value}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={fieldId}
                    type={f.type ?? "text"}
                    value={value}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                )}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
