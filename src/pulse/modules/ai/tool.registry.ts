import type { Redis } from "ioredis";
import { z } from "zod";
import type { Db } from "@/pulse/infrastructure/db";
import { errorCode } from "@/pulse/lib/errors";
import { logger } from "@/pulse/infrastructure/logger";
import { audit } from "@/pulse/modules/audit/audit.service";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import type { InstrumentRef, MarketDataProvider } from "@/pulse/modules/market-data/market-data.types";
import type { EffectivePlan } from "@/pulse/modules/subscriptions/subscription.service";
import type { PulseUser } from "@/pulse/modules/users/user.service";
import type { ConversationContext, Pending } from "@/pulse/modules/conversations/conversation.context";
import type { Intent, IntentName } from "./intent.schema";

export type ToolContext = {
  db: Db;
  redis?: Redis;
  calendar: MarketCalendar;
  provider?: MarketDataProvider | null;
  /** Resolved from the verified WhatsApp sender. Tools never take a user id from input. */
  user: PulseUser;
  plan: EffectivePlan;
  context: ConversationContext;
  sourceMessageId: string;
  now: Date;
};

export type ToolResult = {
  reply: string;
  /** Replaces the pending question (null clears it). */
  pending?: Pending | null;
  lastInstrument?: InstrumentRef;
};

export const toolResultSchema = z.object({ reply: z.string().min(1).max(4096) });

export type ToolDefinition<I extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  intents: IntentName[];
  input: I;
  /** Needs the user to have accepted the privacy notice (stores personal preferences). */
  requiresPrivacyConsent: boolean;
  run(ctx: ToolContext, input: z.infer<I>): Promise<ToolResult>;
};

const registry = new Map<IntentName, ToolDefinition>();

export function registerTool<I extends z.ZodTypeAny>(tool: ToolDefinition<I>) {
  for (const intent of tool.intents) {
    if (registry.has(intent)) throw new Error(`Intent ${intent} already has a tool`);
    registry.set(intent, tool as unknown as ToolDefinition);
  }
}

export function toolFor(intent: IntentName): ToolDefinition | undefined {
  return registry.get(intent);
}

export function registeredTools(): ToolDefinition[] {
  return [...new Set(registry.values())];
}

/**
 * Runs exactly one approved tool. Input is re-validated against the tool's own
 * schema; the result is validated; every run is audited. A tool error becomes a
 * safe generic reply, never a stack trace or fabricated data.
 */
export async function executeTool(ctx: ToolContext, intent: Intent): Promise<ToolResult & { tool: string }> {
  const tool = toolFor(intent.intent);
  if (!tool) return { tool: "none", reply: "Sorry, I can't help with that yet. Reply *help* to see what I can do." };

  const input = tool.input.safeParse(intent);
  if (!input.success) {
    await audit(ctx.db, { actorType: "USER", actorId: ctx.user.id, action: `tool.${tool.name}`, outcome: "denied", metadata: { reason: "invalid_input" } });
    return { tool: tool.name, reply: "I didn't quite get that. Reply *help* for examples." };
  }

  try {
    const result = await tool.run(ctx, input.data);
    toolResultSchema.parse({ reply: result.reply });
    await audit(ctx.db, { actorType: "USER", actorId: ctx.user.id, action: `tool.${tool.name}`, outcome: "success" });
    return { ...result, tool: tool.name };
  } catch (error) {
    const code = errorCode(error);
    logger.error("tool.failed", { tool: tool.name, code, error });
    await audit(ctx.db, { actorType: "USER", actorId: ctx.user.id, action: `tool.${tool.name}`, outcome: "failure", metadata: { code } });
    return { tool: tool.name, reply: code === "NOT_FOUND" ? "I couldn't find that." : "Something went wrong on my side. Please try again in a moment." };
  }
}
