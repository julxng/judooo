-- Newsletter signups table for email capture
create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

-- Allow anonymous inserts (anyone can sign up)
alter table public.newsletter_signups enable row level security;

create policy "Allow anonymous inserts" on public.newsletter_signups
  for insert with check (true);

create policy "Admin can read" on public.newsletter_signups
  for select using (auth.role() = 'authenticated');

-- Add gallery_contact column to events table
alter table public.events add column if not exists gallery_contact text;
