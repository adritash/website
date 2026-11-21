"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_BADGES,
  CATEGORY_STATUSES,
  RISK_LEVEL_COLORS,
} from "@/lib/pm/raid-constants";
import {
  RaidCategory,
  RaidFilterState,
  RaidRecord,
  RaidStatus,
} from "@/lib/pm/raid-types";

interface RaidRegisterTableProps {
  records: RaidRecord[];
  filterState: RaidFilterState;
  onFilterChange: (filters: Partial<RaidFilterState>) => void;
  onEditRecord: (record: RaidRecord) => void;
  onDuplicateRecord: (record: RaidRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: RaidStatus) => void;
}

export default function RaidRegisterTable({
  records,
  filterState,
  onFilterChange,
  onEditRecord,
  onDuplicateRecord,
  onDeleteRecord,
  onUpdateStatus,
}: RaidRegisterTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Search query
      if (filterState.searchQuery.trim()) {
        const query = filterState.searchQuery.toLowerCase();
        const matchesQuery =
          r.id.toLowerCase().includes(query) ||
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.cause.toLowerCase().includes(query) ||
          r.owner.toLowerCase().includes(query) ||
          r.suggestedOwnerRole.toLowerCase().includes(query) ||
          r.mitigation.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Category filter
      if (
        filterState.selectedCategory !== "All" &&
        r.category !== filterState.selectedCategory
      ) {
        return false;
      }

      // 3. Status filter
      if (
        filterState.selectedStatus !== "All" &&
        r.status !== filterState.selectedStatus
      ) {
        return false;
      }

      // 4. Priority filter
      if (
        filterState.selectedPriority !== "All" &&
        r.priority !== filterState.selectedPriority
      ) {
        return false;
      }

      // 5. Risk level filter
      if (
        filterState.selectedRiskLevel !== "All" &&
        r.severity !== filterState.selectedRiskLevel
      ) {
        return false;
      }

      // 6. Matrix cell filter
      if (filterState.matrixCellFilter) {
        if (
          r.probability !== filterState.matrixCellFilter.probability ||
          r.impact !== filterState.matrixCellFilter.impact
        ) {
          return false;
        }
      }

      // 7. Validation filter
      if (filterState.onlyRequiresValidation && !r.requiresValidation) {
        return false;
      }

      return true;
    });
  }, [records, filterState]);

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: "",
      selectedCategory: "All",
      selectedStatus: "All",
      selectedPriority: "All",
      selectedRiskLevel: "All",
      matrixCellFilter: null,
      onlyRequiresValidation: false,
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101a18] shadow-xl backdrop-blur-sm">
      {/* Search & Multi-Filter Bar */}
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search across title, cause, mitigation, owner, ID..."
              className="w-full rounded-xl border border-white/15 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {filterState.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange({ searchQuery: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              aria-label="Filter by category"
              value={filterState.selectedCategory}
              onChange={(e) =>
                onFilterChange({
                  selectedCategory: e.target.value as "All" | RaidCategory,
                })
              }
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium text-white focus:border-gold focus:outline-none"
            >
              <option value="All" className="bg-[#101a18]">
                All Categories
              </option>
              <option value="Risk" className="bg-[#101a18]">
                Risks
              </option>
              <option value="Assumption" className="bg-[#101a18]">
                Assumptions
              </option>
              <option value="Issue" className="bg-[#101a18]">
                Issues
              </option>
              <option value="Dependency" className="bg-[#101a18]">
                Dependencies
              </option>
            </select>

            {/* Risk Level Filter */}
            <select
              aria-label="Filter by risk level"
              value={filterState.selectedRiskLevel}
              onChange={(e) =>
                onFilterChange({ selectedRiskLevel: e.target.value })
              }
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium text-white focus:border-gold focus:outline-none"
            >
              <option value="All" className="bg-[#101a18]">
                All Severities
              </option>
              <option value="Critical" className="bg-[#101a18]">
                Critical (16-25)
              </option>
              <option value="High" className="bg-[#101a18]">
                High (10-15)
              </option>
              <option value="Moderate" className="bg-[#101a18]">
                Moderate (5-9)
              </option>
              <option value="Low" className="bg-[#101a18]">
                Low (1-4)
              </option>
            </select>

            {/* Validation Checkbox Toggle */}
            <label className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium text-white/80 cursor-pointer hover:border-gold">
              <input
                type="checkbox"
                checked={filterState.onlyRequiresValidation}
                onChange={(e) =>
                  onFilterChange({ onlyRequiresValidation: e.target.checked })
                }
                className="h-3.5 w-3.5 rounded border-white/20 bg-black/50 accent-gold"
              />
              <span>Needs Validation</span>
            </label>

            {/* Clear All Filters Button */}
            {(filterState.searchQuery ||
              filterState.selectedCategory !== "All" ||
              filterState.selectedRiskLevel !== "All" ||
              filterState.matrixCellFilter ||
              filterState.onlyRequiresValidation) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-white/20"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Matrix Cell Banner */}
        {filterState.matrixCellFilter && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs text-gold">
            <div className="flex items-center gap-2">
              <span className="font-bold">Matrix Cell Filter:</span>
              <span>
                Probability {filterState.matrixCellFilter.probability} × Impact{" "}
                {filterState.matrixCellFilter.impact} (Score:{" "}
                {filterState.matrixCellFilter.probability *
                  filterState.matrixCellFilter.impact}
                )
              </span>
            </div>
            <button
              type="button"
              onClick={() => onFilterChange({ matrixCellFilter: null })}
              className="font-bold hover:underline"
            >
              Remove Filter ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Register Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-5 py-4">ID & Category</th>
              <th className="px-5 py-4">Title & Context</th>
              <th className="px-5 py-4">Risk Exposure</th>
              <th className="px-5 py-4">P × I</th>
              <th className="px-5 py-4">Owner & Role</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Validation</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((item) => {
                const categoryBadge = CATEGORY_BADGES[item.category];
                const riskColor = RISK_LEVEL_COLORS[item.severity];
                const allowedStatuses = CATEGORY_STATUSES[item.category];

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* ID & Category Badge */}
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${categoryBadge.bg} ${categoryBadge.text} ${categoryBadge.border}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {item.category}
                        </span>
                        <span className="font-mono text-xs font-bold text-white/90">
                          {item.id}
                        </span>
                      </div>
                    </td>

                    {/* Title, Description & Cause */}
                    <td className="max-w-md px-5 py-4 align-top">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => onEditRecord(item)}
                          className="text-left font-bold text-white hover:text-gold transition-colors"
                        >
                          {item.title}
                        </button>
                        <p className="line-clamp-2 text-white/70 leading-relaxed">
                          {item.description}
                        </p>
                        {item.mitigation && (
                          <div className="pt-1 text-[11px] text-white/50">
                            <span className="font-semibold text-gold/80">
                              Mitigation:
                            </span>{" "}
                            <span className="line-clamp-1 text-white/60">
                              {item.mitigation}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Risk Exposure / Score */}
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${riskColor.solidBg}`}
                          />
                          {item.severity}
                        </span>
                        <span className="font-mono text-[11px] text-white/60">
                          Score: <strong className="text-white">{item.riskScore}</strong> / 25
                        </span>
                      </div>
                    </td>

                    {/* P x I */}
                    <td className="px-5 py-4 align-top whitespace-nowrap font-mono text-[11px] text-white/70">
                      <div>P: {item.probability} / 5</div>
                      <div>I: {item.impact} / 5</div>
                    </td>

                    {/* Owner & Role */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-white">
                          {item.owner}
                        </p>
                        <p className="text-[11px] text-white/50">
                          {item.suggestedOwnerRole}
                        </p>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <select
                        aria-label="Status"
                        value={item.status}
                        onChange={(e) =>
                          onUpdateStatus(item.id, e.target.value as RaidStatus)
                        }
                        className="rounded-lg border border-white/15 bg-black/60 px-2.5 py-1.5 text-[11px] font-medium text-white focus:border-gold focus:outline-none"
                      >
                        {allowedStatuses.map((st) => (
                          <option key={st} value={st} className="bg-[#101a18]">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Validation Flag */}
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      {item.requiresValidation ? (
                        <span
                          title={item.validationNotes || "Requires stakeholder validation"}
                          className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300"
                        >
                          <span>⚠ Pending</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400/80 font-medium text-[11px]">
                          ✓ Verified
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEditRecord(item)}
                          title="View / Edit Details"
                          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition-all hover:bg-white/15 hover:text-white"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>

                        {/* Duplicate Button */}
                        <button
                          type="button"
                          onClick={() => onDuplicateRecord(item)}
                          title="Duplicate Record"
                          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition-all hover:bg-white/15 hover:text-white"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteRecord(item.id);
                                setDeleteConfirmId(null);
                              }}
                              className="rounded bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded bg-white/10 px-1.5 py-1 text-[10px] text-white/70 hover:bg-white/20"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Delete Record"
                            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 transition-all hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full bg-white/5 p-4 text-white/30">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-white/80">
                      No matching RAID records found
                    </p>
                    <p className="text-xs text-white/50">
                      Try adjusting your search criteria or resetting filters.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Count info */}
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3.5 text-xs text-white/50">
        <div>
          Showing <span className="font-bold text-white">{filteredRecords.length}</span> of{" "}
          <span className="font-bold text-white">{records.length}</span> total records
        </div>
        <div>
          ADRITASH PM Copilot • ISO/IEC 31000 & PMI-RMP Compliant
        </div>
      </div>
    </div>
  );
}
