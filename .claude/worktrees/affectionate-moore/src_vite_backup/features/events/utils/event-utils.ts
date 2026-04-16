import type { ArtEvent, EventTimeline } from '../types/event.types';
import { todayIso } from '@lib/date';

export const isPastEvent = (event: ArtEvent): boolean => event.endDate < todayIso();

export const matchesEventTimeline = (event: ArtEvent, timeline: EventTimeline): boolean =>
  timeline === 'past' ? isPastEvent(event) : !isPastEvent(event);
