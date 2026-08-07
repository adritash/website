"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Architecture } from "@/lib/data/architectures";
import { architectures } from "@/lib/data/architectures";

const cloudBadgeStyles = {
  AWS: "bg-orange-500/90 text-white",
  GCP: "bg-blue-500/90 text-white",
} as const;

const flowItems = architectures.filter((arch) => arch.diagramImage);

// Repeat items so the track stays filled on wide screens.
const marqueeItems = [...flowItems, ...flowItems, ...flowItems];

type ArchitectureFlowCardProps = {
  arch: Architecture;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

function ArchitectureFlowCard({ arch, onHoverStart, onHoverEnd }: ArchitectureFlowCardProps) {
  return (
    <Link
      href="/architecture"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      className="group relative w-44 shrink-0 overflow-hidden rounded-lg border border-brand/30 bg-black/30 shadow-md transition-all hover:z-10 hover:scale-[1.03] hover:border-brand/60 sm:w-52"
    >
      <div className="relative aspect-[16/10] w-full">
        {arch.diagramImage && (
          <Image
            src={arch.diagramImage}
            alt=""
            fill
            sizes="208px"
            className="object-cover object-center opacity-75 transition-opacity duration-500 group-hover:opacity-95"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent opacity-60 data-flow-scan" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <span
            className={`inline-flex rounded px-1 py-0.5 text-[9px] font-bold ${cloudBadgeStyles[arch.cloud]}`}
          >
            {arch.cloud}
          </span>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-tight text-white sm:text-xs">
            {arch.title}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function DataFlowBanner() {
  const [paused, setPaused] = useState(false);
  const pauseCountRef = useRef(0);

  const handleHoverStart = useCallback(() => {
    pauseCountRef.current += 1;
    setPaused(true);
  }, []);

  const handleHoverEnd = useCallback(() => {
    pauseCountRef.current = Math.max(0, pauseCountRef.current - 1);
    if (pauseCountRef.current === 0) {
      setPaused(false);
    }
  }, []);

  return (
    <section
      className={`data-flow-banner relative overflow-hidden border-b border-border bg-surface-dark py-3 sm:py-4 ${
        paused ? "is-paused" : ""
      }`}
      aria-label="Architecture data flow showcase"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(128,0,32,0.2),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70 sm:text-xs">
            Live data flows
          </p>
          <div className="flex items-center gap-2">
            {paused && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-brand">
                Paused
              </span>
            )}
            <Link
              href="/architecture"
              className="text-[10px] font-semibold text-white/70 transition-colors hover:text-white sm:text-xs"
            >
              Explore →
            </Link>
          </div>
        </div>

        <div
          className="data-flow-marquee w-full overflow-hidden border-y border-brand/20"
          aria-label="Architecture diagrams scrolling"
        >
          <div
            className={`data-flow-marquee-track data-flow-marquee-left data-flow-marquee-slow ${
              paused ? "is-paused" : ""
            }`}
          >
            <div className="flex shrink-0 items-center gap-3 pr-3">
              {marqueeItems.map((arch, index) => (
                <ArchitectureFlowCard
                  key={`a-${arch.id}-${index}`}
                  arch={arch}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3 pr-3" aria-hidden="true">
              {marqueeItems.map((arch, index) => (
                <ArchitectureFlowCard
                  key={`b-${arch.id}-${index}`}
                  arch={arch}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] text-white/50">
          Hover a card to pause
        </p>
      </div>
    </section>
  );
}
