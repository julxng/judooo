import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateRange } from '@/lib/date';
import { Card, Tabs } from '@/components/ui';
import type { ArtEvent, RoutePlannerMode } from '../types';
import { buildRoutePlans } from '../utils/route-optimizer';
import EventMap from './EventMap';
import { EventsGrid } from './EventsGrid';

interface SavedRouteViewProps {
  events: ArtEvent[];
  savedEventIds: string[];
  onOpenEvent: (id: string) => void;
  onToggleSave: (id: string) => void;
}

const formatDistance = (distanceKm: number): string => `${distanceKm.toFixed(distanceKm >= 100 ? 0 : 1)} km`;

const formatTravelTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
};

export const SavedRouteView = ({
  events,
  savedEventIds,
  onOpenEvent,
  onToggleSave,
}: SavedRouteViewProps) => {
  const [routeMode, setRouteMode] = useState<RoutePlannerMode>('optimized');
  const routePlans = useMemo(() => buildRoutePlans(events, savedEventIds), [events, savedEventIds]);
  const activePlan = routeMode === 'optimized' ? routePlans.optimized : routePlans.saved;

  if (events.length === 0) {
    return (
      <EmptyState
        title="No saved stops yet"
        description="Save exhibitions from the grid or map to build a route across your shortlist."
      />
    );
  }

  const { summary } = activePlan;
  const subtitle =
    routeMode === 'optimized'
      ? summary.totalStops > 1
        ? 'This sequence reduces backtracking across your saved exhibitions.'
        : 'Save at least two exhibitions to compare route options.'
      : 'This preserves the same order you used when saving stops.';

  return (
    <div className="content-grid">
      <Card className="route-planner" tone="accent">
        <div className="route-planner__header">
          <div>
            <p className="eyebrow">Route Planner</p>
            <h2 className="route-planner__title">
              {routeMode === 'optimized' ? 'Best route across saved exhibitions' : 'Saved route sequence'}
            </h2>
            <p className="muted-text">{subtitle}</p>
          </div>
          <Tabs
            value={routeMode}
            onChange={setRouteMode}
            options={[
              { id: 'optimized', label: 'Best route' },
              { id: 'saved', label: 'Saved order' },
            ]}
          />
        </div>

        <div className="route-planner__stats">
          <div className="route-planner__stat">
            <span>Stops</span>
            <strong>{summary.totalStops}</strong>
          </div>
          <div className="route-planner__stat">
            <span>Distance</span>
            <strong>{formatDistance(summary.totalDistanceKm)}</strong>
          </div>
          <div className="route-planner__stat">
            <span>Travel</span>
            <strong>{formatTravelTime(summary.estimatedTravelMinutes)}</strong>
          </div>
          <div className="route-planner__stat">
            <span>{routeMode === 'optimized' ? 'Saved' : 'Finish'}</span>
            <strong>
              {routeMode === 'optimized'
                ? formatDistance(routePlans.optimized.summary.distanceSavedKm)
                : summary.endEvent?.city || summary.endEvent?.location || 'TBD'}
            </strong>
          </div>
        </div>

        <ol className="route-planner__stops">
          {activePlan.stops.map((stop) => (
            <li key={stop.event.id}>
              <button
                type="button"
                className="route-stop"
                onClick={() => onOpenEvent(stop.event.id)}
              >
                <span className="route-stop__index">{stop.order}</span>
                <span className="route-stop__body">
                  <strong>{stop.event.name_vie || stop.event.name_en || stop.event.title}</strong>
                  <span>
                    {stop.event.city || stop.event.location} •{' '}
                    {formatDateRange(stop.event.startDate, stop.event.endDate)}
                  </span>
                </span>
                <span className="route-stop__meta">
                  {stop.order === 1 ? 'Start' : `+${formatDistance(stop.legDistanceKm)}`}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <EventMap
        events={activePlan.orderedEvents}
        routeIds={activePlan.orderedEventIds}
        routeLabel={routeMode === 'optimized' ? 'Optimized Art Trail' : 'Saved Art Trail'}
        routeDescription={`Showing ${summary.totalStops} saved stops across ${formatDistance(summary.totalDistanceKm)}.`}
      />

      <EventsGrid
        events={activePlan.orderedEvents}
        savedEventIds={savedEventIds}
        onOpenEvent={onOpenEvent}
        onToggleSave={onToggleSave}
        emptyMessage="Save exhibitions to build your visit route."
      />
    </div>
  );
};
