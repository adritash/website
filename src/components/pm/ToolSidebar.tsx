"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pmTools } from "@/lib/pm/tools";

const baseItem =
  "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap";

export default function ToolSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="PM Toolkit"
      className="border-b border-white/10 bg-ink px-3 py-3 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-4 lg:py-6"
    >
      <p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gold lg:block">
        PM Toolkit
      </p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        <li>
          <Link
            href="/dashboards/project-management"
            className={`${baseItem} ${
              pathname === "/dashboards/project-management"
                ? "bg-gold/15 text-gold"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            Overview
          </Link>
        </li>
        {pmTools.map((tool) => {
          const active = pathname === tool.href && tool.status === "live";
          if (tool.status === "soon") {
            return (
              <li key={tool.slug}>
                <span
                  aria-disabled="true"
                  className={`${baseItem} cursor-not-allowed text-white/45`}
                >
                  {tool.name}
                  <span className="sr-only"> (coming soon)</span>
                </span>
              </li>
            );
          }
          return (
            <li key={tool.slug}>
              <Link
                href={tool.href}
                aria-current={active ? "page" : undefined}
                className={`${baseItem} ${
                  active
                    ? "bg-gold/15 text-gold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tool.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
