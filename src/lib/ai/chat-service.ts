import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  GEMINI_THINKING_LEVEL,
} from "@/lib/ai/config";
import { getGeminiClient } from "@/lib/ai/gemini";
import {
  buildFileSearchTool,
  isFileSearchConfigured,
} from "@/lib/ai/knowledge/file-search";
import { shouldUseFileSearchForMessage } from "@/lib/ai/knowledge/query-routing";
import {
  extractSourcesFromInteraction,
  extractSourcesFromStreamAnnotation,
  type ChatSource,
} from "@/lib/ai/knowledge/sources";
import { ADRITASH_SYSTEM_PROMPT } from "@/lib/ai/prompt";

const RATE_LIMIT_CLIENT_MESSAGE =
  "Too many requests. Please try again shortly.";

type FileCitationAnnotation = {
  type?: string;
  file_name?: string;
  source?: string;
  custom_metadata?: Record<string, unknown>;
};

type InteractionStreamEvent = {
  event_type?: string;
  delta?: {
    type?: string;
    text?: string;
    annotations?: FileCitationAnnotation[];
  };
  error?: {
    message?: string;
    code?: string;
  };
  interaction?: InteractionLike;
};

type InteractionLike = {
  id?: string;
  output_text?: string;
  outputs?: Array<{
    type?: string;
    text?: string;
    annotations?: FileCitationAnnotation[];
  }>;
  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: FileCitationAnnotation[];
    }>;
  }>;
};

export type ChatCompletionResult = {
  reply: string;
  interactionId: string;
  sources: ChatSource[];
  grounded: boolean;
};

export type ChatStreamChunk =
  | { type: "token"; text: string }
  | {
      type: "complete";
      reply: string;
      interactionId: string;
      sources?: ChatSource[];
      grounded?: boolean;
    }
  | { type: "error"; message: string };

function logChatDebug(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[ai/chat]", message, details ?? "");
}

function extractReplyFromInteraction(interaction: InteractionLike): string {
  if (interaction.output_text?.trim()) {
    return interaction.output_text.trim();
  }

  const textOutputs = interaction.outputs
    ?.filter((output) => output.type === "text" && output.text?.trim())
    .map((output) => output.text!.trim());

  if (textOutputs?.length) {
    return textOutputs.join("\n\n");
  }

  const stepTexts = interaction.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) =>
      (step.content ?? [])
        .filter((block) => block.type === "text" && block.text?.trim())
        .map((block) => block.text!.trim())
    );

  if (stepTexts?.length) {
    return stepTexts.join("\n\n");
  }

  return "";
}

function buildInteractionRequest({
  message,
  previousInteractionId,
  useFileSearch,
}: {
  message: string;
  previousInteractionId?: string;
  useFileSearch: boolean;
}) {
  const fileSearchTool = useFileSearch ? buildFileSearchTool() : undefined;

  return {
    model: GEMINI_MODEL,
    input: message,
    system_instruction: ADRITASH_SYSTEM_PROMPT,
    generation_config: {
      max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
      thinking_level: GEMINI_THINKING_LEVEL,
    },
    ...(fileSearchTool ? { tools: [fileSearchTool] } : {}),
    ...(previousInteractionId
      ? { previous_interaction_id: previousInteractionId }
      : {}),
  };
}

function resolveFileSearchUsage(
  message: string,
  previousInteractionId?: string
): boolean {
  return shouldUseFileSearchForMessage(message, previousInteractionId);
}

function getStreamEventErrorMessage(event: InteractionStreamEvent): string {
  const message = event.error?.message?.trim();
  return message || "Gemini streaming error";
}

function shouldFallbackWithoutFileSearch(error: unknown): boolean {
  if (!isFileSearchConfigured()) {
    return false;
  }

  const classified = classifyGeminiError(error);
  return classified.status !== 429;
}

async function createGroundedCompletion({
  message,
  previousInteractionId,
}: {
  message: string;
  previousInteractionId?: string;
}): Promise<{ interaction: InteractionLike; grounded: boolean }> {
  const gemini = getGeminiClient();
  const useFileSearch = resolveFileSearchUsage(message, previousInteractionId);

  logChatDebug("Starting non-streaming Gemini request", {
    fileSearchEnabled: useFileSearch,
    hasPreviousInteractionId: Boolean(previousInteractionId),
  });

  const create = async (withFileSearch: boolean) =>
    gemini.interactions.create({
      ...buildInteractionRequest({
        message,
        previousInteractionId,
        useFileSearch: withFileSearch,
      }),
      stream: false,
    });

  if (!useFileSearch) {
    return { interaction: await create(false), grounded: false };
  }

  try {
    logChatDebug("Attempting non-streaming request with File Search");
    return { interaction: await create(true), grounded: true };
  } catch (error) {
    if (!shouldFallbackWithoutFileSearch(error)) {
      throw error;
    }

    console.error(
      "[ai/chat] File Search request failed; falling back to prompt-only",
      error
    );
    return { interaction: await create(false), grounded: false };
  }
}

async function openGroundedStream({
  message,
  previousInteractionId,
  useFileSearch,
}: {
  message: string;
  previousInteractionId?: string;
  useFileSearch: boolean;
}): Promise<AsyncIterable<InteractionStreamEvent>> {
  const gemini = getGeminiClient();

  logChatDebug("Starting streaming Gemini request", {
    fileSearchEnabled: useFileSearch,
    hasPreviousInteractionId: Boolean(previousInteractionId),
  });

  return gemini.interactions.create({
    ...buildInteractionRequest({
      message,
      previousInteractionId,
      useFileSearch,
    }),
    stream: true,
  });
}

