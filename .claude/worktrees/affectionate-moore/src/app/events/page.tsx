import { EventsDirectoryPage } from '@/features/events/components/EventsDirectoryPage';
import { getInitialEvents } from '@/features/events/api';

export const dynamic = 'force-dynamic';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; search?: string }>;
}) {
  const params = await searchParams;
  const initialEvents = await getInitialEvents();

  return (
    <EventsDirectoryPage
      initialSection={params.section || null}
      initialSearch={params.search || null}
      initialEvents={initialEvents}
    />
  );
}
