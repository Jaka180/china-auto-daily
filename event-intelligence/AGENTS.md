# TopChinaCar Event Intelligence Agent Rules

Build a production-grade event intelligence system, not a blog or CMS.

## Extraction Rules

- Use `EVENT_EXTRACTION_SYSTEM_PROMPT` from `lib/events/extractor.ts` for any LLM-backed extraction.
- Only use facts explicitly present in source text.
- Unknown fields must be `null`.
- Never invent company names, markets, models, dates, or scores.
- Never merge multiple events unless they are explicitly identical.
- Every stored event must have `source_url`, `confidence_score`, and `raw_evidence`.
- Failed extraction, duplicate rejection, and validation rejection must be logged.

## Source Intelligence Rules

- Load RSS/API definitions from `ingestion/sources.json`.
- Respect priority tiers:
  - `10`: official OEM sources.
  - `9`: Reuters / Automotive News tier.
  - `8`: EV vertical media.
  - `7`: China media.
  - `6`: API aggregators.
- Run priority `>= 8` sources immediately; defer lower-priority sources to batch windows.
- Ignore RSS items with no China-auto company mention.
- Ignore pure opinion or test-drive reviews unless they contain an industry signal.
- Keep items that mention factory, export, shipment, pricing, policy, tariff, partnership, launch, market entry, investment, recall, dealer expansion, technology, charging, or localization.
- Use RSS dedup hash from normalized `title + company + date`; also reject same-company titles with similarity above `0.85`.

## Storage Rules

- Use `db/schema.sql` or `migrations/001_init.sql` as the canonical Supabase schema.
- Do not expose service-role keys or database URLs to frontend code.
- Use server-side ingestion for RSS/API processing.
- `/api/ingest/rss` is the production ingestion entrypoint.
- `/api/ingest/dedup` is the periodic duplicate cleanup entrypoint.
- `vercel.json` owns the deployable Hobby-plan cron schedules.
- `vercel.pro.json` keeps the target production cadence: RSS ingestion every 10 minutes and full dedup every 6 hours.

## Frontend Rules

- `/event/[slug]` must display title, summary, event type, company, market, model, event date, source URL, impact score, confidence score, and raw evidence.
- SEO metadata must include title, description, and keywords where relevant.
