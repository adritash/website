import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { randomToken, sha256Hex, signToken, verifyToken } from "@/pulse/lib/crypto";

const LINK_TTL_MS = 15 * 60 * 1000;
export const USER_SESSION_COOKIE = "pulse_session";
export const USER_SESSION_TTL_SECONDS = 7 * 24 * 3600;

/** Single-use dashboard link, sent only to the user's own verified WhatsApp number. */
export async function createLoginLink(db: Db, userId: string): Promise<string> {
  const token = randomToken(32);
  await db.loginToken.create({ data: { userId, tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + LINK_TTL_MS) } });
  return `${getEnv().NEXT_PUBLIC_APP_URL}/pulse/login?token=${token}`;
}

/** Consumes a link token atomically. Returns the user id or null. */
export async function consumeLoginToken(db: Db, token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const tokenHash = sha256Hex(token);
  const result = await db.loginToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (result.count !== 1) return null;
  const row = await db.loginToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!row || row.user.status !== "ACTIVE") return null;
  return row.userId;
}

export function createUserSessionToken(userId: string): string {
  return signToken({ sub: userId, kind: "user" }, getEnv().PULSE_SESSION_SECRET, USER_SESSION_TTL_SECONDS);
}

export function readUserSessionToken(token: string | undefined): string | null {
  const payload = verifyToken<{ sub?: string; kind?: string }>(token, getEnv().PULSE_SESSION_SECRET);
  return payload?.kind === "user" && payload.sub ? payload.sub : null;
}
