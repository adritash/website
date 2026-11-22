import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/pulse/config/env";
import { getDb } from "@/pulse/infrastructure/db";
import { signToken, verifyPassword, verifyToken } from "@/pulse/lib/crypto";
import type { AdminRole } from "@/pulse/generated/prisma/enums";

export const ADMIN_COOKIE = "pulse_admin";
const SESSION_TTL_SECONDS = 8 * 3600;

const ROLE_RANK: Record<AdminRole, number> = { VIEWER: 1, OPERATOR: 2, OWNER: 3 };

export type AdminSession = { adminId: string; email: string; role: AdminRole };

export function roleAllows(role: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/** Verifies credentials. Always runs a hash comparison so timing does not reveal valid emails. */
export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  const db = getDb();
  const admin = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  const dummy = "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);
  const ok = await verifyPassword(password, admin?.passwordHash ?? dummy);
  if (!admin || !admin.active || !ok) return null;
  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  return { adminId: admin.id, email: admin.email, role: admin.role };
}

export function createAdminSessionToken(session: AdminSession): string {
  return signToken({ sub: session.adminId, role: session.role, kind: "admin" }, getEnv().ADMIN_AUTH_SECRET, SESSION_TTL_SECONDS);
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** Reads and re-validates the admin session against the database (disabled admins lose access at once). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const env = getEnv();
  if (!env.PULSE_ENABLED || !env.ADMIN_AUTH_SECRET) return null;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const payload = verifyToken<{ sub?: string; kind?: string }>(token, env.ADMIN_AUTH_SECRET);
  if (!payload?.sub || payload.kind !== "admin") return null;
  const admin = await getDb().adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !admin.active) return null;
  return { adminId: admin.id, email: admin.email, role: admin.role };
}

/** For server components: redirects to the login page when not signed in or not allowed. */
export async function requireAdminPage(required: AdminRole = "VIEWER"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleAllows(session.role, required)) redirect("/admin?error=forbidden");
  return session;
}
