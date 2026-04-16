-- Add source link column for crawled event detail
alter table if exists public.events add column if not exists source_item_url text;
