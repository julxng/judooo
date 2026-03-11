import type { ArtEvent, EventTimeline } from '../types/event.types';
import { todayIso } from '@/lib/date';
import type { Locale } from '@/lib/i18n/translations';
import { getLocalizedValue } from '@/lib/i18n/content';

export const isPastEvent = (event: ArtEvent): boolean => event.endDate < todayIso();

export const isCurrentEvent = (event: ArtEvent): boolean => !isPastEvent(event);

export const matchesEventTimeline = (event: ArtEvent, timeline: EventTimeline): boolean =>
  timeline === 'all' ? true : timeline === 'past' ? isPastEvent(event) : isCurrentEvent(event);

export const isApprovedEvent = (event: ArtEvent): boolean =>
  !event.moderation_status || event.moderation_status === 'approved';

export const getEventTitle = (event: ArtEvent, language: Locale = 'en'): string =>
  getLocalizedValue(language, event.name_vie, event.name_en, event.title);

export const getEventDescription = (event: ArtEvent, language: Locale = 'en'): string =>
  getLocalizedValue(language, event.description_vie, event.description_en, event.description);

export const getEventCity = (event: ArtEvent, language: Locale = 'en'): string =>
  getLocalizedValue(language, event.city_vie, event.city_en, event.city || event.location);

export const getEventDistrict = (event: ArtEvent, language: Locale = 'en'): string =>
  getLocalizedValue(language, event.district_vie, event.district_en, event.district);

export const getEventAddress = (event: ArtEvent, language: Locale = 'en'): string =>
  getLocalizedValue(language, event.address_vie, event.address_en, event.address || event.location);

export const getEventLocation = (event: ArtEvent, language: Locale = 'en'): string =>
  getEventAddress(event, language) || getEventCity(event, language) || event.location;

export const getEventChips = (event: ArtEvent, language: Locale = 'en'): string[] =>
  [
    getLocalizedValue(language, event.art_medium_vie, event.art_medium_en, event.art_medium),
    getLocalizedValue(language, event.event_type_vie, event.event_type_en, event.event_type),
    getLocalizedValue(language, event.place_type_vie, event.place_type_en, event.place_type),
    ...(event.tags || []),
  ].filter(
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
