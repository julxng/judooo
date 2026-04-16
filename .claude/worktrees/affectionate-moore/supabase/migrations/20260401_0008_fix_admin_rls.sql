-- Fix RLS: current_role() and is_admin_like_role() don't recognise the 'admin' enum value
-- added in migration 0007. This means admins are blocked by RLS from viewing/updating
-- events and artworks they did not create.

-- 1. Rebuild current_role() to handle ALL enum values (including admin, artist_pending,
--    gallery_manager_pending, gallery_manager added after the initial migration).
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()),
    'art_lover'::user_role
  );
$$;

-- 2. Include 'admin' in the admin-like check so RLS policies grant full access.
CREATE OR REPLACE FUNCTION public.is_admin_like_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_role() IN (
    'admin'::user_role,
    'gallery'::user_role,
    'art_dealer'::user_role
  );
$$;

-- 3. Allow admins to DELETE events (currently no delete policy exists).
DROP POLICY IF EXISTS events_delete_admin ON public.events;
CREATE POLICY events_delete_admin
ON public.events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  )
);

-- 4. Allow admins to DELETE artworks.
DROP POLICY IF EXISTS artworks_delete_admin ON public.artworks;
CREATE POLICY artworks_delete_admin
ON public.artworks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  )
);

-- 5. Allow admins to INSERT events (for manual publish / crawl import).
DROP POLICY IF EXISTS events_insert_admin ON public.events;
CREATE POLICY events_insert_admin
ON public.events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  )
);
