import type { User } from '@features/auth/types/auth.types';
import type { ArtEvent } from '@features/events/types/event.types';
import type { Artwork } from '@features/marketplace/types/artwork.types';
import { supabase } from '@services/supabase/client';
import { DATA_MODE, STORAGE_BUCKET } from './shared';
import { buildArtworkPayloads, buildEventPayloads, mapArtwork, mapEvent } from './mappers';

export const shouldUseRemote = (): boolean => DATA_MODE !== 'local' && Boolean(supabase);

const withClient = () => {
  if (!supabase) throw new Error('Supabase client not initialised');
  return supabase;
};

const tryInsert = async (table: string, payloads: any[]): Promise<any | null> => {
  const client = withClient();
  let lastError: unknown = null;

  for (const payload of payloads) {
    const { data, error } = await client.from(table).insert(payload).select('*').single();
    if (!error) return data;
    lastError = error;
  }

  if (lastError) {
    console.error(`Supabase insert failed for ${table}:`, lastError);
  }

  return null;
};

export const getEventsRemote = async (): Promise<ArtEvent[] | null> => {
  try {
    const client = withClient();
    let { data, error } = await client.from('events').select('*').order('created_at', { ascending: false });
    if (error) {
      const fallback = await client.from('events').select('*');
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    return (data || []).map(mapEvent);
  } catch (error) {
    console.error('Supabase getEvents error', error);
    return null;
  }
};

export const createEventRemote = async (event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
  try {
    const inserted = await tryInsert('events', buildEventPayloads(event));
    return inserted ? mapEvent(inserted) : null;
  } catch (error) {
    console.error('Supabase createEvent error', error);
    return null;
  }
};

export const updateEventRemote = async (
  id: string,
  event: Partial<ArtEvent>,
): Promise<ArtEvent | null> => {
  try {
    const client = withClient();

    const payloadV2 = {
      title: event.title,
      organizer: event.organizer,
      description: event.description,
      category: event.category,
      start_at: event.startDate,
      end_at: event.endDate,
      city: event.location,
      address: event.location,
      lat: event.lat,
      lng: event.lng,
      cover_image_url: event.imageUrl,
    };

    let { data, error } = await client.from('events').update(payloadV2).eq('id', id).select('*').single();
    if (error) {
      const payloadLegacy = {
        title: event.title,
        organizer: event.organizer,
        description: event.description,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        lat: event.lat,
        lng: event.lng,
        imageUrl: event.imageUrl,
        media: event.media,
      };
      const fallback = await client.from('events').update(payloadLegacy).eq('id', id).select('*').single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    return data ? mapEvent(data) : null;
  } catch (error) {
    console.error('Supabase updateEvent error', error);
    return null;
  }
};

export const getArtworksRemote = async (eventId?: string): Promise<Artwork[] | null> => {
  try {
    const client = withClient();
    let { data, error } = await client
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const fallback = await client.from('artworks').select('*');
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    const mapped = (data || []).map(mapArtwork);
    return eventId ? mapped.filter((artwork) => artwork.eventId === eventId) : mapped;
  } catch (error) {
    console.error('Supabase getArtworks error', error);
    return null;
  }
};

export const createArtworkRemote = async (
  artwork: Partial<Artwork>,
): Promise<Artwork | null> => {
  try {
    const inserted = await tryInsert('artworks', buildArtworkPayloads(artwork));
    return inserted ? mapArtwork(inserted) : null;
  } catch (error) {
    console.error('Supabase createArtwork error', error);
    return null;
  }
};

export const placeBidRemote = async (
  artworkId: string,
  userId: string,
  amount: number,
): Promise<boolean> => {
  try {
    const client = withClient();
    const { error: bidError } = await client.from('bids').insert({
      artwork_id: artworkId,
      bidder_id: userId,
      bid_amount: amount,
    });

    if (!bidError) return true;

    const { error: fallbackError } = await client
      .from('artworks')
      .update({ currentBid: amount, bidCount: 1 })
      .eq('id', artworkId);

    if (fallbackError) throw fallbackError;
    return true;
  } catch (error) {
    console.error('Supabase placeBid error', error);
    return false;
  }
};

export const syncUserRemote = async (user: User): Promise<boolean> => {
  try {
    const client = withClient();
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'gallery',
      avatar: user.avatar,
    };
    const { error } = await client.from('profiles').upsert(payload);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase syncUser error', error);
    return false;
  }
};

export const getProfileRemote = async (id: string): Promise<User | null> => {
  try {
    const client = withClient();
    const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
    };
  } catch (error) {
    console.error('Supabase getProfile error', error);
    return null;
  }
};

export const getWatchlistRemote = async (userId: string): Promise<string[] | null> => {
  try {
    const client = withClient();
    let data: Array<Record<string, any>> | null = null;
    let error: any = null;
    {
      const result = await client.from('watchlist').select('event_id').eq('user_id', userId);
      data = result.data as Array<Record<string, any>> | null;
      error = result.error;
    }
    if (error) {
      const fallback = await client.from('watchlist').select('eventId').eq('userId', userId);
      data = fallback.data as Array<Record<string, any>> | null;
      error = fallback.error;
    }
    if (error) throw error;
    return (data || []).map((row: Record<string, any>) => row.event_id || row.eventId).filter(Boolean);
  } catch (error) {
    console.error('Supabase getWatchlist error', error);
    return null;
  }
};

export const setWatchlistRemote = async (
  userId: string,
  eventId: string,
  saved: boolean,
): Promise<boolean> => {
  try {
    const client = withClient();

    let existing = await client
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing.error) {
      existing = await client
        .from('watchlist')
        .select('*')
        .eq('userId', userId)
        .eq('eventId', eventId)
        .maybeSingle();
    }

    if (saved) {
      if (!existing.data) {
        let add = await client.from('watchlist').insert({ user_id: userId, event_id: eventId });
        if (add.error) {
          add = await client.from('watchlist').insert({ userId, eventId });
        }
        if (add.error) throw add.error;
      }
      return true;
    }

    if (existing.data) {
      let remove = await client
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);
      if (remove.error) {
        remove = await client
          .from('watchlist')
          .delete()
          .eq('userId', userId)
          .eq('eventId', eventId);
      }
      if (remove.error) throw remove.error;
    }

    return true;
  } catch (error) {
    console.error('Supabase setWatchlist error', error);
    return false;
  }
};

export const uploadImageRemote = async (file: File): Promise<string | null> => {
  try {
    const client = withClient();
    const path = `public/${Date.now()}-${file.name}`;
    const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl || null;
  } catch (error) {
    console.error('Supabase uploadImage error', error);
    return null;
  }
};
