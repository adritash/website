import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { getQueues } from "@/pulse/infrastructure/queue";
import { logger, withCorrelation } from "@/pulse/infrastructure/logger";
import { ingestWhatsAppWebhook } from "@/pulse/modules/whatsapp/whatsapp.ingest";
import { verifySubscription } from "@/pulse/modules/whatsapp/whatsapp.webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Meta webhook verification handshake. */
export function GET(request: NextRequest) {
  const env = getEnv();
  if (!env.PULSE_ENABLED) return new NextResponse("Not found", { status: 404 });
  const challenge = verifySubscription(request.nextUrl.searchParams, env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  if (!challenge) return new NextResponse("Forbidden", { status: 403, headers: noStore });
  return new NextResponse(challenge, { status: 200, headers: { ...noStore, "Content-Type": "text/plain" } });
}

/** Inbound messages and delivery statuses. */
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.PULSE_ENABLED) return new NextResponse("Not found", { status: 404 });
  const correlationId = request.headers.get("x-request-id") ?? undefined;
  return withCorrelation(correlationId, async () => {
    try {
      const rawBody = await request.text();
      const result = await ingestWhatsAppWebhook(
        getDb(),
        getQueues().inbound,
        rawBody,
        request.headers.get("x-hub-signature-256")
      );
      return NextResponse.json(result.body, { status: result.status, headers: noStore });
    } catch (error) {
      logger.error("whatsapp.webhook.error", { error });
      // 503 asks Meta to retry later; events already recorded are deduplicated.
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503, headers: noStore });
    }
  });
}
