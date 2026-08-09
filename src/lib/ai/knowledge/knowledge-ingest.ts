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
} from "@/lib/ai/knowledge/file-search";
import {
  getKnowledgeAbsolutePath,
  getPublishedKnowledgeDocuments,
  KNOWLEDGE_MANIFEST_PATH,
  type IngestManifest,
  type KnowledgeDocumentConfig,
} from "@/lib/ai/knowledge/knowledge-config";

function hashFileContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function readManifest(): Promise<IngestManifest | null> {
  try {
    const raw = await readFile(KNOWLEDGE_MANIFEST_PATH, "utf8");
    return JSON.parse(raw) as IngestManifest;
  } catch {
    return null;
  }
}

async function writeManifest(manifest: IngestManifest): Promise<void> {
  await writeFile(KNOWLEDGE_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function validateDocumentConfig(doc: KnowledgeDocumentConfig): string[] {
  const errors: string[] = [];

  if (!doc.id.trim()) errors.push("Document id is required");
  if (!doc.title.trim()) errors.push(`Document ${doc.id}: title is required`);
  if (!doc.relativePath.trim()) {
    errors.push(`Document ${doc.id}: relativePath is required`);
  }

  return errors;
}

export type IngestResult = {
  uploaded: string[];
  skipped: string[];
  replaced: string[];
  deleted: string[];
  errors: Array<{ id: string; message: string }>;
};

export async function ingestKnowledgeDocuments({
  storeName,
  force = false,
}: {
  storeName: string;
  force?: boolean;
}): Promise<IngestResult> {
  const result: IngestResult = {
    uploaded: [],
    skipped: [],
    replaced: [],
    deleted: [],
    errors: [],
  };

  await getFileSearchStore(storeName);

  const manifest = (await readManifest()) ?? {
    storeName,
    documents: {},
  };

  if (manifest.storeName !== storeName) {
    manifest.storeName = storeName;
    manifest.documents = {};
  }

  const publishedDocs = getPublishedKnowledgeDocuments();

  for (const doc of publishedDocs) {
    const validationErrors = validateDocumentConfig(doc);
    if (validationErrors.length) {
      result.errors.push({ id: doc.id, message: validationErrors.join("; ") });
      continue;
    }

    const absolutePath = getKnowledgeAbsolutePath(doc.relativePath);

    try {
      const content = await readFile(absolutePath, "utf8");
      const contentHash = hashFileContent(content);
      const existing = manifest.documents[doc.id];

      if (!force && existing?.contentHash === contentHash) {
        result.skipped.push(doc.id);
        continue;
      }

      if (existing?.documentName) {
        try {
          await deleteIndexedDocument(existing.documentName);
          result.deleted.push(doc.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push({
            id: doc.id,
            message: `Failed to delete previous document: ${message}`,
          });
          continue;
        }
      }

      const operation = await uploadKnowledgeFile({
        storeName,
        filePath: absolutePath,
        displayName: doc.title,
        customMetadata: buildKnowledgeCustomMetadata(doc),
      });

      const documentName = operation.response?.documentName;
      if (!documentName) {
        result.errors.push({
          id: doc.id,
          message: "Upload completed without a document name",
        });
        continue;
      }

      manifest.documents[doc.id] = {
        sourceId: doc.id,
        contentHash,
        documentName,
        displayName: doc.title,
        uploadedAt: new Date().toISOString(),
      };

      if (existing) {
        result.replaced.push(doc.id);
      } else {
        result.uploaded.push(doc.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push({ id: doc.id, message });
    }
  }

  manifest.lastIngestAt = new Date().toISOString();
  await writeManifest(manifest);

  return result;
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

export async function validateKnowledgeFilesOnDisk(): Promise<string[]> {
  const errors: string[] = [];
  const docs = getPublishedKnowledgeDocuments();

  for (const doc of docs) {
    const absolutePath = getKnowledgeAbsolutePath(doc.relativePath);
    try {
      await readFile(absolutePath, "utf8");
    } catch {
      errors.push(`Missing knowledge file: ${path.relative(process.cwd(), absolutePath)}`);
    }
  }

  return errors;
}
