import { NextResponse, type NextRequest } from "next/server";
import { hasDatabaseConfig } from "@/lib/db";
import { authorizeCronRequest } from "@/lib/apiAuth";
import { runRssIngestion } from "@/ingestion/runRssIngestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (!hasDatabaseConfig()) {
    return NextResponse.json({
      ok: false,
      error: "DATABASE_URL or SUPABASE_DATABASE_URL is not configured"
    }, { status: 503 });
  }

  const search = request.nextUrl.searchParams;
  try {
    const summary = await runRssIngestion({
      feed: search.get("feed") || undefined,
      priority: search.get("priority") ? Number(search.get("priority")) : undefined,
      minPriority: search.get("minPriority") ? Number(search.get("minPriority")) : undefined,
      immediateOnly: search.get("mode") === "immediate",
      deferredOnly: search.get("mode") === "deferred",
      limit: search.get("limit") ? Number(search.get("limit")) : 20
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
