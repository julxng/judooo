import { Stack } from '@components/layout/Stack';
import { Input, Select } from '@ui/index';
import type { ArtworkPriceFilter, ArtworkSaleFilter } from '../types/artwork.types';

interface MarketplaceFiltersProps {
  searchQuery: string;
  saleTypeFilter: ArtworkSaleFilter;
  priceFilter: ArtworkPriceFilter;
  onSearchChange: (value: string) => void;
  onSaleTypeChange: (value: ArtworkSaleFilter) => void;
  onPriceFilterChange: (value: ArtworkPriceFilter) => void;
}

export const MarketplaceFilters = ({
  searchQuery,
  saleTypeFilter,
  priceFilter,
  onSearchChange,
  onSaleTypeChange,
  onPriceFilterChange,
}: MarketplaceFiltersProps) => (
  <div className="surface-toolbar">
    <Stack gap={12} className="surface-toolbar__row">
      <Input
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by title, artist, or medium"
      />
      <Select
        value={saleTypeFilter}
        onChange={(event) => onSaleTypeChange(event.target.value as ArtworkSaleFilter)}
      >
        <option value="all">All sale types</option>
        <option value="fixed">Fixed Price</option>
        <option value="auction">Auction</option>
      </Select>
      <Select
        value={priceFilter}
        onChange={(event) => onPriceFilterChange(event.target.value as ArtworkPriceFilter)}
      >
        <option value="all">All prices</option>
        <option value="low">Up to 10,000,000 VND</option>
        <option value="high">Above 10,000,000 VND</option>
      </Select>
    </Stack>
  </div>
);
