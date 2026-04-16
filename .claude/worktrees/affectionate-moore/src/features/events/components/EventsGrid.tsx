import { EmptyState } from '@/components/shared/EmptyState';
import { Masonry } from '@/components/ui/Masonry';
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
    <Masonry>
      {events.map((event) => (
        <div key={event.id} className="events-masonry__item">
          <EventCard
            event={event}
            isSaved={savedEventIds.includes(event.id)}
            onOpen={() => onOpenEvent(event.slug)}
            onToggleSave={() => onToggleSave(event.id)}
          />
        </div>
      ))}
    </Masonry>
  );
};
