import { NextResponse, type NextRequest } from "next/server";
import { createAdminSession, verifyAdminCredentials } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const actor = verifyAdminCredentials(email, password);

  if (!actor) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), { status: 303 });
  }

  await createAdminSession(actor);
  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
