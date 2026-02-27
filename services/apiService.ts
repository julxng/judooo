import { ArtEvent, Artwork, User } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'images';

const withClient = () => {
  if (!supabase) throw new Error('Supabase client not initialised');
  return supabase;
};

const toIsoDate = (value?: string | null): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const mapEvent = (row: any): ArtEvent => ({
  id: String(row.id),
  title: row.title || row.name_en || row.name_vie || 'Untitled Event',
  organizer: row.organizer || row.gallery || 'Gallery',
  startDate: toIsoDate(row.startDate || row.start_date || row.start_at),
  endDate: toIsoDate(row.endDate || row.end_date || row.end_at),
  location: row.location || row.district || row.city || row.address || 'Vietnam',
  lat: Number(row.lat ?? 10.7769),
  lng: Number(row.lng ?? 106.7009),
  imageUrl: row.imageUrl || row.image_url || row.cover_image_url || 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200',
  media: Array.isArray(row.media) ? row.media : [],
  description: row.description || row.description_vie || '',
  category: row.category || 'exhibition',
  createdBy: row.createdBy || row.created_by,
  sourceUrl: row.sourceUrl || row.source_url,
  sourceItemUrl: row.sourceItemUrl || row.source_item_url || row.item_url,
  importedAt: row.importedAt || row.imported_at,
});

const mapArtwork = (row: any): Artwork => {
  const availability = row.availability || (row.available ? 'active' : 'sold');
  const gallery = Array.isArray(row.image_urls)
    ? row.image_urls
    : Array.isArray(row.imageGallery)
    ? row.imageGallery
    : row.image_url
    ? [row.image_url]
    : row.imageUrl
    ? [row.imageUrl]
    : [];

  return {
    id: String(row.id),
    title: row.title || 'Untitled Artwork',
    artist: row.artist || row.artist_name || row.artistName || 'Unknown Artist',
    price: Number(row.price || 0),
    currentBid: row.currentBid != null ? Number(row.currentBid) : row.current_bid != null ? Number(row.current_bid) : undefined,
    bidCount: row.bidCount != null ? Number(row.bidCount) : row.bid_count != null ? Number(row.bid_count) : undefined,
    saleType: row.saleType || row.sale_type || 'fixed',
    imageUrl: row.imageUrl || row.image_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
    medium: row.medium || 'Mixed Media',
    dimensions: row.dimensions || 'N/A',
    description: row.description || '',
    available: row.available != null ? Boolean(row.available) : availability === 'active' || availability === 'draft',
    endTime: row.endTime || row.bid_ends_at,
    createdBy: row.createdBy || row.created_by,
    eventId: row.eventId || row.event_id,
    yearCreated: row.yearCreated != null ? Number(row.yearCreated) : row.year_created != null ? Number(row.year_created) : undefined,
    style: row.style || row.art_form,
    city: row.city || row.location_city,
    country: row.country || 'Vietnam',
    provenance: row.provenance,
    authenticity: row.authenticity,
    conditionReport: row.conditionReport || row.condition_report,
    story: row.story,
    sourceUrl: row.sourceUrl || row.source_url,
    sourceItemUrl: row.sourceItemUrl || row.source_item_url,
    importedAt: row.importedAt || row.imported_at,
    imageGallery: gallery,
  };
};

const buildEventPayloads = (event: Partial<ArtEvent>) => {
  const slug = `${toSlug(event.title || 'event')}-${Date.now()}`;
  return [
    {
      title: event.title,
      slug,
      organizer: event.organizer,
      description: event.description || '',
      category: event.category || 'exhibition',
      moderation: 'approved',
      status: 'published',
      start_at: event.startDate,
      end_at: event.endDate,
      city: event.location,
      address: event.location,
      lat: event.lat,
      lng: event.lng,
      cover_image_url: event.imageUrl,
      created_by: event.createdBy,
    },
    {
      id: event.id,
      title: event.title,
      organizer: event.organizer,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      lat: event.lat,
      lng: event.lng,
      imageUrl: event.imageUrl,
      media: event.media || [],
      description: event.description,
      category: event.category || 'exhibition',
      createdBy: event.createdBy,
    },
  ];
};

