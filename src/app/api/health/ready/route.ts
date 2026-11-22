import { NextResponse } from "next/server";
import { readiness } from "@/pulse/modules/health/health.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Readiness: database and Redis reachable. Component names and ok/fail only. */
export async function GET() {
  try {
    const result = await readiness();
    return NextResponse.json(
      { status: result.ready ? "ok" : "unavailable", components: result.components },
      { status: result.ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
