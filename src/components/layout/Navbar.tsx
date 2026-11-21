"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { aboutLinks, assets, dashboardLinks, navLinks, siteConfig } from "@/lib/site";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"about" | "dashboards" | null>(null);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(true);
  const [mobileDashboardsOpen, setMobileDashboardsOpen] = useState(true);
  const pathname = usePathname();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close menus on route change (adjust state during render instead of in
  // an effect, per https://react.dev/learn/you-might-not-need-an-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setOpenDropdown(null);
  }

  const handleMouseEnter = useCallback((type: "about" | "dashboards") => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenDropdown(type);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
      closeTimerRef.current = null;
    }, 150);
  }, []);

  const isAboutActive =
    pathname === "/about" ||
    pathname === "/experience" ||
    pathname === "/skills" ||
    pathname === "/projects";

  const isDashboardActive =
    pathname.startsWith("/dashboards") || pathname === "/architecture";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink shadow-lg shadow-black/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Logo + Wordmark */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          aria-label={`${siteConfig.brand} home`}
        >
          <span className="relative block aspect-[965/200] h-9 shrink-0 sm:h-11">
            <Image
              src={assets.lockup}
              alt={siteConfig.brand}
              fill
              sizes="(max-width: 640px) 174px, 213px"
              priority
              className="object-contain object-left"
            />
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            // Dropdown Menu for About or Dashboards
            if ("isDropdown" in link && link.isDropdown) {
              const dropdownType = link.dropdownType;
              const isCurrentlyOpen = openDropdown === dropdownType;
              const isActive =
                dropdownType === "about" ? isAboutActive : isDashboardActive;

              const items = dropdownType === "about" ? aboutLinks : dashboardLinks;
              const categoryTitle =
                dropdownType === "about" ? "Leadership & Background" : "Enterprise Consoles";

              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(dropdownType)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={link.href}
                    aria-expanded={isCurrentlyOpen}
                    aria-haspopup="true"
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium tracking-wide transition-all duration-150 xl:px-3.5 ${
                      isActive
                        ? "bg-gold/15 text-gold border border-gold/30"
                        : "text-white/60 hover:bg-white/8 hover:text-white/90 border border-transparent"
                    }`}
                  >
                    <span>{link.label}</span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isCurrentlyOpen ? "rotate-180 text-gold" : "text-white/40"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Dropdown list appearing below */}
                  {isCurrentlyOpen && (
                    <div
                      className="absolute left-0 top-full mt-1.5 w-84 rounded-xl border border-white/15 bg-ink p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gold/90">
                          {categoryTitle}
                        </p>
                      </div>

                      <div className="space-y-1">
                        {items.map((item, idx) => {
                          const itemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              className={`group flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                                itemActive
                                  ? "bg-gold/15 text-gold"
                                  : "hover:bg-white/8 text-white/80 hover:text-white"
                              }`}
                            >
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-bold text-gold group-hover:bg-gold group-hover:text-ink transition-colors">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                                    {item.title}
                                  </span>
                                  {"badge" in item && (
                                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/50 group-hover:text-gold">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-xs text-white/50 group-hover:text-white/70">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {dropdownType === "dashboards" && (
                        <div className="mt-2 border-t border-white/10 pt-2 px-2">
                          <Link
                            href="/dashboards"
                            className="block text-center text-xs font-semibold text-gold hover:text-[#e2bb5e] transition-colors py-1"
                          >
                            View All Dashboards Overview →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Standard Nav Item
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium tracking-wide transition-all duration-150 xl:px-3.5 ${
                  active
                    ? "bg-gold/15 text-gold border border-gold/30"
                    : "text-white/60 hover:bg-white/8 hover:text-white/90 border border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/contact"
            className="hidden rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink tracking-wide transition-all duration-150 hover:bg-[#e2bb5e] hover:shadow-md hover:shadow-gold/25 sm:inline-flex"
          >
            Connect
          </Link>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div id="mobile-nav" className="border-t border-white/10 bg-ink lg:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              if ("isDropdown" in link && link.isDropdown) {
                const isAbout = link.dropdownType === "about";
                const isExpanded = isAbout ? mobileAboutOpen : mobileDashboardsOpen;
                const toggleExpanded = isAbout
                  ? () => setMobileAboutOpen((prev) => !prev)
                  : () => setMobileDashboardsOpen((prev) => !prev);
                const items = isAbout ? aboutLinks : dashboardLinks;

                return (
                  <div key={link.href} className="flex flex-col rounded-md bg-white/5 p-2">
                    <button
                      type="button"
                      onClick={toggleExpanded}
                      className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-white"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gold" />
                        {link.label}
                      </span>
                      <svg
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "rotate-180 text-gold" : "text-white/50"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1 pl-3 border-l border-white/10">
                        {items.map((item, idx) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            <span className="text-gold font-bold mr-1.5">{idx + 1}.</span>
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-3 text-sm font-medium tracking-wide transition-colors ${
                    active
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "text-white/70 hover:bg-white/8 hover:text-white border border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-gold px-3 py-3 text-center text-sm font-semibold text-ink tracking-wide"
            >
              Connect
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
