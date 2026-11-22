import type { Db } from "@/pulse/infrastructure/db";
import { currentCorrelationId, logger } from "@/pulse/infrastructure/logger";
import { redact } from "@/pulse/infrastructure/logger";
import type { ActorType } from "@/pulse/generated/prisma/enums";

export type AuditEntry = {
  actorType: ActorType;
  actorId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome: "success" | "denied" | "failure" | "skipped";
  security?: boolean;
  metadata?: Record<string, unknown>;
};

/** Writes an audit row. Audit failures are logged but never break the user action. */
export async function audit(db: Db, entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorType: entry.actorType,
        actorId: entry.actorId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        outcome: entry.outcome,
        security: entry.security ?? false,
        metadata: entry.metadata ? (redact(entry.metadata) as object) : undefined,
        correlationId: currentCorrelationId(),
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", { action: entry.action, error });
  }
}

/** Security events are audited and also logged at warn for alerting. */
export async function securityEvent(db: Db, entry: Omit<AuditEntry, "security">): Promise<void> {
  logger.warn("security.event", { action: entry.action, actorId: entry.actorId, resourceType: entry.resourceType });
  await audit(db, { ...entry, security: true });
}
