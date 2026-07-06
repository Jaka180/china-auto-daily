alter table events
  alter column company drop not null,
  alter column event_date drop not null;

alter table events
  add column if not exists raw_evidence text;

alter table events
  add column if not exists article_hash text,
  add column if not exists source_priority integer,
  add column if not exists source_category text;

update events
set raw_evidence = coalesce(nullif(raw_evidence, ''), left(coalesce(raw_content, summary, title), 320))
where raw_evidence is null;

alter table events
  alter column raw_evidence set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'markets_name_region_key'
  ) then
    alter table markets drop constraint markets_name_region_key;
  end if;
end $$;

create unique index if not exists markets_name_unique_idx on markets (name);
create unique index if not exists events_article_hash_unique_idx on events (article_hash) where article_hash is not null;

alter table event_extraction_logs
  add column if not exists source_priority integer,
  add column if not exists source_category text,
  add column if not exists article_hash text;
