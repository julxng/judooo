import { CuratedEventsPage } from '@/features/events/components/CuratedEventsPage';
import { getInitialEvents } from '@/features/events/api';
import { getInitialArtworks } from '@/features/marketplace/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [initialEvents, initialArtworks] = await Promise.all([
    getInitialEvents({ limit: 50 }),
    getInitialArtworks(30),
  ]);

  return (
    <CuratedEventsPage
      initialEvents={initialEvents}
      initialArtworks={initialArtworks}
    />
  );
}
