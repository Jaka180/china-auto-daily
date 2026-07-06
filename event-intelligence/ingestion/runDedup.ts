import { getPool, hasDatabaseConfig } from "../lib/db";
import { titleSimilarity } from "../lib/events/dedupe";

type EventRow = {
  id: string;
  title: string;
  company: string | null;
  event_type: string;
  event_date: string | null;
  article_hash: string | null;
  created_at: string;
};

function isDuplicatePair(a: EventRow, b: EventRow) {
  if ((a.company || "").toLowerCase() !== (b.company || "").toLowerCase()) return false;
  if (a.event_type !== b.event_type) return false;
  if (!a.event_date || !b.event_date) return false;
  const aDate = new Date(a.event_date);
  const bDate = new Date(b.event_date);
  if (Number.isNaN(aDate.getTime()) || Number.isNaN(bDate.getTime())) return false;
  const days = Math.abs(aDate.getTime() - bDate.getTime()) / (24 * 60 * 60 * 1000);
  return days <= 3 && titleSimilarity(a.title, b.title) > 0.85;
}

export async function runFullDedup(limit = 500) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required");
  }

  const pool = getPool();
  const result = await pool.query<EventRow>(
    `select id, title, company, event_type, event_date, article_hash, created_at
     from events
     order by created_at desc
     limit $1`,
    [limit]
  );

  const keep = new Set<string>();
  const remove = new Set<string>();
  const rows = result.rows;

  const hashSeen = new Map<string, string>();
  for (const row of rows) {
    if (row.article_hash && hashSeen.has(row.article_hash)) {
      remove.add(row.id);
      continue;
    }
    if (row.article_hash) hashSeen.set(row.article_hash, row.id);
  }

  for (const row of rows) {
    if (remove.has(row.id)) continue;
    const duplicateOf = rows.find((candidate) =>
      candidate.id !== row.id &&
      !remove.has(candidate.id) &&
      (keep.has(candidate.id) || new Date(candidate.created_at) < new Date(row.created_at)) &&
      isDuplicatePair(row, candidate)
    );
    if (duplicateOf) {
      remove.add(row.id);
    } else {
      keep.add(row.id);
    }
  }

  if (remove.size) {
    await pool.query("delete from events where id = any($1::uuid[])", [[...remove]]);
  }

  return {
    scanned: rows.length,
    removed: remove.size
  };
}
