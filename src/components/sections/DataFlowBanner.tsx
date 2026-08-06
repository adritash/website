"use client";

import Image from "next/image";
import Link from "next/link";
import { architectures } from "@/lib/data/architectures";

const cloudBadgeStyles = {
  AWS: "bg-orange-500/90 text-white",
  GCP: "bg-blue-500/90 text-white",
} as const;

const flowItems = architectures.filter((arch) => arch.diagramImage);

export default function DataFlowBanner() {
  return (
    <section
      className="relative overflow-hidden border-b border-border bg-surface-dark"
      aria-label="Architecture data flow showcase"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(129,140,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300 sm:text-left">
            End-to-end cloud architectures · live data flows
          </p>
          <Link
            href="/architecture"
            className="text-xs font-semibold text-indigo-300 transition-colors hover:text-white"
          >
            Explore all →
          </Link>
        </div>

        <div className="relative">
          <svg
            className="data-flow-svg pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            <path
              d="M 140 100 L 360 100"
              fill="none"
              stroke="url(#flowLine)"
              strokeWidth="2"
              strokeDasharray="8 6"
              className="data-flow-line"
            />
            <path
              d="M 390 100 L 610 100"
              fill="none"
              stroke="url(#flowLine)"
              strokeWidth="2"
              strokeDasharray="8 6"
              className="data-flow-line data-flow-line-delay-1"
            />
            <path
              d="M 640 100 L 860 100"
              fill="none"
              stroke="url(#flowLine)"
              strokeWidth="2"
              strokeDasharray="8 6"
              className="data-flow-line data-flow-line-delay-2"
            />

            <circle r="5" fill="#a5b4fc" className="data-flow-pulse data-flow-particle">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 140 100 L 360 100" />
            </circle>
            <circle r="4" fill="#c7d2fe" className="data-flow-pulse data-flow-particle">
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                begin="1.3s"
                path="M 390 100 L 610 100"
              />
            </circle>
            <circle r="5" fill="#a5b4fc" className="data-flow-pulse data-flow-particle">
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                begin="2.6s"
                path="M 640 100 L 860 100"
              />
            </circle>
            <circle r="3" fill="#ffffff" opacity="0.9" className="data-flow-particle">
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                begin="0.5s"
                path="M 140 100 L 860 100"
              />
            </circle>
          </svg>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {flowItems.map((arch, index) => (
              <Link
                key={arch.id}
                href="/architecture"
                className={`data-flow-card group relative overflow-hidden rounded-xl border border-indigo-500/25 bg-slate-900/50 shadow-lg transition-all hover:border-indigo-400/50 hover:shadow-indigo-500/10 data-flow-card-delay-${index}`}
              >
                <div className="relative aspect-[16/10] w-full">
                  {arch.diagramImage && (
                    <Image
                      src={arch.diagramImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 45vw, 25vw"
                      className="object-cover object-center opacity-70 transition-opacity duration-500 group-hover:opacity-90"
                      priority={index < 2}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-60 data-flow-scan" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${cloudBadgeStyles[arch.cloud]}`}
                    >
                      {arch.cloud}
                    </span>
                    <p className="mt-1 text-xs font-semibold leading-tight text-white sm:text-sm">
                      {arch.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 sm:hidden" aria-hidden="true">
            <span className="data-flow-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="data-flow-dot data-flow-line-delay-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="data-flow-dot data-flow-line-delay-2 h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-300">
              Data flowing →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
