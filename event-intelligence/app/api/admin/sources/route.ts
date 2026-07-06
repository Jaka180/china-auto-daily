import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/adminAuth";
import { listAdminSources, updateAdminSource } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectBack(request: NextRequest) {
  return NextResponse.redirect(request.headers.get("referer") || new URL("/admin/sources", request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  const auth = requireAdminRequest(request, "viewer");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const sources = await listAdminSources();
  return NextResponse.json({ ok: true, sources });
}

export async function POST(request: NextRequest) {
  const auth = requireAdminRequest(request, "admin");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const sourceId = String(form.get("source_id") || "");
  if (!sourceId) {
    return NextResponse.json({ ok: false, error: "source_id is required" }, { status: 400 });
  }

  const statusRaw = String(form.get("status") || "");
  const priority = Number(form.get("priority"));
  const reliabilityScore = Number(form.get("reliability_score"));
  await updateAdminSource(sourceId, {
    status: statusRaw === "inactive" ? "inactive" : "active",
    priority: Number.isFinite(priority) ? priority : undefined,
    reliability_score: Number.isFinite(reliabilityScore) ? reliabilityScore : undefined
  }, auth.actor);

  return redirectBack(request);
}
