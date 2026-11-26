import { NextResponse } from "next/server";

/**
 * Shared guards for public API routes.
 *
 * Note: an Origin check only stops cross-site abuse from other people's web
 * pages. Scripts can fake the header, so it complements (and never replaces)
 * rate limiting and provider-side spend limits.
 */

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function safeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** True when the request comes from this site (or the configured site URL). */
export function isSameSiteRequest(request: Request): boolean {
  const allowed = new Set<string>();
  allowed.add(new URL(request.url).origin);

  const configured = safeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  if (configured) allowed.add(configured);

  const origin = safeOrigin(request.headers.get("origin"));
  if (origin) return allowed.has(origin);

  const referer = safeOrigin(request.headers.get("referer"));
  if (referer) return allowed.has(referer);

  return false;
}

export function forbiddenResponse(shape: "error" | "success") {
  const message = "Request origin is not allowed.";
  return NextResponse.json(
    shape === "success" ? { success: false, error: message } : { error: message },
    { status: 403 }
  );
}

type JsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Reads a JSON body while enforcing a real byte limit. The Content-Length
 * header alone is not enough, because it can be missing or wrong.
 */
export async function readJsonLimited(
  request: Request,
  maxBytes: number
): Promise<JsonResult> {
  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > maxBytes) {
    return { ok: false, status: 413, error: "Request payload is too large." };
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Invalid request body." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Request payload is too large." };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  }

  try {
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  }
}

/** Trims and caps a free-text field so it cannot inflate prompts or costs. */
export function capText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}
