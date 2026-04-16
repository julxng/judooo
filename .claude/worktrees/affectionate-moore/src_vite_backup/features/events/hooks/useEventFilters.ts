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
      const matchesSearch =
        normalizedQuery.length === 0 ||
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.organizer.toLowerCase().includes(normalizedQuery) ||
        String(event.city || event.location).toLowerCase().includes(normalizedQuery);

      const matchesCategory = category === 'all' || event.category === category;

      return matchesSearch && matchesCategory && matchesEventTimeline(event, timeline);
    });
  }, [category, events, searchQuery, timeline]);
