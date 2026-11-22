import type { Redis } from "ioredis";
import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { incrementWindow } from "@/pulse/infrastructure/redis";
import { logger } from "@/pulse/infrastructure/logger";
import { getInterpreter, interpretWithAi } from "@/pulse/modules/ai/ai.service";
import { CONFIDENCE_THRESHOLD, type Intent } from "@/pulse/modules/ai/intent.schema";
import { parseWithRules } from "@/pulse/modules/ai/rules.parser";
import { executeTool, toolFor, type ToolContext } from "@/pulse/modules/ai/tool.registry";
import { confirmDeletion, HELP_TEXT, privacyLink } from "@/pulse/modules/ai/tools";
import type { MarketCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import type { MarketDataProvider } from "@/pulse/modules/market-data/market-data.types";
import { getEffectivePlan } from "@/pulse/modules/subscriptions/subscription.service";
import { recordUsage, usageToday } from "@/pulse/modules/subscriptions/usage.service";
import { hasActiveConsent, resolveUserByWaId, type PulseUser } from "@/pulse/modules/users/user.service";
import { sendToUser } from "@/pulse/modules/whatsapp/whatsapp.service";
import type { NormalizedInbound } from "@/pulse/modules/whatsapp/whatsapp.types";
import { DISCLAIMER } from "./formatter";
import { getConversation, readContext, saveContext, type ConversationContext } from "./conversation.context";

export type ConversationDeps = {
  db: Db;
  redis?: Redis;
  calendar: MarketCalendar;
  provider?: MarketDataProvider | null;
  now?: () => Date;
};

export function welcomeText(): string {
  return [
    "Welcome to *Adritash Pulse* 👋",
    "I can check NSE/BSE stock prices, keep a watchlist, send scheduled updates during market hours, set price alerts, and help with your plan.",
    "",
    `Before I save a watchlist or alerts for you, please read our privacy notice and reply *AGREE*: ${privacyLink()}`,
    `Prices are delayed, not real-time. ${DISCLAIMER}`,
  ].join("\n");
}

function consentAsk(): string {
  return `To save this for you I need your OK to store your number, watchlist and alert settings, as described in our privacy notice: ${privacyLink()}\nReply *AGREE* to continue, and I'll do it straight away.`;
}

/** Decides what the user meant, using pending questions, then rules, then (optionally) AI. */
async function interpret(deps: ConversationDeps, user: PulseUser, text: string, ctx: ConversationContext): Promise<{ intent: Intent; fromPending: boolean }> {
  const t = text.trim();
  const pending = ctx.pending;

  if (pending?.kind === "choose_instrument") {
    const n = Number(t.replace(/[^\d]/g, ""));
    if (/^\s*\d\s*$/.test(t) && n >= 1 && n <= pending.options.length) {
      const choice = pending.options[n - 1];
      // Re-run the original intent with the exact symbol + exchange the user picked.
      return { intent: { ...pending.intent, stock_query: choice.symbol, exchange: choice.exchange, confidence: 1 }, fromPending: true };
    }
  }
  if (pending?.kind === "need_stock") {
    const rules = parseWithRules(t);
    if (rules.intent === "STOCK_PRICE" && rules.stock_query) {
      return { intent: { ...pending.intent, stock_query: rules.stock_query, exchange: rules.exchange ?? pending.intent.exchange, confidence: 1 }, fromPending: true };
    }
  }

  const rules = parseWithRules(t);
  if (rules.intent !== "UNKNOWN" && rules.confidence >= CONFIDENCE_THRESHOLD) return { intent: rules, fromPending: false };

  const env = getEnv();
  const interpreter = getInterpreter();
  if (interpreter) {
    const plan = await getEffectivePlan(deps.db, user.id);
    const used = await usageToday(deps.db, user.id, "AI_REQUEST");
    if (used < Math.min(plan.limits.dailyAiRequests, env.AI_DAILY_REQUESTS_PER_USER)) {
      await recordUsage(deps.db, { userId: user.id, usageType: "AI_REQUEST", estimatedCostInr: env.PULSE_COST_AI_REQUEST_INR });
      const ai = await interpretWithAi(interpreter, t);
      if (ai.ok) return { intent: ai.intent, fromPending: false };
    }
  }
  return { intent: rules, fromPending: false };
}

/**
 * Produces the reply text for one inbound message from a known user. Pure with
 * respect to WhatsApp: the caller sends the reply.
 */
export async function replyTo(deps: ConversationDeps, user: PulseUser, message: NormalizedInbound, isNew: boolean): Promise<string | null> {
  const now = deps.now?.() ?? new Date();
  const conversation = await getConversation(deps.db, user.id);
  const ctx = readContext(conversation, now);
  const greeting = isNew || !user.welcomedAt ? welcomeText() : null;
  if (greeting) await deps.db.user.update({ where: { id: user.id }, data: { welcomedAt: now } });

  if (message.text === null || !message.text.trim()) {
    return [greeting, "I can only read text messages. Reply *help* to see what I can do."].filter(Boolean).join("\n\n");
  }
  const text = message.text.slice(0, 1000);

  if (ctx.pending?.kind === "confirm_delete") {
    if (/^\s*yes,?\s*delete\s*$/i.test(text)) {
      const plan = await getEffectivePlan(deps.db, user.id);
      await saveContext(deps.db, conversation.id, {}, now);
      return confirmDeletion({ ...toolCtxBase(deps, user, ctx, message.providerMessageId, now), plan });
    }
  }

  const { intent } = await interpret(deps, user, text, ctx);

  if (intent.intent === "UNKNOWN" || intent.confidence < CONFIDENCE_THRESHOLD) {
    await saveContext(deps.db, conversation.id, { lastInstrument: ctx.lastInstrument }, now);
    if (greeting) return greeting;
    return `Sorry, I didn't understand that. I can help with Indian stock prices, watchlists and alerts.\n\n${HELP_TEXT}`;
  }

  const plan = await getEffectivePlan(deps.db, user.id);
  const toolCtx: ToolContext = { ...toolCtxBase(deps, user, ctx, message.providerMessageId, now), plan };

  // AGREE completes a pending action that needed consent.
  if (intent.intent === "AGREE") {
    const agreed = await executeTool(toolCtx, intent);
    if (ctx.pending?.kind === "consent") {
      const resumed = await executeTool({ ...toolCtx, context: { lastInstrument: ctx.lastInstrument } }, ctx.pending.intent);
      await persist(deps, conversation.id, ctx, resumed, now);
      return resumed.reply;
    }
    await persist(deps, conversation.id, ctx, { ...agreed, pending: null }, now);
    return agreed.reply;
  }

  const tool = toolFor(intent.intent);
  if (tool?.requiresPrivacyConsent && !(await hasActiveConsent(deps.db, user.id, "PRIVACY_NOTICE"))) {
    await saveContext(deps.db, conversation.id, { lastInstrument: ctx.lastInstrument, pending: { kind: "consent", intent } }, now);
    return [greeting, consentAsk()].filter(Boolean).join("\n\n");
  }

  const result = await executeTool(toolCtx, intent);
  await persist(deps, conversation.id, ctx, result, now);
  if (greeting && (intent.intent === "HELP" || intent.intent === "GREETING")) return `${greeting}\n\n${HELP_TEXT}`;
  return [greeting, result.reply].filter(Boolean).join("\n\n");
}

function toolCtxBase(deps: ConversationDeps, user: PulseUser, context: ConversationContext, sourceMessageId: string, now: Date) {
  return { db: deps.db, redis: deps.redis, calendar: deps.calendar, provider: deps.provider, user, context, sourceMessageId, now };
}

async function persist(
  deps: ConversationDeps,
  conversationId: string,
  prev: ConversationContext,
  result: { pending?: ConversationContext["pending"] | null; lastInstrument?: ConversationContext["lastInstrument"] },
  now: Date
) {
  const next: ConversationContext = {
    lastInstrument: result.lastInstrument ?? prev.lastInstrument,
    pending: result.pending === undefined ? prev.pending : result.pending ?? undefined,
  };
  await saveContext(deps.db, conversationId, next, now);
}

export type InboundOutcome = "replied" | "duplicate" | "rate_limited" | "ignored" | "skipped";

/**
 * Worker entry point for one inbound WhatsApp message (already signature-verified
 * and deduplicated by the webhook). Identity comes from the message sender only.
 */
export async function processInboundMessage(deps: ConversationDeps, event: NormalizedInbound): Promise<InboundOutcome> {
  const env = getEnv();
  const now = deps.now?.() ?? new Date();
  const { user, isNew } = await resolveUserByWaId(deps.db, event.waId, event.profileName);
  if (user.status === "DISABLED") return "ignored";

  // Record the inbound message once (providerMessageId is unique).
  try {
    await deps.db.message.create({
      data: {
        userId: user.id,
        providerMessageId: event.providerMessageId,
        direction: "INBOUND",
        messageType: event.messageType,
        content: event.text?.slice(0, 1000) ?? null,
        status: "RECEIVED",
        receivedAt: event.sentAt,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    // Seen before. If our reply already exists, this is a true duplicate; otherwise a
    // previous attempt failed part-way and we continue (each step is idempotent).
    const replied = await deps.db.message.findUnique({ where: { idempotencyKey: `reply_${event.providerMessageId}` } });
    if (replied && replied.status !== "FAILED") return "duplicate";
  }

  // The customer-service window opens from the user's message time.
  const fresh = await deps.db.user.update({
    where: { id: user.id },
    data: { lastInboundAt: event.sentAt > now ? now : event.sentAt },
  });
  if (fresh.status !== "ACTIVE") return "ignored";

  if (deps.redis) {
    const count = await incrementWindow(deps.redis, `pulse:rl:in:${user.id}`, 600);
    if (count > env.PULSE_INBOUND_PER_USER_PER_10_MIN) {
      if (count === env.PULSE_INBOUND_PER_USER_PER_10_MIN + 1) {
        await sendToUser(deps.db, fresh, { text: "You're sending messages very quickly. Please wait a few minutes and try again." }, { idempotencyKey: `rl_${event.providerMessageId}`, purpose: "reply", redis: deps.redis });
      }
      logger.warn("conversation.rate_limited", { userId: user.id });
      return "rate_limited";
    }
  }

  const reply = await replyTo(deps, fresh, event, isNew);
  if (!reply) return "skipped";
  const latest = await deps.db.user.findUniqueOrThrow({ where: { id: user.id } });
  // A reply to a deletion request must still go out even though the user is no longer ACTIVE.
  const sendable = latest.status === "DELETION_REQUESTED" ? { ...latest, status: "ACTIVE" as const } : latest;
  const outcome = await sendToUser(deps.db, sendable, { text: reply }, { idempotencyKey: `reply_${event.providerMessageId}`, purpose: "reply", redis: deps.redis });
  return outcome.status === "sent" || outcome.status === "duplicate" ? "replied" : "skipped";
}
