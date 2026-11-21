export const GEMINI_MODEL = "gemini-3.6-flash";

export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const MAX_INTERACTION_ID_LENGTH = 128;
export const INTERACTION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const AI_RATE_LIMIT_WINDOW_MS = 60_000;
export const AI_RATE_LIMIT_MAX_REQUESTS = 10;

export const WELCOME_BUBBLE_MIN_DELAY_MS = 5000;
export const WELCOME_BUBBLE_MAX_DELAY_MS = 8000;

export const WELCOME_BUBBLE_STORAGE_KEY = "adritash-ai-welcome-dismissed";
export const AI_SESSION_INTERACTION_KEY = "adritash-ai-interaction-id";
