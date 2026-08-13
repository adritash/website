import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildKnowledgeCustomMetadata,
  createFileSearchStore,
  deleteIndexedDocument,
  getFileSearchStore,
  listIndexedDocuments,
  uploadKnowledgeFile,
  type KnowledgeUploadMetadata,
} from "@/lib/ai/knowledge/file-search";
import {
  getKnowledgeDocumentById,
  getKnowledgeDocumentByRelativePath,
  KNOWLEDGE_MANIFEST_PATH,
  KNOWLEDGE_ROOT,
  LEGACY_KNOWLEDGE_MANIFEST_PATH,
  type IngestManifest,
  type IngestManifestEntry,
  type LegacyIngestManifest,
} from "@/lib/ai/knowledge/knowledge-config";
import {
  scanKnowledgeFolder,
  type ScannedKnowledgeFile,
} from "@/lib/ai/knowledge/knowledge-scan";

export type KnowledgeFileSearchClient = {
  getStore?: (storeName: string) => Promise<unknown>;
  upload: (args: {
    storeName: string;
    filePath: string;
    displayName: string;
    mimeType: string;
    customMetadata: ReturnType<typeof buildKnowledgeCustomMetadata>;
  }) => Promise<{ documentName: string }>;
  deleteDocument: (documentName: string) => Promise<void>;
};

export type KnowledgeSyncPaths = {
  knowledgeRoot: string;
  manifestPath: string;
};

export type KnowledgeSyncResult = {
  added: string[];
  updated: string[];
  unchanged: string[];
  removed: string[];
  failed: Array<{ path: string; message: string }>;
  unsupported: Array<{ relativePath: string; reason: string }>;
};

