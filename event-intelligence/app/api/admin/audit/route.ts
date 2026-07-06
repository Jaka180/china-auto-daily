import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/adminAuth";
import { listAuditLogs } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminRequest(request, "viewer");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const limit = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 100)));
  const logs = await listAuditLogs({
    actor: request.nextUrl.searchParams.get("actor") || undefined,
    action: request.nextUrl.searchParams.get("action") || undefined,
    targetType: request.nextUrl.searchParams.get("target_type") || undefined,
    limit
  });
  return NextResponse.json({ ok: true, logs });
}
