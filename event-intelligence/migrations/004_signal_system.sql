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
