import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

/** Basic liveness of the web app. Reveals no infrastructure details. */
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers });
}
