import Link from "next/link";
import { profile } from "@/lib/data/profile";
import { contact, footerLinks, siteConfig, social } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-dark text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
              {profile.initials}
            </div>
            <p className="text-xl font-bold text-white">{profile.name}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-brand-light">
              {profile.role}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed">
              {profile.tagline}
            </p>
            <p className="mt-2 text-xs text-white/60">
              {siteConfig.brand} · Personal Portfolio
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/90">
              Explore
            </p>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/90">
              Connect
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={contact.emailHref} className="transition-colors hover:text-white">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={contact.phoneHref} className="transition-colors hover:text-white">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={social.credly} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  Credly Badges
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm">
          <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
