import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/pulse/infrastructure/db";
import { isSameOrigin } from "@/pulse/lib/http";
import { cancelAlerts, pauseAlerts, resumeAlerts } from "@/pulse/modules/alerts/alert.service";
import { loadCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { getSessionUser } from "@/pulse/modules/users/user-session";

export const runtime = "nodejs";

/** Dashboard alert actions. Ownership is enforced in the service (userId from the session only). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/pulse/dashboard", request.nextUrl.origin), 303);
  const form = await request.formData();
  const alertId = String(form.get("alertId") ?? "");
  const action = String(form.get("action") ?? "");
  const db = getDb();
  try {
    if (action === "cancel") await cancelAlerts(db, user.id, { alertId });
    else if (action === "pause") await pauseAlerts(db, user.id, { alertId });
    else if (action === "resume" && !user.proactiveOptOutAt) await resumeAlerts(db, await loadCalendar(db), user.id, { alertId });
  } catch {
    // NotFound (including another user's alert) is logged by the service; show the dashboard again.
  }
  return NextResponse.redirect(new URL("/pulse/dashboard", request.nextUrl.origin), 303);
}
