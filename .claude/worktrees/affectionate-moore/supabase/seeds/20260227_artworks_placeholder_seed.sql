-- Placeholder artwork records for marketplace testing.
-- Prerequisite: at least one seller profile in public.profiles.

DO $$
DECLARE
  seller_id uuid;
  seller_artist_id uuid;
BEGIN
  SELECT id INTO seller_id
  FROM public.profiles
  WHERE role IN ('artist', 'gallery', 'art_dealer')
  ORDER BY created_at
  LIMIT 1;

  IF seller_id IS NULL THEN
    RAISE NOTICE 'Seed skipped: no seller profile found in public.profiles.';
    RETURN;
  END IF;

  INSERT INTO public.artists (profile_id, display_name, bio, city, disciplines)
  VALUES (
    seller_id,
    'Vietnam Marketplace Placeholder',
    'Auto-seeded placeholder artist for marketplace preview.',
    'Ho Chi Minh City',
    ARRAY['painting'::art_form, 'mixed_media'::art_form]
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

  INSERT INTO public.artworks (
    artist_id, created_by, title, slug, description, art_form, medium, dimensions, year_created,
    image_url, image_urls, sale_type, price, starting_bid, current_bid, bid_increment, bid_ends_at, availability, moderation,
    style, city, country, provenance, authenticity, condition_report, story,
    source_url, source_item_url, imported_at
  ) VALUES
  (
    seller_artist_id, seller_id,
    'Red River Memory',
    'placeholder-red-river-memory',
    'Placeholder listing used to validate the richer artwork detail view.',
    'painting',
    'Oil on canvas',
    '90 x 120 cm',
    2022,
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
    ARRAY[
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
      'https://images.unsplash.com/photo-1494948141550-256616053995?w=1200'
    ],
    'fixed',
    18500000,
    null,
    null,
    null,
    null,
    'active',
    'approved',
    'Contemporary',
    'Hanoi',
    'Vietnam',
    'Direct from artist studio (placeholder provenance).',
    'Signed and archived by seller.',
    'Excellent',
    'A tone study inspired by late afternoon light over the Red River.',
    'https://judooo.art',
    'https://judooo.art/marketplace',
    now()
  ),
  (
    seller_artist_id, seller_id,
    'Monsoon Signal',
    'placeholder-monsoon-signal',
    'Placeholder auction lot for testing bids and detail metadata.',
    'mixed_media',
    'Acrylic and lacquer',
    '100 x 140 cm',
    2023,
    'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1200',
    ARRAY[
      'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1200',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200'
    ],
    'auction',
    null,
    12000000,
    12000000,
    500000,
    now() + interval '7 days',
    'active',
    'approved',
    'Lacquer Contemporary',
    'Ho Chi Minh City',
    'Vietnam',
    'Consigned by gallery (placeholder provenance).',
    'Certificate by gallery.',
    'Very good',
    'Built from layered textures that reference monsoon streets and market signage.',
    'https://judooo.art',
    'https://judooo.art/marketplace',
    now()
  )
  ON CONFLICT (slug) DO UPDATE
    SET description = excluded.description,
        medium = excluded.medium,
        dimensions = excluded.dimensions,
        year_created = excluded.year_created,
        image_url = excluded.image_url,
        image_urls = excluded.image_urls,
        style = excluded.style,
        city = excluded.city,
        country = excluded.country,
        provenance = excluded.provenance,
        authenticity = excluded.authenticity,
        condition_report = excluded.condition_report,
        story = excluded.story,
        source_url = excluded.source_url,
        source_item_url = excluded.source_item_url,
        imported_at = excluded.imported_at,
        updated_at = now();
END $$;
