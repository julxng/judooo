import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import type { ModerationTab } from '@/features/admin/types/admin.types';

export type EventGroup = {
  gallery: string;
  sourceUrl: string | undefined;
  events: ArtEvent[];
};

export type ArtworkGroup = {
  artist: string;
  sourceUrl: string | undefined;
  artworks: Artwork[];
};

export const groupEventsByGallery = (events: ArtEvent[]): EventGroup[] => {
  const map = new Map<string, EventGroup>();
  for (const event of events) {
    const key = event.organizer || 'Unknown Gallery';
    const existing = map.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      map.set(key, { gallery: key, sourceUrl: event.sourceUrl, events: [event] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.events.length - a.events.length);
};

export const groupArtworksByArtist = (artworks: Artwork[]): ArtworkGroup[] => {
  const map = new Map<string, ArtworkGroup>();
  for (const artwork of artworks) {
    const key = artwork.artist || 'Unknown Artist';
    const existing = map.get(key);
    if (existing) {
      existing.artworks.push(artwork);
    } else {
      map.set(key, { artist: key, sourceUrl: artwork.sourceUrl, artworks: [artwork] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.artworks.length - a.artworks.length);
};

export const filterByModerationStatus = (status: ModerationTab) =>
  (item: { moderation_status?: string }) =>
    status === 'pending'
      ? !item.moderation_status || item.moderation_status === 'pending'
      : item.moderation_status === status;
