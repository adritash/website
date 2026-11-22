"use client";

import { useEffect, useRef, useState } from "react";
import RaidContextForm from "@/components/pm/raid/RaidContextForm";
import RaidControls from "@/components/pm/raid/RaidControls";
import RaidDetailModal from "@/components/pm/raid/RaidDetailModal";
import RaidExportModal from "@/components/pm/raid/RaidExportModal";
import RaidManualAddModal from "@/components/pm/raid/RaidManualAddModal";
import RaidRegisterTable from "@/components/pm/raid/RaidRegisterTable";
import RaidReportPreview from "@/components/pm/raid/RaidReportPreview";
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

  // Collapse the input form into a summary bar once results are generated
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false);

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
  const [isReportOpen, setIsReportOpen] = useState(false);
  // Don't persist until saved data has been restored, otherwise the sample
  // data can overwrite it (React runs mount effects twice in development).
  const [hasRestored, setHasRestored] = useState(false);

  const resultsRef = useRef<HTMLElement>(null);
  const setupRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);

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
    setHasRestored(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 2. Persist to localStorage on change
  useEffect(() => {
    if (!hasRestored) return;
    try {
      localStorage.setItem(STORAGE_KEY_CONTEXT, JSON.stringify(projectContext));
    } catch (e) {
      console.warn("Failed to persist project context", e);
    }
  }, [projectContext, hasRestored]);

  useEffect(() => {
    if (!hasRestored) return;
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn("Failed to persist RAID records", e);
    }
  }, [records, hasRestored]);

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
      setGenerationSuccessMessage("Restored the sample project.");
      setTimeout(() => setGenerationSuccessMessage(null), 3000);
    }
  };

  // Generate RAID using server-side Gemini API
  const handleGenerate = async () => {
    if (!isReadyToGenerate) {
      setGenerationError(
        "Add a project name, goal and scope (or pick an example) before generating."
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
          `Generated ${generatedItems.length} RAID items.`
      );
      setActiveTab("register");
      setIsSetupCollapsed(true);

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

  const tabs: { id: Exclude<ActiveTab, "context">; label: string; count?: number }[] = [
    { id: "register", label: "Register", count: records.length },
    { id: "matrix", label: "Risk matrix", count: records.filter((r) => r.category === "Risk").length },
    { id: "report", label: "Briefing" },
  ];

  const closeMenu = () => menuRef.current?.removeAttribute("open");

  return (
    <div className="min-h-screen text-white">
      {/* Tool toolbar (sits under the site navbar; the shared shell provides the sidebar) */}
      <header className="sticky top-16 z-30 border-b border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <p className="min-w-0 truncate text-sm font-semibold text-white">
            RAID Generator
            <span className="ml-2 text-xs font-medium text-white/50">
              {projectContext.projectName || "Untitled project"}
            </span>
          </p>

          <div className="flex items-center gap-2">
            {/* File menu: save / import / reset */}
            <details ref={menuRef} className="relative">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden">
                File
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#101a18] py-1 text-sm shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    handleSaveJson();
                  }}
                  className="block w-full px-4 py-2 text-left text-white/80 hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:outline-none"
                >
                  Save to file (.json)
                </button>
                <label className="block cursor-pointer px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white focus-within:bg-white/5">
                  Open saved file…
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      closeMenu();
                      if (f) void handleImportJson(f);
                    }}
                  />
                </label>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    handleResetToDefaults();
                  }}
                  className="block w-full px-4 py-2 text-left text-white/60 hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:outline-none"
                >
                  Reset to sample data
                </button>
              </div>
            </details>

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black shadow-md shadow-gold/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export<span className="hidden sm:inline"> report</span></span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="max-w-3xl space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            RAID Generator
          </h1>
          <p className="text-sm leading-relaxed text-white/70 sm:text-base">
            Describe your project and get a starter register of Risks, Assumptions,
            Issues and Dependencies, with a 5×5 risk matrix and a briefing you can export.
          </p>
          <details className="group text-sm">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded font-medium text-gold hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden">
              What is a RAID log?
              <svg aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-white/70 sm:grid-cols-2">
              <div><dt className="inline font-semibold text-rose-300">Risks</dt> <dd className="inline">: things that could go wrong.</dd></div>
              <div><dt className="inline font-semibold text-cyan-300">Assumptions</dt> <dd className="inline">: beliefs you still need to prove.</dd></div>
              <div><dt className="inline font-semibold text-amber-300">Issues</dt> <dd className="inline">: problems happening right now.</dd></div>
              <div><dt className="inline font-semibold text-purple-300">Dependencies</dt> <dd className="inline">: work you are waiting on from others.</dd></div>
            </dl>
          </details>
        </section>

        {/* =========================================================================
            STEP 1: DESCRIBE & GENERATE
            ========================================================================= */}
        <section ref={setupRef} aria-labelledby="raid-step-1" className="scroll-mt-32">
          <div className="mb-3 flex items-center gap-2.5">
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">1</span>
            <h2 id="raid-step-1" className="text-lg font-semibold text-white">Describe your project</h2>
          </div>

          {isSetupCollapsed ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101a18] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{projectContext.projectName || "Untitled project"}</p>
                <p className="text-xs text-white/60">
                  {projectContext.projectType} · {projectContext.projectPhase}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSetupCollapsed(false)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-lg bg-gold px-3.5 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-60"
                >
                  {isGenerating ? "Generating…" : "Generate again"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 rounded-2xl border border-white/10 bg-[#101a18] p-5 sm:p-7">
              <RaidContextForm
                context={projectContext}
                onChange={setProjectContext}
                onReset={() => {
                  if (window.confirm("Clear the project fields?")) {
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

              <RaidControls
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                recordCount={recordCount}
                onRecordCountChange={setRecordCount}
                depth={depth}
                onDepthChange={setDepth}
                isGenerating={isGenerating}
                hasExistingRecords={records.length > 0}
                replaceMode={replaceMode}
                onToggleReplaceMode={setReplaceMode}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/55">
                  {isReadyToGenerate
                    ? "Results usually take 10 to 30 seconds."
                    : "Fill in the name, goal and scope to continue."}
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !isReadyToGenerate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-black shadow-lg shadow-gold/10 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      Generate RAID register
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status messages */}
          <div aria-live="polite" className="mt-3 space-y-2">
            {generationSuccessMessage && (
              <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <span>{generationSuccessMessage}</span>
                <button type="button" aria-label="Dismiss message" onClick={() => setGenerationSuccessMessage(null)} className="text-emerald-200/70 hover:text-white">✕</button>
              </div>
            )}
            {generationError && (
              <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <span>{generationError}</span>
                <button type="button" aria-label="Dismiss error" onClick={() => setGenerationError(null)} className="text-rose-200/70 hover:text-white">✕</button>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            STEP 2: REVIEW RESULTS
            ========================================================================= */}
        <section ref={resultsRef} id="results-section" aria-labelledby="raid-step-2" className="scroll-mt-32 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">2</span>
              <h2 id="raid-step-2" className="text-lg font-semibold text-white">Review your register</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManualAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add item
              </button>
              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                disabled={records.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-gold/20 transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
                Export report
              </button>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
              <p className="font-semibold text-white">No items yet</p>
              <p className="mt-1 text-sm text-white/60">
                Generate a register above, or add an item by hand.
              </p>
            </div>
          ) : (
            <>
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

              {/* Tabs */}
              <div role="tablist" aria-label="Result views" className="flex gap-1 overflow-x-auto border-b border-white/10">
                {tabs.map((t) => {
                  const selected = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`raid-tab-${t.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`raid-panel-${t.id}`}
                      onClick={() => setActiveTab(t.id)}
                      className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        selected ? "border-gold text-gold" : "border-transparent text-white/60 hover:text-white"
                      }`}
                    >
                      {t.label}
                      {t.count !== undefined && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                          {t.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" id={`raid-panel-${activeTab}`} aria-labelledby={`raid-tab-${activeTab}`}>
                {activeTab === "register" && (
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
                )}

                {activeTab === "matrix" && (
                  <RiskMatrix5x5
                    records={records}
                    activeCell={filterState.matrixCellFilter}
                    onCellClick={(cell) => {
                      setFilterState((prev) => ({
                        ...prev,
                        matrixCellFilter: cell,
                        selectedCategory: cell ? "Risk" : prev.selectedCategory,
                      }));
                      // Jump to the register so the filtered items are visible.
                      if (cell) setActiveTab("register");
                    }}
                  />
                )}

                {activeTab === "report" && (
                  <div className="space-y-6 rounded-2xl border border-white/10 bg-[#101a18] p-6 sm:p-8">
                    <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold">Executive briefing</p>
                        <h3 className="mt-1 text-xl font-bold text-white">{projectContext.projectName}</h3>
                        <p className="mt-1 text-xs text-white/60">
                          {projectContext.projectType} · {projectContext.projectPhase}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsReportOpen(true)}
                        className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-gold/20 hover:brightness-110"
                      >
                        Preview PDF report
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Goal</h4>
                          <p className="mt-1.5 leading-relaxed text-white/80">
                            {projectContext.projectObjective || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Deliverables &amp; constraints</h4>
                          <p className="mt-1.5 leading-relaxed text-white/80">
                            {projectContext.keyDeliverables || "Not specified"}
                            {projectContext.projectConstraints ? `. Constraints: ${projectContext.projectConstraints}` : ""}
                          </p>
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        {[
                          { label: "Critical / high risks", value: records.filter((r) => r.category === "Risk" && (r.severity === "Critical" || r.severity === "High")).length, tone: "text-rose-300" },
                          { label: "Unverified assumptions", value: records.filter((r) => r.category === "Assumption" && r.requiresValidation).length, tone: "text-cyan-300" },
                          { label: "Open issues", value: records.filter((r) => r.category === "Issue" && r.status !== "Closed").length, tone: "text-amber-300" },
                          { label: "Dependencies", value: records.filter((r) => r.category === "Dependency").length, tone: "text-purple-300" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl border border-white/10 bg-black/30 p-4">
                            <dt className={`font-semibold ${s.tone}`}>{s.label}</dt>
                            <dd className="mt-1 text-2xl font-bold text-white">{s.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            </>
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
        onOpenReport={() => setIsReportOpen(true)}
      />

      <RaidReportPreview
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        projectContext={projectContext}
        records={records}
      />
    </div>
  );
}
