"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Architecture } from "@/lib/data/architectures";
import { architectures } from "@/lib/data/architectures";
import ArchitectureDiagram from "@/components/sections/ArchitectureDiagram";
import PageHero from "@/components/sections/PageHero";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";

function architectureIdFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;

  const id = raw.startsWith("diagram-")
    ? raw.slice("diagram-".length)
    : raw.startsWith("architecture-")
      ? raw.slice("architecture-".length)
      : raw;

  return architectures.some((arch) => arch.id === id) ? id : null;
}

function setArchitectureHash(id: string | null) {
  const url = new URL(window.location.href);
  url.hash = id ?? "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

const cloudBadgeStyles = {
  AWS: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  GCP: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
} as const;

type ArchitectureDashboardProps = {
  items?: Architecture[];
};

export default function ArchitectureDashboard({
  items = architectures,
}: ArchitectureDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((a) => a.id === selectedId);

  useEffect(() => {
    function syncFromHash() {
      setSelectedId(architectureIdFromHash(window.location.hash));
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedId]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setArchitectureHash(id);
  }

  function handleBack() {
    setSelectedId(null);
    setArchitectureHash(null);
  }

  if (selected) {
    return (
      <Section background="white" className="!pt-10 sm:!pt-12">
        <article id={selected.id} className="section-anchor">
          <Card hover={false} className="!p-6 sm:!p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${cloudBadgeStyles[selected.cloud]}`}
                  >
                    {selected.cloud}
                  </span>
                  <h1 className="text-2xl font-semibold text-foreground">
                    {selected.title}
                  </h1>
                </div>
                <p className="mt-2 text-muted">{selected.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={handleBack}
                className="shrink-0 text-sm font-medium text-brand hover:underline"
              >
                Back to overview
              </button>
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {selected.overview}
              </p>
            </section>

            <section id={`diagram-${selected.id}`} className="section-anchor mt-10">
              <h2 className="text-lg font-semibold text-foreground">
                Architecture Layers
              </h2>
              <p className="mt-1 text-sm text-muted">
                End-to-end stack from channels through storage and observability.
              </p>
              <div className="mt-6">
                {selected.diagramImage ? (
                  <figure className="overflow-hidden rounded-xl border border-border bg-surface">
                    <Image
                      src={selected.diagramImage}
                      alt={
                        selected.diagramAlt ??
                        `${selected.title} architecture diagram`
                      }
                      width={selected.diagramWidth ?? 1536}
                      height={selected.diagramHeight ?? 1024}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
                      className="h-auto w-full"
                    />
                  </figure>
                ) : (
                  <ArchitectureDiagram layers={selected.layers} />
                )}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-foreground">Data Flow</h2>
              <ol className="mt-4 space-y-4">
                {selected.dataFlow.map((step) => (
                  <li key={step.step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
                      {step.step}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{step.label}</p>
                      <p className="mt-1 text-sm text-muted">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-foreground">
                Design Decisions
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {selected.decisions.map((decision) => (
                  <div
                    key={decision.title}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <h3 className="font-semibold text-foreground">{decision.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {decision.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </Card>
        </article>
      </Section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Architecture"
        title="Reference designs for real-world workloads"
        description="Click each architecture to explore the full end-to-end cloud stack — layers, services, data flows, and key design decisions."
      />

      <Section background="white">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => handleSelect(arch.id)}
              className="text-left"
            >
              <Card hover className="h-full transition-all">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${cloudBadgeStyles[arch.cloud]}`}
                  >
                    {arch.cloud}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  {arch.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{arch.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {arch.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {arch.highlightServices.map((service) => (
                    <Badge key={service} variant="brand">
                      {service}
                    </Badge>
                  ))}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}
