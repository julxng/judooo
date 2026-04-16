import { getInitialEvents } from '@/features/events/api';
import { getInitialArtworks } from '@/features/marketplace/api';
import { SearchResultsPage } from '@/features/search/components/SearchResultsPage';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const [initialArtworks, initialEvents] = await Promise.all([
    getInitialArtworks(undefined, { skipCache: true }),
    getInitialEvents({ skipCache: true }),
  ]);

  return (
    <SearchResultsPage
      initialArtworks={initialArtworks}
      initialEvents={initialEvents}
      initialSearch={params.search || null}
    />
  );
}
