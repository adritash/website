"use client";

import { useEffect, useRef, useState } from "react";
import RaidContextForm from "@/components/pm/raid/RaidContextForm";
import RaidControls from "@/components/pm/raid/RaidControls";
import RaidDetailModal from "@/components/pm/raid/RaidDetailModal";
import RaidExportModal from "@/components/pm/raid/RaidExportModal";
import RaidManualAddModal from "@/components/pm/raid/RaidManualAddModal";
import RaidRegisterTable from "@/components/pm/raid/RaidRegisterTable";
import RaidSummaryCards from "@/components/pm/raid/RaidSummaryCards";
import RiskMatrix5x5 from "@/components/pm/raid/RiskMatrix5x5";
import {
  INITIAL_SAMPLE_RECORDS,
  SAMPLE_PROJECT_CONTEXT,
} from "@/lib/pm/raid-constants";
import {
  GenerationDepth,
  ProjectContext,
  RaidCategory,
  RaidFilterState,
  RaidRecord,
  RaidStatus,
} from "@/lib/pm/raid-types";

const STORAGE_KEY_CONTEXT = "adritash_pm_raid_context_v1";
const STORAGE_KEY_RECORDS = "adritash_pm_raid_records_v1";

type ActiveTab = "register" | "matrix" | "report" | "context";

