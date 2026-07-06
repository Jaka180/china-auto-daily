import { NextResponse, type NextRequest } from "next/server";
import { ensureSeedEvents, hasDatabaseConfig, listEvents } from "@/lib/db";
import { eventTypeLabel, resolveLocale, t } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({
      ok: false,
      error: "DATABASE_URL or SUPABASE_DATABASE_URL is not configured"
    }, { status: 503 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = Number(limitParam);
  const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 80;
  const locale = resolveLocale(request.nextUrl.searchParams.get("lang") || undefined);
  const copy = t(locale);

  await ensureSeedEvents();
  const events = await listEvents({ limit });
  return NextResponse.json({
    ok: true,
    events: events.map((event, index) => ({
      rank: index + 1,
      priority_label: index < 5 ? copy.highPriority : event.final_score >= 6 ? copy.medium : copy.lowImpact,
      data_label: event.is_seed ? copy.systemData : copy.liveData,
      event_type_label: eventTypeLabel(event.event_type, locale),
      ...event
    }))
  });
}
