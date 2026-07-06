import crypto from "node:crypto";
import pg from "pg";
import { generateEventSlug } from "./events/slug";
import { isDuplicateEvent } from "./events/dedupe";
import { knownCompanySeed, knownMarketSeed } from "./events/extractor";
import { computeFinalScore, normalizeSourcePriority } from "./events/scoring";
import { isRssDuplicate, rssEventHash } from "../ingestion/rssDedup";
import { loadSourcesConfig, rssSourcesOnly, type SourceConfig } from "../ingestion/sourceConfig";
import { sourceTypeFromConfig } from "./signals/sourceLayer";
import { decodeHtmlEntities } from "./text";
import type { NormalizedSignal, SignalCoverageLayer, StoredSignal } from "./signals/types";
import type { EventFilters, EventType, ExtractedEvent, ReviewStatus, StoredEvent } from "./events/types";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let signalSchemaReady = false;
let adminSchemaReady = false;

export type AdminRole = "admin" | "editor" | "viewer" | "system";

export type AdminActor = {
  email: string;
  role: AdminRole;
};

export type AuditLogEntry = {
  id: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  before_json: unknown;
  after_json: unknown;
  created_at: string;
};

export type AdminSignal = StoredSignal & {
  admin_status: string;
  is_noise: boolean;
  noise_reason: string | null;
  marked_by: string | null;
  marked_at: string | null;
};

export type AdminSource = {
  id: string;
  source_key: string;
  name: string;
  type: string;
  source_type: string;
  category: string | null;
  url: string | null;
  priority: number;
  reliability_score: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string | null;
};

function needsSsl(connectionString: string) {
  return connectionString.includes("supabase.co") || connectionString.includes("supabase.com");
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);
}

export function getPool() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

function mapEvent(row: Record<string, unknown>): StoredEvent {
  const title = decodeHtmlEntities(String(row.title));
  const summary = decodeHtmlEntities(String(row.summary));
  const eventType = normalizeStoredEventType(row.event_type as EventType, `${title} ${summary}`);
  const finalScore = computeFinalScore({
    impact_score: Number(row.impact_score),
    confidence_score: Number(row.confidence_score),
    source_priority: row.source_priority ? Number(row.source_priority) : null
  });

  return {
    id: String(row.id),
    slug: String(row.slug),
    article_hash: row.article_hash ? String(row.article_hash) : null,
    review_status: (row.review_status ? String(row.review_status) : "published") as ReviewStatus,
    reviewed_by: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewed_at: row.reviewed_at ? new Date(String(row.reviewed_at)).toISOString() : null,
    title,
    summary,
    event_type: eventType,
    company: row.company ? String(row.company) : null,
    market: row.market ? String(row.market) : null,
    model: row.model ? String(row.model) : null,
    event_date: row.event_date ? new Date(String(row.event_date)).toISOString() : null,
    source_url: String(row.source_url),
    source_name: row.source_name ? String(row.source_name) : null,
    source_priority: normalizeSourcePriority(row.source_priority ? Number(row.source_priority) : null),
    source_category: row.source_category ? String(row.source_category) : null,
    final_score: finalScore,
    is_seed: Boolean(row.is_seed),
    signal_ids: Array.isArray(row.signal_ids) ? row.signal_ids.map(String) : null,
    signal_count: Number(row.signal_count || 0),
    impact_score: Number(row.impact_score),
    confidence_score: Number(row.confidence_score),
    raw_content: String(row.raw_content),
    raw_evidence: decodeHtmlEntities(String(row.raw_evidence)),
    low_confidence: Boolean(row.low_confidence),
    created_at: new Date(String(row.created_at)).toISOString()
  };
}

function mapSignal(row: Record<string, unknown>): StoredSignal {
  return {
    id: String(row.id),
    signal_hash: String(row.signal_hash),
    source_type: row.source_type as StoredSignal["source_type"],
    source_name: String(row.source_name),
    source_url: String(row.source_url),
    raw_title: row.raw_title ? decodeHtmlEntities(String(row.raw_title)) : "",
    raw_text: decodeHtmlEntities(String(row.raw_text)),
    timestamp: row.timestamp ? new Date(String(row.timestamp)).toISOString() : null,
    signal_strength: Number(row.signal_strength || 0),
    signal_type: row.signal_type as StoredSignal["signal_type"],
    entity_guess: row.entity_guess ? String(row.entity_guess) : null,
    market_guess: row.market_guess ? String(row.market_guess) : null,
    processed: Boolean(row.processed),
    event_id: row.event_id ? String(row.event_id) : null,
    created_at: new Date(String(row.created_at)).toISOString()
  };
}

