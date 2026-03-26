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
import { PaymentModal } from '@/features/payment/components';
import { ArtworkActionModal } from './ArtworkActionModal';
import { ArtworkDetailModal } from './ArtworkDetailModal';
import { MarketplaceFilters } from './MarketplaceFilters';
import { MarketplaceGrid } from './MarketplaceGrid';
import { getArtworkTitle } from '../utils/artwork-utils';

const isApprovedArtwork = (artwork: Artwork) =>
  artwork.moderation_status === 'approved';

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
  const [paymentArtwork, setPaymentArtwork] = useState<Artwork | null>(null);
  const [actionArtwork, setActionArtwork] = useState<Artwork | null>(null);
  const [actionMode, setActionMode] = useState<'bid' | 'auto-inquire' | null>(null);
  const [bidValue, setBidValue] = useState(0);
  const [collectorNote, setCollectorNote] = useState('');
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

  // Handle VNPay / MoMo payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (!paymentStatus) return;
    if (paymentStatus === 'success') {
      notify('Thanh toán thành công! Gallery sẽ liên hệ với bạn sớm.', 'success');
    } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
      notify('Thanh toán thất bại. Vui lòng thử lại.', 'warning');
    }
    // Remove query params without page reload
    const clean = new URL(window.location.href);
    clean.searchParams.delete('payment');
    clean.searchParams.delete('ref');
    window.history.replaceState({}, '', clean.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const openArtworkAction = (artwork: Artwork, mode: 'bid' | 'auto-inquire') => {
    if (!currentUser) {
      openAuthDialog();
      return;
    }
    if (mode === 'auto-inquire') {
      // Fixed-price → payment flow
      setActiveArtwork(null);
      setPaymentArtwork(artwork);
      return;
    }
    setActionArtwork(artwork);
    setActionMode(mode);
    setCollectorNote('');
    setBidValue((artwork.currentBid || artwork.price) + 500_000);
  };

  const submitArtworkAction = async () => {
    if (!actionArtwork || !actionMode || !currentUser) return;

    if (actionMode === 'auto-inquire') {
      notify(
        language === 'vi'
          ? `Đã ghi nhận yêu cầu cho "${getArtworkTitle(actionArtwork, language)}".`
          : `Inquiry noted for "${getArtworkTitle(actionArtwork, language)}".`,
        'success',
      );
      setActionArtwork(null);
      setActionMode(null);
      setCollectorNote('');
      return;
    }

    const minimumBid = actionArtwork.currentBid || actionArtwork.price;
    if (bidValue <= minimumBid) {
      notify('Bid must be higher than the current price.', 'warning');
      return;
    }

    const success = await api.placeBid(actionArtwork.id, currentUser.id, bidValue);
    if (success) {
      notify('Bid submitted successfully.', 'success');
      setActionArtwork(null);
      setActionMode(null);
      setCollectorNote('');
    } else {
      notify('Bid failed. Try again after checking your connection.', 'error');
    }
  };

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
            onActionArtwork={(artwork) =>
              openArtworkAction(artwork, artwork.saleType === 'auction' ? 'bid' : 'auto-inquire')
            }
          />
        </section>
      </Container>

      {activeArtwork ? (
        <ArtworkDetailModal
          artwork={activeArtwork}
          onClose={() => setActiveArtwork(null)}
          onAction={(artwork) =>
            openArtworkAction(artwork, artwork.saleType === 'auction' ? 'bid' : 'auto-inquire')
          }
        />
      ) : null}

      {actionArtwork && actionMode ? (
        <ArtworkActionModal
          artwork={actionArtwork}
          mode={actionMode}
          bidValue={bidValue}
          collectorNote={collectorNote}
          onBidValueChange={setBidValue}
          onCollectorNoteChange={setCollectorNote}
          onClose={() => {
            setActionArtwork(null);
            setActionMode(null);
            setCollectorNote('');
          }}
          onSubmit={submitArtworkAction}
        />
      ) : null}

      {paymentArtwork ? (
        <PaymentModal
          context={{
            artworkId: paymentArtwork.id,
            artworkTitle: getArtworkTitle(paymentArtwork, language),
            artist: paymentArtwork.artist,
            amount: paymentArtwork.price,
            imageUrl: paymentArtwork.imageUrl,
          }}
          onClose={() => setPaymentArtwork(null)}
          onSuccess={() => {
            notify('Đơn hàng đã được ghi nhận. Gallery sẽ liên hệ sớm.', 'success');
            setPaymentArtwork(null);
          }}
        />
      ) : null}
    </SiteShell>
  );
};
