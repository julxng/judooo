import type { ArtEvent, EventTimeline } from '../types/event.types';
import { todayIso } from '@/lib/date';

export const isPastEvent = (event: ArtEvent): boolean => event.endDate < todayIso();

export const isCurrentEvent = (event: ArtEvent): boolean => !isPastEvent(event);

export const matchesEventTimeline = (event: ArtEvent, timeline: EventTimeline): boolean =>
  timeline === 'all' ? true : timeline === 'past' ? isPastEvent(event) : isCurrentEvent(event);

export const isApprovedEvent = (event: ArtEvent): boolean =>
  !event.moderation_status || event.moderation_status === 'approved';

export const getEventTitle = (event: ArtEvent): string =>
  event.name_en || event.name_vie || event.title;

export const getEventDescription = (event: ArtEvent): string =>
  event.description_en || event.description_vie || event.description;

export const getEventChips = (event: ArtEvent): string[] =>
  [event.art_medium, event.event_type, event.place_type, ...(event.tags || [])].filter(
    (value): value is string => Boolean(value),
  );

export const sortEventsByStartDate = (events: ArtEvent[]): ArtEvent[] =>
  [...events].sort((left, right) => right.startDate.localeCompare(left.startDate));

export const sortEventsByEndDate = (events: ArtEvent[]): ArtEvent[] =>
  [...events].sort((left, right) => left.endDate.localeCompare(right.endDate));

export const sortEventsBySavedCount = (events: ArtEvent[]): ArtEvent[] =>
  [...events].sort((left, right) => (right.saved_count || 0) - (left.saved_count || 0));

export const sortEventsByImportedAt = (events: ArtEvent[]): ArtEvent[] =>
  [...events].sort((left, right) =>
    String(right.importedAt || '').localeCompare(String(left.importedAt || '')),
  );

export const buildGoogleMapsUrl = (event: ArtEvent): string => {
  if (event.google_map_link) return event.google_map_link;
  if (event.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;
};
