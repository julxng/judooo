import { EventDetailPage } from '@/features/events/components/EventDetailPage';
import { getInitialEvents } from '@/features/events/api';

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialEvents = await getInitialEvents();

  return <EventDetailPage eventId={id} initialEvents={initialEvents} />;
}
