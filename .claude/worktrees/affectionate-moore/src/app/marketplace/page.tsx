import { MarketplaceCollectionPage } from '@/features/marketplace/components/MarketplaceCollectionPage';
import { getInitialArtworks } from '@/features/marketplace/api';

export default async function MarketplaceRoute({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const initialArtworks = await getInitialArtworks();

  return (
    <MarketplaceCollectionPage
      initialArtworks={initialArtworks}
      initialSearch={params.search || null}
    />
  );
}
