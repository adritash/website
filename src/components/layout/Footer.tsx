import Image from "next/image";
import Link from "next/link";
import { profile } from "@/lib/data/profile";
import { assets, contact, footerLinks, siteConfig, social } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-dark text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Image
              src={assets.logo}
              alt={`${siteConfig.brand}: ${siteConfig.tagline}`}
              width={1000}
              height={793}
              sizes="288px"
              className="mb-5 w-72 max-w-full rounded-xl ring-1 ring-white/10"
            />
            <p className="mt-3 max-w-md text-sm leading-relaxed">
              {profile.tagline}
            </p>
            <p className="mt-2 text-xs text-white/60">
              Founded by {profile.name} · Preview test change
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
                  Founder LinkedIn
                </a>
              </li>
              <li>
                <a href={social.linkedinCompany} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  ADRITASH on LinkedIn
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
          <p>© {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
