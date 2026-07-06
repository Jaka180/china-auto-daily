import { NextResponse, type NextRequest } from "next/server";
import { ensureSeedEvents, hasDatabaseConfig, listEvents } from "@/lib/db";
import { generateSystemInsight, selectInsightEvents } from "@/lib/insightGenerator";
import { resolveLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({
      ok: false,
      error: "DATABASE_URL or SUPABASE_DATABASE_URL is not configured"
    }, { status: 503 });
  }

  await ensureSeedEvents();
  const events = await listEvents({ limit: 80 });
  const locale = resolveLocale(request.nextUrl.searchParams.get("lang") || undefined);
  const insight = generateSystemInsight(selectInsightEvents(events), locale);

  if (!insight) {
    return NextResponse.json({
      ok: false,
      error: "insufficient event support for insight generation",
      based_on_events: []
    }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    core_signal: insight.core_signal,
    trend: insight.market_trend,
    market_trend: insight.market_trend,
    risk: insight.risk_signal,
    risk_signal: insight.risk_signal,
    confidence: insight.confidence,
    data_scope: insight.data_scope,
    based_on_events: insight.based_on_events,
    support_count: insight.support_count,
    generated_at: insight.generated_at
  });
}
