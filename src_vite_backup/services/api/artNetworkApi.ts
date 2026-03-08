import type { User } from '@features/auth/types/auth.types';
import type { ArtEvent } from '@features/events/types/event.types';
import type { Artwork } from '@features/marketplace/types/artwork.types';
import {
  applyLocalBid,
  enqueuePendingWrite,
  ensureArtworkDefaults,
  ensureEventDefaults,
  getLocalWatchlist,
  patchLocalEvent,
  readLocalDb,
  replaceLocalWatchlistForUser,
  setLocalWatchlistState,
  updateLocalDb,
  upsertLocalArtwork,
  upsertLocalEvent,
  upsertLocalProfile,
} from './localDb';
import {
  createArtworkRemote,
  createEventRemote,
  getArtworksRemote,
  getEventsRemote,
  getProfileRemote,
  getWatchlistRemote,
  placeBidRemote,
  setWatchlistRemote,
  shouldUseRemote,
  syncUserRemote,
  updateEventRemote,
  uploadImageRemote,
} from './remoteApi';
import { mergeById, withTimeout } from './shared';
import type { PendingWrite } from './types';

const fileToDataUrl = async (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

const flushPendingWrites = async (): Promise<{ synced: number; remaining: number }> => {
  const queue = readLocalDb().pendingWrites;
  if (!shouldUseRemote() || queue.length === 0) {
    return { synced: 0, remaining: queue.length };
  }

  const remaining: PendingWrite[] = [];
  let synced = 0;

  for (const write of queue) {
    let ok = false;

    switch (write.kind) {
      case 'createEvent': {
        const created = await withTimeout(createEventRemote(write.payload), 7000);
        if (created) {
          upsertLocalEvent(created);
          ok = true;
        }
        break;
      }
      case 'updateEvent': {
        const updated = await withTimeout(updateEventRemote(write.payload.id, write.payload.data), 7000);
        if (updated) {
          upsertLocalEvent(updated);
          ok = true;
        }
        break;
      }
      case 'createArtwork': {
        const created = await withTimeout(createArtworkRemote(write.payload), 7000);
        if (created) {
          upsertLocalArtwork(created);
          ok = true;
        }
        break;
      }
      case 'placeBid': {
        const placed = await withTimeout(
          placeBidRemote(write.payload.artworkId, write.payload.userId, write.payload.amount),
          7000,
        );
        if (placed) ok = true;
        break;
      }
      case 'syncUser': {
        const syncedUser = await withTimeout(syncUserRemote(write.payload), 7000);
        if (syncedUser) ok = true;
        break;
      }
      case 'setWatchlist': {
        const syncedWatchlist = await withTimeout(
          setWatchlistRemote(write.payload.userId, write.payload.eventId, write.payload.saved),
          7000,
        );
        if (syncedWatchlist) ok = true;
        break;
      }
    }

    if (ok) {
      synced += 1;
    } else {
      remaining.push(write);
    }
  }

  updateLocalDb((state) => ({
    ...state,
    pendingWrites: remaining,
  }));

  return {
    synced,
    remaining: remaining.length,
  };
};

export const api = {
  getPendingWritesCount: (): number => readLocalDb().pendingWrites.length,

  syncPendingWrites: async (): Promise<{ synced: number; remaining: number }> => flushPendingWrites(),

  getEvents: async (): Promise<ArtEvent[]> => {
    const localEvents = readLocalDb().events;

    if (shouldUseRemote()) {
      const remoteEvents = await withTimeout(getEventsRemote(), 8000);
      if (remoteEvents) {
        const merged = mergeById(remoteEvents, localEvents);
        updateLocalDb((state) => ({ ...state, events: merged }));
        void flushPendingWrites();
        return merged;
      }
    }

    return localEvents;
  },

  createEvent: async (event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    if (shouldUseRemote()) {
      const inserted = await withTimeout(createEventRemote(event), 7000);
      if (inserted) {
        upsertLocalEvent(inserted);
        void flushPendingWrites();
        return inserted;
      }
    }

    const localEvent = upsertLocalEvent(ensureEventDefaults(event));
    enqueuePendingWrite({
      kind: 'createEvent',
      queuedAt: new Date().toISOString(),
      payload: localEvent,
    });
    return localEvent;
  },

  updateEvent: async (id: string, event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    if (shouldUseRemote()) {
      const updatedRemote = await withTimeout(updateEventRemote(id, event), 7000);
      if (updatedRemote) {
        upsertLocalEvent(updatedRemote);
        void flushPendingWrites();
        return updatedRemote;
      }
    }

    const updatedLocal = patchLocalEvent(id, event);
    if (updatedLocal) {
      enqueuePendingWrite({
        kind: 'updateEvent',
        queuedAt: new Date().toISOString(),
        payload: { id, data: event },
      });
    }
    return updatedLocal;
  },

  getArtworks: async (eventId?: string): Promise<Artwork[]> => {
    const localArtworks = readLocalDb().artworks;

    if (shouldUseRemote()) {
      const remoteArtworks = await withTimeout(getArtworksRemote(), 8000);
      if (remoteArtworks) {
        const merged = mergeById(remoteArtworks, localArtworks);
        updateLocalDb((state) => ({ ...state, artworks: merged }));
        void flushPendingWrites();
        return eventId ? merged.filter((artwork) => artwork.eventId === eventId) : merged;
      }
    }

    return eventId ? localArtworks.filter((artwork) => artwork.eventId === eventId) : localArtworks;
  },

  createArtwork: async (artwork: Partial<Artwork>): Promise<Artwork | null> => {
    if (shouldUseRemote()) {
      const inserted = await withTimeout(createArtworkRemote(artwork), 7000);
      if (inserted) {
        upsertLocalArtwork(inserted);
        void flushPendingWrites();
        return inserted;
      }
    }

    const localArtwork = upsertLocalArtwork(ensureArtworkDefaults(artwork));
    enqueuePendingWrite({
      kind: 'createArtwork',
      queuedAt: new Date().toISOString(),
      payload: localArtwork,
    });
    return localArtwork;
  },

  placeBid: async (artworkId: string, userId: string, amount: number): Promise<boolean> => {
    if (shouldUseRemote()) {
      const success = await withTimeout(placeBidRemote(artworkId, userId, amount), 7000);
      if (success) {
        applyLocalBid(artworkId, userId, amount);
        void flushPendingWrites();
        return true;
      }
    }

    const applied = applyLocalBid(artworkId, userId, amount);
    if (applied) {
      enqueuePendingWrite({
        kind: 'placeBid',
        queuedAt: new Date().toISOString(),
        payload: { artworkId, userId, amount },
      });
      return true;
    }

    return false;
  },

  syncUser: async (user: User): Promise<void> => {
    upsertLocalProfile(user);

    if (shouldUseRemote()) {
      const success = await withTimeout(syncUserRemote(user), 7000);
      if (success) {
        void flushPendingWrites();
        return;
      }
    }

    enqueuePendingWrite({
      kind: 'syncUser',
      queuedAt: new Date().toISOString(),
      payload: user,
    });
  },

  getProfile: async (id: string): Promise<User | null> => {
    if (shouldUseRemote()) {
      const profile = await withTimeout(getProfileRemote(id), 7000);
      if (profile) {
        upsertLocalProfile(profile);
        void flushPendingWrites();
        return profile;
      }
    }

    return readLocalDb().profiles.find((profile) => profile.id === id) || null;
  },

  getWatchlist: async (userId: string): Promise<string[]> => {
    if (shouldUseRemote()) {
      const watchlist = await withTimeout(getWatchlistRemote(userId), 7000);
      if (watchlist !== null) {
        replaceLocalWatchlistForUser(userId, watchlist);
        void flushPendingWrites();
        return watchlist;
      }
    }

    return getLocalWatchlist(userId);
  },

  toggleWatchlist: async (userId: string, eventId: string): Promise<boolean | null> => {
    const current = getLocalWatchlist(userId);
    const shouldBeSaved = !current.includes(eventId);
    setLocalWatchlistState(userId, eventId, shouldBeSaved);

    if (shouldUseRemote()) {
      const synced = await withTimeout(setWatchlistRemote(userId, eventId, shouldBeSaved), 7000);
      if (synced) {
        void flushPendingWrites();
        return shouldBeSaved;
      }
    }

    enqueuePendingWrite({
      kind: 'setWatchlist',
      queuedAt: new Date().toISOString(),
      payload: { userId, eventId, saved: shouldBeSaved },
    });

    return shouldBeSaved;
  },

  uploadImage: async (file: File): Promise<string | null> => {
    if (shouldUseRemote()) {
      const remoteUrl = await withTimeout(uploadImageRemote(file), 15000);
      if (remoteUrl) return remoteUrl;
    }

    return fileToDataUrl(file);
  },
};