const buildArtworkPayloads = (artwork: Partial<Artwork>) => {
  const slug = `${toSlug(artwork.title || 'artwork')}-${Date.now()}`;
  const isAuction = artwork.saleType === 'auction';
  const numericPrice = Number(artwork.price || 0);

  return [
    {
      title: artwork.title,
      slug,
      artist: artwork.artist,
      description: artwork.description || '',
      medium: artwork.medium,
      dimensions: artwork.dimensions,
      image_url: artwork.imageUrl,
      image_urls: artwork.imageGallery && artwork.imageGallery.length ? artwork.imageGallery : [artwork.imageUrl].filter(Boolean),
      sale_type: artwork.saleType || 'fixed',
      price: isAuction ? null : numericPrice,
      starting_bid: isAuction ? numericPrice : null,
      current_bid: isAuction ? Number(artwork.currentBid || numericPrice) : null,
      bid_increment: isAuction ? 500000 : null,
      bid_ends_at: isAuction ? artwork.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      availability: artwork.available ? 'active' : 'sold',
      moderation: 'approved',
      created_by: artwork.createdBy,
      event_id: artwork.eventId || null,
      year_created: artwork.yearCreated ?? null,
      style: artwork.style || null,
      city: artwork.city || null,
      country: artwork.country || 'Vietnam',
      provenance: artwork.provenance || null,
      authenticity: artwork.authenticity || null,
      condition_report: artwork.conditionReport || null,
      story: artwork.story || null,
      source_url: artwork.sourceUrl || null,
      source_item_url: artwork.sourceItemUrl || null,
      imported_at: artwork.importedAt || null,
    },
    {
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist,
      price: numericPrice,
      currentBid: artwork.currentBid,
      bidCount: artwork.bidCount,
      saleType: artwork.saleType || 'fixed',
      imageUrl: artwork.imageUrl,
      medium: artwork.medium,
      dimensions: artwork.dimensions,
      description: artwork.description,
      available: artwork.available ?? true,
      endTime: artwork.endTime,
      eventId: artwork.eventId,
      createdBy: artwork.createdBy,
    },
  ];
};

const tryInsert = async (table: string, payloads: any[]): Promise<any | null> => {
  const client = withClient();
  let lastError: any = null;
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

export const api = {
  getEvents: async (): Promise<ArtEvent[]> => {
    try {
      const client = withClient();
      const { data, error } = await client.from('events').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapEvent);
    } catch (err) {
      console.error('Supabase getEvents error', err);
      return [];
    }
  },

  createEvent: async (event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    try {
      const inserted = await tryInsert('events', buildEventPayloads(event));
      return inserted ? mapEvent(inserted) : null;
    } catch (err) {
      console.error('Supabase createEvent error', err);
      return null;
    }
  },

  updateEvent: async (id: string, event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
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
    } catch (err) {
      console.error('Supabase updateEvent error', err);
      return null;
    }
  },

  getArtworks: async (eventId?: string): Promise<Artwork[]> => {
    try {
      const client = withClient();
      const { data, error } = await client.from('artworks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map(mapArtwork);
      return eventId ? mapped.filter((a) => a.eventId === eventId) : mapped;
    } catch (err) {
      console.error('Supabase getArtworks error', err);
      return [];
    }
  },

  createArtwork: async (artwork: Partial<Artwork>): Promise<Artwork | null> => {
    try {
      const inserted = await tryInsert('artworks', buildArtworkPayloads(artwork));
      return inserted ? mapArtwork(inserted) : null;
    } catch (err) {
      console.error('Supabase createArtwork error', err);
      return null;
    }
  },

  placeBid: async (artworkId: string, userId: string, amount: number): Promise<boolean> => {
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
    } catch (err) {
      console.error('Supabase placeBid error', err);
      return false;
    }
  },

  syncUser: async (user: User): Promise<void> => {
    try {
      const client = withClient();
      const payload = { id: user.id, name: user.name, email: user.email, role: user.role || 'gallery', avatar: user.avatar };
      const { error } = await client.from('profiles').upsert(payload);
      if (error) throw error;
    } catch (err) {
      console.error('Supabase syncUser error', err);
    }
  },

  getProfile: async (id: string): Promise<User | null> => {
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
    } catch (err) {
      console.error('Supabase getProfile error', err);
      return null;
    }
  },

  getWatchlist: async (userId: string): Promise<string[]> => {
    try {
      const client = withClient();
      let { data, error } = await client.from('watchlist').select('event_id').eq('user_id', userId);
      if (error) {
        const fallback = await client.from('watchlist').select('eventId').eq('userId', userId);
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      return (data || []).map((row: any) => row.event_id || row.eventId).filter(Boolean);
    } catch (err) {
      console.error('Supabase getWatchlist error', err);
      return [];
    }
  },

  toggleWatchlist: async (userId: string, eventId: string): Promise<boolean | null> => {
    try {
      const client = withClient();

      let existing = await client.from('watchlist').select('*').eq('user_id', userId).eq('event_id', eventId).maybeSingle();

      if (existing.error) {
        existing = await client.from('watchlist').select('*').eq('userId', userId).eq('eventId', eventId).maybeSingle();
      }

      if (existing.data) {
        let remove = await client.from('watchlist').delete().eq('user_id', userId).eq('event_id', eventId);
        if (remove.error) {
          remove = await client.from('watchlist').delete().eq('userId', userId).eq('eventId', eventId);
        }
        if (remove.error) throw remove.error;
        return false;
      }

      let add = await client.from('watchlist').insert({ user_id: userId, event_id: eventId });
      if (add.error) {
        add = await client.from('watchlist').insert({ userId, eventId });
      }
      if (add.error) throw add.error;
      return true;
    } catch (err) {
      console.error('Supabase toggleWatchlist error', err);
      return null;
    }
  },

  uploadImage: async (file: File): Promise<string | null> => {
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
    } catch (err) {
      console.error('Supabase uploadImage error', err);
      return null;
    }
  },
};
