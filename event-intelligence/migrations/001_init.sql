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

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text,
  type text check (type in ('OEM', 'Startup', 'Supplier')),
  created_at timestamp with time zone not null default now()
);

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  region text,
  created_at timestamp with time zone not null default now()
);

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  segment text,
  created_at timestamp with time zone not null default now(),
  unique (name, company)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  article_hash text unique,
  title text not null,
  summary text not null,
  event_type event_type_enum not null,
  company text,
  market text,
  model text,
  event_date timestamp with time zone,
  source_url text not null,
  source_name text,
  source_priority double precision not null default 6,
  source_category text,
  impact_score double precision not null default 0,
  confidence_score double precision not null default 0,
  final_score double precision not null default 0,
  is_seed boolean not null default false,
  low_confidence boolean not null default false,
  raw_content text not null,
  raw_evidence text not null,
  created_at timestamp with time zone not null default now(),
  constraint confidence_score_range check (confidence_score >= 0 and confidence_score <= 1),
  constraint impact_score_range check (impact_score >= 0 and impact_score <= 10)
);

create index if not exists events_event_date_idx on events (event_date desc);
create index if not exists events_company_idx on events (company);
create index if not exists events_market_idx on events (market);
create index if not exists events_event_type_idx on events (event_type);
create index if not exists events_source_url_idx on events (source_url);
create index if not exists events_article_hash_idx on events (article_hash);
create index if not exists events_final_score_idx on events (final_score desc);
create index if not exists events_is_seed_idx on events (is_seed);

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

create index if not exists event_extraction_logs_source_url_idx on event_extraction_logs (source_url);
create index if not exists event_extraction_logs_status_idx on event_extraction_logs (status);
