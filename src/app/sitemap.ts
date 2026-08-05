import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const routes = [
  "",
  "/about",
  "/experience",
  "/skills",
  "/projects",
  "/insights",
  "/resume",
  "/contact",
  "/insights/enterprise-architecture-in-the-age-of-ai",
  "/insights/cloud-migration-what-fails",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
