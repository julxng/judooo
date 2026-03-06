import { AsyncStatusBanner } from '@components/shared/AsyncStatusBanner';
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
}: MarketplaceScreenProps) => (
  <div className="content-grid">
    {dbReadError ? <AsyncStatusBanner tone="danger" message={dbReadError} /> : null}
    {pendingWritesCount > 0 ? (
      <AsyncStatusBanner tone="warning" message={`${pendingWritesCount} pending offline writes waiting to sync.`} />
    ) : null}
    <MarketplaceFilters
      searchQuery={searchQuery}
      saleTypeFilter={saleTypeFilter}
      priceFilter={priceFilter}
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
