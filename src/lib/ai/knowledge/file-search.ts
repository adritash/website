import type { CustomMetadata, UploadToFileSearchStoreOperation } from "@google/genai";
import { getGeminiClient } from "@/lib/ai/gemini";
import { FILE_SEARCH_TOP_K } from "@/lib/ai/config";
import {
  PUBLIC_METADATA_FILTER,
  type KnowledgeDocumentConfig,
} from "@/lib/ai/knowledge/knowledge-config";

export function getFileSearchStoreName(): string | undefined {
  const store = process.env.GEMINI_FILE_SEARCH_STORE?.trim();
  return store || undefined;
}

export function isFileSearchConfigured(): boolean {
  return Boolean(getFileSearchStoreName());
}

export function buildFileSearchTool() {
  const storeName = getFileSearchStoreName();
  if (!storeName) {
    return undefined;
  }

  return {
    type: "file_search" as const,
    file_search_store_names: [storeName],
    metadata_filter: PUBLIC_METADATA_FILTER,
    top_k: FILE_SEARCH_TOP_K,
  };
}

export function buildKnowledgeCustomMetadata(
  doc: KnowledgeDocumentConfig
): CustomMetadata[] {
  const metadata: CustomMetadata[] = [
    { key: "category", stringValue: doc.category },
    { key: "topic", stringValue: doc.topic },
    { key: "status", stringValue: doc.status },
    { key: "visibility", stringValue: doc.visibility },
    { key: "title", stringValue: doc.title },
    { key: "source_id", stringValue: doc.id },
  ];

  if (doc.publicUrl) {
    metadata.push({ key: "public_url", stringValue: doc.publicUrl });
  }

  return metadata;
}

export async function createFileSearchStore(displayName: string) {
  const gemini = getGeminiClient();
  return gemini.fileSearchStores.create({
    config: { displayName },
  });
}

export async function getFileSearchStore(storeName: string) {
  const gemini = getGeminiClient();
  return gemini.fileSearchStores.get({ name: storeName });
}

export async function listFileSearchStores() {
  const gemini = getGeminiClient();
  return gemini.fileSearchStores.list();
}

export async function listIndexedDocuments(storeName: string) {
  const gemini = getGeminiClient();
  return gemini.fileSearchStores.documents.list({ parent: storeName });
}

export async function deleteIndexedDocument(documentName: string) {
  const gemini = getGeminiClient();
  await gemini.fileSearchStores.documents.delete({ name: documentName });
}

export async function waitForUploadOperation(
  operation: UploadToFileSearchStoreOperation,
  options?: { pollIntervalMs?: number; timeoutMs?: number }
): Promise<UploadToFileSearchStoreOperation> {
  const gemini = getGeminiClient();
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const timeoutMs = options?.timeoutMs ?? 10 * 60 * 1000;
  const startedAt = Date.now();

  let current: UploadToFileSearchStoreOperation = operation;

  while (!current.done) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("File Search upload operation timed out");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    current = await gemini.operations.get({ operation: current });
  }

  if (current.error) {
    throw new Error(
      `File Search upload failed: ${JSON.stringify(current.error)}`
    );
  }

  return current;
}

export async function uploadKnowledgeFile({
  storeName,
  filePath,
  displayName,
  customMetadata,
}: {
  storeName: string;
  filePath: string;
  displayName: string;
  customMetadata: CustomMetadata[];
}) {
  const gemini = getGeminiClient();

  const operation = await gemini.fileSearchStores.uploadToFileSearchStore({
    fileSearchStoreName: storeName,
    file: filePath,
    config: {
      displayName,
      mimeType: "text/markdown",
      customMetadata,
    },
  });

  return waitForUploadOperation(operation);
}

export function isFileSearchRetrievalError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("file_search") ||
    normalized.includes("file search") ||
    normalized.includes("filesearch") ||
    normalized.includes("retrieval") ||
    normalized.includes("semantic retrieval")
  );
}
