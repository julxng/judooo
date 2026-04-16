import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import {
  createArtworkRemote,
  createEventRemote,
  deleteArtworkRemote,
  deleteEventRemote,
  getArtworksRemote,
  getEventsRemote,
  getProfileRemote,
  getProfilesRemote,
  getWatchlistRemote,
  placeBidRemote,
  setWatchlistRemote,
  shouldUseRemote,
  syncUserRemote,
  updateEventRemote,
  updateArtworkRemote,
  uploadImageRemote,
} from './remoteApi';
import { enrichArtworkTranslations, enrichEventTranslations } from '@/lib/i18n/content';

const fileToDataUrl = async (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

export const api = {
  getEvents: async (): Promise<ArtEvent[]> => {
    const events = await getEventsRemote();
    return events || [];
  },

  createEvent: async (event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    const localized = await enrichEventTranslations(event);
    return createEventRemote(localized);
  },

  updateEvent: async (id: string, event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    const localized = await enrichEventTranslations(event);
    return updateEventRemote(id, localized);
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    return deleteEventRemote(id);
  },

  getArtworks: async (eventId?: string): Promise<Artwork[]> => {
    const artworks = await getArtworksRemote(eventId);
    return artworks || [];
  },

  createArtwork: async (artwork: Partial<Artwork>): Promise<Artwork | null> => {
    const localized = await enrichArtworkTranslations(artwork);
    return createArtworkRemote(localized);
  },

  updateArtwork: async (id: string, artwork: Partial<Artwork>): Promise<Artwork | null> => {
    const localized = await enrichArtworkTranslations(artwork);
    return updateArtworkRemote(id, localized);
  },

  deleteArtwork: async (id: string): Promise<boolean> => {
    return deleteArtworkRemote(id);
  },

  placeBid: async (artworkId: string, userId: string, amount: number): Promise<boolean> => {
    return placeBidRemote(artworkId, userId, amount);
  },

  syncUser: async (user: User): Promise<boolean> => {
    return syncUserRemote(user);
  },

  getProfile: async (id: string): Promise<User | null> => {
    return getProfileRemote(id);
  },

  getProfiles: async (): Promise<User[]> => {
    const profiles = await getProfilesRemote();
    return profiles || [];
  },

  getWatchlist: async (userId: string): Promise<string[]> => {
    const watchlist = await getWatchlistRemote(userId);
    return watchlist || [];
  },

  toggleWatchlist: async (userId: string, eventId: string): Promise<boolean | null> => {
    const currentWatchlist = await getWatchlistRemote(userId);
    if (currentWatchlist === null) return null;
    const shouldBeSaved = !currentWatchlist.includes(eventId);
    const success = await setWatchlistRemote(userId, eventId, shouldBeSaved);
    return success ? shouldBeSaved : null;
  },

  uploadImage: async (file: File): Promise<string | null> => {
    if (shouldUseRemote()) {
      const remoteUrl = await uploadImageRemote(file);
      if (remoteUrl) return remoteUrl;
    }
    return fileToDataUrl(file);
  },
};
