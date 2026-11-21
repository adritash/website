import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content/posts";
import { siteConfig } from "@/lib/site";

const routes = [
  "",
  "/about",
  "/experience",
  "/skills",
  "/architecture",
  "/projects",
  "/insights",
  "/resume",
  "/contact",
  "/dashboards",
  "/dashboards/project-management",
  "/dashboards/project-management/raid-generator",
  "/dashboards/presentation",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const postEntries = posts.map((p) => ({
    url: `${siteConfig.url}/insights/${p.slug}`,
    lastModified: new Date(`${p.date}T00:00:00Z`),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));
  return [...routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "" ? 1 : 0.8,
  })), ...postEntries];
}
