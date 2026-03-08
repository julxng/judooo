import { AsyncStatusBanner } from '@components/shared/AsyncStatusBanner';
import { JudoooButton } from '@tailwind-ui/components/Button';
import { MarketplaceFilters } from './MarketplaceFilters';
import { MarketplaceGrid } from './MarketplaceGrid';
import type {
  Artwork,
  ArtworkPriceFilter,
  ArtworkSaleFilter,
} from '../types/artwork.types';

interface MarketplaceScreenProps {
  artworks: Artwork[];
  searchQuery: string;
  saleTypeFilter: ArtworkSaleFilter;
  priceFilter: ArtworkPriceFilter;
  dbReadError: string | null;
  pendingWritesCount: number;
  onSearchChange: (value: string) => void;
  onSaleTypeChange: (value: ArtworkSaleFilter) => void;
  onPriceFilterChange: (value: ArtworkPriceFilter) => void;
  onOpenArtwork: (artwork: Artwork) => void;
  onActionArtwork: (artwork: Artwork) => void;
}

export const MarketplaceScreen = ({
  artworks,
  searchQuery,
  saleTypeFilter,
  priceFilter,
  dbReadError,
  pendingWritesCount,
  onSearchChange,
  onSaleTypeChange,
  onPriceFilterChange,
  onOpenArtwork,
  onActionArtwork,
}: MarketplaceScreenProps) => {
  const availableCount = artworks.filter((artwork) => artwork.available).length;
  const auctionCount = artworks.filter((artwork) => artwork.saleType === 'auction').length;
  const artistCount = new Set(artworks.map((artwork) => artwork.artist).filter(Boolean)).size;

  return (
    <div className="jd:flex jd:flex-col jd:gap-6">
      <section className="jd:relative jd:overflow-hidden jd:rounded-[32px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-paper jd:p-6 jd:shadow-judooo-float md:jd:p-8">
        <div className="judooo-ds__hero-glow" />
        <div className="jd:relative jd:z-10 jd:grid jd:gap-8 lg:jd:grid-cols-[minmax(0,1.1fr)_320px]">
          <div className="jd:flex jd:flex-col jd:gap-5">
            <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.28em] jd:text-judooo-ember">
              Live Marketplace
            </p>
            <h2 className="jd:m-0 jd:max-w-3xl jd:font-serif jd:text-[clamp(2.6rem,5vw,4.8rem)] jd:leading-[0.9] jd:text-judooo-ink">
              Selective adoption of the new Judooo collection language.
            </h2>
            <p className="jd:m-0 jd:max-w-2xl jd:text-base jd:leading-7 jd:text-judooo-smoke">
              This screen now uses the new Tailwind component system only here: warmer papers, editorial typography, quieter controls, and stronger artwork framing.
            </p>
            <div className="jd:flex jd:flex-wrap jd:gap-3">
              <JudoooButton variant="default">Collection live</JudoooButton>
              <JudoooButton variant="secondary">Artsy-derived system</JudoooButton>
              <JudoooButton variant="ghost">Judooo ember accent</JudoooButton>
            </div>
          </div>

          <div className="jd:grid jd:grid-cols-2 jd:gap-3">
            <div className="jd:rounded-[24px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-canvas jd:p-4">
              <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">Works</p>
              <p className="jd:mt-2 jd:mb-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">{artworks.length}</p>
            </div>
            <div className="jd:rounded-[24px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-canvas jd:p-4">
              <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">Available</p>
              <p className="jd:mt-2 jd:mb-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">{availableCount}</p>
            </div>
            <div className="jd:rounded-[24px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-canvas jd:p-4">
              <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">Auctions</p>
              <p className="jd:mt-2 jd:mb-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">{auctionCount}</p>
            </div>
            <div className="jd:rounded-[24px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-canvas jd:p-4">
              <p className="jd:m-0 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">Artists</p>
              <p className="jd:mt-2 jd:mb-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">{artistCount}</p>
            </div>
          </div>
        </div>
      </section>

      {dbReadError ? <AsyncStatusBanner tone="danger" message={dbReadError} /> : null}
      {pendingWritesCount > 0 ? (
        <AsyncStatusBanner tone="warning" message={`${pendingWritesCount} pending offline writes waiting to sync.`} />
      ) : null}
      <MarketplaceFilters
        searchQuery={searchQuery}
        saleTypeFilter={saleTypeFilter}
        priceFilter={priceFilter}
        resultCount={artworks.length}
        onSearchChange={onSearchChange}
        onSaleTypeChange={onSaleTypeChange}
        onPriceFilterChange={onPriceFilterChange}
      />
      <MarketplaceGrid
        artworks={artworks}
        onOpenArtwork={onOpenArtwork}
        onActionArtwork={onActionArtwork}
      />
    </div>
  );
};
