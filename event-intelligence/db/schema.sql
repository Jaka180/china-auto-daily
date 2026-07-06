create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type_enum') then
    create type event_type_enum as enum (
      'launch',
      'export',
      'sales_update',
      'factory',
      'partnership',
      'policy',
      'tariff',
      'pricing',
      'recall',
      'investment',
      'regulation',
      'dealer_expansion',
      'technology',
      'charging',
      'localization'
    );
  end if;
end $$;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  article_hash text unique,
  title text not null,
  summary text,
  event_type event_type_enum not null,
  company text,
  market text,
  model text,
  event_date timestamp with time zone,
  source_url text not null,
  source_name text,
  source_priority double precision not null default 6,
  source_category text,
  signal_ids jsonb,
  signal_count integer not null default 0,
  impact_score float default 0,
  confidence_score float default 0,
  final_score double precision not null default 0,
  is_seed boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected', 'needs_fix')),
  reviewed_by text,
  reviewed_at timestamp with time zone,
  low_confidence boolean not null default false,
  raw_content text,
  raw_evidence text not null,
  created_at timestamp with time zone default now(),
  constraint confidence_score_range check (confidence_score >= 0 and confidence_score <= 1),
  constraint impact_score_range check (impact_score >= 0 and impact_score <= 10)
);

create index if not exists events_review_status_idx on events (review_status);
create index if not exists events_review_created_idx on events (review_status, created_at desc);

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
  admin_status text not null default 'new' check (admin_status in ('new', 'processed', 'ignored', 'flagged')),
  is_noise boolean not null default false,
  noise_reason text,
  marked_by text,
  marked_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint signal_strength_range check (signal_strength >= 0 and signal_strength <= 1)
);

create index if not exists signals_source_type_idx on signals (source_type);
create index if not exists signals_signal_type_idx on signals (signal_type);
create index if not exists signals_entity_market_idx on signals (entity_guess, market_guess);
create index if not exists signals_processed_idx on signals (processed);
create index if not exists signals_timestamp_idx on signals (timestamp desc);
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
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone
);

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

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text,
  type text,
  created_at timestamp with time zone default now()
);

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  region text,
  created_at timestamp with time zone default now()
);

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  segment text,
  created_at timestamp with time zone default now(),
  unique (name, company)
);

create table if not exists event_extraction_logs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_name text,
  raw_title text,
  raw_content text,
  source_priority integer,
  source_category text,
  article_hash text,
  extracted_output jsonb,
  status text not null check (status in ('stored', 'duplicate', 'rejected', 'failed')),
  error text,
  created_at timestamp with time zone not null default now()
);
