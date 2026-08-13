import { NextRequest, NextResponse } from "next/server";
import {
  AI_RATE_LIMIT_MAX_REQUESTS,
  AI_RATE_LIMIT_WINDOW_MS,
} from "@/lib/ai/config";
import {
  classifyGeminiError,
  createChatCompletion,
  getClientErrorMessage,
  streamChatCompletion,
  type ChatStreamChunk,
} from "@/lib/ai/chat-service";
import {
  isFileSearchConfigured,
} from "@/lib/ai/knowledge/file-search";
import {
  isLikelyPromptInjection,
  validateChatRequest,
  type ChatRequestBody,
} from "@/lib/ai/request-validation";
import { applyRateLimit } from "@/lib/rate-limit";

const GENERIC_ERROR =
  "I'm having trouble processing your request right now. Please try again.";
const RATE_LIMIT_ERROR = "Too many requests. Please try again shortly.";

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
        const clientMessage = getClientErrorMessage(error);

        if (process.env.NODE_ENV === "development") {
          console.error("[ai/chat] stream error", error);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: clientMessage })}\n\n`
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

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.error(
      "[ai/chat] GEMINI_API_KEY is not configured. Add it in your hosting provider's environment variables (e.g. Vercel → Settings → Environment Variables) and redeploy."
    );
    return jsonError(GENERIC_ERROR, 503);
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[ai/chat] request received", {
      stream,
      messageLength: message.length,
      hasPreviousInteractionId: Boolean(previousInteractionId),
      geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      fileSearchStoreConfigured: isFileSearchConfigured(),
    });
  }

  if (isLikelyPromptInjection(message)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ai/chat] Possible prompt injection attempt blocked");
    }
  }

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
      sources: result.sources,
      grounded: result.grounded,
    });
  } catch (error) {
    const classified = classifyGeminiError(error);

    if (process.env.NODE_ENV === "development") {
      console.error("[ai/chat]", classified.logMessage, error);
    } else {
      console.error("[ai/chat]", classified.logMessage);
    }

    if (classified.status === 429) {
      return jsonError(classified.clientMessage ?? RATE_LIMIT_ERROR, 429);
    }

    return jsonError(
      classified.clientMessage ?? GENERIC_ERROR,
      classified.status >= 500 ? 503 : classified.status
    );
  }
}
