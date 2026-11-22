import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/pulse/modules/admin/admin-auth";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", request.nextUrl.origin), 303);
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return res;
}
