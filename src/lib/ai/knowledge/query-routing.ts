import { isFileSearchConfigured } from "@/lib/ai/knowledge/file-search";

const GREETING_ONLY_PATTERN =
  /^(hi|hello|hey|thanks|thank you|ok|okay|good morning|good afternoon)[\s!.]*$/i;

/**
 * When a File Search store is configured, use it for arbitrary natural-language
 * questions so answers can be grounded in knowledge/ documents.
 * Skip only trivial greetings to avoid unnecessary retrieval latency.
 */
export function shouldUseFileSearchForMessage(
  message: string,
  previousInteractionId?: string
): boolean {
  if (!isFileSearchConfigured()) {
    return false;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  if (GREETING_ONLY_PATTERN.test(trimmed) && !previousInteractionId) {
    return false;
  }

  return true;
}
