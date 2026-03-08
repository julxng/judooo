import { AsyncStatusBanner } from '@/components/shared/AsyncStatusBanner';
import { Button } from '@/components/ui/Button';
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
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border bg-card text-card-foreground p-8 lg:p-12 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_360px] items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase w-fit">
              Live Marketplace
            </span>
            <h2 className="m-0 max-w-2xl text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground">
              Discover verified object stories.
            </h2>
            <p className="m-0 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Explore our curated collection of contemporary artworks. Bid on exclusive auctions or inquire directly about fixed-price pieces from celebrated artists.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Button size="lg" className="rounded-full shadow-md font-semibold px-8 hover:scale-105 transition-transform">
                Explore Collection
              </Button>
              <Button size="lg" variant="secondary" className="rounded-full font-semibold px-8 hover:scale-105 transition-transform">
                Learn More
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col p-6 rounded-2xl bg-background border shadow-sm items-center text-center justify-center">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Works</span>
              <span className="text-4xl font-bold text-foreground">{artworks.length}</span>
            </div>
            <div className="flex flex-col p-6 rounded-2xl bg-background border shadow-sm items-center text-center justify-center">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Available</span>
              <span className="text-4xl font-bold text-foreground">{availableCount}</span>
            </div>
            <div className="flex flex-col p-6 rounded-2xl bg-background border shadow-sm items-center text-center justify-center">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Auctions</span>
              <span className="text-4xl font-bold text-foreground">{auctionCount}</span>
            </div>
            <div className="flex flex-col p-6 rounded-2xl bg-background border shadow-sm items-center text-center justify-center">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Artists</span>
              <span className="text-4xl font-bold text-foreground">{artistCount}</span>
            </div>
          </div>
        </div>
      </section>

      {dbReadError ? <AsyncStatusBanner message={dbReadError} /> : null}
      {pendingWritesCount > 0 ? (
        <AsyncStatusBanner message={`${pendingWritesCount} pending offline writes waiting to sync.`} />
      ) : null}

      <div className="flex flex-col gap-6">
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
    </div>
  );
};
