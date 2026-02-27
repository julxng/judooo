-- Artwork detail extension for richer marketplace cards/detail view + scraped imports.
-- Safe to run multiple times.

alter table if exists public.artworks
  add column if not exists style text,
  add column if not exists city text,
  add column if not exists country text default 'Vietnam',
  add column if not exists provenance text,
  add column if not exists authenticity text,
  add column if not exists condition_report text,
  add column if not exists story text,
  add column if not exists source_url text,
  add column if not exists source_item_url text,
  add column if not exists imported_at timestamptz,
  add column if not exists image_urls text[] default '{}';

create index if not exists idx_artworks_imported_at on public.artworks (imported_at desc);
