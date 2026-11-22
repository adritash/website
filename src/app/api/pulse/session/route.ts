import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { getRedis, incrementWindow } from "@/pulse/infrastructure/redis";
import { clientIp, isSameOrigin } from "@/pulse/lib/http";
import { consumeLoginToken, createUserSessionToken, USER_SESSION_COOKIE } from "@/pulse/modules/users/login-link";
import { userCookieOptions } from "@/pulse/modules/users/user-session";

export const runtime = "nodejs";

/** Exchanges a single-use WhatsApp link token for a dashboard session; DELETE signs out. */
export async function POST(request: NextRequest) {
  if (!getEnv().PULSE_ENABLED) return new NextResponse("Not found", { status: 404 });
  const base = request.nextUrl.origin;
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  if (form.get("action") === "logout") {
    const res = NextResponse.redirect(new URL("/pulse", base), 303);
    res.cookies.set(USER_SESSION_COOKIE, "", { ...userCookieOptions, maxAge: 0 });
    return res;
  }
  if ((await incrementWindow(getRedis(), `pulse:rl:login:${clientIp(request)}`, 600)) > 20) {
    return new NextResponse("Too many attempts", { status: 429 });
  }
  const token = form.get("token");
  const userId = typeof token === "string" ? await consumeLoginToken(getDb(), token) : null;
  if (!userId) return NextResponse.redirect(new URL("/pulse/login?error=expired", base), 303);
  const res = NextResponse.redirect(new URL("/pulse/dashboard", base), 303);
  res.cookies.set(USER_SESSION_COOKIE, createUserSessionToken(userId), userCookieOptions);
  return res;
}
