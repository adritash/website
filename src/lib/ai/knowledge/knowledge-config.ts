import path from "node:path";

export type KnowledgeCategory =
  | "about"
  | "service"
  | "architecture"
  | "case-study"
  | "ai"
  | "cloud"
  | "consulting"
  | "resource";

export type KnowledgeDocumentStatus = "published" | "draft";
export type KnowledgeVisibility = "public" | "private";

export type KnowledgeDocumentConfig = {
  id: string;
  relativePath: string;
  title: string;
  category: KnowledgeCategory;
  topic: string;
  status: KnowledgeDocumentStatus;
  visibility: KnowledgeVisibility;
  publicUrl?: string;
};

const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge");

export const PUBLIC_METADATA_FILTER =
  'status="published" AND visibility="public"';

export const KNOWLEDGE_MANIFEST_PATH = path.join(
  KNOWLEDGE_ROOT,
  ".ingest-manifest.json"
);

export const knowledgeDocuments: KnowledgeDocumentConfig[] = [
  {
    id: "adritash",
    relativePath: "about/adritash.md",
    title: "About Adritash",
    category: "about",
    topic: "adritash",
    status: "published",
    visibility: "public",
    publicUrl: "/about",
  },
  {
    id: "application-architecture",
    relativePath: "services/application-architecture.md",
    title: "Application Architecture",
    category: "service",
    topic: "application-architecture",
    status: "published",
    visibility: "public",
    publicUrl: "/skills",
  },
  {
    id: "cloud-migration",
    relativePath: "services/cloud-migration.md",
    title: "Cloud Migration",
    category: "service",
    topic: "cloud-migration",
    status: "published",
    visibility: "public",
    publicUrl: "/insights/cloud-migration-what-fails",
  },
  {
    id: "ai-architecture",
    relativePath: "services/ai-architecture.md",
    title: "AI Architecture",
    category: "service",
    topic: "ai-architecture",
    status: "published",
    visibility: "public",
    publicUrl: "/skills",
  },
  {
    id: "financial-reporting",
    relativePath: "architecture/financial-reporting.md",
    title: "Financial Reporting Architecture",
    category: "architecture",
    topic: "financial-reporting",
    status: "published",
    visibility: "public",
    publicUrl: "/architecture",
  },
  {
    id: "ledger-validation",
    relativePath: "architecture/ledger-validation.md",
    title: "Ledger Validation Architecture",
    category: "architecture",
    topic: "ledger-validation",
    status: "published",
    visibility: "public",
    publicUrl: "/architecture",
  },
  {
    id: "stock-market-agent",
    relativePath: "architecture/stock-market-agent.md",
    title: "Stock Market Agent Architecture",
    category: "architecture",
    topic: "stock-market-agent",
    status: "published",
    visibility: "public",
    publicUrl: "/architecture",
  },
  {
    id: "rag",
    relativePath: "ai/rag.md",
    title: "Retrieval-Augmented Generation (RAG)",
    category: "ai",
    topic: "rag",
    status: "published",
    visibility: "public",
  },
  {
    id: "agentic-ai",
    relativePath: "ai/agentic-ai.md",
    title: "Agentic AI",
    category: "ai",
    topic: "agentic-ai",
    status: "published",
    visibility: "public",
  },
  {
    id: "mcp",
    relativePath: "ai/mcp.md",
    title: "Model Context Protocol (MCP)",
    category: "ai",
    topic: "mcp",
    status: "published",
    visibility: "public",
  },
  {
    id: "consulting-overview",
    relativePath: "consulting/overview.md",
    title: "Consulting Overview",
    category: "consulting",
    topic: "consulting",
    status: "published",
    visibility: "public",
    publicUrl: "/about",
  },
  {
    id: "contact",
    relativePath: "resources/contact.md",
    title: "Contact & Consultation",
    category: "resource",
    topic: "contact",
    status: "published",
    visibility: "public",
    publicUrl: "/contact",
  },
];

export function getKnowledgeAbsolutePath(relativePath: string): string {
  return path.join(KNOWLEDGE_ROOT, relativePath);
}

export function getPublishedKnowledgeDocuments(): KnowledgeDocumentConfig[] {
  return knowledgeDocuments.filter(
    (doc) => doc.status === "published" && doc.visibility === "public"
  );
}

export function getKnowledgeDocumentById(
  id: string
): KnowledgeDocumentConfig | undefined {
  return knowledgeDocuments.find((doc) => doc.id === id);
}

export function getKnowledgeDocumentByTitle(
  title: string
): KnowledgeDocumentConfig | undefined {
  const normalized = title.trim().toLowerCase();
  return knowledgeDocuments.find(
    (doc) => doc.title.toLowerCase() === normalized
  );
}

export function getKnowledgeDocumentByFileName(
  fileName: string
): KnowledgeDocumentConfig | undefined {
  const base = fileName.replace(/\.[^.]+$/, "").toLowerCase();
  return knowledgeDocuments.find((doc) => {
    const docBase = path.basename(doc.relativePath, ".md").toLowerCase();
    return docBase === base || doc.id.toLowerCase() === base;
  });
}

export type IngestManifestEntry = {
  sourceId: string;
  contentHash: string;
  documentName: string;
  displayName: string;
  uploadedAt: string;
};

export type IngestManifest = {
  storeName: string;
  documents: Record<string, IngestManifestEntry>;
  lastIngestAt?: string;
};
