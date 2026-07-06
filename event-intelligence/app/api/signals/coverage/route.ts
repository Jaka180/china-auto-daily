import { NextResponse } from "next/server";
import { ensureSignalSchema, hasDatabaseConfig } from "@/lib/db";
import { computeSignalCoverage } from "@/lib/signals/coverage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({
      ok: false,
      error: "DATABASE_URL or SUPABASE_DATABASE_URL is not configured"
    }, { status: 503 });
  }

  await ensureSignalSchema();
  const coverage = await computeSignalCoverage();
  return NextResponse.json({ ok: true, ...coverage });
}
