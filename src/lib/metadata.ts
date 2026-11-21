import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
};

export function createPageMetadata({
  title,
  description,
  path = "",
}: PageMetadataOptions): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle =
    path === "/" || path === ""
      ? `${siteConfig.brand} — ${siteConfig.tagline}`
      : `${title} | ${siteConfig.brand}`;

  return {
    // absolute: fullTitle already includes the name, so skip the layout's "%s | name" template
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: siteConfig.brand,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
