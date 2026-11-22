import { z } from "zod";
import type { Db } from "@/pulse/infrastructure/db";
import { intentSchema } from "@/pulse/modules/ai/intent.schema";

const instrumentRef = z.object({ symbol: z.string(), exchange: z.enum(["NSE", "BSE"]), companyName: z.string() });

export const pendingSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choose_instrument"), intent: intentSchema, options: z.array(instrumentRef).min(1).max(5) }),
  z.object({ kind: z.literal("need_stock"), intent: intentSchema }),
  z.object({ kind: z.literal("consent"), intent: intentSchema }),
  z.object({ kind: z.literal("confirm_delete") }),
]);

export const contextSchema = z.object({
  pending: pendingSchema.optional(),
  lastInstrument: instrumentRef.optional(),
});

export type Pending = z.infer<typeof pendingSchema>;
export type ConversationContext = z.infer<typeof contextSchema>;

/** Pending questions expire so an old "1" or "yes" is never applied to a stale question. */
export const CONTEXT_TTL_MS = 15 * 60 * 1000;

export async function getConversation(db: Db, userId: string) {
  return db.conversation.upsert({ where: { userId }, update: { lastMessageAt: new Date() }, create: { userId } });
}

export function readContext(conversation: { context: unknown; contextExpiresAt: Date | null }, now = new Date()): ConversationContext {
  if (!conversation.context) return {};
  const parsed = contextSchema.safeParse(conversation.context);
  if (!parsed.success) return {};
  const expired = !conversation.contextExpiresAt || conversation.contextExpiresAt.getTime() < now.getTime();
  return expired ? { lastInstrument: parsed.data.lastInstrument } : parsed.data;
}

export async function saveContext(db: Db, conversationId: string, context: ConversationContext, now = new Date()) {
  await db.conversation.update({
    where: { id: conversationId },
    data: { context: context as object, contextExpiresAt: new Date(now.getTime() + CONTEXT_TTL_MS) },
  });
}
