import { getInitialEvents } from '@/features/events/api';
import { MarketplaceHomePage } from '@/features/marketplace/components/MarketplaceHomePage';
import { getInitialArtworks } from '@/features/marketplace/api';

export default async function MarketplaceRoute() {
  const [initialEvents, initialArtworks] = await Promise.all([
    getInitialEvents(),
    getInitialArtworks(24),
  ]);

  return (
    <MarketplaceHomePage
      initialEvents={initialEvents}
      initialArtworks={initialArtworks}
      artworkLimit={24}
    />
  );
}
