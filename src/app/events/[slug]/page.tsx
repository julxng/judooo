import { EventDetailPage } from '@/features/events/components/EventDetailPage';
import { getInitialEventBySlug, getRelatedInitialEvents } from '@/features/events/api';
import { getArtworksByEventId } from '@/features/marketplace/api';

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialEvent = await getInitialEventBySlug(slug);
  const [initialRelatedEvents, initialArtworks] = await Promise.all([
    initialEvent?.city
      ? getRelatedInitialEvents({ city: initialEvent.city, excludeId: initialEvent.id, limit: 3 })
      : Promise.resolve([]),
    initialEvent ? getArtworksByEventId(initialEvent.id) : Promise.resolve([]),
  ]);

  return (
    <EventDetailPage
      eventId={initialEvent?.id ?? slug}
      initialEvent={initialEvent}
      initialRelatedEvents={initialRelatedEvents}
      initialArtworks={initialArtworks}
    />
  );
}
