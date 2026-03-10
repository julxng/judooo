import { Badge } from '@/components/ui/Badge';
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
  <div className="surface-toolbar">
    <div className="surface-toolbar__row flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Search by title, artist, or medium"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-11"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
        <Select
          value={saleTypeFilter}
          onChange={(event) => onSaleTypeChange(event.target.value as ArtworkSaleFilter)}
          className="sm:min-w-52"
        >
          <option value="all">All sale types</option>
          <option value="fixed">Fixed price</option>
          <option value="auction">Auction</option>
        </Select>

        <Select
          value={priceFilter}
          onChange={(event) => onPriceFilterChange(event.target.value as ArtworkPriceFilter)}
          className="sm:min-w-52"
        >
          <option value="all">All prices</option>
          <option value="low">Up to 10,000,000 VND</option>
          <option value="high">Above 10,000,000 VND</option>
        </Select>
      </div>
    </div>

    <div className="surface-toolbar__tabs">
      <Badge tone="accent">
        {resultCount} {resultCount === 1 ? 'work' : 'works'}
      </Badge>
      <p className="m-0 text-sm text-muted-foreground">
        Filter by commercial format and pricing without leaving the collection grid.
      </p>
    </div>
  </div>
);