function hashBuffer(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

function humanizeFileName(relativePath: string): string {
  const base = path.basename(relativePath).replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayNameForFile(relativePath: string): string {
  const overlay = getKnowledgeDocumentByRelativePath(relativePath);
  return overlay?.title ?? humanizeFileName(relativePath);
}

function sourceIdForFile(relativePath: string): string {
  return getKnowledgeDocumentByRelativePath(relativePath)?.id ?? relativePath;
}

function metadataForFile(relativePath: string): KnowledgeUploadMetadata {
  const overlay = getKnowledgeDocumentByRelativePath(relativePath);
  return {
    sourceId: sourceIdForFile(relativePath),
    relativePath,
    title: displayNameForFile(relativePath),
    category: overlay?.category ?? "resource",
    topic: overlay?.topic ?? relativePath,
    status: "published",
    visibility: "public",
    publicUrl: overlay?.publicUrl,
  };
}

export async function readManifest(
  manifestPath = KNOWLEDGE_MANIFEST_PATH
): Promise<IngestManifest | null> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as IngestManifest | LegacyIngestManifest;

    if ("files" in parsed && parsed.files) {
      return parsed as IngestManifest;
    }

    return migrateLegacyManifest(parsed as LegacyIngestManifest);
  } catch {
    if (manifestPath === KNOWLEDGE_MANIFEST_PATH) {
      try {
        const raw = await readFile(LEGACY_KNOWLEDGE_MANIFEST_PATH, "utf8");
        return migrateLegacyManifest(JSON.parse(raw) as LegacyIngestManifest);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function migrateLegacyManifest(legacy: LegacyIngestManifest): IngestManifest {
  const files: Record<string, IngestManifestEntry> = {};

  for (const [id, entry] of Object.entries(legacy.documents ?? {})) {
    const overlay = getKnowledgeDocumentById(id);
    const relativePath = overlay?.relativePath ?? `${id}.md`;
    files[relativePath] = {
      relativePath,
      contentHash: entry.contentHash,
      size: 0,
      mtimeMs: 0,
      mimeType: "text/markdown",
      documentName: entry.documentName,
      displayName: entry.displayName,
      sourceId: entry.sourceId ?? id,
      status: "indexed",
      uploadedAt: entry.uploadedAt,
    };
  }

  return {
    version: 1,
    storeName: legacy.storeName,
    files,
    lastSyncAt: legacy.lastIngestAt,
  };
}

async function writeManifest(
  manifest: IngestManifest,
  manifestPath: string
): Promise<void> {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function defaultFileSearchClient(): KnowledgeFileSearchClient {
  return {
    getStore: getFileSearchStore,
    upload: async ({ storeName, filePath, displayName, mimeType, customMetadata }) => {
      const operation = await uploadKnowledgeFile({
        storeName,
        filePath,
        displayName,
        mimeType,
        customMetadata,
      });
      const documentName = operation.response?.documentName;
      if (!documentName) {
        throw new Error("Upload completed without a document name");
      }
      return { documentName };
    },
    deleteDocument: deleteIndexedDocument,
  };
}

export function formatKnowledgeSyncSummary(result: KnowledgeSyncResult): string {
  const lines = [
    "Knowledge Sync",
    "-------------------------",
    `Added:     ${result.added.length}`,
    `Updated:   ${result.updated.length}`,
    `Unchanged: ${result.unchanged.length}`,
    `Removed:   ${result.removed.length}`,
    `Failed:    ${result.failed.length}`,
  ];

  if (result.unsupported.length) {
    lines.push(`Unsupported: ${result.unsupported.length}`);
  }

  if (result.failed.length) {
    lines.push("", "Failures:");
    for (const failure of result.failed) {
      lines.push(`  - ${failure.path}: ${failure.message}`);
    }
  }

  if (result.unsupported.length) {
    lines.push("", "Unsupported:");
    for (const item of result.unsupported) {
      lines.push(`  - ${item.relativePath}: ${item.reason}`);
    }
  }

  return lines.join("\n");
}

export async function syncKnowledgeDocuments({
  storeName,
  force = false,
  paths = {
    knowledgeRoot: KNOWLEDGE_ROOT,
    manifestPath: KNOWLEDGE_MANIFEST_PATH,
  },
  client = defaultFileSearchClient(),
}: {
  storeName: string;
  force?: boolean;
  paths?: KnowledgeSyncPaths;
  client?: KnowledgeFileSearchClient;
}): Promise<KnowledgeSyncResult> {
  if (!storeName.trim()) {
    throw new Error("GEMINI_FILE_SEARCH_STORE is not configured");
  }

  if (client.getStore) {
    await client.getStore(storeName);
  }

  const result: KnowledgeSyncResult = {
    added: [],
    updated: [],
    unchanged: [],
    removed: [],
    failed: [],
    unsupported: [],
  };

  const scan = await scanKnowledgeFolder(paths.knowledgeRoot);
  result.unsupported = scan.unsupported;

  const manifest = (await readManifest(paths.manifestPath)) ?? {
    version: 1 as const,
    storeName,
    files: {},
  };

  if (manifest.storeName !== storeName) {
    manifest.storeName = storeName;
  }

  const seen = new Set<string>();

  for (const file of scan.files) {
    seen.add(file.relativePath);
    await syncOneFile({
      file,
      storeName,
      force,
      manifest,
      result,
      client,
    });
    await writeManifest(manifest, paths.manifestPath);
  }

  for (const relativePath of Object.keys(manifest.files)) {
    if (seen.has(relativePath)) continue;

    const existing = manifest.files[relativePath];
    if (existing?.documentName) {
      try {
        await client.deleteDocument(existing.documentName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push({
          path: relativePath,
          message: `Failed to delete removed document: ${message}`,
        });
        continue;
      }
    }

    delete manifest.files[relativePath];
    result.removed.push(relativePath);
    await writeManifest(manifest, paths.manifestPath);
  }

  manifest.lastSyncAt = new Date().toISOString();
  await writeManifest(manifest, paths.manifestPath);

  return result;
}

async function syncOneFile({
  file,
  storeName,
  force,
  manifest,
  result,
  client,
}: {
  file: ScannedKnowledgeFile;
  storeName: string;
  force: boolean;
  manifest: IngestManifest;
  result: KnowledgeSyncResult;
  client: KnowledgeFileSearchClient;
}): Promise<void> {
  const existing = manifest.files[file.relativePath];

  try {
    const content = await readFile(file.absolutePath);
    const contentHash = hashBuffer(content);

    if (!force && existing?.status === "indexed" && existing.contentHash === contentHash) {
      manifest.files[file.relativePath] = {
        ...existing,
        size: file.size,
        mtimeMs: file.mtimeMs,
        mimeType: file.mimeType,
        displayName: displayNameForFile(file.relativePath),
      };
      result.unchanged.push(file.relativePath);
      return;
    }

    const meta = metadataForFile(file.relativePath);
    const uploaded = await client.upload({
      storeName,
      filePath: file.absolutePath,
      displayName: meta.title,
      mimeType: file.mimeType,
      customMetadata: buildKnowledgeCustomMetadata(meta),
    });

    if (existing?.documentName && existing.documentName !== uploaded.documentName) {
      try {
        await client.deleteDocument(existing.documentName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push({
          path: file.relativePath,
          message: `Indexed new version but failed to delete previous document: ${message}`,
        });
      }
    }

    const nextEntry: IngestManifestEntry = {
      relativePath: file.relativePath,
      contentHash,
      size: file.size,
      mtimeMs: file.mtimeMs,
      mimeType: file.mimeType,
      documentName: uploaded.documentName,
      displayName: meta.title,
      sourceId: meta.sourceId,
      status: "indexed",
      uploadedAt: new Date().toISOString(),
    };

    manifest.files[file.relativePath] = nextEntry;

    if (existing?.status === "indexed") {
      result.updated.push(file.relativePath);
    } else {
      result.added.push(file.relativePath);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.failed.push({ path: file.relativePath, message });

    if (existing) {
      manifest.files[file.relativePath] = {
        ...existing,
        lastError: message,
      };
    }
  }
}

/** @deprecated Use syncKnowledgeDocuments */
export async function ingestKnowledgeDocuments({
  storeName,
  force = false,
}: {
  storeName: string;
  force?: boolean;
}) {
  const result = await syncKnowledgeDocuments({ storeName, force });
  return {
    uploaded: result.added,
    skipped: result.unchanged,
    replaced: result.updated,
    deleted: result.removed,
    errors: result.failed.map((item) => ({ id: item.path, message: item.message })),
  };
}

export async function createAndReportFileSearchStore(displayName: string) {
  const store = await createFileSearchStore(displayName);
  return store;
}

export async function reportKnowledgeStoreStatus(storeName: string) {
  const store = await getFileSearchStore(storeName);
  const documents = await listIndexedDocuments(storeName);
  const manifest = await readManifest();

  const docList: Array<{ name?: string; displayName?: string; state?: string }> = [];

  for await (const document of documents) {
    docList.push({
      name: document.name,
      displayName: document.displayName,
      state: document.state,
    });
  }

  return {
    store,
    documents: docList,
    manifest,
    manifestPath: KNOWLEDGE_MANIFEST_PATH,
  };
}

export async function listKnowledgeFiles(knowledgeRoot = KNOWLEDGE_ROOT) {
  const scan = await scanKnowledgeFolder(knowledgeRoot);
  const manifest = await readManifest();

  return {
    files: scan.files.map((file) => {
      const entry = manifest?.files[file.relativePath];
      return {
        relativePath: file.relativePath,
        mimeType: file.mimeType,
        size: file.size,
        status: entry?.status ?? "not-indexed",
        documentName: entry?.documentName,
        displayName: displayNameForFile(file.relativePath),
      };
    }),
    unsupported: scan.unsupported,
  };
}

export async function clearKnowledgeStore({
  storeName,
  confirm,
  paths = {
    knowledgeRoot: KNOWLEDGE_ROOT,
    manifestPath: KNOWLEDGE_MANIFEST_PATH,
  },
  client = defaultFileSearchClient(),
}: {
  storeName: string;
  confirm: boolean;
  paths?: KnowledgeSyncPaths;
  client?: KnowledgeFileSearchClient;
}): Promise<{ deleted: string[]; failed: Array<{ path: string; message: string }> }> {
  if (!confirm) {
    throw new Error("Refusing to clear knowledge store without --confirm");
  }

  const manifest = (await readManifest(paths.manifestPath)) ?? {
    version: 1 as const,
    storeName,
    files: {},
  };

  const deleted: string[] = [];
  const failed: Array<{ path: string; message: string }> = [];

  for (const [relativePath, entry] of Object.entries(manifest.files)) {
    if (!entry.documentName) {
      delete manifest.files[relativePath];
      continue;
    }

    try {
      await client.deleteDocument(entry.documentName);
      delete manifest.files[relativePath];
      deleted.push(relativePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ path: relativePath, message });
    }
  }

  manifest.storeName = storeName;
  manifest.lastSyncAt = new Date().toISOString();
  await writeManifest(manifest, paths.manifestPath);

  return { deleted, failed };
}

export async function validateKnowledgeFilesOnDisk(
  knowledgeRoot = KNOWLEDGE_ROOT
): Promise<string[]> {
  const scan = await scanKnowledgeFolder(knowledgeRoot);
  return scan.unsupported.map(
    (item) => `${item.relativePath}: ${item.reason}`
  );
}
