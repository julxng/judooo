import type { ArtEvent } from '../types/event.types';
import type { RoutePlan, RoutePlanSet, RouteStop } from '../types/route.types';

const EARTH_RADIUS_KM = 6371;
const AVERAGE_TRAVEL_SPEED_KMH = 28;

const toRadians = (value: number): number => (value * Math.PI) / 180;

const getDistanceKm = (from: ArtEvent, to: ArtEvent): number => {
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getRouteDistanceKm = (events: ArtEvent[]): number =>
  events.slice(1).reduce((total, event, index) => total + getDistanceKm(events[index], event), 0);

const buildRoutePlan = (events: ArtEvent[], distanceSavedKm = 0): RoutePlan => {
  let cumulativeDistanceKm = 0;

  const stops: RouteStop[] = events.map((event, index) => {
    const legDistanceKm = index === 0 ? 0 : getDistanceKm(events[index - 1], event);
    cumulativeDistanceKm += legDistanceKm;

    return {
      event,
      order: index + 1,
      legDistanceKm,
      cumulativeDistanceKm,
    };
  });

  const totalDistanceKm = stops[stops.length - 1]?.cumulativeDistanceKm || 0;

  return {
    orderedEventIds: events.map((event) => event.id),
    orderedEvents: events,
    stops,
    summary: {
      totalStops: events.length,
      totalDistanceKm,
      estimatedTravelMinutes: Math.round((totalDistanceKm / AVERAGE_TRAVEL_SPEED_KMH) * 60),
      distanceSavedKm,
      startEvent: events[0] || null,
      endEvent: events[events.length - 1] || null,
    },
  };
};

const orderEventsBySavedIds = (events: ArtEvent[], savedEventIds: string[]): ArtEvent[] => {
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const ordered = savedEventIds
    .map((eventId) => eventsById.get(eventId))
    .filter((event): event is ArtEvent => Boolean(event));

  if (ordered.length === events.length) {
    return ordered;
  }

  const orderedIds = new Set(ordered.map((event) => event.id));
  return [...ordered, ...events.filter((event) => !orderedIds.has(event.id))];
};

const buildNearestNeighborRoute = (events: ArtEvent[], startIndex: number): ArtEvent[] => {
  const remaining = events.filter((_, index) => index !== startIndex);
  const route = [events[startIndex]];

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const distance = getDistanceKm(current, candidate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    route.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }

  return route;
};

const improveWithTwoOpt = (events: ArtEvent[]): ArtEvent[] => {
  if (events.length < 4) {
    return events;
  }

  let improved = true;
  let bestRoute = [...events];
  let bestDistance = getRouteDistanceKm(bestRoute);

  while (improved) {
    improved = false;

    for (let start = 1; start < bestRoute.length - 2; start += 1) {
      for (let end = start + 1; end < bestRoute.length - 1; end += 1) {
        const candidate = [
          ...bestRoute.slice(0, start),
          ...bestRoute.slice(start, end + 1).reverse(),
          ...bestRoute.slice(end + 1),
        ];
        const candidateDistance = getRouteDistanceKm(candidate);

        if (candidateDistance + 0.01 < bestDistance) {
          bestRoute = candidate;
          bestDistance = candidateDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
};

const buildOptimizedRoute = (events: ArtEvent[]): ArtEvent[] => {
  if (events.length < 3) {
    return events;
  }

  return events.reduce<{ route: ArtEvent[]; distanceKm: number } | null>((best, _, startIndex) => {
    const candidate = improveWithTwoOpt(buildNearestNeighborRoute(events, startIndex));
    const candidateDistance = getRouteDistanceKm(candidate);

    if (!best || candidateDistance < best.distanceKm) {
      return { route: candidate, distanceKm: candidateDistance };
    }

    return best;
  }, null)?.route || events;
};

export const buildRoutePlans = (events: ArtEvent[], savedEventIds: string[] = []): RoutePlanSet => {
  const savedOrderedEvents = orderEventsBySavedIds(events, savedEventIds);
  const savedPlan = buildRoutePlan(savedOrderedEvents);
  const optimizedEvents = buildOptimizedRoute(savedOrderedEvents);
  const distanceSavedKm = Math.max(savedPlan.summary.totalDistanceKm - getRouteDistanceKm(optimizedEvents), 0);
  const optimizedPlan = buildRoutePlan(optimizedEvents, distanceSavedKm);

  return {
    optimized: optimizedPlan,
    saved: savedPlan,
  };
};
