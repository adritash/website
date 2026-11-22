import type { NextRequest } from "next/server";

/**
 * CSRF guard for cookie-authenticated form posts: the Origin (or Referer) must be
 * this site. Session cookies are also SameSite=Strict.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Redirect back to a local path only (prevents open redirects). */
export function safeLocalPath(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}
