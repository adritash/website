import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { logger, withCorrelation } from "@/pulse/infrastructure/logger";
import { handleRazorpayWebhook } from "@/pulse/modules/payments/razorpay.webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.PULSE_ENABLED || env.PAYMENT_PROVIDER !== "razorpay") return new NextResponse("Not found", { status: 404 });
  return withCorrelation(undefined, async () => {
    try {
      const raw = await request.text();
      if (raw.length > 256 * 1024) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
      const result = await handleRazorpayWebhook(getDb(), raw, request.headers.get("x-razorpay-signature"), request.headers.get("x-razorpay-event-id"));
      return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      logger.error("razorpay.webhook.error", { error });
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
  });
}
