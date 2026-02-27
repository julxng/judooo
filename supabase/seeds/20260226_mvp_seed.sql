-- MVP seed data (safe, idempotent-enough for local testing)
-- Prerequisite: at least 2 rows in public.profiles.

DO $$
DECLARE
  seller_id uuid;
  buyer_id uuid;
  seller_artist_id uuid;
  event_a_id uuid;
  event_b_id uuid;
  fixed_artwork_id uuid;
  auction_artwork_id uuid;
BEGIN
  SELECT id INTO seller_id
  FROM public.profiles
  WHERE role IN ('artist', 'gallery', 'art_dealer')
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO buyer_id
  FROM public.profiles
  WHERE id <> seller_id
  ORDER BY created_at
  LIMIT 1;

  IF seller_id IS NULL OR buyer_id IS NULL THEN
    RAISE NOTICE 'Seed skipped: need at least 1 seller profile and 1 buyer profile in public.profiles.';
    RETURN;
  END IF;

  INSERT INTO public.artists (profile_id, display_name, bio, city, disciplines)
  VALUES (
    seller_id,
    'Demo Artist',
    'Emerging artist profile for MVP validation.',
    'Ho Chi Minh City',
    ARRAY['painting'::art_form, 'video'::art_form]
  )
  ON CONFLICT (profile_id) DO UPDATE
    SET display_name = excluded.display_name,
        bio = excluded.bio,
        city = excluded.city,
        disciplines = excluded.disciplines,
        updated_at = now();

  SELECT id INTO seller_artist_id
  FROM public.artists
  WHERE profile_id = seller_id
  LIMIT 1;

  INSERT INTO public.events (
    title, slug, organizer, description, category, moderation, status,
    start_at, end_at, venue_name, address, city, lat, lng, cover_image_url, created_by
  ) VALUES (
    'Saigon Emerging Voices',
    'saigon-emerging-voices',
    'Demo Gallery',
    'Group exhibition featuring emerging artists and affordable originals.',
    'exhibition',
    'approved',
    'published',
    now() - interval '1 day',
    now() + interval '10 days',
    'District 1 Art House',
    '97 Pho Duc Chinh, District 1',
    'Ho Chi Minh City',
    10.7734,
    106.6980,
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200',
    seller_id
  )
  ON CONFLICT (slug) DO UPDATE
    SET organizer = excluded.organizer,
        description = excluded.description,
        category = excluded.category,
        moderation = excluded.moderation,
        status = excluded.status,
        start_at = excluded.start_at,
        end_at = excluded.end_at,
        venue_name = excluded.venue_name,
        address = excluded.address,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        cover_image_url = excluded.cover_image_url,
        created_by = excluded.created_by,
        updated_at = now()
  RETURNING id INTO event_a_id;

  INSERT INTO public.events (
    title, slug, organizer, description, category, moderation, status,
    start_at, end_at, venue_name, address, city, lat, lng, cover_image_url, created_by
  ) VALUES (
    'Hanoi Contemporary Auction Night',
    'hanoi-contemporary-auction-night',
    'Demo Auction Collective',
    'Auction-focused evening with works from rising Vietnamese talents.',
    'auction',
    'approved',
    'published',
    now() - interval '2 hours',
    now() + interval '4 days',
    'Ba Dinh Cultural Hall',
    'Ba Dinh District',
    'Hanoi',
    21.0333,
    105.8333,
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200',
    seller_id
  )
  ON CONFLICT (slug) DO UPDATE
    SET organizer = excluded.organizer,
        description = excluded.description,
        category = excluded.category,
        moderation = excluded.moderation,
        status = excluded.status,
        start_at = excluded.start_at,
        end_at = excluded.end_at,
        venue_name = excluded.venue_name,
        address = excluded.address,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        cover_image_url = excluded.cover_image_url,
        created_by = excluded.created_by,
        updated_at = now()
  RETURNING id INTO event_b_id;

  INSERT INTO public.artworks (
    artist_id, event_id, created_by, title, slug, description, art_form, medium,
    dimensions, image_url, sale_type, price, availability, moderation
  ) VALUES (
    seller_artist_id,
    event_a_id,
    seller_id,
    'Monsoon Memory I',
    'monsoon-memory-i',
    'Original painting from the Monsoon Memory series.',
    'painting',
    'Oil on canvas',
    '80 x 100 cm',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
    'fixed',
    8500000,
    'active',
    'approved'
  )
  ON CONFLICT (slug) DO UPDATE
    SET artist_id = excluded.artist_id,
        event_id = excluded.event_id,
        created_by = excluded.created_by,
        description = excluded.description,
        art_form = excluded.art_form,
        medium = excluded.medium,
        dimensions = excluded.dimensions,
        image_url = excluded.image_url,
        sale_type = excluded.sale_type,
        price = excluded.price,
        availability = excluded.availability,
        moderation = excluded.moderation,
        updated_at = now()
  RETURNING id INTO fixed_artwork_id;

  INSERT INTO public.artworks (
    artist_id, event_id, created_by, title, slug, description, art_form, medium,
    dimensions, image_url, sale_type, starting_bid, current_bid, bid_increment,
    bid_ends_at, availability, moderation
  ) VALUES (
    seller_artist_id,
    event_b_id,
    seller_id,
    'Signals From The River',
    'signals-from-the-river',
    'Mixed media work listed for auction.',
    'mixed_media',
    'Acrylic and lacquer',
    '100 x 140 cm',
    'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=1200',
    'auction',
    12000000,
    12000000,
    500000,
    now() + interval '3 days',
    'active',
    'approved'
  )
  ON CONFLICT (slug) DO UPDATE
    SET artist_id = excluded.artist_id,
        event_id = excluded.event_id,
        created_by = excluded.created_by,
        description = excluded.description,
        art_form = excluded.art_form,
        medium = excluded.medium,
        dimensions = excluded.dimensions,
        image_url = excluded.image_url,
        sale_type = excluded.sale_type,
        starting_bid = excluded.starting_bid,
        current_bid = excluded.current_bid,
        bid_increment = excluded.bid_increment,
        bid_ends_at = excluded.bid_ends_at,
        availability = excluded.availability,
        moderation = excluded.moderation,
        updated_at = now()
  RETURNING id INTO auction_artwork_id;

  INSERT INTO public.watchlist (user_id, event_id)
  VALUES (buyer_id, event_a_id)
  ON CONFLICT DO NOTHING;

  -- Seed one valid bid (trigger validates increments and updates current_bid/bid_count)
  BEGIN
    INSERT INTO public.bids (artwork_id, bidder_id, bid_amount)
    VALUES (auction_artwork_id, buyer_id, 12500000);
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
    WHEN others THEN
      -- ignore if bid already exists or auction row already moved past this value
      NULL;
  END;

  INSERT INTO public.purchase_intents (artwork_id, buyer_id, status, offered_price, message)
  SELECT
    fixed_artwork_id,
    buyer_id,
    'inquiry',
    8500000,
    'Interested in purchasing this piece. Please share pickup/shipping options.'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.purchase_intents pi
    WHERE pi.artwork_id = fixed_artwork_id
      AND pi.buyer_id = buyer_id
      AND pi.status = 'inquiry'
  );
END $$;
