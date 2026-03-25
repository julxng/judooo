import { EventDetailPage } from '@/features/events/components/EventDetailPage';
import { getInitialEventById, getRelatedInitialEvents } from '@/features/events/api';
import { getArtworksByEventId } from '@/features/marketplace/api';

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialEvent = await getInitialEventById(id);
  const [initialRelatedEvents, initialArtworks] = await Promise.all([
    initialEvent?.city
      ? getRelatedInitialEvents({ city: initialEvent.city, excludeId: initialEvent.id, limit: 3 })
      : Promise.resolve([]),
    getArtworksByEventId(id),
  ]);

  return (
    <EventDetailPage
      eventId={id}
      initialEvent={initialEvent}
      initialRelatedEvents={initialRelatedEvents}
      initialArtworks={initialArtworks}
    />
  );
}
