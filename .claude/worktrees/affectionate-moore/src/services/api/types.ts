import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';

export type DataMode = 'auto' | 'local' | 'supabase';

export type PendingWrite =
  | {
      kind: 'createEvent';
      queuedAt: string;
      payload: ArtEvent;
    }
  | {
      kind: 'updateEvent';
      queuedAt: string;
      payload: { id: string; data: Partial<ArtEvent> };
    }
  | {
      kind: 'createArtwork';
      queuedAt: string;
      payload: Artwork;
    }
  | {
      kind: 'updateArtwork';
      queuedAt: string;
      payload: { id: string; data: Partial<Artwork> };
    }
  | {
      kind: 'placeBid';
      queuedAt: string;
      payload: { artworkId: string; userId: string; amount: number };
    }
  | {
      kind: 'syncUser';
      queuedAt: string;
      payload: User;
    }
  | {
      kind: 'setWatchlist';
      queuedAt: string;
      payload: { userId: string; eventId: string; saved: boolean };
    };

export interface LocalWatchlistItem {
  userId: string;
  eventId: string;
}

export interface LocalBid {
  artworkId: string;
  bidderId: string;
  bidAmount: number;
  createdAt: string;
}

export interface LocalDbState {
  events: ArtEvent[];
  artworks: Artwork[];
  profiles: User[];
  watchlist: LocalWatchlistItem[];
  bids: LocalBid[];
  pendingWrites: PendingWrite[];
}
