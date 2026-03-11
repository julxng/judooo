'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useAuth, useLanguage } from '@/app/providers';
import { useNotice } from '@/app/providers/NoticeProvider';
import { SiteShell } from '@/components/layout/SiteShell';
import { AsyncStatusBanner } from '@/components/shared/AsyncStatusBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { api } from '@/services/api';
import { hydrateLocalCatalogSnapshot } from '@/services/api/localDb';
import { useArtworkFilters } from '../hooks/useArtworkFilters';
import type {
  Artwork,
  ArtworkPriceFilter,
  ArtworkSaleFilter,
} from '../types/artwork.types';
import { ArtworkDetailModal } from './ArtworkDetailModal';
import { MarketplaceFilters } from './MarketplaceFilters';
import { MarketplaceGrid } from './MarketplaceGrid';
import { getArtworkTitle } from '../utils/artwork-utils';

const isApprovedArtwork = (artwork: Artwork) =>
  !artwork.moderation_status || artwork.moderation_status === 'approved';

interface MarketplaceCollectionPageProps {
  initialArtworks?: Artwork[];
  initialSearch?: string | null;
}

export const MarketplaceCollectionPage = ({
  initialArtworks = [],
  initialSearch,
}: MarketplaceCollectionPageProps) => {
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const { notify } = useNotice();
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '');
  const [saleTypeFilter, setSaleTypeFilter] = useState<ArtworkSaleFilter>('all');
  const [priceFilter, setPriceFilter] = useState<ArtworkPriceFilter>('all');
  const [dbReadError, setDbReadError] = useState<string | null>(null);

  useEffect(() => {
    if (initialArtworks.length === 0) return;
    hydrateLocalCatalogSnapshot({ artworks: initialArtworks });
  }, [initialArtworks]);

  useEffect(() => {
    setSearchQuery(initialSearch ?? '');
  }, [initialSearch]);

  useEffect(() => {
    if (initialArtworks.length > 0) return;

    const loadArtworks = async () => {
      try {
        const nextArtworks = await api.getArtworks();
        setArtworks(nextArtworks);
      } catch (error) {
        console.error('Failed to load marketplace artworks', error);
        setDbReadError('Failed to load artworks. Showing available local records.');
      }
    };

    void loadArtworks();
  }, [initialArtworks.length]);

  const publicArtworks = useMemo(
    () => artworks.filter(isApprovedArtwork),
    [artworks],
  );
  const filteredArtworks = useArtworkFilters(
    publicArtworks,
    useDeferredValue(searchQuery),
    [],
    saleTypeFilter,
    priceFilter,
  );

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 md:py-10">
        <section className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="section-kicker">Marketplace</p>
            <h1 className="section-heading max-w-4xl">Browse the full artwork collection.</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              This page is only for artworks. Search, filter, and open any listing without the homepage event sections.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Badge tone="accent">
              {publicArtworks.length} {publicArtworks.length === 1 ? 'work' : 'works'}
            </Badge>
            <Badge>{saleTypeFilter === 'all' ? 'All sale types' : saleTypeFilter}</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <MarketplaceFilters
            searchQuery={searchQuery}
            saleTypeFilter={saleTypeFilter}
            priceFilter={priceFilter}
            resultCount={filteredArtworks.length}
            onSearchChange={setSearchQuery}
            onSaleTypeChange={setSaleTypeFilter}
            onPriceFilterChange={setPriceFilter}
          />

          {(searchQuery || saleTypeFilter !== 'all' || priceFilter !== 'all') ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSaleTypeFilter('all');
                  setPriceFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : null}
        </section>

        {dbReadError ? <AsyncStatusBanner message={dbReadError} /> : null}

        <section>
          <MarketplaceGrid
            artworks={filteredArtworks}
            onOpenArtwork={setActiveArtwork}
            onActionArtwork={setActiveArtwork}
          />
        </section>
      </Container>

      {activeArtwork ? (
        <ArtworkDetailModal
          artwork={activeArtwork}
          onClose={() => setActiveArtwork(null)}
          onAction={() => {
            if (!currentUser) {
              openAuthDialog();
              return;
            }
            notify(
              language === 'vi'
                ? `Đã ghi nhận quan tâm cho ${getArtworkTitle(activeArtwork, language)}.`
                : `Interest captured for ${getArtworkTitle(activeArtwork, language)}.`,
              'success',
            );
          }}
        />
      ) : null}
    </SiteShell>
  );
};