function mapAdminSignal(row: Record<string, unknown>): AdminSignal {
  return {
    ...mapSignal(row),
    admin_status: row.admin_status ? String(row.admin_status) : "new",
    is_noise: Boolean(row.is_noise),
    noise_reason: row.noise_reason ? String(row.noise_reason) : null,
    marked_by: row.marked_by ? String(row.marked_by) : null,
    marked_at: row.marked_at ? new Date(String(row.marked_at)).toISOString() : null
  };
}

function mapAdminSource(row: Record<string, unknown>): AdminSource {
  return {
    id: String(row.id),
    source_key: String(row.source_key),
    name: String(row.name),
    type: String(row.type),
    source_type: String(row.source_type),
    category: row.category ? String(row.category) : null,
    url: row.url ? String(row.url) : null,
    priority: Number(row.priority || 6),
    reliability_score: Number(row.reliability_score || 0.7),
    status: row.status === "inactive" ? "inactive" : "active",
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: String(row.id),
    actor_email: row.actor_email ? String(row.actor_email) : null,
    actor_role: row.actor_role ? String(row.actor_role) : null,
    action: String(row.action),
    target_type: String(row.target_type),
    target_id: row.target_id ? String(row.target_id) : null,
    before_json: row.before_json ?? null,
    after_json: row.after_json ?? null,
    created_at: new Date(String(row.created_at)).toISOString()
  };
}

function sourceKey(source: Pick<SourceConfig, "name" | "url" | "endpoint" | "type">) {
  return crypto
    .createHash("sha256")
    .update(`${source.type}|${source.url || source.endpoint || source.name}`)
    .digest("hex");
}

export function signalHash(signal: Pick<NormalizedSignal, "source_url" | "raw_title" | "timestamp" | "signal_type">) {
  return crypto
    .createHash("sha256")
    .update(`${signal.source_url}|${signal.raw_title}|${signal.timestamp || ""}|${signal.signal_type}`)
    .digest("hex");
}

export async function ensureSignalSchema() {
  if (signalSchemaReady) return;
  await getPool().query(`
    alter table events
      add column if not exists signal_ids jsonb,
      add column if not exists signal_count integer not null default 0;

    create table if not exists signals (
      id uuid primary key default gen_random_uuid(),
      signal_hash text unique not null,
      source_type text not null check (source_type in ('OEM', 'POLICY', 'MEDIA', 'CHINA_MEDIA', 'MACRO')),
      source_name text not null,
      source_url text not null,
      raw_title text,
      raw_text text not null,
      timestamp timestamp with time zone,
      signal_strength double precision not null default 0,
      signal_type text not null check (signal_type in (
        'FACT_SIGNAL',
        'POLICY_SIGNAL',
        'PRICE_SIGNAL',
        'EXPORT_SIGNAL',
        'INVESTMENT_SIGNAL',
        'PRODUCTION_SIGNAL',
        'REGULATORY_SIGNAL'
      )),
      entity_guess text,
      market_guess text,
      processed boolean not null default false,
      event_id uuid references events(id) on delete set null,
      created_at timestamp with time zone not null default now(),
      constraint signal_strength_range check (signal_strength >= 0 and signal_strength <= 1)
    );

    create index if not exists signals_source_type_idx on signals (source_type);
    create index if not exists signals_signal_type_idx on signals (signal_type);
    create index if not exists signals_entity_market_idx on signals (entity_guess, market_guess);
    create index if not exists signals_processed_idx on signals (processed);
    create index if not exists signals_timestamp_idx on signals (timestamp desc);
  `);
  signalSchemaReady = true;
}