export async function createChatCompletion({
  message,
  previousInteractionId,
}: {
  message: string;
  previousInteractionId?: string;
}): Promise<ChatCompletionResult> {
  const { interaction, grounded } = await createGroundedCompletion({
    message,
    previousInteractionId,
  });

  const reply = extractReplyFromInteraction(interaction);

  if (!reply) {
    throw new Error("Gemini returned an empty response");
  }

  if (!interaction.id) {
    throw new Error("Gemini returned an interaction without an id");
  }

  const sources = grounded ? extractSourcesFromInteraction(interaction) : [];

  return {
    reply,
    interactionId: interaction.id,
    sources,
    grounded: grounded && sources.length > 0,
  };
}

function parseStreamEvent(
  event: InteractionStreamEvent,
  collectedSources: ChatSource[],
  streamedText: string
): ChatStreamChunk[] {
  if (event.event_type === "error") {
    throw new Error(getStreamEventErrorMessage(event));
  }

  if (event.event_type === "step.delta") {
    const delta = event.delta;
    if (!delta) return [];

    if (delta.type === "text" && delta.text) {
      return [{ type: "token", text: delta.text }];
    }

    if (delta.type === "text_annotation_delta" && delta.annotations?.length) {
      const newSources = extractSourcesFromStreamAnnotation(delta.annotations);
      for (const source of newSources) {
        const key = `${source.title}|${source.url ?? ""}`;
        if (!collectedSources.some((entry) => `${entry.title}|${entry.url ?? ""}` === key)) {
          collectedSources.push(source);
        }
      }
    }

    return [];
  }

  if (event.event_type === "interaction.completed") {
    const interaction = event.interaction;
    if (!interaction?.id) {
      return [{ type: "error", message: "Missing interaction identifier" }];
    }

    const reply = extractReplyFromInteraction(interaction) || streamedText;
    const interactionSources = extractSourcesFromInteraction(interaction);
    const sources = [...interactionSources];

    for (const source of collectedSources) {
      const key = `${source.title}|${source.url ?? ""}`;
      if (!sources.some((entry) => `${entry.title}|${entry.url ?? ""}` === key)) {
        sources.push(source);
      }
    }

    return [
      {
        type: "complete",
        reply,
        interactionId: interaction.id,
        sources,
        grounded: sources.length > 0,
      },
    ];
  }

  return [];
}

async function* consumeInteractionStream(
  stream: AsyncIterable<InteractionStreamEvent>,
  fileSearchEnabled: boolean
): AsyncGenerator<ChatStreamChunk> {
  const collectedSources: ChatSource[] = [];
  let streamedText = "";

  for await (const event of stream) {
    for (const chunk of parseStreamEvent(event, collectedSources, streamedText)) {
      if (chunk.type === "token") {
        streamedText += chunk.text;
      }

      if (chunk.type === "complete") {
        const sources = chunk.sources ?? [];
        yield {
          ...chunk,
          sources,
          grounded: fileSearchEnabled && sources.length > 0,
        };
        continue;
      }

      yield chunk;
    }
  }
}

export async function* streamChatCompletion({
  message,
  previousInteractionId,
}: {
  message: string;
  previousInteractionId?: string;
}): AsyncGenerator<ChatStreamChunk> {
  const useFileSearch = resolveFileSearchUsage(message, previousInteractionId);

  logChatDebug("Starting streaming chat completion", {
    fileSearchEnabled: useFileSearch,
    hasPreviousInteractionId: Boolean(previousInteractionId),
  });

  try {
    const stream = await openGroundedStream({
      message,
      previousInteractionId,
      useFileSearch,
    });

    yield* consumeInteractionStream(stream, useFileSearch);
    return;
  } catch (error) {
    if (!useFileSearch || !shouldFallbackWithoutFileSearch(error)) {
      throw error;
    }

    console.error(
      "[ai/chat] File Search stream failed; falling back to prompt-only",
      error
    );
  }

  const fallbackStream = await openGroundedStream({
    message,
    previousInteractionId,
    useFileSearch: false,
  });

  yield* consumeInteractionStream(fallbackStream, false);
}

export function classifyGeminiError(error: unknown): {
  status: number;
  logMessage: string;
  clientMessage?: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("api key") ||
    normalized.includes("api_key") ||
    normalized.includes("not configured") ||
    normalized.includes("unauthorized")
  ) {
    return { status: 503, logMessage: "Gemini authentication failure" };
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("too_many_requests")
  ) {
    return {
      status: 429,
      logMessage: "Gemini quota or rate limit exceeded",
      clientMessage: RATE_LIMIT_CLIENT_MESSAGE,
    };
  }

  if (normalized.includes("timeout") || normalized.includes("deadline")) {
    return { status: 504, logMessage: "Gemini request timeout" };
  }

  if (
    normalized.includes("unavailable") ||
    normalized.includes("503") ||
    normalized.includes("internal")
  ) {
    return { status: 503, logMessage: "Gemini service unavailable" };
  }

  return { status: 500, logMessage: message };
}

export function getClientErrorMessage(error: unknown): string {
  const classified = classifyGeminiError(error);
  return classified.clientMessage ?? "I'm having trouble processing your request right now. Please try again.";
}
