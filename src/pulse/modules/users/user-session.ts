import { cookies } from "next/headers";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { readUserSessionToken, USER_SESSION_COOKIE, USER_SESSION_TTL_SECONDS } from "./login-link";

export const userCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: USER_SESSION_TTL_SECONDS,
};

/** The signed-in Pulse user for the dashboard, or null. Re-checked against the DB. */
export async function getSessionUser() {
  const env = getEnv();
  if (!env.PULSE_ENABLED || !env.PULSE_SESSION_SECRET) return null;
  const userId = readUserSessionToken((await cookies()).get(USER_SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await getDb().user.findUnique({ where: { id: userId } });
  return user && user.status === "ACTIVE" ? user : null;
}
