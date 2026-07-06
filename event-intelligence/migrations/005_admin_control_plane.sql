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
