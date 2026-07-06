import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/adminAuth";
import { eventTypeSchema, REVIEW_STATUSES, type ReviewStatus } from "@/lib/events/types";
import { listAdminEvents, updateEventFields, updateEventStatus } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isReviewStatus(value: string): value is ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus);
}

function redirectBack(request: NextRequest) {
  return NextResponse.redirect(request.headers.get("referer") || new URL("/admin/events", request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  const auth = requireAdminRequest(request, "viewer");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const statusParam = request.nextUrl.searchParams.get("status") || "pending";
  const status = statusParam === "all" || isReviewStatus(statusParam) ? statusParam : "pending";
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 50)));
  const events = await listAdminEvents({ status, limit });
  return NextResponse.json({ ok: true, events });
}

export async function POST(request: NextRequest) {
  const auth = requireAdminRequest(request, "editor");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const action = String(form.get("action") || "");
  const eventId = String(form.get("event_id") || "");
  if (!eventId) {
    return NextResponse.json({ ok: false, error: "event_id is required" }, { status: 400 });
  }

  if (action === "approve") {
    await updateEventStatus(eventId, "published", auth.actor);
    return redirectBack(request);
  }
  if (action === "reject") {
    await updateEventStatus(eventId, "rejected", auth.actor);
    return redirectBack(request);
  }
  if (action === "needs_fix") {
    await updateEventStatus(eventId, "needs_fix", auth.actor);
    return redirectBack(request);
  }
  if (action === "status") {
    const status = String(form.get("review_status") || "");
    if (!isReviewStatus(status)) {
      return NextResponse.json({ ok: false, error: "invalid review_status" }, { status: 400 });
    }
    await updateEventStatus(eventId, status, auth.actor);
    return redirectBack(request);
  }
  if (action === "edit") {
    const eventType = String(form.get("event_type") || "");
    const parsedEventType = eventTypeSchema.safeParse(eventType);
    if (!parsedEventType.success) {
      return NextResponse.json({ ok: false, error: "invalid event_type" }, { status: 400 });
    }

    const impact = Number(form.get("impact_score"));
    const confidence = Number(form.get("confidence_score"));
    await updateEventFields(eventId, {
      title: String(form.get("title") || "").trim(),
      summary: String(form.get("summary") || "").trim(),
      event_type: parsedEventType.data,
      company: String(form.get("company") || "").trim() || null,
      market: String(form.get("market") || "").trim() || null,
      model: String(form.get("model") || "").trim() || null,
      event_date: String(form.get("event_date") || "").trim() || null,
      impact_score: Number.isFinite(impact) ? Math.max(0, Math.min(10, impact)) : undefined,
      confidence_score: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : undefined
    }, auth.actor);
    return redirectBack(request);
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
