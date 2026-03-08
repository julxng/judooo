import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { ArtworkPriceFilter, ArtworkSaleFilter } from '../types/artwork.types';
import { Search } from 'lucide-react';

interface MarketplaceFiltersProps {
  searchQuery: string;
  saleTypeFilter: ArtworkSaleFilter;
  priceFilter: ArtworkPriceFilter;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onSaleTypeChange: (value: ArtworkSaleFilter) => void;
  onPriceFilterChange: (value: ArtworkPriceFilter) => void;
}

export const MarketplaceFilters = ({
  searchQuery,
  saleTypeFilter,
  priceFilter,
  resultCount,
  onSearchChange,
  onSaleTypeChange,
  onPriceFilterChange,
}: MarketplaceFiltersProps) => (
  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm text-card-foreground">
    <div className="relative w-full md:w-96 flex-shrink-0">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        type="text"
        placeholder="Search by title, artist, or medium..."
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className="pl-10 pr-4 h-11 w-full bg-background rounded-lg border-muted-foreground/20 focus-visible:ring-primary shadow-inner"
      />
    </div>

    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="flex-1 md:w-48">
        <select
          className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={saleTypeFilter}
          onChange={(event) => onSaleTypeChange(event.target.value as ArtworkSaleFilter)}
        >
          <option value="all">All Sale Types</option>
          <option value="fixed">Fixed Price</option>
          <option value="auction">Auction</option>
        </select>
      </div>

      <div className="flex-1 md:w-48">
        <select
          className="h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={priceFilter}
          onChange={(event) => onPriceFilterChange(event.target.value as ArtworkPriceFilter)}
        >
          <option value="all">All Prices</option>
          <option value="low">Up to 10,000,000 VND</option>
          <option value="high">Above 10,000,000 VND</option>
        </select>
      </div>

      <div className="hidden lg:flex shrink-0 items-center justify-center px-4 h-11 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {resultCount} {resultCount === 1 ? 'work' : 'works'}
        </span>
      </div>
    </div>
  </div>
);
