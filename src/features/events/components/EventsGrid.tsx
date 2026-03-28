import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ArtEvent } from '../types/event.types';
import { EventCard } from './EventCard';

interface EventsGridProps {
  events: ArtEvent[];
  savedEventIds: string[];
  onOpenEvent: (slug: string) => void;
  onToggleSave: (id: string) => void;
  emptyMessage: string;
}

export const EventsGrid = ({
  events,
  savedEventIds,
  onOpenEvent,
  onToggleSave,
  emptyMessage,
}: EventsGridProps) => {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No events found"
        description={emptyMessage}
      />
    );
  }

  return (
    <Grid min={320}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isSaved={savedEventIds.includes(event.id)}
          onOpen={() => onOpenEvent(event.slug)}
          onToggleSave={() => onToggleSave(event.id)}
        />
      ))}
    </Grid>
  );
};
