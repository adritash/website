import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono, Montserrat } from "next/font/google";
import { connection } from "next/server";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkipLink from "@/components/ui/SkipLink";
import ChatWidget from "@/components/ai/ChatWidget";
import { certifications } from "@/lib/data/certifications";
import { profile } from "@/lib/data/profile";
import { skillCategories } from "@/lib/data/skills";
import { assets, contact, siteConfig, social } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-wordmark",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a1211",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.brand} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.brand}`,
  },
  description: siteConfig.description,
  keywords: [
    "ADRITASH",
    "Dwaipayan Rajguru",
    "enterprise architecture consultancy",
    "cloud migration",
    "AI transformation",
    "technology leader",
    "FinTech",
    "Pune",
  ],
  authors: [{ name: siteConfig.brand, url: siteConfig.url }],
  creator: siteConfig.brand,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.brand,
    title: `${siteConfig.brand} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: assets.ogImage, width: 1200, height: 630, alt: `${siteConfig.brand}: ${siteConfig.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brand} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [assets.ogImage],
  },
  robots: { index: true, follow: true },
};

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.brand,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}${assets.logo}`,
    image: `${siteConfig.url}${assets.profilePhoto}`,
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pune",
      addressCountry: "IN",
    },
    founder: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.role,
      description: profile.summary,
      sameAs: [social.linkedin, social.credly],
    },
    sameAs: [social.linkedinCompany, social.linkedin],
    knowsAbout: skillCategories.flatMap((c) => c.skills),
    hasCredential: certifications.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: c.issuer,
    })),
    alumniOf: profile.education.map((item) => ({
      "@type": "CollegeOrUniversity",
      name: item.institution,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${montserrat.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <JsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        <SkipLink />
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <ChatWidget />
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
