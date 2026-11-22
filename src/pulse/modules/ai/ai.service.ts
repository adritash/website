import { GoogleGenAI } from "@google/genai";
import { getEnv } from "@/pulse/config/env";
import { logger } from "@/pulse/infrastructure/logger";
import { intentJsonSchema, intentSchema, type Intent } from "./intent.schema";
import { INTENT_SYSTEM_PROMPT } from "./prompt";

/** Replaceable interpreter. Implementations return untrusted data that is validated here. */
export interface IntentInterpreter {
  readonly name: string;
  interpret(text: string): Promise<unknown>;
}

export class GeminiInterpreter implements IntentInterpreter {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async interpret(text: string): Promise<unknown> {
    const response = await this.client.models.generateContent({
      model: this.model,
      // The user message is passed as data inside a delimited block, never as instructions.
      contents: [{ role: "user", parts: [{ text: `<user_message>\n${text.slice(0, 1000)}\n</user_message>` }] }],
      config: {
        systemInstruction: INTENT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: intentJsonSchema,
        temperature: 0,
        maxOutputTokens: 200,
        abortSignal: AbortSignal.timeout(this.timeoutMs),
      },
    });
    const raw = response.text ?? "";
    return JSON.parse(raw);
  }
}

let override: IntentInterpreter | null | undefined;

export function setInterpreterForTests(i: IntentInterpreter | null | undefined) {
  override = i;
}

export function getInterpreter(): IntentInterpreter | null {
  if (override !== undefined) return override;
  const env = getEnv();
  if (env.AI_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
    return new GeminiInterpreter(env.GEMINI_API_KEY, env.AI_MODEL, env.AI_TIMEOUT_MS);
  }
  return null;
}

/**
 * Asks the AI interpreter and validates the result against the intent schema.
 * Any failure (timeout, bad JSON, schema mismatch) yields UNKNOWN, never a guess.
 */
export async function interpretWithAi(interpreter: IntentInterpreter, text: string): Promise<{ intent: Intent; ok: boolean }> {
  const started = Date.now();
  try {
    const raw = await interpreter.interpret(text);
    const parsed = intentSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn("ai.invalid_output", { interpreter: interpreter.name, latencyMs: Date.now() - started });
      return { intent: { intent: "UNKNOWN", confidence: 0 }, ok: false };
    }
    logger.info("ai.interpreted", { interpreter: interpreter.name, intent: parsed.data.intent, latencyMs: Date.now() - started });
    return { intent: parsed.data, ok: true };
  } catch (error) {
    logger.warn("ai.failed", { interpreter: interpreter.name, latencyMs: Date.now() - started, error });
    return { intent: { intent: "UNKNOWN", confidence: 0 }, ok: false };
  }
}
