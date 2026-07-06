import { NextResponse, type NextRequest } from "next/server";
import { clearAdminSession } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
