-- MVP foundation schema for Vietnam Art Marketplace
-- Safe to run multiple times where possible.

create extension if not exists pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('art_lover', 'artist', 'gallery', 'art_dealer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE moderation_state AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_category AS ENUM ('exhibition', 'auction', 'workshop', 'performance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE art_form AS ENUM ('painting', 'sculpture', 'mixed_media', 'video', 'performance', 'installation', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sale_type AS ENUM ('fixed', 'auction', 'commission', 'booking');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE artwork_status AS ENUM ('draft', 'active', 'sold', 'reserved', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE intent_status AS ENUM ('inquiry', 'pending_payment', 'paid', 'cancelled', 'fulfilled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE promotion_plan AS ENUM ('basic', 'featured', 'spotlight');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE promotion_status AS ENUM ('pending', 'active', 'expired', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Role helper
create or replace function public.current_role()
returns user_role
language sql
stable
as $$
  select coalesce(
    (
      select case
        when p.role::text in ('art_lover', 'artist', 'gallery', 'art_dealer') then p.role::text::user_role
        else null
      end
      from public.profiles p
      where p.id = auth.uid()
    ),
    'art_lover'::user_role
  );
$$;

create or replace function public.is_seller_role()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('artist'::user_role, 'gallery'::user_role, 'art_dealer'::user_role);
$$;

create or replace function public.is_admin_like_role()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('gallery'::user_role, 'art_dealer'::user_role);
$$;

-- Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'art_lover',
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  display_name text not null,
  bio text,
  city text,
  country text default 'Vietnam',
  disciplines art_form[] not null default '{}',
  website_url text,
  instagram_handle text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  organizer text not null,
  description text not null,
  category event_category not null,
  moderation moderation_state not null default 'draft',
  status event_status not null default 'draft',
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  venue_name text,
  address text,
  city text,
  country text not null default 'Vietnam',
  lat double precision,
  lng double precision,
  cover_image_url text,
  featured boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at >= start_at)
);

create index if not exists idx_events_status_moderation on public.events (status, moderation);
create index if not exists idx_events_dates on public.events (start_at, end_at);
create index if not exists idx_events_city on public.events (city);

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  slug text not null unique,
  description text,
  art_form art_form not null default 'other',
  medium text,
  dimensions text,
  year_created int,
  image_url text,
  sale_type sale_type not null,
  currency text not null default 'VND',
  price numeric(14,2),
  starting_bid numeric(14,2),
  current_bid numeric(14,2),
  bid_increment numeric(14,2),
  bid_count int not null default 0,
  bid_ends_at timestamptz,
  availability artwork_status not null default 'draft',
  moderation moderation_state not null default 'draft',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price is null or price >= 0),
  check (starting_bid is null or starting_bid >= 0),
  check (current_bid is null or current_bid >= 0),
  check (bid_increment is null or bid_increment > 0),
  check (
    (sale_type = 'fixed' and price is not null) or
    (sale_type = 'auction' and starting_bid is not null and bid_ends_at is not null) or
    (sale_type in ('commission', 'booking'))
  )
);

create index if not exists idx_artworks_event on public.artworks (event_id);
create index if not exists idx_artworks_creator on public.artworks (created_by);
create index if not exists idx_artworks_sale_status on public.artworks (sale_type, availability, moderation);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  bidder_id uuid not null references public.profiles (id) on delete cascade,
  bid_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  check (bid_amount > 0)
);

create index if not exists idx_bids_artwork_created on public.bids (artwork_id, created_at desc);

create table if not exists public.watchlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.purchase_intents (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  status intent_status not null default 'inquiry',
  offered_price numeric(14,2),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offered_price is null or offered_price >= 0)
);

create index if not exists idx_purchase_intents_buyer on public.purchase_intents (buyer_id, created_at desc);

create table if not exists public.event_promotions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  plan promotion_plan not null,
  fee_vnd numeric(14,2) not null,
  status promotion_status not null default 'pending',
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fee_vnd >= 0),
  check (end_at is null or start_at is null or end_at >= start_at)
);

-- Timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_artists_updated_at on public.artists;
create trigger trg_artists_updated_at before update on public.artists
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at before update on public.events
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_artworks_updated_at on public.artworks;
create trigger trg_artworks_updated_at before update on public.artworks
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_purchase_intents_updated_at on public.purchase_intents;
create trigger trg_purchase_intents_updated_at before update on public.purchase_intents
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_event_promotions_updated_at on public.event_promotions;
create trigger trg_event_promotions_updated_at before update on public.event_promotions
for each row execute procedure public.set_updated_at();

-- Bid validation + aggregation trigger
create or replace function public.validate_and_apply_bid()
returns trigger
language plpgsql
as $$
declare
  row_artwork public.artworks%rowtype;
  min_required numeric(14,2);
begin
  select * into row_artwork
  from public.artworks
  where id = new.artwork_id
  for update;

  if row_artwork.id is null then
    raise exception 'Artwork not found';
  end if;

  if row_artwork.sale_type <> 'auction' then
    raise exception 'Bids are only allowed for auction listings';
  end if;

  if row_artwork.availability <> 'active' or row_artwork.moderation <> 'approved' then
    raise exception 'Artwork is not open for bidding';
  end if;

  if row_artwork.bid_ends_at is null or row_artwork.bid_ends_at < now() then
    raise exception 'Auction has ended';
  end if;

  if row_artwork.current_bid is null then
    min_required := coalesce(row_artwork.starting_bid, 0);
  else
    min_required := row_artwork.current_bid + coalesce(row_artwork.bid_increment, 1);
  end if;

  if new.bid_amount < min_required then
    raise exception 'Bid must be at least %', min_required;
  end if;

  if new.bidder_id = row_artwork.created_by then
    raise exception 'Owner cannot bid on own artwork';
  end if;

  update public.artworks
  set current_bid = new.bid_amount,
      bid_count = bid_count + 1,
      updated_at = now()
  where id = new.artwork_id;

  return new;
end;
$$;

drop trigger if exists trg_validate_and_apply_bid on public.bids;
create trigger trg_validate_and_apply_bid
before insert on public.bids
for each row execute procedure public.validate_and_apply_bid();

-- RLS
alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.events enable row level security;
alter table public.artworks enable row level security;
alter table public.bids enable row level security;
alter table public.watchlist enable row level security;
alter table public.purchase_intents enable row level security;
alter table public.event_promotions enable row level security;

