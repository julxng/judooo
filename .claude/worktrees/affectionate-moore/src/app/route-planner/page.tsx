import { RoutePlannerPage } from '@/features/events/components/RoutePlannerPage';
import { getInitialEvents } from '@/features/events/api';

export const dynamic = 'force-dynamic';

export default async function RoutePage() {
  const initialEvents = await getInitialEvents();

  return <RoutePlannerPage initialEvents={initialEvents} />;
}
