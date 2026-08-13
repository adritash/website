import { isFileSearchConfigured } from "@/lib/ai/knowledge/file-search";

const ADRITASH_QUERY_PATTERNS = [
  /\badritash\b/i,
  /\b(your|our)\s+(services?|capabilities|expertise|offerings?)\b/i,
  /\bwhat\s+(services?|can\s+you\s+help|does\s+adritash)\b/i,
  /\b(book|schedule)\s+(a\s+)?consultation\b/i,
  /\b(contact|email|phone|reach\s+you)\b/i,
  /\bfinancial\s+reporting\b/i,
  /\bledger\s+validation\b/i,
  /\bstock\s+market\s+agent\b/i,
  /\bcloud\s+migration\b/i,
  /\bai\s+architecture\b/i,
  /\bapplication\s+architecture\b/i,
  /\b(reference\s+)?architecture\b/i,
  /\bconsulting\b/i,
  /\bmoderni[sz]e\b/i,
  /\bwho\s+(is|founded)\b/i,
  /\babout\s+(you|adritash)\b/i,
];

const GENERAL_KNOWLEDGE_ONLY_PATTERNS = [
  /^what\s+is\s+(rag|mcp|agentic\s+ai)\??$/i,
  /^explain\s+(rag|mcp|agentic\s+ai)\b/i,
  /^define\s+(rag|mcp)\b/i,
  /^(hi|hello|hey)\b/i,
];

function isGeneralKnowledgeOnly(message: string): boolean {
  const trimmed = message.trim();
  return GENERAL_KNOWLEDGE_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isAdritashSpecificQuery(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || isGeneralKnowledgeOnly(trimmed)) {
    return false;
  }

  return ADRITASH_QUERY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * File Search adds retrieval latency. Use it for Adritash-specific first turns
 * and for follow-ups in an existing interaction (conversation continuity).
 */
export function shouldUseFileSearchForMessage(
  message: string,
  previousInteractionId?: string
): boolean {
  if (!isFileSearchConfigured()) {
    return false;
  }

  if (previousInteractionId) {
    return true;
  }

  return isAdritashSpecificQuery(message);
}
