-- Crawl ingestion support tables/columns

create extension if not exists pgcrypto;

create table if not exists public.source_items (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  external_id text not null,
  source_type text not null default 'rss',
  title text not null,
  summary text,
  item_url text,
  published_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  crawl_status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_url, external_id)
);

create index if not exists idx_source_items_published_at on public.source_items (published_at desc);
create index if not exists idx_source_items_status on public.source_items (crawl_status);

create or replace function public.touch_source_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_source_items_updated_at on public.source_items;
create trigger trg_touch_source_items_updated_at
before update on public.source_items
for each row execute procedure public.touch_source_items_updated_at();

-- Event-level source traceability for deduped upsert from crawlers
alter table if exists public.events add column if not exists source_url text;
alter table if exists public.events add column if not exists external_id text;
alter table if exists public.events add column if not exists source_item_id uuid;
alter table if exists public.events add column if not exists imported_at timestamptz;

-- Works only when events table exists
create unique index if not exists idx_events_source_unique
on public.events (source_url, external_id)
where source_url is not null and external_id is not null;