-- profiles
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
create policy profiles_select_all
on public.profiles for select
using (true);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
create policy profiles_insert_self
on public.profiles for insert
with check (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
create policy profiles_update_self
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- artists
DROP POLICY IF EXISTS artists_select_all ON public.artists;
create policy artists_select_all
on public.artists for select
using (true);

DROP POLICY IF EXISTS artists_insert_owner ON public.artists;
create policy artists_insert_owner
on public.artists for insert
with check (profile_id = auth.uid() and public.is_seller_role());

DROP POLICY IF EXISTS artists_update_owner ON public.artists;
create policy artists_update_owner
on public.artists for update
using (profile_id = auth.uid() or public.is_admin_like_role())
with check (profile_id = auth.uid() or public.is_admin_like_role());

-- events
DROP POLICY IF EXISTS events_select_public_or_owner ON public.events;
create policy events_select_public_or_owner
on public.events for select
using (
  (status = 'published' and moderation = 'approved')
  or created_by = auth.uid()
  or public.is_admin_like_role()
);

DROP POLICY IF EXISTS events_insert_seller ON public.events;
create policy events_insert_seller
on public.events for insert
with check (created_by = auth.uid() and public.is_seller_role());

DROP POLICY IF EXISTS events_update_owner_or_admin ON public.events;
create policy events_update_owner_or_admin
on public.events for update
using (created_by = auth.uid() or public.is_admin_like_role())
with check (created_by = auth.uid() or public.is_admin_like_role());

-- artworks
DROP POLICY IF EXISTS artworks_select_public_or_owner ON public.artworks;
create policy artworks_select_public_or_owner
on public.artworks for select
using (
  (availability = 'active' and moderation = 'approved')
  or created_by = auth.uid()
  or public.is_admin_like_role()
);

DROP POLICY IF EXISTS artworks_insert_seller ON public.artworks;
create policy artworks_insert_seller
on public.artworks for insert
with check (created_by = auth.uid() and public.is_seller_role());

DROP POLICY IF EXISTS artworks_update_owner_or_admin ON public.artworks;
create policy artworks_update_owner_or_admin
on public.artworks for update
using (created_by = auth.uid() or public.is_admin_like_role())
with check (created_by = auth.uid() or public.is_admin_like_role());

-- bids
DROP POLICY IF EXISTS bids_select_participants ON public.bids;
create policy bids_select_participants
on public.bids for select
using (
  bidder_id = auth.uid()
  or exists (
    select 1 from public.artworks a where a.id = bids.artwork_id and a.created_by = auth.uid()
  )
  or public.is_admin_like_role()
);

DROP POLICY IF EXISTS bids_insert_auth ON public.bids;
create policy bids_insert_auth
on public.bids for insert
with check (bidder_id = auth.uid());

-- watchlist
DROP POLICY IF EXISTS watchlist_select_own ON public.watchlist;
create policy watchlist_select_own
on public.watchlist for select
using (user_id = auth.uid());

DROP POLICY IF EXISTS watchlist_insert_own ON public.watchlist;
create policy watchlist_insert_own
on public.watchlist for insert
with check (user_id = auth.uid());

DROP POLICY IF EXISTS watchlist_delete_own ON public.watchlist;
create policy watchlist_delete_own
on public.watchlist for delete
using (user_id = auth.uid());

-- purchase_intents
DROP POLICY IF EXISTS intents_select_owner_or_seller ON public.purchase_intents;
create policy intents_select_owner_or_seller
on public.purchase_intents for select
using (
  buyer_id = auth.uid()
  or exists (
    select 1 from public.artworks a where a.id = purchase_intents.artwork_id and a.created_by = auth.uid()
  )
  or public.is_admin_like_role()
);

DROP POLICY IF EXISTS intents_insert_buyer ON public.purchase_intents;
create policy intents_insert_buyer
on public.purchase_intents for insert
with check (buyer_id = auth.uid());

DROP POLICY IF EXISTS intents_update_owner_or_seller ON public.purchase_intents;
create policy intents_update_owner_or_seller
on public.purchase_intents for update
using (
  buyer_id = auth.uid()
  or exists (
    select 1 from public.artworks a where a.id = purchase_intents.artwork_id and a.created_by = auth.uid()
  )
  or public.is_admin_like_role()
)
with check (
  buyer_id = auth.uid()
  or exists (
    select 1 from public.artworks a where a.id = purchase_intents.artwork_id and a.created_by = auth.uid()
  )
  or public.is_admin_like_role()
);

-- event promotions
DROP POLICY IF EXISTS promotions_select_owner_or_admin ON public.event_promotions;
create policy promotions_select_owner_or_admin
on public.event_promotions for select
using (requested_by = auth.uid() or public.is_admin_like_role());

DROP POLICY IF EXISTS promotions_insert_owner ON public.event_promotions;
create policy promotions_insert_owner
on public.event_promotions for insert
with check (requested_by = auth.uid() and public.current_role() in ('gallery'::user_role, 'art_dealer'::user_role));

DROP POLICY IF EXISTS promotions_update_owner_or_admin ON public.event_promotions;
create policy promotions_update_owner_or_admin
on public.event_promotions for update
using (requested_by = auth.uid() or public.is_admin_like_role())
with check (requested_by = auth.uid() or public.is_admin_like_role());
