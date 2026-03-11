import { useMemo } from 'react';
import type { ArtEvent, EventCategory, EventTimeline } from '../types/event.types';
import { matchesEventTimeline } from '../utils/event-utils';

export const useEventFilters = (
  events: ArtEvent[],
  searchQuery: string,
  category: EventCategory,
  timeline: EventTimeline,
) =>
  useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const haystack = [
        event.title,
        event.name_en,
        event.name_vie,
        event.organizer,
        event.description,
        event.description_en,
        event.description_vie,
        event.art_medium,
        event.art_medium_en,
        event.art_medium_vie,
        event.event_type,
        event.event_type_en,
        event.event_type_vie,
        event.place_type,
        event.place_type_en,
        event.place_type_vie,
        event.city,
        event.city_en,
        event.city_vie,
        event.district,
        event.district_en,
        event.district_vie,
        event.address,
        event.address_en,
        event.address_vie,
        event.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      const matchesCategory = category === 'all' || event.category === category;

      return matchesSearch && matchesCategory && matchesEventTimeline(event, timeline);
    });
  }, [category, events, searchQuery, timeline]);
