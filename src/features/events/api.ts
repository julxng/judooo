import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { initialEvents } from './services/eventFixtures';
import { mapEvent } from '@/services/api/mappers';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

const loadInitialEvents = unstable_cache(
  async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return initialEvents;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('imported_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error || !data) {
        return initialEvents;
      }

      return data.map(mapEvent);
    } catch {
      return initialEvents;
    }
  },
  ['initial-events'],
  { revalidate: 300 },
);

export const getInitialEvents = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return initialEvents;
  }

  return loadInitialEvents();
};
