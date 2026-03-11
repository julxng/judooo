import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { initialEvents } from './services/eventFixtures';
import { mapEvent } from '@/services/api/mappers';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

const fallbackEventById = (id: string) => initialEvents.find((event) => event.id === id) ?? null;

const fetchInitialEvents = async (limit?: number) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return typeof limit === 'number' ? initialEvents.slice(0, limit) : initialEvents;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let query = supabase
      .from('events')
      .select('*')
      .order('imported_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return typeof limit === 'number' ? initialEvents.slice(0, limit) : initialEvents;
    }

    return data.map(mapEvent);
  } catch {
    return typeof limit === 'number' ? initialEvents.slice(0, limit) : initialEvents;
  }
};

const loadInitialEvents = unstable_cache(
  async (limit?: number) => fetchInitialEvents(limit),
  ['initial-events'],
  { revalidate: 300 },
);

export const getInitialEvents = async (options?: { skipCache?: boolean; limit?: number }) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return typeof options?.limit === 'number' ? initialEvents.slice(0, options.limit) : initialEvents;
  }

  if (options?.skipCache) {
    return fetchInitialEvents(options.limit);
  }

  return loadInitialEvents(options?.limit);
};

export const getInitialEventById = async (id: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return fallbackEventById(id);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();

    if (error || !data) {
      return fallbackEventById(id);
    }

    return mapEvent(data);
  } catch {
    return fallbackEventById(id);
  }
};

export const getRelatedInitialEvents = async ({
  city,
  excludeId,
  limit = 3,
}: {
  city?: string | null;
  excludeId?: string;
  limit?: number;
}) => {
  if (!city) {
    return [];
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return initialEvents.filter((event) => event.city === city && event.id !== excludeId).slice(0, limit);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let query = supabase
      .from('events')
      .select('*')
      .eq('city', city)
      .order('imported_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return initialEvents.filter((event) => event.city === city && event.id !== excludeId).slice(0, limit);
    }

    return data.map(mapEvent);
  } catch {
    return initialEvents.filter((event) => event.city === city && event.id !== excludeId).slice(0, limit);
  }
};
