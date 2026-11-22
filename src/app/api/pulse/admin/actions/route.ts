import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/pulse/infrastructure/db";
import { getQueues, jobId } from "@/pulse/infrastructure/queue";
import { isSameOrigin, safeLocalPath } from "@/pulse/lib/http";
import { getAdminSession, roleAllows } from "@/pulse/modules/admin/admin-auth";
import { audit, securityEvent } from "@/pulse/modules/audit/audit.service";
import { requestDeletion } from "@/pulse/modules/users/user.service";
import type { AdminRole } from "@/pulse/generated/prisma/enums";

export const runtime = "nodejs";

const REQUIRED: Record<string, AdminRole> = {
  "disable-user": "OPERATOR",
  "enable-user": "OPERATOR",
  "delete-user": "OWNER",
  "pause-alert": "OPERATOR",
  "retry-execution": "OPERATOR",
};

/** Admin mutations. Each requires a fresh DB-checked session, a role and same-origin; all are audited. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.nextUrl.origin), 303);
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const back = new URL(safeLocalPath(form.get("back"), "/admin"), request.nextUrl.origin);
  const db = getDb();
  const required = REQUIRED[action];
  if (!required || !roleAllows(session.role, required)) {
    await securityEvent(db, { actorType: "ADMIN", actorId: session.adminId, action: `admin.${action || "unknown"}`, outcome: "denied" });
    return new NextResponse("Forbidden", { status: 403 });
  }

  const userId = String(form.get("userId") ?? "");
  const alertId = String(form.get("alertId") ?? "");
  const executionId = String(form.get("executionId") ?? "");
  switch (action) {
    case "disable-user":
      await db.user.updateMany({ where: { id: userId, status: "ACTIVE" }, data: { status: "DISABLED" } });
      await db.alert.updateMany({ where: { userId, status: "ACTIVE" }, data: { status: "PAUSED", nextRunAt: null } });
      break;
    case "enable-user":
      await db.user.updateMany({ where: { id: userId, status: "DISABLED" }, data: { status: "ACTIVE" } });
      break;
    case "delete-user":
      if (await db.user.findUnique({ where: { id: userId } })) await requestDeletion(db, userId);
      break;
    case "pause-alert":
      await db.alert.updateMany({ where: { id: alertId, status: "ACTIVE" }, data: { status: "PAUSED", nextRunAt: null } });
      break;
    case "retry-execution": {
      const updated = await db.alertExecution.updateMany({ where: { id: executionId, status: "FAILED" }, data: { status: "QUEUED", errorCode: null, errorMessage: null } });
      if (updated.count) await getQueues().alerts.add("execute", { executionId }, { jobId: jobId("exec", executionId, "retry", Date.now()) });
      break;
    }
  }
  await audit(db, { actorType: "ADMIN", actorId: session.adminId, action: `admin.${action}`, resourceId: userId || alertId || executionId, outcome: "success" });
  return NextResponse.redirect(back, 303);
}
