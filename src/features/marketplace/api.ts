import { createClient } from '@supabase/supabase-js';
import { initialArtworks } from './services/artworkFixtures';
import { mapArtwork } from '@/services/api/mappers';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

export const getInitialArtworks = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return initialArtworks;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return initialArtworks;
    }

    return data.map(mapArtwork);
  } catch {
    return initialArtworks;
  }
};
