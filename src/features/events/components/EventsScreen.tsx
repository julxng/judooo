import { lazy, Suspense } from 'react';
import { AsyncStatusBanner } from '@/components/shared/AsyncStatusBanner';
import { EventFilters } from './EventFilters';
import { EventsGrid } from './EventsGrid';
import { SavedRouteView } from './SavedRouteView';
import type { ArtEvent, EventCategory, EventTimeline } from '../types/event.types';

const LazyEventMap = lazy(() => import('./EventMap'));

interface EventsScreenProps {
  events: ArtEvent[];
  savedEvents: ArtEvent[];
  savedEventIds: string[];
  searchQuery: string;
  category: EventCategory;
  timeline: EventTimeline;
  viewMode: 'grid' | 'map' | 'route';
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: EventCategory) => void;
  onTimelineChange: (value: EventTimeline) => void;
  onViewModeChange: (value: 'grid' | 'map' | 'route') => void;
  onOpenEvent: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export const EventsScreen = ({
  events,
  savedEvents,
  savedEventIds,
  searchQuery,
  category,
  timeline,
  viewMode,
  onSearchChange,
  onCategoryChange,
  onTimelineChange,
  onViewModeChange,
  onOpenEvent,
  onToggleSave,
}: EventsScreenProps) => (
  <div className="content-grid">
    <EventFilters
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      category={category}
      onCategoryChange={onCategoryChange}
      timeline={timeline}
      onTimelineChange={onTimelineChange}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />

    {viewMode === 'grid' ? (
      <EventsGrid
        events={events}
        savedEventIds={savedEventIds}
        onOpenEvent={onOpenEvent}
        onToggleSave={onToggleSave}
        emptyMessage="Try broadening the current city, title, or category filter."
      />
    ) : viewMode === 'map' ? (
      <Suspense fallback={<AsyncStatusBanner message="Loading map surface..." />}>
        <LazyEventMap events={events} routeIds={savedEventIds} />
      </Suspense>
    ) : (
      <SavedRouteView
        events={savedEvents}
        savedEventIds={savedEventIds}
        onOpenEvent={onOpenEvent}
        onToggleSave={onToggleSave}
      />
    )}
  </div>
);
