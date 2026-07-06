# TopChinaCar Event Intelligence V1

Structured intelligence system for China automotive global expansion.

## MVP

- RSS ingestion worker.
- Event extraction with strict validation and no unsourced storage.
- Strong extraction prompt exported as `EVENT_EXTRACTION_SYSTEM_PROMPT`.
- `raw_evidence` is required for every stored event.
- PostgreSQL/Supabase schema for events, companies, markets, models, and extraction logs.
- SEO-ready Next.js pages:
  - `/event/[slug]`
  - `/company/[name]`
  - `/market/[region]`
  - `/news`

## Stack note

The PRD suggested Next.js 14. This scaffold uses Next.js 16 App Router because `npm audit` reports production vulnerabilities against the currently installable Next 14 line. The routing, server-component, and deployment model remains the same App Router architecture requested in the PRD.

## Setup

```bash
cp .env.example .env.local
npm install
psql "$DATABASE_URL" -f migrations/001_init.sql
npm run ingest:rss -- --feed https://example.com/rss.xml
npm run dev
```

No API key is exposed to the frontend. The ingestion worker only reads secrets from server-side environment variables.

## Source Intelligence Feed

RSS/API sources live in `ingestion/sources.json` and are grouped into:

- `official_oem` priority 10.
- `industry_media_global` priority 8-9.
- `china_media` priority 7.
- `api_sources` priority 6.

Useful commands:

```bash
npm run ingest:immediate -- --limit 20
npm run ingest:deferred -- --limit 20
npm run ingest:rss -- --feed https://carnewschina.com/feed/ --priority 8
```

Production HTTP endpoints:

- `GET /api/ingest/rss`
- `GET /api/ingest/rss?mode=immediate&limit=20`
- `GET /api/ingest/dedup?limit=500`

If `CRON_SECRET` is configured, manual calls must include `Authorization: Bearer <CRON_SECRET>`.

Current `vercel.json` cron is Hobby-plan compatible:

- RSS ingestion: once daily.
- Full batch dedup: once daily.

Target production cron for Vercel Pro is kept in `vercel.pro.json`:

- OEM feeds: every 10 minutes.
- Media feeds: every 30 minutes.
- API feeds: every 60 minutes.
- Full batch dedup: every 6 hours.

The ingestion worker filters out opinion/test-drive noise, requires China-auto company/domain keywords, prioritizes strong event signals, ranks by source priority, and logs every rejection or failure.

## Compatibility Entrypoints

The implementation keeps the internal code under `lib/events/*`, and also exposes the PRD-standard paths:

- `lib/supabaseClient.ts`
- `lib/eventParser.ts`
- `lib/slugify.ts`
- `ingestion/rssFetcher.ts`
- `ingestion/eventExtractor.ts`
- `ingestion/deduplicate.ts`
- `db/schema.sql`
- `db/seed.sql`
- `AGENTS.md`

Run `migrations/002_agent_prompt_raw_evidence.sql` if an older V1 database already exists.
