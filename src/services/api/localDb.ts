import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import { initialEvents } from '@/features/events/services/eventFixtures';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { initialArtworks } from '@/features/marketplace/services/artworkFixtures';
import { DATA_MODE, HAS_REMOTE_ENV, hasBrowserStorage, LOCAL_DB_KEY, mergeById, toId, toIsoDate } from './shared';
import type { LocalDbState, PendingWrite } from './types';

const shouldSeedFixtures = DATA_MODE === 'local' || !HAS_REMOTE_ENV;
const fixtureEventIds = new Set(initialEvents.map((event) => event.id));
const fixtureArtworkIds = new Set(initialArtworks.map((artwork) => artwork.id));

const createDefaultLocalState = (): LocalDbState => ({
  events: shouldSeedFixtures ? initialEvents : [],
  artworks: shouldSeedFixtures ? initialArtworks : [],
  profiles: [],
  watchlist: [],
  bids: [],
  pendingWrites: [],
});

let inMemoryDb: LocalDbState = createDefaultLocalState();

const normalizeLocalState = (raw: unknown): LocalDbState => {
  const fallback = createDefaultLocalState();
  const state = raw as Partial<LocalDbState> | undefined;

  return {
    events: Array.isArray(state?.events) ? state.events : fallback.events,
    artworks: Array.isArray(state?.artworks) ? state.artworks : fallback.artworks,
    profiles: Array.isArray(state?.profiles) ? state.profiles : fallback.profiles,
    watchlist: Array.isArray(state?.watchlist) ? state.watchlist : fallback.watchlist,
    bids: Array.isArray(state?.bids) ? state.bids : fallback.bids,
    pendingWrites: Array.isArray(state?.pendingWrites) ? state.pendingWrites : fallback.pendingWrites,
  };
};

export const readLocalDb = (): LocalDbState => {
  if (!hasBrowserStorage()) return inMemoryDb;

  try {
    const raw = window.localStorage.getItem(LOCAL_DB_KEY);

    if (!raw) {
      const fresh = createDefaultLocalState();
      inMemoryDb = fresh;
      window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(fresh));
      return fresh;
    }

    const parsed = normalizeLocalState(JSON.parse(raw));
    inMemoryDb = parsed;
    return parsed;
  } catch (error) {
    console.error('Failed to read local db', error);
    return inMemoryDb;
  }
};

export const writeLocalDb = (next: LocalDbState): void => {
  inMemoryDb = next;
  if (!hasBrowserStorage()) return;

  try {
    window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to write local db', error);
  }
};

export const updateLocalDb = (updater: (state: LocalDbState) => LocalDbState): LocalDbState => {
  const current = readLocalDb();
  const next = updater(current);
  writeLocalDb(next);
  return next;
};

export const hydrateLocalCatalogSnapshot = ({
  events,
  artworks,
}: {
  events?: ArtEvent[];
  artworks?: Artwork[];
}): LocalDbState =>
  updateLocalDb((state) => ({
    ...state,
    events:
      events && events.length > 0
        ? mergeById(
            events,
            state.events.filter((event) => !fixtureEventIds.has(event.id)),
          )
        : state.events,
    artworks:
      artworks && artworks.length > 0
        ? mergeById(
            artworks,
            state.artworks.filter((artwork) => !fixtureArtworkIds.has(artwork.id)),
          )
        : state.artworks,
  }));

export const ensureEventDefaults = (event: Partial<ArtEvent>): ArtEvent => ({
  id: String(event.id || toId('local-e')),
  title: String(event.title || 'Untitled Event'),
  name_vie: event.name_vie,
  name_en: event.name_en,
  organizer: String(event.organizer || 'Gallery'),
  description_vie: event.description_vie,
  description_en: event.description_en,
  startDate: toIsoDate(event.startDate),
  endDate: toIsoDate(event.endDate),
  location: String(event.location || 'Vietnam'),
  city: event.city,
  district: event.district,
  lat: Number(event.lat ?? 10.7769),
  lng: Number(event.lng ?? 106.7009),
  imageUrl: String(
    event.imageUrl || 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200',
  ),
  media: Array.isArray(event.media) ? event.media : [],
  description: String(event.description || ''),
  category: event.category || 'exhibition',
  art_medium: event.art_medium,
  event_type: event.event_type,
  place_type: event.place_type,
  is_virtual: event.is_virtual,
  is_free: event.is_free,
  tags: event.tags,
  price: event.price,
  registration_required: event.registration_required,
  registration_link: event.registration_link,
  address: event.address,
  google_map_link: event.google_map_link,
  saved_count: event.saved_count,
  createdBy: event.createdBy,
  sourceUrl: event.sourceUrl,
  sourceItemUrl: event.sourceItemUrl,
  importedAt: event.importedAt,
  socialvideo_url: event.socialvideo_url,
  moderation_status: event.moderation_status,
  featured: event.featured,
  submitter_name: event.submitter_name,
  submitter_email: event.submitter_email,
  submitter_organization: event.submitter_organization,
});

