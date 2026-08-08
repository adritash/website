import { NextRequest, NextResponse } from "next/server";
import {
  INTERACTION_ID_PATTERN,
  AI_RATE_LIMIT_MAX_REQUESTS,
  AI_RATE_LIMIT_WINDOW_MS,
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_INTERACTION_ID_LENGTH,
} from "@/lib/ai/config";
import {
  classifyGeminiError,
  createChatCompletion,
  streamChatCompletion,
  type ChatStreamChunk,
} from "@/lib/ai/chat-service";
import { applyRateLimit } from "@/lib/rate-limit";

const GENERIC_ERROR =
  "I'm having trouble processing your request right now. Please try again.";
const RATE_LIMIT_ERROR = "Too many requests. Please try again shortly.";

type ChatRequestBody = {
  message?: unknown;
  previousInteractionId?: unknown;
  stream?: unknown;
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

function validateChatRequest(body: ChatRequestBody):
  | { ok: false; error: string }
  | {
      ok: true;
      data: {
        message: string;
        previousInteractionId?: string;
        stream: boolean;
      };
    } {
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

function createSseStream(generator: AsyncGenerator<ChatStreamChunk>) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        }
        controller.close();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[ai/chat] stream error", error);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: GENERIC_ERROR })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

export async function POST(request: NextRequest) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }

  const { message, previousInteractionId, stream } = validation.data;
  const clientIp = getClientIp(request);

  const rateLimit = await applyRateLimit({
    key: `ai-chat:${clientIp}`,
    limit: AI_RATE_LIMIT_MAX_REQUESTS,
    windowMs: AI_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return jsonError(RATE_LIMIT_ERROR, 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  try {
    if (stream) {
      const sseStream = createSseStream(
        streamChatCompletion({ message, previousInteractionId })
      );

      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const result = await createChatCompletion({ message, previousInteractionId });

    return NextResponse.json({
      reply: result.reply,
      interactionId: result.interactionId,
    });
  } catch (error) {
    const classified = classifyGeminiError(error);

    if (process.env.NODE_ENV === "development") {
      console.error("[ai/chat]", classified.logMessage, error);
    } else {
      console.error("[ai/chat]", classified.logMessage);
    }

    if (classified.status === 429) {
      return jsonError(RATE_LIMIT_ERROR, 429);
    }

    return jsonError(GENERIC_ERROR, classified.status >= 500 ? 503 : classified.status);
  }
}
