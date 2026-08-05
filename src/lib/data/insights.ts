export type BlogPost = {
  slug: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "enterprise-architecture-in-the-age-of-ai",
    date: "June 2025",
    tag: "Architecture",
    title: "Enterprise Architecture in the Age of AI",
    excerpt:
      "How AI is changing the assumptions that enterprise architects have held for decades — and what it means for technology strategy.",
  },
  {
    slug: "cloud-migration-what-fails",
    date: "May 2025",
    tag: "Cloud",
    title: "Cloud Migration: What Actually Fails",
    excerpt:
      "Most cloud migrations underdeliver not because of technology but because of governance, skill gaps, and unclear ownership.",
  },
];
