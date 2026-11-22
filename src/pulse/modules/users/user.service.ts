import type { Db } from "@/pulse/infrastructure/db";
import { getEnv } from "@/pulse/config/env";
import { decrypt, encrypt, hashPhone } from "@/pulse/lib/crypto";
import { normalizeWaId } from "@/pulse/lib/phone";
import { PulseError } from "@/pulse/lib/errors";
import { audit } from "@/pulse/modules/audit/audit.service";
import type { ConsentType } from "@/pulse/generated/prisma/enums";

/** Bump when the user-facing wording of a consent changes. */
export const CONSENT_TEXT_VERSIONS: Record<ConsentType, string> = {
  PRIVACY_NOTICE: "privacy-2026-11-v1",
  RECURRING_UPDATES: "recurring-2026-11-v1",
  PROACTIVE_MESSAGES: "proactive-2026-11-v1",
};

export type PulseUser = Awaited<ReturnType<Db["user"]["findUniqueOrThrow"]>>;

/**
 * Identity comes only from the WhatsApp `wa_id` on a signature-verified webhook,
 * never from numbers typed in message text.
 */
export async function resolveUserByWaId(
  db: Db,
  waId: string,
  displayName?: string
): Promise<{ user: PulseUser; isNew: boolean }> {
  const env = getEnv();
  const digits = normalizeWaId(waId);
  if (!digits) throw new PulseError("INVALID_WA_ID", "Invalid WhatsApp id");
  const phoneHash = hashPhone(digits, env.PULSE_PHONE_HASH_KEY);

  const existing = await db.user.findUnique({ where: { phoneHash } });
  if (existing) {
    return { user: existing, isNew: false };
  }

  try {
    const user = await db.user.create({
      data: {
        phoneHash,
        phoneEncrypted: encrypt(digits, env.PULSE_ENCRYPTION_KEY),
        phoneLast4: digits.slice(-4),
        displayName: displayName?.slice(0, 80),
      },
    });
    await audit(db, { actorType: "SYSTEM", action: "user.created", resourceType: "User", resourceId: user.id, outcome: "success" });
    return { user, isNew: true };
  } catch (error) {
    // Concurrent first messages from the same number: the unique constraint wins.
    const raced = await db.user.findUnique({ where: { phoneHash } });
    if (raced) return { user: raced, isNew: false };
    throw error;
  }
}

export function phoneForSending(user: Pick<PulseUser, "phoneEncrypted">): string {
  return decrypt(user.phoneEncrypted, getEnv().PULSE_ENCRYPTION_KEY);
}

export async function hasActiveConsent(db: Db, userId: string, consentType: ConsentType): Promise<boolean> {
  const record = await db.consentRecord.findFirst({
    where: { userId, consentType, revokedAt: null },
    select: { id: true },
  });
  return record !== null;
}

export async function grantConsent(
  db: Db,
  userId: string,
  consentType: ConsentType,
  source: string,
  scopeRef?: string
) {
  return db.consentRecord.create({
    data: { userId, consentType, consentTextVersion: CONSENT_TEXT_VERSIONS[consentType], source, scopeRef },
  });
}

export async function revokeConsent(db: Db, userId: string, consentType: ConsentType, scopeRef?: string) {
  await db.consentRecord.updateMany({
    where: { userId, consentType, revokedAt: null, ...(scopeRef ? { scopeRef } : {}) },
    data: { revokedAt: new Date() },
  });
}

/** Marks the account for erasure and stops all proactive messages immediately. */
export async function requestDeletion(db: Db, userId: string) {
  const now = new Date();
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status: "DELETION_REQUESTED", deletionRequestedAt: now, proactiveOptOutAt: now } }),
    db.alert.updateMany({ where: { userId, status: { in: ["ACTIVE", "PAUSED"] } }, data: { status: "CANCELLED", cancelledAt: now, nextRunAt: null } }),
    db.consentRecord.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
  ]);
  await audit(db, { actorType: "USER", actorId: userId, action: "user.deletion_requested", resourceType: "User", resourceId: userId, outcome: "success" });
}

/**
 * Erases personal data for users who requested deletion. Cascades remove messages,
 * watchlist, alerts, consents and tokens. The row itself is anonymised and kept as
 * DELETED (phone hash replaced) so payment/audit references stay consistent.
 * If the same number writes again, a brand-new user is created.
 */
export async function eraseRequestedUsers(db: Db, graceMinutes = 0): Promise<number> {
  const cutoff = new Date(Date.now() - graceMinutes * 60_000);
  const users = await db.user.findMany({
    where: { status: "DELETION_REQUESTED", deletionRequestedAt: { lte: cutoff } },
    select: { id: true },
    take: 100,
  });
  for (const { id } of users) {
    await db.$transaction([
      db.message.deleteMany({ where: { userId: id } }),
      db.watchlistItem.deleteMany({ where: { userId: id } }),
      db.alert.deleteMany({ where: { userId: id } }),
      db.conversation.deleteMany({ where: { userId: id } }),
      db.loginToken.deleteMany({ where: { userId: id } }),
      db.user.update({
        where: { id },
        data: { status: "DELETED", phoneHash: `erased_${id}`, phoneEncrypted: "erased", phoneLast4: "0000", displayName: null, lastInboundAt: null },
      }),
    ]);
    await audit(db, { actorType: "SYSTEM", action: "user.erased", resourceType: "User", resourceId: id, outcome: "success" });
  }
  return users.length;
}
