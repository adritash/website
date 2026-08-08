import { GEMINI_MODEL } from "@/lib/ai/config";
import { getGeminiClient } from "@/lib/ai/gemini";
import { ADRITASH_SYSTEM_PROMPT } from "@/lib/ai/prompt";

type InteractionStreamEvent = {
  event_type?: string;
  delta?: { type?: string; text?: string };
  interaction?: {
    id?: string;
    output_text?: string;
    outputs?: Array<{ type?: string; text?: string }>;
  };
};

export type ChatCompletionResult = {
  reply: string;
  interactionId: string;
};

export type ChatStreamChunk =
  | { type: "token"; text: string }
  | { type: "complete"; reply: string; interactionId: string }
  | { type: "error"; message: string };

function extractReplyFromInteraction(interaction: {
  output_text?: string;
  outputs?: Array<{ type?: string; text?: string }>;
}): string {
  if (interaction.output_text?.trim()) {
    return interaction.output_text.trim();
  }

  const textOutputs = interaction.outputs
    ?.filter((output) => output.type === "text" && output.text?.trim())
    .map((output) => output.text!.trim());

  if (textOutputs?.length) {
    return textOutputs.join("\n\n");
  }

  return "";
}

export async function createChatCompletion({
  message,
  previousInteractionId,
}: {
  message: string;
  previousInteractionId?: string;
}): Promise<ChatCompletionResult> {
  const gemini = getGeminiClient();

  const interaction = await gemini.interactions.create({
    model: GEMINI_MODEL,
    input: message,
    system_instruction: ADRITASH_SYSTEM_PROMPT,
    ...(previousInteractionId
      ? { previous_interaction_id: previousInteractionId }
      : {}),
  });

  const reply = extractReplyFromInteraction(interaction);

  if (!reply) {
    throw new Error("Gemini returned an empty response");
  }

  return {
    reply,
    interactionId: interaction.id,
  };
}

function parseStreamEvent(event: InteractionStreamEvent): ChatStreamChunk[] {
  if (event.event_type === "step.delta") {
    const delta = event.delta;
    if (delta && "type" in delta && delta.type === "text" && delta.text) {
      return [{ type: "token", text: delta.text }];
    }
    return [];
  }

  if (event.event_type === "interaction.completed") {
    const interaction = event.interaction;
    if (!interaction?.id) {
      return [{ type: "error", message: "Missing interaction identifier" }];
    }

    const reply = extractReplyFromInteraction(interaction);

    return [
      {
        type: "complete",
        reply,
        interactionId: interaction.id,
      },
    ];
  }

  if (event.event_type === "error") {
    return [
      {
        type: "error",
        message: "Gemini streaming error",
      },
    ];
  }

  return [];
}

export async function* streamChatCompletion({
  message,
  previousInteractionId,
}: {
  message: string;
  previousInteractionId?: string;
}): AsyncGenerator<ChatStreamChunk> {
  const gemini = getGeminiClient();

  const stream = await gemini.interactions.create({
    model: GEMINI_MODEL,
    input: message,
    system_instruction: ADRITASH_SYSTEM_PROMPT,
    stream: true,
    ...(previousInteractionId
      ? { previous_interaction_id: previousInteractionId }
      : {}),
  });

  for await (const event of stream) {
    for (const chunk of parseStreamEvent(event)) {
      yield chunk;
    }
  }
}

export function classifyGeminiError(error: unknown): {
  status: number;
  logMessage: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("api key") || normalized.includes("unauthorized")) {
    return { status: 503, logMessage: "Gemini authentication failure" };
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("resource exhausted")
  ) {
    return { status: 429, logMessage: "Gemini quota or rate limit exceeded" };
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
