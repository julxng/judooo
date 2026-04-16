---
name: crawl-events
description: Run the event crawling pipeline — crawl new events, deduplicate, and backfill bilingual translations
disable-model-invocation: true
---

# Crawl Events Pipeline

Run the full data ingestion pipeline for art events. Execute these steps in order, stopping if any step fails:

## Steps

1. **Crawl events to Supabase**
   ```bash
   npm run crawl:events
   ```
   Wait for completion. If it fails, report the error and stop.

2. **Deduplicate events**
   ```bash
   npm run dedupe:events
   ```
   Report how many duplicates were removed.

3. **Backfill bilingual content**
   ```bash
   npm run backfill:bilingual
   ```
   This fills in missing Vietnamese/English translations for event fields.

4. **Verify** — Run a quick check by querying recent events from Supabase to confirm data looks correct. Report a summary: total events, how many have both `_vie` and `_en` fields populated.

## Notes
- Requires `.env.crawl` to be configured with valid Supabase credentials
- Do NOT modify `.env.crawl` — if credentials are missing, ask the user to configure them
- If the user asks to also crawl artworks, run `npm run crawl:artworks` after step 1
