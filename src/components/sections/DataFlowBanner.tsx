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
      className="group relative w-72 shrink-0 overflow-hidden rounded-xl border border-brand/40 bg-[#1a0a0e] shadow-lg ring-1 ring-white/10 transition-all hover:z-10 hover:scale-[1.02] hover:border-brand/70 hover:ring-brand/30 sm:w-80 lg:w-[26rem]"
    >
      <div className="relative aspect-[16/10] w-full bg-[#1f1014]">
        {arch.diagramImage && (
          <Image
            src={arch.diagramImage}
            alt={arch.diagramAlt ?? `${arch.title} architecture diagram`}
            fill
            quality={92}
            sizes="(max-width: 640px) 288px, (max-width: 1024px) 320px, 416px"
            className="object-contain object-center p-1 transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/40 p-3 backdrop-blur-sm sm:p-3.5">
          <span
            className={`inline-flex rounded px-2 py-0.5 text-xs font-bold shadow-sm ${cloudBadgeStyles[arch.cloud]}`}
          >
            {arch.cloud}
          </span>
          <p className="mt-1.5 line-clamp-1 text-sm font-semibold leading-tight text-white drop-shadow-sm sm:text-base">
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
      className={`data-flow-banner relative overflow-hidden border-b border-border bg-surface-dark pt-5 pb-2 sm:pt-7 sm:pb-2 ${
        paused ? "is-paused" : ""
      }`}
      aria-label="Architecture data flow showcase"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(128,0,32,0.12),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mx-auto mb-3 flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/90 sm:text-sm">
            Live data flows
          </p>
          <div className="flex items-center gap-2">
            {paused && (
              <span className="text-xs font-medium uppercase tracking-wider text-brand-light">
                Paused
              </span>
            )}
            <Link
              href="/architecture"
              className="text-xs font-semibold text-white/90 transition-colors hover:text-white sm:text-sm"
            >
              Explore →
            </Link>
          </div>
        </div>

        <div
          className="data-flow-marquee w-full overflow-hidden border-y border-brand/30 bg-black/20"
          aria-label="Architecture diagrams scrolling"
        >
          <div
            className={`data-flow-marquee-track data-flow-marquee-left data-flow-marquee-slow ${
              paused ? "is-paused" : ""
            }`}
          >
            <div className="flex shrink-0 items-center gap-5 pr-5">
              {marqueeItems.map((arch, index) => (
                <ArchitectureFlowCard
                  key={`a-${arch.id}-${index}`}
                  arch={arch}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-5 pr-5" aria-hidden="true">
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

        <p className="mt-1.5 text-center text-xs text-white/70">
          Hover a card to pause
        </p>
      </div>
    </section>
  );
}
