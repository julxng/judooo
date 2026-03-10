import { MarketplaceHomePage } from '@/features/marketplace/components/MarketplaceHomePage';
import { getInitialEvents } from '@/features/events/api';
import { getInitialArtworks } from '@/features/marketplace/api';

export default async function Home() {
  const [initialEvents, initialArtworks] = await Promise.all([
    getInitialEvents(),
    getInitialArtworks(),
  ]);

  return (
    <MarketplaceHomePage
      initialEvents={initialEvents}
      initialArtworks={initialArtworks}
    />
  );
}
