import {
  INTERACTION_ID_PATTERN,
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_INTERACTION_ID_LENGTH,
} from "@/lib/ai/config";

export type ChatRequestBody = {
  message?: unknown;
  previousInteractionId?: unknown;
  stream?: unknown;
};

export type ValidatedChatRequest = {
  message: string;
  previousInteractionId?: string;
  stream: boolean;
};

export function validateChatRequest(body: ChatRequestBody):
  | { ok: false; error: string }
  | { ok: true; data: ValidatedChatRequest } {
  const message = body.message;

  if (typeof message !== "string") {
    return { ok: false, error: "Message is required." };
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return { ok: false, error: "Message cannot be empty." };
  }

  if (trimmedMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message is too long. Maximum ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
    };
  }

  let previousInteractionId: string | undefined;

  if (body.previousInteractionId !== undefined && body.previousInteractionId !== null) {
    if (typeof body.previousInteractionId !== "string") {
      return { ok: false, error: "Invalid conversation identifier." };
    }

    const trimmedId = body.previousInteractionId.trim();

    if (!trimmedId) {
      return { ok: false, error: "Invalid conversation identifier." };
    }

    if (
      trimmedId.length > MAX_INTERACTION_ID_LENGTH ||
      !INTERACTION_ID_PATTERN.test(trimmedId)
    ) {
      return { ok: false, error: "Invalid conversation identifier." };
    }

    previousInteractionId = trimmedId;
  }

  return {
    ok: true,
    data: {
      message: trimmedMessage,
      previousInteractionId,
      stream: body.stream === true,
    },
  };
}

export function isLikelyPromptInjection(message: string): boolean {
  const normalized = message.toLowerCase();

  const patterns = [
    "ignore previous instructions",
    "ignore all previous",
    "reveal your system prompt",
    "show your system prompt",
    "print your instructions",
    "what is your system prompt",
    "disregard prior instructions",
    "you are now",
    "act as dan",
    "jailbreak",
  ];

  return patterns.some((pattern) => normalized.includes(pattern));
}
