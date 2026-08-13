/**
 * MIME types Gemini File Search can index. We do not parse these formats
 * ourselves; the File Search Store handles extraction.
 *
 * @see https://ai.google.dev/gemini-api/docs/file-search
 */
export const MAX_KNOWLEDGE_FILE_BYTES = 100 * 1024 * 1024;

export const SUPPORTED_KNOWLEDGE_EXTENSIONS: Record<string, string> = {
  ".pdf": "application/pdf",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".txt": "text/plain",
  ".text": "text/plain",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".csv": "text/csv",
  ".json": "application/json",
  ".html": "text/html",
  ".htm": "text/html",
  ".xml": "text/xml",
  ".rtf": "text/rtf",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".cjs": "text/javascript",
  ".ts": "text/x-typescript",
  ".tsx": "text/x-typescript",
  ".jsx": "text/javascript",
  ".py": "text/x-python",
  ".java": "text/x-java",
  ".go": "text/x-go",
  ".rs": "text/x-rust",
  ".rb": "text/x-ruby",
  ".php": "text/x-php",
  ".c": "text/x-c",
  ".h": "text/x-c",
  ".cpp": "text/x-c++src",
  ".cc": "text/x-c++src",
  ".hpp": "text/x-c++hdr",
  ".cs": "text/x-csharp",
  ".sh": "text/x-sh",
  ".yml": "text/yaml",
  ".yaml": "text/yaml",
  ".sql": "text/x-sql",
  ".toml": "text/plain",
  ".ini": "text/plain",
  ".log": "text/plain",
};

const SKIP_FILE_NAMES = new Set([
  ".gitkeep",
  ".manifest.json",
  ".ingest-manifest.json",
  "readme.md",
  "readme.txt",
]);

export function getKnowledgeMimeType(fileName: string): string | undefined {
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";
  return SUPPORTED_KNOWLEDGE_EXTENSIONS[ext];
}

export function isSkippedKnowledgeFileName(fileName: string): boolean {
  if (fileName.startsWith(".")) return true;
  return SKIP_FILE_NAMES.has(fileName.toLowerCase());
}

export function isSupportedKnowledgeFileName(fileName: string): boolean {
  if (isSkippedKnowledgeFileName(fileName)) return false;
  return Boolean(getKnowledgeMimeType(fileName));
}
