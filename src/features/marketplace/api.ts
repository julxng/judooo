import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { initialArtworks } from './services/artworkFixtures';
import { mapArtwork } from '@/services/api/mappers';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

const loadInitialArtworks = unstable_cache(
  async (limit?: number) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return limit ? initialArtworks.slice(0, limit) : initialArtworks;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      let query = supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeof limit === 'number') {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error || !data) {
        return limit ? initialArtworks.slice(0, limit) : initialArtworks;
      }

      return data.map(mapArtwork);
    } catch {
      return limit ? initialArtworks.slice(0, limit) : initialArtworks;
    }
  },
  ['initial-artworks'],
  { revalidate: 300 },
);

export const getInitialArtworks = async (limit?: number) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return limit ? initialArtworks.slice(0, limit) : initialArtworks;
  }

  return loadInitialArtworks(limit);
};
