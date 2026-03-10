import type { ArtEvent } from '@/features/events/types/event.types';
import { EventsGrid } from '@/features/events/components/EventsGrid';

interface WatchlistViewProps {
  events: ArtEvent[];
  savedEventIds: string[];
  onOpenEvent: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export const WatchlistView = ({
  events,
  savedEventIds,
  onOpenEvent,
  onToggleSave,
}: WatchlistViewProps) => (
  <EventsGrid
    events={events}
    savedEventIds={savedEventIds}
    onOpenEvent={onOpenEvent}
    onToggleSave={onToggleSave}
    emptyMessage="Save exhibitions to build your visit route."
  />
);