export default function RaidGeneratorPage() {
  const [projectContext, setProjectContext] = useState<ProjectContext>(
    SAMPLE_PROJECT_CONTEXT
  );
  const [records, setRecords] = useState<RaidRecord[]>(INITIAL_SAMPLE_RECORDS);
  const [activeTab, setActiveTab] = useState<ActiveTab>("register");

  // Step 1 & 2 panel collapse state (allows focusing on table when reviewing)
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false);
  const [showRaidExplainer, setShowRaidExplainer] = useState(false);

  // AI Controls state
  const [selectedCategory, setSelectedCategory] = useState<"all" | RaidCategory>(
    "all"
  );
  const [recordCount, setRecordCount] = useState<5 | 10 | 15 | 20>(10);
  const [depth, setDepth] = useState<GenerationDepth>("Standard");
  const [replaceMode, setReplaceMode] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccessMessage, setGenerationSuccessMessage] = useState<
    string | null
  >(null);

  // Table filter state
  const [filterState, setFilterState] = useState<RaidFilterState>({
    searchQuery: "",
    selectedCategory: "All",
    selectedStatus: "All",
    selectedPriority: "All",
    selectedRiskLevel: "All",
    matrixCellFilter: null,
    onlyRequiresValidation: false,
  });

  // Modals state
  const [editingRecord, setEditingRecord] = useState<RaidRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef<HTMLDivElement>(null);

  // 1. Restore from localStorage on client mount.
  // This intentionally runs in an effect (not a lazy useState initializer)
  // so the first client render still matches the server-rendered HTML
  // (SAMPLE_PROJECT_CONTEXT / INITIAL_SAMPLE_RECORDS) before hydration,
  // then swaps in the saved data right after mount. Lint flags this as
  // "setState in effect", but moving the localStorage read into a lazy
  // useState initializer would read browser-only storage during the
  // server-rendered pass too and risk a hydration mismatch.
  /* eslint-disable react-hooks/set-state-in-effect -- intentional, see comment above */
  useEffect(() => {
    try {
      const savedContext = localStorage.getItem(STORAGE_KEY_CONTEXT);
      if (savedContext) {
        setProjectContext(JSON.parse(savedContext));
      }
      const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
    } catch (e) {
      console.warn("Could not parse saved RAID data from localStorage", e);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 2. Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTEXT, JSON.stringify(projectContext));
    } catch (e) {
      console.warn("Failed to persist project context", e);
    }
  }, [projectContext]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn("Failed to persist RAID records", e);
    }
  }, [records]);

  // Check if minimal required baseline is filled
  const isReadyToGenerate =
    Boolean(projectContext.projectName?.trim()) &&
    Boolean(projectContext.projectObjective?.trim()) &&
    Boolean(projectContext.projectDescription?.trim());

  // Save the whole workspace to a JSON file
  const handleSaveJson = () => {
    const payload = {
      app: "adritash-raid-generator",
      version: 1,
      savedAt: new Date().toISOString(),
      projectContext,
      records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug =
      (projectContext.projectName || "raid-register")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "raid-register";
    a.download = `${slug}-raid.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore a workspace from a previously saved JSON file
  const handleImportJson = async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File is too large.");
      const data = JSON.parse(await file.text());
      if (
        data?.app !== "adritash-raid-generator" ||
        !data.projectContext ||
        typeof data.projectContext !== "object" ||
        !Array.isArray(data.records)
      ) {
        throw new Error("Not an ADRITASH RAID Generator save file.");
      }
      if (
        !window.confirm(
          `Replace the current register with ${data.records.length} records from "${file.name}"?`
        )
      ) {
        return;
      }
      setProjectContext(data.projectContext);
      setRecords(data.records);
    } catch (err) {
      window.alert(
        err instanceof Error ? `Could not import: ${err.message}` : "Could not import file."
      );
    }
  };

  // Reset all to sample defaults
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        "Reset project context and RAID register back to default sample data?"
      )
    ) {
      setProjectContext(SAMPLE_PROJECT_CONTEXT);
      setRecords(INITIAL_SAMPLE_RECORDS);
      setFilterState({
        searchQuery: "",
        selectedCategory: "All",
        selectedStatus: "All",
        selectedPriority: "All",
        selectedRiskLevel: "All",
        matrixCellFilter: null,
        onlyRequiresValidation: false,
      });
      setGenerationError(null);
      setGenerationSuccessMessage("Restored default enterprise sample dataset.");
      setTimeout(() => setGenerationSuccessMessage(null), 3000);
    }
  };

  // Generate RAID using server-side Gemini API
  const handleGenerate = async () => {
    if (!isReadyToGenerate) {
      setGenerationError(
        "Please fill in Project Name, Strategic Objective, and Scope Details in Step 1 (or pick a Quick Template) before generating."
      );
      setIsSetupCollapsed(false);
      setupRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccessMessage(null);

    try {
      const response = await fetch("/api/pm/raid/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext,
          categoryFilter: selectedCategory,
          recordCount,
          depth,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate RAID register.");
      }

      const generatedItems: RaidRecord[] = data.records;

      if (replaceMode || records.length === 0) {
        setRecords(generatedItems);
      } else {
        // Append mode: re-index IDs cleanly
        const existingIds = new Set(records.map((r) => r.id));
        const filteredNew = generatedItems.filter((r) => !existingIds.has(r.id));
        setRecords([...records, ...filteredNew]);
      }

      setGenerationSuccessMessage(
        data.summary ||
          `Successfully synthesized ${generatedItems.length} RAID records using Gemini 3.8 Flash.`
      );
      setActiveTab("register");

      // Smooth scroll down to results section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: unknown) {
      console.error("Generation error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while communicating with the AI engine.";
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Record CRUD helpers
  const handleSaveRecord = (updated: RaidRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleDuplicateRecord = (item: RaidRecord) => {
    const codeMap: Record<RaidCategory, string> = {
      Risk: "RSK",
      Assumption: "ASM",
      Issue: "ISS",
      Dependency: "DEP",
    };
    const newId = `${codeMap[item.category]}-${String(records.length + 1).padStart(3, "0")}`;
    const duplicate: RaidRecord = {
      ...item,
      id: newId,
      title: `${item.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecords((prev) => [duplicate, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateStatus = (id: string, newStatus: RaidStatus) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const handleEditRecord = (item: RaidRecord) => {
    setEditingRecord(item);
    setIsDetailOpen(true);
  };

  const handleAddManual = (newRecord: RaidRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setActiveTab("register");
  };

  return (
    <div className="min-h-screen text-white">
      {/* Tool toolbar (sits under the site navbar; the shared shell provides the sidebar) */}
      <header className="sticky top-16 z-30 border-b border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="min-w-0 truncate text-sm font-semibold text-white">
            RAID Generator
            <span className="ml-2 text-xs font-medium text-white/50">
              {projectContext.projectName || "Untitled Project"}
            </span>
          </p>

          {/* Top Actions: Reset & Export */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleSaveJson}
              title="Save this register to a JSON file"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              Save JSON
            </button>
            <label
              title="Load a saved JSON register"
              className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all focus-within:ring-2 focus-within:ring-gold"
            >
              Import JSON
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void handleImportJson(f);
                }}
              />
            </label>

            <button
              type="button"
              onClick={handleResetToDefaults}
              title="Reset data back to sample project"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <svg className="h-3.5 w-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Sample
            </button>

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold/20 transition-all shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Report</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101a18] via-[#14201e] to-ink p-6 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  AI Project Management Copilot • Powered by Gemini 3.8 Flash
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
                  Autonomous RAID Generator &amp; Risk Matrix
                </h1>
                <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                  Quickly turn any project plan into an enterprise-ready RAID register, 5×5 risk heatmap, and executive briefing. Fill in 3 basic fields in Step 1, select your options in Step 2, and click Generate!
                </p>
              </div>

              {/* Active Project Pill */}
              <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 p-4 lg:w-72">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Target Project
                </span>
                <p className="mt-1 font-bold text-sm text-white line-clamp-1">
                  {projectContext.projectName || "Untitled Project"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white/80">
                    {projectContext.projectType}
                  </span>
                  <span className="rounded bg-gold/15 px-2 py-0.5 font-semibold text-gold">
                    {projectContext.projectPhase}
                  </span>
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-400">
                    {records.length} items logged
                  </span>
                </div>
              </div>
            </div>

            {/* 3-Step Guided Roadmap */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/5 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-xs font-black text-gold">
                  1
                </span>
                <div className="text-xs">
                  <p className="font-bold text-white">Step 1: Project Basics</p>
                  <p className="text-white/50 text-[11px]">Enter name, goal &amp; scope, or pick a template</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/5 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-xs font-black text-gold">
                  2
                </span>
                <div className="text-xs">
                  <p className="font-bold text-white">Step 2: Choose Settings</p>
                  <p className="text-white/50 text-[11px]">Select item volume, depth &amp; click Generate</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/5 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-xs font-black text-gold">
                  3
                </span>
                <div className="text-xs">
                  <p className="font-bold text-white">Step 3: Review &amp; Export</p>
                  <p className="text-white/50 text-[11px]">Inspect 5×5 matrix, RAID table &amp; PDF briefing</p>
                </div>
              </div>
            </div>

            {/* Layman "What is a RAID Log?" Accordion */}
            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowRaidExplainer(!showRaidExplainer)}
                className="flex items-center gap-2 text-xs font-semibold text-gold hover:text-[#e8c48f] transition-colors"
              >
                <span>{showRaidExplainer ? "▲ Hide" : "▼ What is a RAID Log?"} Beginner Guide to Risks, Assumptions, Issues &amp; Dependencies</span>
              </button>

              {showRaidExplainer && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-xs font-black text-rose-400">R</span>
                      <span className="font-bold text-xs text-white">Risks (What could go wrong?)</span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
                      Future events that haven&apos;t happened yet, but could damage your schedule, cost, or quality if they do occur (e.g. key engineer leaving, API latency spikes).
                    </p>
                  </div>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-xs font-black text-cyan-400">A</span>
                      <span className="font-bold text-xs text-white">Assumptions (What are we guessing?)</span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
                      Beliefs you consider to be true without absolute proof. They must be validated early before they silently turn into severe issues (e.g. cloud credits will be approved).
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-xs font-black text-amber-400">I</span>
                      <span className="font-bold text-xs text-white">Issues (What is broken right now?)</span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
                      Active problems and blockers currently impacting your team that require immediate corrective action and an assigned owner to resolve.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-xs font-black text-purple-400">D</span>
                      <span className="font-bold text-xs text-white">Dependencies (Who are we waiting on?)</span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
                      Tasks, components, or external deliverables that your project relies on from outside teams, vendors, or systems before you can proceed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Global Notifications / Banners */}
        {generationSuccessMessage && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>{generationSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setGenerationSuccessMessage(null)}
              className="font-bold hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {generationError && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠</span>
              <span>{generationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGenerationError(null)}
              className="font-bold hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            STAGE 1 & 2: PROJECT ENTRY & AI SYNTHESIS CONTROLS
            ========================================================================= */}
        <section ref={setupRef} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Project Baseline &amp; Generation Controls
              </h2>
            </div>
            {records.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSetupCollapsed(!isSetupCollapsed)}
                className="text-xs font-semibold text-gold hover:underline"
              >
                {isSetupCollapsed ? "▼ Show Project Setup & Settings" : "▲ Collapse Setup to View Table"}
              </button>
            )}
          </div>

          {!isSetupCollapsed ? (
            <div className="space-y-6">
              {/* Step 1: Project Details Form */}
              <RaidContextForm
                context={projectContext}
                onChange={setProjectContext}
                onReset={() => {
                  if (window.confirm("Clear project context fields?")) {
                    setProjectContext({
                      projectName: "",
                      projectDescription: "",
                      projectType: "Cloud Migration",
                      projectObjective: "",
                      projectPhase: "Initiation",
                    });
                  }
                }}
              />

              {/* Step 2: Generation Controls & Action */}
              <RaidControls
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                recordCount={recordCount}
                onRecordCountChange={setRecordCount}
                depth={depth}
                onDepthChange={setDepth}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onAddManual={() => setIsManualAddOpen(true)}
                hasExistingRecords={records.length > 0}
                replaceMode={replaceMode}
                onToggleReplaceMode={setReplaceMode}
                isReadyToGenerate={isReadyToGenerate}
                projectName={projectContext.projectName}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#101a18] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-sm">
                  🎯
                </span>
                <div>
                  <p className="font-bold text-sm text-white">
                    {projectContext.projectName}
                  </p>
                  <p className="text-xs text-white/60">
                    {projectContext.projectType} • Phase: {projectContext.projectPhase} • {records.length} items synthesized
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSetupCollapsed(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-white/10"
                >
                  ✏️ Edit Project Baseline
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-lg bg-gold px-3.5 py-1.5 text-xs font-bold text-black hover:brightness-110"
                >
                  {isGenerating ? "Synthesizing..." : "⚡ Regenerate"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            STAGE 3: LIVE DASHBOARD, REGISTER & EXECUTIVE BRIEFING
            ========================================================================= */}
        <section ref={resultsRef} id="results-section" className="space-y-6 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-[11px] font-black text-gold">
                  3
                </span>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Step 3: Executive Results &amp; Reports
                </h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-mono text-white">
                  {records.length} Total Records
                </span>
              </div>
              <p className="mt-1 text-xs text-white/60">
                Click any summary card below to filter the register, or switch tabs to view the 5×5 Risk Matrix and Executive Briefing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManualAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
              >
                + Manual Item
              </button>
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 px-3.5 py-2 text-xs font-bold text-gold hover:bg-gold/20 shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Portfolio Live KPI Cards */}
          <RaidSummaryCards
            records={records}
            selectedCategory={filterState.selectedCategory}
            onlyRequiresValidation={filterState.onlyRequiresValidation}
            onSelectCategory={(cat) =>
              setFilterState((prev) => ({
                ...prev,
                selectedCategory: cat,
                onlyRequiresValidation: false,
                matrixCellFilter: null,
              }))
            }
            onSelectValidationOnly={() =>
              setFilterState((prev) => ({
                ...prev,
                onlyRequiresValidation: !prev.onlyRequiresValidation,
              }))
            }
          />

          {/* Navigation Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex space-x-6 text-xs font-bold uppercase tracking-wider overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "register"
                    ? "border-gold text-gold"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <span>📋 RAID Register</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white">
                  {records.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "matrix"
                    ? "border-gold text-gold"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <span>🎯 5×5 Risk Matrix</span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                  {records.filter((r) => r.category === "Risk").length} Risks
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "report"
                    ? "border-gold text-gold"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <span>📑 Executive Briefing</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSetupCollapsed(false);
                  setupRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="pb-3 border-b-2 border-transparent text-white/50 hover:text-gold transition-all flex items-center gap-1.5 shrink-0 ml-auto"
              >
                <span>✏️ Edit Project Baseline</span>
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </button>
            </nav>
          </div>

          {/* Tab 1: Full Register Table */}
          {activeTab === "register" && (
            <div className="space-y-6">
              <RaidRegisterTable
                records={records}
                filterState={filterState}
                onFilterChange={(newFilters) =>
                  setFilterState((prev) => ({ ...prev, ...newFilters }))
                }
                onEditRecord={handleEditRecord}
                onDuplicateRecord={handleDuplicateRecord}
                onDeleteRecord={handleDeleteRecord}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          )}

          {/* Tab 2: Dedicated 5x5 Matrix */}
          {activeTab === "matrix" && (
            <div className="space-y-6">
              <RiskMatrix5x5
                records={records}
                activeCell={filterState.matrixCellFilter}
                onCellClick={(cell) => {
                  setFilterState((prev) => ({
                    ...prev,
                    matrixCellFilter: cell,
                    selectedCategory: cell ? "Risk" : prev.selectedCategory,
                  }));
                  if (cell) {
                    // Switch to register tab so the user immediately sees the filtered items!
                    setActiveTab("register");
                  }
                }}
              />
            </div>
          )}

          {/* Tab 3: Executive Briefing Summary */}
          {activeTab === "report" && (
            <div className="rounded-2xl border border-white/10 bg-[#101a18] p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                    Executive Governance Briefing
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {projectContext.projectName}
                  </h2>
                  <p className="mt-1 text-xs text-white/60">
                    {projectContext.projectType} • Phase: {projectContext.projectPhase}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-black hover:brightness-110 shadow"
                >
                  Download / Print Formal PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Strategic Objective
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed rounded-xl bg-black/30 p-4 border border-white/5">
                    {projectContext.projectObjective || "None specified"}
                  </p>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 pt-2">
                    Key Deliverables &amp; Constraints
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed rounded-xl bg-black/30 p-4 border border-white/5">
                    {projectContext.keyDeliverables || "None specified"}
                    {projectContext.projectConstraints ? ` | Constraints: ${projectContext.projectConstraints}` : ""}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Risk &amp; Delivery Posture Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                      <span className="text-rose-400 font-bold block">Critical / High Risks</span>
                      <span className="text-2xl font-black text-white mt-1 block">
                        {records.filter((r) => r.category === "Risk" && (r.severity === "Critical" || r.severity === "High")).length}
                      </span>
                    </div>
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <span className="text-cyan-400 font-bold block">Assumptions Unverified</span>
                      <span className="text-2xl font-black text-white mt-1 block">
                        {records.filter((r) => r.category === "Assumption" && r.requiresValidation).length}
                      </span>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <span className="text-amber-400 font-bold block">Open Issues</span>
                      <span className="text-2xl font-black text-white mt-1 block">
                        {records.filter((r) => r.category === "Issue" && r.status !== "Closed").length}
                      </span>
                    </div>
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                      <span className="text-purple-400 font-bold block">Total Dependencies</span>
                      <span className="text-2xl font-black text-white mt-1 block">
                        {records.filter((r) => r.category === "Dependency").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <RaidDetailModal
        record={editingRecord}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
      />

      <RaidManualAddModal
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onAdd={handleAddManual}
        existingCount={records.length}
      />

      <RaidExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectContext={projectContext}
        records={records}
      />
    </div>
  );
}
