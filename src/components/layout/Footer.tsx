import Link from "next/link";

const links = [
  { label: "Solutions", href: "/solutions" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-xl font-bold text-white">Adritash</p>
            <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest">Enterprise Technology</p>
            <p className="mt-3 text-sm max-w-xs leading-relaxed">
              Helping organisations modernise enterprise technology through architecture, cloud, and AI.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-sm">
          © {new Date().getFullYear()} Adritash. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
