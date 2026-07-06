import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/adminAuth";
import { listAdminSignals, markSignalNoise } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectBack(request: NextRequest) {
  return NextResponse.redirect(request.headers.get("referer") || new URL("/admin/signals", request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  const auth = requireAdminRequest(request, "viewer");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 80)));
  const status = request.nextUrl.searchParams.get("status") || "all";
  const sourceType = request.nextUrl.searchParams.get("source_type") || "all";
  const signals = await listAdminSignals({ status, sourceType, limit });
  return NextResponse.json({ ok: true, signals });
}

export async function POST(request: NextRequest) {
  const auth = requireAdminRequest(request, "editor");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const action = String(form.get("action") || "");
  const signalId = String(form.get("signal_id") || "");
  if (!signalId) {
    return NextResponse.json({ ok: false, error: "signal_id is required" }, { status: 400 });
  }

  if (action === "mark_noise") {
    await markSignalNoise(signalId, true, String(form.get("noise_reason") || "").trim() || "Marked as noise", auth.actor);
    return redirectBack(request);
  }
  if (action === "clear_noise") {
    await markSignalNoise(signalId, false, null, auth.actor);
    return redirectBack(request);
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
