import { SavedEventsPage } from '@/features/watchlist/components/SavedEventsPage';
import { getInitialEvents } from '@/features/events/api';

export const dynamic = 'force-dynamic';

export default async function SavedRoute() {
  const initialEvents = await getInitialEvents();

  return <SavedEventsPage initialEvents={initialEvents} />;
}
