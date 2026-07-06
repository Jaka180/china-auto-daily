alter table events
  add column if not exists final_score double precision not null default 0,
  add column if not exists is_seed boolean not null default false;

alter table events
  alter column source_priority type double precision using source_priority::double precision;

update events
set source_priority = coalesce(source_priority, 6);

alter table events
  alter column source_priority set default 6,
  alter column source_priority set not null;

update events
set final_score = round((
  coalesce(impact_score, 0) * 0.5 +
  coalesce(confidence_score, 0) * 0.3 +
  coalesce(source_priority, 6) * 0.2
)::numeric, 2)::double precision;

create index if not exists events_final_score_idx on events (final_score desc);
create index if not exists events_is_seed_idx on events (is_seed);
