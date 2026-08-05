"use client";

import { useState } from "react";
import type { ExperienceEntry } from "@/lib/data/experience";
import Card from "@/components/ui/Card";

type ExperienceTimelineProps = {
  entries: ExperienceEntry[];
};

export default function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(entries[0]?.id ?? null);

  return (
    <ol className="space-y-0">
      {entries.map((job, index) => {
        const isOpen = expanded === job.id;
        const isLast = index === entries.length - 1;

        return (
          <li key={job.id} className="relative flex gap-5 pb-10 sm:gap-8 sm:pb-12">
            {!isLast && (
              <div
                className="absolute left-[11px] top-10 bottom-0 w-px bg-border"
                aria-hidden="true"
              />
            )}
            <div
              className="mt-1.5 h-6 w-6 shrink-0 rounded-full border-4 border-background bg-brand ring-1 ring-brand/30"
              aria-hidden="true"
            />
            <div className="flex-1">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpanded(isOpen ? null : job.id)}
                aria-expanded={isOpen}
                aria-controls={`exp-${job.id}`}
              >
                <Card hover={false} className="!p-5 sm:!p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {job.role}
                      </h3>
                      <p className="text-sm font-medium text-brand">
                        {job.company} · {job.location}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted">
                        {job.impact}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                        {job.period}
                      </span>
                      <svg
                        className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div
                    id={`exp-${job.id}`}
                    className={`overflow-hidden transition-all ${isOpen ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <ul className="space-y-2 border-t border-border pt-4">
                      {job.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-start gap-2 text-sm text-muted"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden="true"
                          />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
