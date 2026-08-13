import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

import {
  getKnowledgeMimeType,
  isSkippedKnowledgeFileName,
  MAX_KNOWLEDGE_FILE_BYTES,
} from "@/lib/ai/knowledge/supported-formats";

export type ScannedKnowledgeFile = {
  relativePath: string;
  absolutePath: string;
  size: number;
  mtimeMs: number;
  mimeType: string;
};

export type KnowledgeScanResult = {
  files: ScannedKnowledgeFile[];
  unsupported: Array<{ relativePath: string; reason: string }>;
};

function toPosixRelative(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

export function assertPathInsideRoot(root: string, candidate: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const prefix = resolvedRoot.endsWith(path.sep)
    ? resolvedRoot
    : `${resolvedRoot}${path.sep}`;

  if (resolvedCandidate !== resolvedRoot && !resolvedCandidate.startsWith(prefix)) {
    throw new Error(`Path escapes knowledge root: ${candidate}`);
  }

  return resolvedCandidate;
}

export async function scanKnowledgeFolder(
  knowledgeRoot: string
): Promise<KnowledgeScanResult> {
  const files: ScannedKnowledgeFile[] = [];
  const unsupported: Array<{ relativePath: string; reason: string }> = [];

  let rootReal: string;
  try {
    rootReal = await realpath(knowledgeRoot);
  } catch {
    return { files, unsupported };
  }

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const absolutePath = path.join(directory, entry.name);
      const relativePath = toPosixRelative(path.relative(rootReal, absolutePath));

      if (relativePath.includes("..")) {
        unsupported.push({
          relativePath,
          reason: "Rejected path traversal",
        });
        continue;
      }

      if (entry.isSymbolicLink()) {
        unsupported.push({
          relativePath,
          reason: "Symbolic links are not ingested",
        });
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        unsupported.push({
          relativePath,
          reason: "Not a regular file",
        });
        continue;
      }

      if (isSkippedKnowledgeFileName(entry.name)) {
        continue;
      }

      const mimeType = getKnowledgeMimeType(entry.name);
      if (!mimeType) {
        unsupported.push({
          relativePath,
          reason: "Unsupported file type",
        });
        continue;
      }

      const info = await stat(absolutePath);
      if (info.size > MAX_KNOWLEDGE_FILE_BYTES) {
        unsupported.push({
          relativePath,
          reason: `File exceeds ${MAX_KNOWLEDGE_FILE_BYTES} bytes`,
        });
        continue;
      }

      assertPathInsideRoot(rootReal, absolutePath);

      files.push({
        relativePath,
        absolutePath,
        size: info.size,
        mtimeMs: info.mtimeMs,
        mimeType,
      });
    }
  }

  await walk(rootReal);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return { files, unsupported };
}
