import { ingestWhatsAppWebhook } from "@/pulse/modules/whatsapp/whatsapp.ingest";
import { processInboundJob } from "@/pulse/workers/processors";
import type { InboundJob } from "@/pulse/infrastructure/queue";
import { fakeQueue, inboundPayload, sign, TEST_WA_ID, type TestEnv } from "../helpers";

/** Sends one WhatsApp message through webhook → queue → worker and returns Pulse's reply text. */
export async function say(env: TestEnv, text: string, opts: { waId?: string; id?: string } = {}) {
  const queue = fakeQueue<InboundJob>();
  const { id, body } = inboundPayload(text, { waId: opts.waId ?? TEST_WA_ID, id: opts.id, at: env.clock.now });
  const raw = JSON.stringify(body);
  const before = env.transport.sent.length;
  const res = await ingestWhatsAppWebhook(env.db, queue, raw, sign(raw));
  if (res.status !== 200) throw new Error(`webhook returned ${res.status}`);
  for (const job of queue.jobs) {
    await processInboundJob({ db: env.db, redis: env.redis, provider: env.provider, now: () => env.clock.now }, job.data.webhookEventId, false);
  }
  const sent = env.transport.sent.slice(before);
  const last = sent.at(-1);
  return { id, raw, res, queued: queue.jobs.length, replies: sent, text: last?.payload.type === "text" ? last.payload.text : undefined };
}
