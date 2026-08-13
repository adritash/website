export const GEMINI_MODEL = "gemini-3.6-flash";

/** Cap response length for faster generation on a public site chatbot. */
export const GEMINI_MAX_OUTPUT_TOKENS = 1024;

/** Minimize thinking depth for lower time-to-first-token on supported models. */
export const GEMINI_THINKING_LEVEL = "minimal" as const;

/** Fewer retrieved chunks = faster File Search + generation. */
export const FILE_SEARCH_TOP_K = 8;

export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const MAX_INTERACTION_ID_LENGTH = 128;
export const INTERACTION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const AI_RATE_LIMIT_WINDOW_MS = 60_000;
export const AI_RATE_LIMIT_MAX_REQUESTS = 10;

export const WELCOME_BUBBLE_MIN_DELAY_MS = 5000;
export const WELCOME_BUBBLE_MAX_DELAY_MS = 8000;

export const WELCOME_BUBBLE_STORAGE_KEY = "adritash-ai-welcome-dismissed";
export const AI_SESSION_INTERACTION_KEY = "adritash-ai-interaction-id";

/** Shown in the chat bubble while waiting for the first streamed tokens. */
export const AI_THINKING_STATUSES = [
  "Thinking",
  "Analyzing",
  "Reasoning",
  "Processing",
  "Evaluating",
  "Synthesizing",
  "Calculating",
  "Drafting",
  "Refining",
  "Reviewing",
] as const;

export const AI_THINKING_STATUS_INTERVAL_MS = 1600;
