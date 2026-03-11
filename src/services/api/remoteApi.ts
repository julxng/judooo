import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { supabase } from '@/services/supabase/client';
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
    const canonicalTitle = event.name_en || event.name_vie || event.title;
    const canonicalDescription = event.description_en || event.description_vie || event.description;

    const payloadV2 = {
      title: canonicalTitle,
      name_vie: event.name_vie,
      name_en: event.name_en,
      organizer: event.organizer,
      description: canonicalDescription,
      description_vie: event.description_vie,
      description_en: event.description_en,
      category: event.category,
      start_at: event.startDate,
      end_at: event.endDate,
      city: event.city_en || event.city || event.location,
      city_vie: event.city_vie,
      city_en: event.city_en,
      district: event.district,
      district_vie: event.district_vie,
      district_en: event.district_en,
      location: event.address_en || event.address || event.location,
      location_name: event.address_en || event.address || event.location,
      address_vie: event.address_vie,
      address_en: event.address_en,
      lat: event.lat,
      lng: event.lng,
      cover_image_url: event.imageUrl,
      art_medium: event.art_medium,
      art_medium_vie: event.art_medium_vie,
      art_medium_en: event.art_medium_en,
      event_type: event.event_type,
      event_type_vie: event.event_type_vie,
      event_type_en: event.event_type_en,
      place_type: event.place_type,
      place_type_vie: event.place_type_vie,
      place_type_en: event.place_type_en,
      is_virtual: event.is_virtual,
      is_free: event.is_free,
      tags: event.tags,
      price: event.price,
      registration_required: event.registration_required,
      registration_link: event.registration_link,
      google_map_link: event.google_map_link,
      socialvideo_url: event.socialvideo_url,
      moderation: event.moderation_status,
      moderation_status: event.moderation_status,
      featured: event.featured,
      submitter_name: event.submitter_name,
      submitter_email: event.submitter_email,
      submitter_organization: event.submitter_organization,
    };

    let { data, error } = await client.from('events').update(payloadV2).eq('id', id).select('*').single();
    if (error) {
      const payloadLegacy = {
        title: event.title,
        name_vie: event.name_vie,
        name_en: event.name_en,
        organizer: event.organizer,
        description: event.description,
        description_vie: event.description_vie,
        description_en: event.description_en,
        art_medium_vie: event.art_medium_vie,
        art_medium_en: event.art_medium_en,
        event_type_vie: event.event_type_vie,
        event_type_en: event.event_type_en,
        place_type_vie: event.place_type_vie,
        place_type_en: event.place_type_en,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        lat: event.lat,
        lng: event.lng,
        imageUrl: event.imageUrl,
        media: event.media,
        city: event.city,
        city_vie: event.city_vie,
        city_en: event.city_en,
        district: event.district,
        district_vie: event.district_vie,
        district_en: event.district_en,
        location_name: event.address,
        address_vie: event.address_vie,
        address_en: event.address_en,
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

export const updateArtworkRemote = async (
  id: string,
  artwork: Partial<Artwork>,
): Promise<Artwork | null> => {
  try {
    const client = withClient();
    const canonicalTitle = artwork.title_en || artwork.title_vie || artwork.title;
    const canonicalDescription =
      artwork.description_en || artwork.description_vie || artwork.description;

    const payloadV2 = {
      title: canonicalTitle,
      title_vie: artwork.title_vie,
      title_en: artwork.title_en,
      artist: artwork.artist,
      description: canonicalDescription,
      description_vie: artwork.description_vie,
      description_en: artwork.description_en,
      medium: artwork.medium_en || artwork.medium_vie || artwork.medium,
      medium_vie: artwork.medium_vie,
      medium_en: artwork.medium_en,
      dimensions: artwork.dimensions,
      image_url: artwork.imageUrl,
      image_urls: artwork.imageGallery,
      sale_type: artwork.saleType,
      price: artwork.saleType === 'fixed' ? artwork.price : null,
      current_bid: artwork.currentBid,
      bid_ends_at: artwork.endTime,
      availability: artwork.available ? 'active' : 'sold',
      moderation: artwork.moderation_status,
      moderation_status: artwork.moderation_status,
      event_id: artwork.eventId,
      year_created: artwork.yearCreated,
      style: artwork.style_en || artwork.style_vie || artwork.style,
      style_vie: artwork.style_vie,
      style_en: artwork.style_en,
      city: artwork.city_en || artwork.city,
      city_vie: artwork.city_vie,
      city_en: artwork.city_en,
      country: artwork.country_en || artwork.country,
      country_vie: artwork.country_vie,
      country_en: artwork.country_en,
      provenance: artwork.provenance_en || artwork.provenance,
      provenance_vie: artwork.provenance_vie,
      provenance_en: artwork.provenance_en,
      authenticity: artwork.authenticity_en || artwork.authenticity,
      authenticity_vie: artwork.authenticity_vie,
      authenticity_en: artwork.authenticity_en,
      condition_report: artwork.conditionReport_en || artwork.conditionReport,
      condition_report_vie: artwork.conditionReport_vie,
      condition_report_en: artwork.conditionReport_en,
      story: artwork.story_en || artwork.story,
      story_vie: artwork.story_vie,
      story_en: artwork.story_en,
    };

    let { data, error } = await client.from('artworks').update(payloadV2).eq('id', id).select('*').single();
    if (error) {
      const payloadLegacy = {
        title: artwork.title,
        title_vie: artwork.title_vie,
        title_en: artwork.title_en,
        artist: artwork.artist,
        price: artwork.price,
        currentBid: artwork.currentBid,
        bidCount: artwork.bidCount,
        saleType: artwork.saleType,
        imageUrl: artwork.imageUrl,
        medium: artwork.medium,
        medium_vie: artwork.medium_vie,
        medium_en: artwork.medium_en,
        dimensions: artwork.dimensions,
        description: artwork.description,
        description_vie: artwork.description_vie,
        description_en: artwork.description_en,
        available: artwork.available,
        endTime: artwork.endTime,
        eventId: artwork.eventId,
        createdBy: artwork.createdBy,
        style: artwork.style,
        style_vie: artwork.style_vie,
        style_en: artwork.style_en,
        city: artwork.city,
        city_vie: artwork.city_vie,
        city_en: artwork.city_en,
        country: artwork.country,
        country_vie: artwork.country_vie,
        country_en: artwork.country_en,
        provenance: artwork.provenance,
        provenance_vie: artwork.provenance_vie,
        provenance_en: artwork.provenance_en,
        authenticity: artwork.authenticity,
        authenticity_vie: artwork.authenticity_vie,
        authenticity_en: artwork.authenticity_en,
        conditionReport: artwork.conditionReport,
        conditionReport_vie: artwork.conditionReport_vie,
        conditionReport_en: artwork.conditionReport_en,
        story: artwork.story,
        story_vie: artwork.story_vie,
        story_en: artwork.story_en,
        moderation_status: artwork.moderation_status,
      };
      const fallback = await client.from('artworks').update(payloadLegacy).eq('id', id).select('*').single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    return data ? mapArtwork(data) : null;
  } catch (error) {
    console.error('Supabase updateArtwork error', error);
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

export const getProfilesRemote = async (): Promise<User[] | null> => {
  try {
    const client = withClient();
    const { data, error } = await client.from('profiles').select('*');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar,
    }));
  } catch (error) {
    console.error('Supabase getProfiles error', error);
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
