import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { getRedis, incrementWindow } from "@/pulse/infrastructure/redis";
import { clientIp, isSameOrigin } from "@/pulse/lib/http";
import { sha256Hex } from "@/pulse/lib/crypto";
import { ADMIN_COOKIE, adminCookieOptions, authenticateAdmin, createAdminSessionToken } from "@/pulse/modules/admin/admin-auth";
import { audit, securityEvent } from "@/pulse/modules/audit/audit.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.PULSE_ENABLED || !env.ADMIN_AUTH_SECRET) return new NextResponse("Not found", { status: 404 });
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const base = request.nextUrl.origin;
  const form = await request.formData();
  const email = String(form.get("email") ?? "").slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const redis = getRedis();
  const ip = clientIp(request);
  const [byIp, byEmail] = await Promise.all([
    incrementWindow(redis, `pulse:rl:admin:ip:${ip}`, 900),
    incrementWindow(redis, `pulse:rl:admin:email:${sha256Hex(email.toLowerCase())}`, 900),
  ]);
  if (byIp > 20 || byEmail > 5) return NextResponse.redirect(new URL("/admin/login?error=rate", base), 303);

  const session = await authenticateAdmin(email, password);
  const db = getDb();
  if (!session) {
    await securityEvent(db, { actorType: "ADMIN", action: "admin.login_failed", outcome: "denied", metadata: { emailHash: sha256Hex(email.toLowerCase()).slice(0, 16) } });
    return NextResponse.redirect(new URL("/admin/login?error=1", base), 303);
  }
  await audit(db, { actorType: "ADMIN", actorId: session.adminId, action: "admin.login", outcome: "success" });
  const res = NextResponse.redirect(new URL("/admin", base), 303);
  res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(session), adminCookieOptions);
  return res;
}