export const ensureArtworkDefaults = (artwork: Partial<Artwork>): Artwork => ({
  id: String(artwork.id || toId('local-a')),
  title: String(artwork.title || 'Untitled Artwork'),
  artist: String(artwork.artist || 'Unknown Artist'),
  price: Number(artwork.price || 0),
  currentBid:
    artwork.currentBid != null
      ? Number(artwork.currentBid)
      : artwork.saleType === 'auction'
        ? Number(artwork.price || 0)
        : undefined,
  bidCount:
    artwork.bidCount != null
      ? Number(artwork.bidCount)
      : artwork.saleType === 'auction'
        ? 0
        : undefined,
  saleType: artwork.saleType || 'fixed',
  imageUrl: String(
    artwork.imageUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
  ),
  medium: String(artwork.medium || 'Mixed Media'),
  dimensions: String(artwork.dimensions || 'N/A'),
  description: String(artwork.description || ''),
  available: artwork.available != null ? Boolean(artwork.available) : true,
  endTime: artwork.endTime,
  createdBy: artwork.createdBy,
  eventId: artwork.eventId,
  yearCreated: artwork.yearCreated != null ? Number(artwork.yearCreated) : undefined,
  style: artwork.style,
  city: artwork.city,
  country: artwork.country || 'Vietnam',
  provenance: artwork.provenance,
  authenticity: artwork.authenticity,
  conditionReport: artwork.conditionReport,
  story: artwork.story,
  sourceUrl: artwork.sourceUrl,
  sourceItemUrl: artwork.sourceItemUrl,
  importedAt: artwork.importedAt,
  imageGallery: artwork.imageGallery,
  moderation_status: artwork.moderation_status,
});

export const upsertLocalEvent = (event: ArtEvent): ArtEvent => {
  updateLocalDb((state) => ({
    ...state,
    events: [event, ...state.events.filter((item) => item.id !== event.id)],
  }));
  return event;
};

export const patchLocalEvent = (id: string, data: Partial<ArtEvent>): ArtEvent | null => {
  const state = readLocalDb();
  const index = state.events.findIndex((event) => event.id === id);
  if (index === -1) return null;

  const updated = ensureEventDefaults({ ...state.events[index], ...data, id: state.events[index].id });
  const nextEvents = [...state.events];
  nextEvents[index] = updated;
  writeLocalDb({ ...state, events: nextEvents });
  return updated;
};

export const upsertLocalArtwork = (artwork: Artwork): Artwork => {
  updateLocalDb((state) => ({
    ...state,
    artworks: [artwork, ...state.artworks.filter((item) => item.id !== artwork.id)],
  }));
  return artwork;
};

export const patchLocalArtwork = (id: string, data: Partial<Artwork>): Artwork | null => {
  const state = readLocalDb();
  const index = state.artworks.findIndex((artwork) => artwork.id === id);
  if (index === -1) return null;

  const updated = ensureArtworkDefaults({ ...state.artworks[index], ...data, id: state.artworks[index].id });
  const nextArtworks = [...state.artworks];
  nextArtworks[index] = updated;
  writeLocalDb({ ...state, artworks: nextArtworks });
  return updated;
};

export const applyLocalBid = (artworkId: string, bidderId: string, amount: number): boolean => {
  const state = readLocalDb();
  const index = state.artworks.findIndex((artwork) => artwork.id === artworkId);
  if (index === -1) return false;

  const target = state.artworks[index];
  const updated: Artwork = {
    ...target,
    currentBid: amount,
    bidCount: (target.bidCount || 0) + 1,
    saleType: target.saleType || 'auction',
  };

  const nextArtworks = [...state.artworks];
  nextArtworks[index] = updated;

  writeLocalDb({
    ...state,
    artworks: nextArtworks,
    bids: [
      {
        artworkId,
        bidderId,
        bidAmount: amount,
        createdAt: new Date().toISOString(),
      },
      ...state.bids,
    ],
  });

  return true;
};

export const upsertLocalProfile = (user: User): User => {
  const existing = readLocalDb().profiles.find((profile) => profile.id === user.id);
  const nextProfile = existing ? { ...existing, ...user } : user;

  updateLocalDb((state) => ({
    ...state,
    profiles: [nextProfile, ...state.profiles.filter((profile) => profile.id !== user.id)],
  }));
  return nextProfile;
};

export const replaceLocalWatchlistForUser = (userId: string, eventIds: string[]): void => {
  const uniqueIds = Array.from(new Set(eventIds));
  updateLocalDb((state) => ({
    ...state,
    watchlist: [
      ...state.watchlist.filter((item) => item.userId !== userId),
      ...uniqueIds.map((eventId) => ({ userId, eventId })),
    ],
  }));
};

export const setLocalWatchlistState = (userId: string, eventId: string, saved: boolean): void => {
  updateLocalDb((state) => {
    const exists = state.watchlist.some((item) => item.userId === userId && item.eventId === eventId);
    if ((saved && exists) || (!saved && !exists)) return state;

    return {
      ...state,
      watchlist: saved
        ? [{ userId, eventId }, ...state.watchlist]
        : state.watchlist.filter((item) => !(item.userId === userId && item.eventId === eventId)),
    };
  });
};

export const getLocalWatchlist = (userId: string): string[] =>
  readLocalDb()
    .watchlist.filter((item) => item.userId === userId)
    .map((item) => item.eventId);

export const enqueuePendingWrite = (write: PendingWrite): void => {
  updateLocalDb((state) => {
    let pending = state.pendingWrites;

    if (write.kind === 'setWatchlist') {
      pending = pending.filter(
        (item) =>
          !(
            item.kind === 'setWatchlist' &&
            item.payload.userId === write.payload.userId &&
            item.payload.eventId === write.payload.eventId
          ),
      );
    }

    if (write.kind === 'updateEvent') {
      pending = pending.filter(
        (item) => !(item.kind === 'updateEvent' && item.payload.id === write.payload.id),
      );
    }

    if (write.kind === 'syncUser') {
      pending = pending.filter(
        (item) => !(item.kind === 'syncUser' && item.payload.id === write.payload.id),
      );
    }

    if (write.kind === 'updateArtwork') {
      pending = pending.filter(
        (item) => !(item.kind === 'updateArtwork' && item.payload.id === write.payload.id),
      );
    }

    return {
      ...state,
      pendingWrites: [...pending, write],
    };
  });
};
