import { EventsDirectoryPage } from '@/features/events/components/EventsDirectoryPage';
import { getInitialEvents } from '@/features/events/api';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const params = await searchParams;
  const initialEvents = await getInitialEvents();

  return (
    <EventsDirectoryPage
      initialSection={params.section || null}
      initialEvents={initialEvents}
    />
  );
}