export async function ensureAdminSchema() {
  if (adminSchemaReady) return;
  await ensureSignalSchema();
  await getPool().query(`
    alter table events
      add column if not exists review_status text,
      add column if not exists reviewed_by text,
      add column if not exists reviewed_at timestamp with time zone;

    update events
      set review_status = 'published'
      where review_status is null;

    alter table events
      alter column review_status set default 'pending',
      alter column review_status set not null;

    do $$
    begin
      if not exists (
        select 1 from pg_constraint where conname = 'events_review_status_check'
      ) then
        alter table events
          add constraint events_review_status_check
          check (review_status in ('pending', 'published', 'rejected', 'needs_fix'));
      end if;
    end $$;

    create index if not exists events_review_status_idx on events (review_status);
    create index if not exists events_review_created_idx on events (review_status, created_at desc);

    alter table signals
      add column if not exists admin_status text not null default 'new',
      add column if not exists is_noise boolean not null default false,
      add column if not exists noise_reason text,
      add column if not exists marked_by text,
      add column if not exists marked_at timestamp with time zone;

    do $$
    begin
      if not exists (
        select 1 from pg_constraint where conname = 'signals_admin_status_check'
      ) then
        alter table signals
          add constraint signals_admin_status_check
          check (admin_status in ('new', 'processed', 'ignored', 'flagged'));
      end if;
    end $$;

    create index if not exists signals_admin_status_idx on signals (admin_status);
    create index if not exists signals_is_noise_idx on signals (is_noise);

    create table if not exists sources (
      id uuid primary key default gen_random_uuid(),
      source_key text unique not null,
      name text not null,
      type text not null default 'rss',
      source_type text not null,
      category text,
      url text,
      priority integer not null default 6,
      reliability_score double precision not null default 0.7,
      status text not null default 'active',
      created_at timestamp with time zone not null default now(),
      updated_at timestamp with time zone
    );

    do $$
    begin
      if not exists (
        select 1 from pg_constraint where conname = 'sources_status_check'
      ) then
        alter table sources
          add constraint sources_status_check
          check (status in ('active', 'inactive'));
      end if;
    end $$;

    create index if not exists sources_status_idx on sources (status);
    create index if not exists sources_source_type_idx on sources (source_type);

    create table if not exists audit_logs (
      id uuid primary key default gen_random_uuid(),
      actor_email text,
      actor_role text,
      action text not null,
      target_type text not null,
      target_id text,
      before_json jsonb,
      after_json jsonb,
      created_at timestamp with time zone not null default now()
    );

    create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
    create index if not exists audit_logs_actor_idx on audit_logs (actor_email);
    create index if not exists audit_logs_target_idx on audit_logs (target_type, target_id);

    alter table events enable row level security;
    drop policy if exists events_public_read_published on events;
    create policy events_public_read_published
      on events
      for select
      using (review_status = 'published');

    alter table signals enable row level security;
    alter table sources enable row level security;
    alter table audit_logs enable row level security;

    do $$
    begin
      if exists (select 1 from pg_roles where rolname = 'anon') then
        grant select on table events to anon;
        revoke insert, update, delete on table events from anon;
        revoke all on table signals, sources, audit_logs from anon;
      end if;

      if exists (select 1 from pg_roles where rolname = 'authenticated') then
        grant select on table events to authenticated;
        revoke insert, update, delete on table events from authenticated;
        revoke all on table signals, sources, audit_logs from authenticated;
      end if;

      if exists (select 1 from pg_roles where rolname = 'service_role') then
        grant select, insert, update, delete on table events, signals, sources, audit_logs to service_role;
      end if;
    end $$;
  `);
  await seedSourcesFromConfig();
  adminSchemaReady = true;
}

export async function insertSignal(signal: NormalizedSignal) {
  await ensureSignalSchema();
  const hash = signalHash(signal);
  const inserted = await getPool().query(
    `insert into signals (
       signal_hash, source_type, source_name, source_url, raw_title, raw_text, timestamp,
       signal_strength, signal_type, entity_guess, market_guess
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     on conflict (signal_hash) do nothing
     returning *`,
    [
      hash,
      signal.source_type,
      signal.source_name,
      signal.source_url,
      signal.raw_title,
      signal.raw_text,
      signal.timestamp,
      signal.signal_strength,
      signal.signal_type,
      signal.entity_guess,
      signal.market_guess
    ]
  );

  if (inserted.rows[0]) {
    return { status: "stored" as const, signal: mapSignal(inserted.rows[0]) };
  }

  const existing = await getPool().query("select * from signals where signal_hash = $1 limit 1", [hash]);
  return { status: "duplicate" as const, signal: mapSignal(existing.rows[0]) };
}

export async function listUnprocessedSignals(limit = 500) {
  await ensureAdminSchema();
  const result = await getPool().query(
    `select * from signals
     where processed = false and is_noise = false
     order by timestamp desc nulls last, created_at desc
     limit $1`,
    [limit]
  );
  return result.rows.map(mapSignal);
}

export async function markSignalsProcessed(signalIds: string[], eventId: string | null) {
  if (!signalIds.length) return;
  await ensureSignalSchema();
  await getPool().query(
    `update signals
     set processed = true, event_id = $2
     where id = any($1::uuid[])`,
    [signalIds, eventId]
  );
}

export async function seedSourcesFromConfig() {
  const sources = loadSourcesConfig();
  for (const source of sources) {
    const key = sourceKey(source);
    const sourceType = sourceTypeFromConfig(source);
    await getPool().query(
      `insert into sources (
         source_key, name, type, source_type, category, url, priority, reliability_score, status
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       on conflict (source_key) do update
       set
         name = excluded.name,
         type = excluded.type,
         source_type = excluded.source_type,
         category = excluded.category,
         url = excluded.url,
         updated_at = now()`,
      [
        key,
        source.name,
        source.type,
        sourceType,
        source.category,
        source.url || source.endpoint || null,
        source.priority,
        source.priority >= 10 ? 1 : source.priority >= 9 ? 0.9 : source.priority >= 8 ? 0.8 : source.priority >= 7 ? 0.7 : 0.6
      ]
    );
  }
}

