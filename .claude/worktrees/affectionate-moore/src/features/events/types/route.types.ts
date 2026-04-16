import type { ArtEvent } from './event.types';

export type RoutePlannerMode = 'optimized' | 'saved';

export type RouteStop = {
  event: ArtEvent;
  order: number;
  legDistanceKm: number;
  cumulativeDistanceKm: number;
};

export type RouteSummary = {
  totalStops: number;
  totalDistanceKm: number;
  estimatedTravelMinutes: number;
  distanceSavedKm: number;
  startEvent: ArtEvent | null;
  endEvent: ArtEvent | null;
};

export type RoutePlan = {
  orderedEventIds: string[];
  orderedEvents: ArtEvent[];
  stops: RouteStop[];
  summary: RouteSummary;
};

export type RoutePlanSet = {
  optimized: RoutePlan;
  saved: RoutePlan;
};
