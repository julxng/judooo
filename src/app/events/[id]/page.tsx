import { EventDetailPage } from '@/features/events/components/EventDetailPage';
import { getInitialEventById, getRelatedInitialEvents } from '@/features/events/api';

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialEvent = await getInitialEventById(id);
  const initialRelatedEvents = initialEvent?.city
    ? await getRelatedInitialEvents({ city: initialEvent.city, excludeId: initialEvent.id, limit: 3 })
    : [];

  return (
    <EventDetailPage
      eventId={id}
      initialEvent={initialEvent}
      initialRelatedEvents={initialRelatedEvents}
    />
  );
}