export async function getActiveSourceConfigs(sources: SourceConfig[]) {
  await ensureAdminSchema();
  if (!sources.length) return sources;
  const keys = sources.map(sourceKey);
  const result = await getPool().query(
    `select source_key, priority, status
     from sources
     where source_key = any($1::text[])`,
    [keys]
  );
  const controls = new Map(result.rows.map((row) => [String(row.source_key), row]));

  const activeSources: SourceConfig[] = [];
  for (const source of sources) {
    const control = controls.get(sourceKey(source));
    if (control && String(control.status) !== "active") continue;
    activeSources.push({
      ...source,
      priority: control ? Number(control.priority || source.priority) : source.priority
    });
  }
  return activeSources;
}

export async function logAudit(input: {
  actor: AdminActor;
  action: string;
  target_type: string;
  target_id?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  await ensureAdminSchema();
  await getPool().query(
    `insert into audit_logs (
       actor_email, actor_role, action, target_type, target_id, before_json, after_json
     )
     values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
    [
      input.actor.email,
      input.actor.role,
      input.action,
      input.target_type,
      input.target_id || null,
      input.before === undefined ? null : JSON.stringify(input.before),
      input.after === undefined ? null : JSON.stringify(input.after)
    ]
  );
}

export async function getAdminDashboardStats() {
  await ensureAdminSchema();
  const [events, signals, sources] = await Promise.all([
    getPool().query(`
      select
        count(*) filter (where review_status = 'pending')::int as pending,
        count(*) filter (where review_status = 'published')::int as published,
        count(*) filter (where review_status = 'rejected')::int as rejected,
        count(*) filter (where review_status = 'needs_fix')::int as needs_fix
      from events
    `),
    getPool().query(`
      select
        count(*)::int as total,
        count(*) filter (where is_noise = true)::int as noise,
        count(*) filter (where admin_status = 'new')::int as new
      from signals
    `),
    getPool().query(`
      select
        count(*)::int as total,
        count(*) filter (where status = 'active')::int as active
      from sources
    `)
  ]);

  return {
    events: {
      pending: Number(events.rows[0]?.pending || 0),
      published: Number(events.rows[0]?.published || 0),
      rejected: Number(events.rows[0]?.rejected || 0),
      needs_fix: Number(events.rows[0]?.needs_fix || 0)
    },
    signals: {
      total: Number(signals.rows[0]?.total || 0),
      noise: Number(signals.rows[0]?.noise || 0),
      new: Number(signals.rows[0]?.new || 0)
    },
    sources: {
      total: Number(sources.rows[0]?.total || 0),
      active: Number(sources.rows[0]?.active || 0)
    }
  };
}

export async function listAdminEvents(options: { status?: ReviewStatus | "all"; limit?: number } = {}) {
  return listEvents({
    reviewStatus: options.status || "pending",
    limit: options.limit || 50
  });
}

export async function getAdminEventById(id: string) {
  await ensureAdminSchema();
  const result = await getPool().query("select * from events where id = $1 limit 1", [id]);
  return result.rows[0] ? mapEvent(result.rows[0]) : null;
}

export async function updateEventStatus(id: string, status: ReviewStatus, actor: AdminActor) {
  await ensureAdminSchema();
  const before = await getAdminEventById(id);
  if (!before) return null;

  const result = await getPool().query(
    `update events
     set review_status = $2,
         reviewed_by = $3,
         reviewed_at = now()
     where id = $1
     returning *`,
    [id, status, actor.email]
  );
  const after = mapEvent(result.rows[0]);
  await logAudit({
    actor,
    action: `event.${status}`,
    target_type: "event",
    target_id: id,
    before,
    after
  });
  return after;
}

export async function updateEventFields(
  id: string,
  fields: Partial<Pick<StoredEvent, "title" | "summary" | "event_type" | "company" | "market" | "model" | "impact_score" | "confidence_score" | "event_date">>,
  actor: AdminActor
) {
  await ensureAdminSchema();
  const before = await getAdminEventById(id);
  if (!before) return null;

  const nextImpact = fields.impact_score === undefined ? before.impact_score : Number(fields.impact_score);
  const nextConfidence = fields.confidence_score === undefined ? before.confidence_score : Number(fields.confidence_score);
  const nextFinalScore = computeFinalScore({
    impact_score: nextImpact,
    confidence_score: nextConfidence,
    source_priority: before.source_priority
  });

  const result = await getPool().query(
    `update events
     set title = $2,
         summary = $3,
         event_type = $4::event_type_enum,
         company = $5,
         market = $6,
         model = $7,
         event_date = $8,
         impact_score = $9,
         confidence_score = $10,
         final_score = $11,
         low_confidence = $10 < 0.6
     where id = $1
     returning *`,
    [
      id,
      fields.title ?? before.title,
      fields.summary ?? before.summary,
      fields.event_type ?? before.event_type,
      fields.company === undefined ? before.company : fields.company || null,
      fields.market === undefined ? before.market : fields.market || null,
      fields.model === undefined ? before.model : fields.model || null,
      fields.event_date === undefined ? before.event_date : fields.event_date || null,
      nextImpact,
      nextConfidence,
      nextFinalScore
    ]
  );
  const after = mapEvent(result.rows[0]);
  await logAudit({
    actor,
    action: "event.edit",
    target_type: "event",
    target_id: id,
    before,
    after
  });
  return after;
}

export async function listAdminSignals(options: { status?: string; sourceType?: string; limit?: number } = {}) {
  await ensureAdminSchema();
  const where: string[] = [];
  const values: unknown[] = [];
  if (options.status && options.status !== "all") {
    values.push(options.status);
    where.push(`admin_status = $${values.length}`);
  }
  if (options.sourceType && options.sourceType !== "all") {
    values.push(options.sourceType);
    where.push(`source_type = $${values.length}`);
  }
  values.push(options.limit || 80);

  const result = await getPool().query(
    `select *
     from signals
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by created_at desc
     limit $${values.length}`,
    values
  );
  return result.rows.map(mapAdminSignal);
}

export async function markSignalNoise(id: string, noise: boolean, reason: string | null, actor: AdminActor) {
  await ensureAdminSchema();
  const beforeResult = await getPool().query("select * from signals where id = $1 limit 1", [id]);
  if (!beforeResult.rows[0]) return null;
  const before = mapAdminSignal(beforeResult.rows[0]);
  const result = await getPool().query(
    `update signals
     set is_noise = $2,
         noise_reason = $3,
         admin_status = case when $2 then 'ignored' else 'new' end,
         marked_by = $4,
         marked_at = now()
     where id = $1
     returning *`,
    [id, noise, reason, actor.email]
  );
  const after = mapAdminSignal(result.rows[0]);
  await logAudit({
    actor,
    action: noise ? "signal.mark_noise" : "signal.clear_noise",
    target_type: "signal",
    target_id: id,
    before,
    after
  });
  return after;
}

export async function listAdminSources() {
  await ensureAdminSchema();
  const result = await getPool().query("select * from sources order by status asc, priority desc, name asc");
  return result.rows.map(mapAdminSource);
}

export async function updateAdminSource(
  id: string,
  fields: { status?: "active" | "inactive"; priority?: number; reliability_score?: number },
  actor: AdminActor
) {
  await ensureAdminSchema();
  const beforeResult = await getPool().query("select * from sources where id = $1 limit 1", [id]);
  if (!beforeResult.rows[0]) return null;
  const before = mapAdminSource(beforeResult.rows[0]);
  const result = await getPool().query(
    `update sources
     set status = $2,
         priority = $3,
         reliability_score = $4,
         updated_at = now()
     where id = $1
     returning *`,
    [
      id,
      fields.status || before.status,
      fields.priority === undefined ? before.priority : Math.max(1, Math.min(10, Math.round(fields.priority))),
      fields.reliability_score === undefined ? before.reliability_score : Math.max(0, Math.min(1, fields.reliability_score))
    ]
  );
  const after = mapAdminSource(result.rows[0]);
  await logAudit({
    actor,
    action: "source.update",
    target_type: "source",
    target_id: id,
    before,
    after
  });
  return after;
}

export async function listAuditLogs(options: { actor?: string; action?: string; targetType?: string; limit?: number } = {}) {
  await ensureAdminSchema();
  const where: string[] = [];
  const values: unknown[] = [];
  if (options.actor) {
    values.push(`%${options.actor}%`);
    where.push(`actor_email ilike $${values.length}`);
  }
  if (options.action) {
    values.push(`%${options.action}%`);
    where.push(`action ilike $${values.length}`);
  }
  if (options.targetType) {
    values.push(options.targetType);
    where.push(`target_type = $${values.length}`);
  }
  values.push(options.limit || 100);

  const result = await getPool().query(
    `select *
     from audit_logs
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by created_at desc
     limit $${values.length}`,
    values
  );
  return result.rows.map(mapAuditLog);
}

export async function getRecentSignalCountsByType() {
  await ensureSignalSchema();
  const result = await getPool().query(
    `select source_type, count(*)::int as count
     from signals
     where created_at >= now() - interval '24 hours'
     group by source_type`
  );
  return new Map(result.rows.map((row) => [String(row.source_type), Number(row.count || 0)]));
}

function normalizeStoredEventType(type: EventType, text: string): EventType {
  if (type !== "launch") return type;
  return /recall|defect|quality issue|complaints?|leak|flooded|detached|failure|fault/i.test(text)
    ? "recall"
    : type;
}

export async function listEvents(filters: EventFilters = {}) {
  await ensureAdminSchema();
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.company) {
    values.push(filters.company);
    where.push(`company = $${values.length}`);
  }
  if (filters.market) {
    values.push(filters.market);
    where.push(`market = $${values.length}`);
  }
  if (filters.type) {
    values.push(filters.type);
    where.push(`event_type = $${values.length}`);
  }
  if (filters.reviewStatus !== "all") {
    values.push(filters.reviewStatus || "published");
    where.push(`review_status = $${values.length}`);
  }

  values.push(filters.limit || 50);
  const result = await getPool().query(
    `select * from events
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by (
       coalesce(impact_score, 0) * 0.5 +
       coalesce(confidence_score, 0) * 10 * 0.3 +
       coalesce(source_priority, 6) * 0.2
     ) desc, event_date desc nulls last, created_at desc
     limit $${values.length}`,
    values
  );

  return result.rows.map(mapEvent);
}

export async function getEventBySlug(slug: string) {
  await ensureAdminSchema();
  const result = await getPool().query("select * from events where slug = $1 and review_status = 'published' limit 1", [slug]);
  return result.rows[0] ? mapEvent(result.rows[0]) : null;
}

export async function listSitemapEntities() {
  await ensureAdminSchema();
  const [events, companies, markets] = await Promise.all([
    getPool().query("select slug, created_at from events where review_status = 'published' order by created_at desc limit 500"),
    getPool().query("select name, created_at from companies order by name asc limit 200"),
    getPool().query("select name, created_at from markets order by name asc limit 200")
  ]);

  return {
    events: events.rows.map((row) => ({
      slug: String(row.slug),
      updated_at: row.created_at ? new Date(String(row.created_at)).toISOString() : null
    })),
    companies: companies.rows.map((row) => ({
      name: String(row.name),
      updated_at: row.created_at ? new Date(String(row.created_at)).toISOString() : null
    })),
    markets: markets.rows.map((row) => ({
      name: String(row.name),
      updated_at: row.created_at ? new Date(String(row.created_at)).toISOString() : null
    }))
  };
}

export async function getCompany(name: string) {
  const result = await getPool().query("select * from companies where lower(name) = lower($1) limit 1", [name]);
  return result.rows[0] || null;
}

export async function getMarket(name: string) {
  const result = await getPool().query("select * from markets where lower(name) = lower($1) limit 1", [name]);
  return result.rows[0] || null;
}

export async function countEvents() {
  const result = await getPool().query("select count(*)::int as count from events");
  return Number(result.rows[0]?.count || 0);
}

export async function upsertCompany(name: string | null) {
  if (!name) return;
  const seed = knownCompanySeed(name);
  await getPool().query(
    `insert into companies (name, country, type)
     values ($1, $2, $3)
     on conflict (name) do nothing`,
    [name, "China", seed?.type || "OEM"]
  );
}

export async function upsertMarket(name: string | null) {
  if (!name) return;
  const seed = knownMarketSeed(name);
  await getPool().query(
    `insert into markets (name, region)
     values ($1, $2)
     on conflict (name) do nothing`,
    [name, seed?.region || null]
  );
}

export async function upsertModel(name: string | null, company: string | null) {
  if (!name || !company) return;
  await getPool().query(
    `insert into models (name, company)
     values ($1, $2)
     on conflict (name, company) do nothing`,
    [name, company]
  );
}

export async function findDuplicate(candidate: ExtractedEvent) {
  await ensureAdminSchema();
  const articleHash = rssEventHash(candidate);
  const hashResult = await getPool().query("select * from events where article_hash = $1 limit 1", [articleHash]);
  if (hashResult.rows[0]) return mapEvent(hashResult.rows[0]);

  if (!candidate.event_date) return null;
  const companyClause = candidate.company ? "lower(company) = lower($1)" : "company is null";
  const values = candidate.company
    ? [candidate.company, candidate.event_type, candidate.event_date]
    : [candidate.event_type, candidate.event_date];
  const eventTypeIndex = candidate.company ? 2 : 1;
  const eventDateIndex = candidate.company ? 3 : 2;
  const result = await getPool().query(
    `select * from events
     where ${companyClause}
       and event_type = $${eventTypeIndex}
       and event_date between ($${eventDateIndex}::timestamptz - interval '3 days') and ($${eventDateIndex}::timestamptz + interval '3 days')
     order by event_date desc
     limit 25`,
    values
  );

  const events = result.rows.map(mapEvent);
  return events.find((event) => isDuplicateEvent(candidate, event) || isRssDuplicate(candidate, event)) || null;
}

export async function insertEvent(event: ExtractedEvent, raw: {
  content: string;
  source_name?: string | null;
  source_priority?: number | null;
  source_category?: string | null;
  signal_ids?: string[] | null;
}) {
  await ensureAdminSchema();
  const duplicate = await findDuplicate(event);
  if (duplicate) return { status: "duplicate" as const, event: duplicate };

  await upsertCompany(event.company);
  await upsertMarket(event.market);
  await upsertModel(event.model, event.company);
  const sourcePriority = normalizeSourcePriority(raw.source_priority);
  const finalScore = computeFinalScore({
    impact_score: event.impact_score,
    confidence_score: event.confidence_score,
    source_priority: sourcePriority
  });

  const baseSlug = generateEventSlug(event);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const exists = await getPool().query("select 1 from events where slug = $1 limit 1", [slug]);
    if (!exists.rows.length) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const result = await getPool().query(
     `insert into events (
       slug, article_hash, title, summary, event_type, company, market, model, event_date,
       source_url, source_name, source_priority, source_category, signal_ids, signal_count,
       impact_score, confidence_score, final_score, low_confidence, raw_content, raw_evidence, review_status
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, $19, $20, $21, 'pending')
     returning *`,
    [
      slug,
      rssEventHash(event),
      event.title,
      event.summary,
      event.event_type,
      event.company,
      event.market,
      event.model,
      event.event_date,
      event.source_url,
      raw.source_name || null,
      sourcePriority,
      raw.source_category || null,
      raw.signal_ids?.length ? JSON.stringify(raw.signal_ids) : null,
      raw.signal_ids?.length || 0,
      event.impact_score,
      event.confidence_score,
      finalScore,
      event.confidence_score < 0.6,
      raw.content,
      event.raw_evidence
    ]
  );

  return { status: "stored" as const, event: mapEvent(result.rows[0]) };
}

export async function logExtraction(input: {
  source_url: string;
  source_name?: string | null;
  raw_title?: string | null;
  raw_content?: string | null;
  extracted_output?: unknown;
  source_priority?: number | null;
  source_category?: string | null;
  article_hash?: string | null;
  status: "stored" | "duplicate" | "rejected" | "failed";
  error?: string | null;
}) {
  await getPool().query(
    `insert into event_extraction_logs (
       source_url, source_name, raw_title, raw_content, source_priority, source_category, article_hash, extracted_output, status, error
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
    [
      input.source_url,
      input.source_name || null,
      input.raw_title || null,
      input.raw_content || null,
      input.source_priority || null,
      input.source_category || null,
      input.article_hash || null,
      input.extracted_output ? JSON.stringify(input.extracted_output) : null,
      input.status,
      input.error || null
    ]
  );
}

const SEED_EVENTS: ExtractedEvent[] = [
  {
    title: "BYD expands EV factory in Hungary",
    summary: "Seed intelligence event for cold-start ranking and page rendering.",
    event_type: "factory",
    company: "BYD",
    market: "Europe",
    model: null,
    event_date: "2026-07-01T00:00:00.000Z",
    impact_score: 8,
    confidence_score: 0.8,
    source_url: "https://www.topchinacar.com/seed/byd-hungary-factory",
    raw_evidence: "Seed event: BYD expands EV factory in Hungary."
  },
  {
    title: "Chery builds plant in Thailand",
    summary: "Seed intelligence event for cold-start ranking and page rendering.",
    event_type: "factory",
    company: "Chery",
    market: "Thailand",
    model: null,
    event_date: "2026-07-01T00:00:00.000Z",
    impact_score: 8,
    confidence_score: 0.8,
    source_url: "https://www.topchinacar.com/seed/chery-thailand-plant",
    raw_evidence: "Seed event: Chery builds plant in Thailand."
  },
  {
    title: "EU increases EV tariffs on Chinese imports",
    summary: "Seed intelligence event for cold-start ranking and page rendering.",
    event_type: "tariff",
    company: null,
    market: "Europe",
    model: null,
    event_date: "2026-07-01T00:00:00.000Z",
    impact_score: 9,
    confidence_score: 0.8,
    source_url: "https://www.topchinacar.com/seed/eu-china-ev-tariffs",
    raw_evidence: "Seed event: EU increases EV tariffs on Chinese imports."
  },
  {
    title: "Tesla reduces prices in China",
    summary: "Seed intelligence event for cold-start ranking and page rendering.",
    event_type: "pricing",
    company: "Tesla",
    market: "China",
    model: null,
    event_date: "2026-07-01T00:00:00.000Z",
    impact_score: 5,
    confidence_score: 0.8,
    source_url: "https://www.topchinacar.com/seed/tesla-china-pricing",
    raw_evidence: "Seed event: Tesla reduces prices in China."
  },
  {
    title: "XPeng expands Europe distribution",
    summary: "Seed intelligence event for cold-start ranking and page rendering.",
    event_type: "dealer_expansion",
    company: "Xpeng",
    market: "Europe",
    model: null,
    event_date: "2026-07-01T00:00:00.000Z",
    impact_score: 6,
    confidence_score: 0.8,
    source_url: "https://www.topchinacar.com/seed/xpeng-europe-distribution",
    raw_evidence: "Seed event: XPeng expands Europe distribution."
  },
  {
    title: "Geely invests in SEA expansion",
    summary: "Seed intelligence event for cold-start ranking and page rendering.",
    event_type: "investment",
    company: "Geely",
    market: "Southeast Asia",
    model: null,
    event_date: "2026-07-01T00:00:00.000Z",
    impact_score: 7,
    confidence_score: 0.8,
    source_url: "https://www.topchinacar.com/seed/geely-sea-expansion",
    raw_evidence: "Seed event: Geely invests in SEA expansion."
  }
];

export async function ensureSeedEvents() {
  await ensureAdminSchema();
  if ((await countEvents()) > 0) return { inserted: 0, skipped: true };

  let inserted = 0;
  for (const event of SEED_EVENTS) {
    await upsertCompany(event.company);
    await upsertMarket(event.market);

    const slug = generateEventSlug(event);
    const sourcePriority = 6;
    const finalScore = computeFinalScore({
      impact_score: event.impact_score,
      confidence_score: event.confidence_score,
      source_priority: sourcePriority
    });

    const result = await getPool().query(
      `insert into events (
         slug, article_hash, title, summary, event_type, company, market, model, event_date,
         source_url, source_name, source_priority, source_category, impact_score, confidence_score,
         final_score, low_confidence, raw_content, raw_evidence, is_seed, review_status, reviewed_by, reviewed_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true, 'published', 'system', now())
       on conflict (slug) do nothing
       returning id`,
      [
        slug,
        `seed:${slug}`,
        event.title,
        event.summary,
        event.event_type,
        event.company,
        event.market,
        event.model,
        event.event_date,
        event.source_url,
        "TopChinaCar Seed Data",
        sourcePriority,
        "seed",
        event.impact_score,
        event.confidence_score,
        finalScore,
        event.confidence_score < 0.6,
        event.raw_evidence,
        event.raw_evidence
      ]
    );
    inserted += result.rowCount || 0;
  }

  return { inserted, skipped: false };
}

export async function getSystemStatus() {
  await ensureAdminSchema();
  const [eventCount, latestLog, todayCount] = await Promise.all([
    getPool().query("select count(*)::int as count from events where review_status = 'published'"),
    getPool().query("select max(created_at) as last_update from event_extraction_logs"),
    getPool().query("select count(*)::int as count from events where review_status = 'published' and created_at >= date_trunc('day', now())")
  ]);
  const sources = rssSourcesOnly(loadSourcesConfig());
  const sourceNames = sources
    .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name))
    .map((source) => source.name);
  const lastUpdate = latestLog.rows[0]?.last_update ? new Date(String(latestLog.rows[0].last_update)).toISOString() : null;

  return {
    rss_feeds_active: sources.length,
    ingestion_status: "running",
    last_update: lastUpdate,
    events_today: Number(todayCount.rows[0]?.count || 0),
    total_events: Number(eventCount.rows[0]?.count || 0),
    sources: sourceNames
  };
}

export async function getRelatedEvents(event: StoredEvent, limit = 6) {
  await ensureAdminSchema();
  const values: unknown[] = [event.id];
  const clauses: string[] = [];
  let companyOrder = "1";

  if (event.company) {
    values.push(event.company);
    companyOrder = `case when company is not null and lower(company) = lower($${values.length}) then 0 else 1 end`;
    clauses.push(`lower(company) = lower($${values.length})`);
  }
  if (event.market) {
    values.push(event.market);
    clauses.push(`lower(market) = lower($${values.length})`);
  }
  values.push(event.event_type);
  clauses.push(`event_type = $${values.length}`);
  values.push(limit);

  const result = await getPool().query(
    `select * from events
     where id <> $1 and review_status = 'published' and (${clauses.join(" or ")})
     order by
       ${companyOrder},
       final_score desc nulls last,
       event_date desc nulls last,
       created_at desc
     limit $${values.length}`,
    values
  );

  return result.rows.map(mapEvent);
}
