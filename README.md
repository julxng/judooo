# Vietnam Art Marketplace Web App

This repository is a React + Vite frontend backed by Supabase.

## Local app run

1. Install dependencies:
`npm install`
2. Configure `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
3. Start dev server:
`npm run dev`

## Supabase setup

Run these SQL files in Supabase SQL Editor:
1. `supabase/migrations/20260226_0002_crawl_ingestion.sql` (crawler table + event source keys)
2. `supabase/migrations/20260226_0003_event_source_link.sql` (original article URL on events)
3. `supabase/migrations/20260227_0004_artwork_details_placeholder.sql` (artwork detail columns + import metadata)
4. Existing foundation/legacy tables as needed for your app (`events`, `artworks`, etc.)

## Internet crawl ingestion

This project includes an RSS crawler that writes raw internet data into `public.source_items`, then normalizes/upserts to `public.events`.

### Configure crawl env

Copy `.env.crawl.example` values into your shell/session.
Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (recommended)

Optional:
- `CRAWL_SOURCE_URLS` (comma-separated feeds)
- `CRAWL_GOOGLE_NEWS_QUERIES` (comma-separated search queries for broader Google News coverage)
- `CRAWL_GOOGLE_NEWS_HL`, `CRAWL_GOOGLE_NEWS_GL`, `CRAWL_GOOGLE_NEWS_CEID`
- `CRAWL_FACEBOOK_GROUP_IDS` + `FACEBOOK_GRAPH_ACCESS_TOKEN` (official Graph API access)
- `CRAWL_DEFAULT_LOCATION`
- `CRAWL_DEFAULT_CATEGORY`
- `CRAWL_BATCH_LIMIT`

### Run crawler

`npm run crawl:events`

### Remove duplicate crawled events

`npm run dedupe:events`

## Artwork placeholder DB + online import

### Seed placeholder artworks

Run in Supabase SQL Editor:
`supabase/seeds/20260227_artworks_placeholder_seed.sql`

### Import Vietnamese artworks + images from online sources

Set crawl env vars (see `.env.crawl.example`), then run:
`npm run crawl:artworks`

This script tries sources in order:
1. Nguyen Art Foundation collection pages (`https://nguyenartfoundation.com/vn/collection/suu-tap/`)
2. Wikidata (with retry)
3. Wikimedia Commons category images
4. No-key web search fallback (DuckDuckGo HTML + page `og:image`)
5. Wikipedia artist-page image fallback

Then it upserts into `public.artworks`.

Notes:
- `CRAWL_ARTWORK_LIMIT=0` means crawl all discovered artworks from Nguyen Art Foundation.
- `CRAWL_NGUYEN_MAX_PAGES` limits how many collection pages are scanned for pagination safety.

### Export Nguyen Art Foundation collection to JSON (standalone scraper)

Install Python deps once:
`pip3 install requests beautifulsoup4`

Run:
`python3 scripts/scrape_naf_collection.py --output naf_main_collection.json`

Scrape + upsert to Supabase artworks in one run:
`set -a; source .env.crawl; set +a && python3 scripts/scrape_naf_collection.py --output naf_main_collection.json --to-supabase`

### What it does

- Fetches each source feed
- Expands optional Google News query feeds
- Optionally ingests Facebook group posts via Graph API
- Parses RSS items
- Cleans noisy source suffixes from titles
- Upserts into `public.source_items` using dedupe key `(source_url, external_id)`
- Upserts normalized rows into `public.events` using dedupe key `(source_url, external_id)`

## Files

- Crawl migration: `supabase/migrations/20260226_0002_crawl_ingestion.sql`
- Crawl script: `scripts/crawlToSupabase.mjs`
- Crawl env template: `.env.crawl.example`
