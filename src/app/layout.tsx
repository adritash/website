import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { connection } from "next/server";
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${profile.name} — ${siteConfig.tagline}`,
    template: `%s | ${profile.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Dwaipayan Rajguru",
    "enterprise architect",
    "cloud migration",
    "AI transformation",
    "technology leader",
    "FinTech",
    "Pune",
  ],
  authors: [{ name: profile.name, url: siteConfig.url }],
  creator: profile.name,
  openGraph: {
    type: "profile",
    locale: "en_IN",
    siteName: profile.name,
    title: `${profile.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: assets.profilePhoto, width: 1024, height: 1536, alt: profile.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [assets.profilePhoto],
  },
  robots: { index: true, follow: true },
};

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: profile.summary,
    url: siteConfig.url,
    image: `${siteConfig.url}${assets.profilePhoto}`,
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pune",
      addressCountry: "IN",
    },
    sameAs: [social.linkedin, social.credly],
    knowsAbout: skillCategories.flatMap((c) => c.skills),
    hasCredential: certifications.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: c.issuer,
    })),
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: profile.education.institution,
    },
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
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
      </body>
    </html>
  );
}
