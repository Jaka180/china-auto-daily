import { NextResponse, type NextRequest } from "next/server";
import { hasDatabaseConfig } from "@/lib/db";
import { authorizeCronRequest } from "@/lib/apiAuth";
import { runFullDedup } from "@/ingestion/runDedup";

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

  const limit = request.nextUrl.searchParams.get("limit");
  try {
    const summary = await runFullDedup(limit ? Number(limit) : 500);
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
