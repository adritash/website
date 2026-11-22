import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/pulse/infrastructure/db";
import { isSameOrigin } from "@/pulse/lib/http";
import { pauseAlerts, resumeAlerts } from "@/pulse/modules/alerts/alert.service";
import { loadCalendar } from "@/pulse/modules/market-calendar/market-calendar.service";
import { USER_SESSION_COOKIE } from "@/pulse/modules/users/login-link";
import { requestDeletion, revokeConsent } from "@/pulse/modules/users/user.service";
import { getSessionUser, userCookieOptions } from "@/pulse/modules/users/user-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const user = await getSessionUser();
  const back = NextResponse.redirect(new URL("/pulse/dashboard", request.nextUrl.origin), 303);
  if (!user) return back;
  const form = await request.formData();
  const action = form.get("action");
  const db = getDb();
  if (action === "optout") {
    await pauseAlerts(db, user.id, {});
    await db.user.update({ where: { id: user.id }, data: { proactiveOptOutAt: new Date() } });
    await revokeConsent(db, user.id, "PROACTIVE_MESSAGES");
  } else if (action === "optin") {
    await db.user.update({ where: { id: user.id }, data: { proactiveOptOutAt: null } });
    await resumeAlerts(db, await loadCalendar(db), user.id, {});
  } else if (action === "delete" && form.get("confirm") === "yes") {
    await requestDeletion(db, user.id);
    const res = NextResponse.redirect(new URL("/pulse?deleted=1", request.nextUrl.origin), 303);
    res.cookies.set(USER_SESSION_COOKIE, "", { ...userCookieOptions, maxAge: 0 });
    return res;
  }
  return back;
}
