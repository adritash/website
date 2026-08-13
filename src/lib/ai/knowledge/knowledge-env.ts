export function getMissingKnowledgeEnv(): string[] {
  const missing: string[] = [];

  if (!process.env.GEMINI_API_KEY?.trim()) {
    missing.push("GEMINI_API_KEY");
  }

  if (!process.env.GEMINI_FILE_SEARCH_STORE?.trim()) {
    missing.push("GEMINI_FILE_SEARCH_STORE");
  }

  return missing;
}

export function formatMissingKnowledgeEnvError(missing = getMissingKnowledgeEnv()): string {
  if (!missing.length) return "";

  return [
    "Gemini knowledge sync is not configured.",
    `Missing: ${missing.join(", ")}`,
    "Add these server-side variables to .env.local (never NEXT_PUBLIC_*).",
  ].join("\n");
}
