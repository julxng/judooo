import { AdminPage } from '@/features/admin/components/AdminPage';
import { getInitialEvents } from '@/features/events/api';
import { getInitialArtworks } from '@/features/marketplace/api';

export default async function AdminRoute() {
  const [initialEvents, initialArtworks] = await Promise.all([
    getInitialEvents(),
    getInitialArtworks(),
  ]);

  return <AdminPage initialEvents={initialEvents} initialArtworks={initialArtworks} />;
}
