import { FilterToolbar } from '@components/shared/FilterToolbar';
import { Select } from '@ui/index';
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
  <FilterToolbar
    searchValue={searchQuery}
    onSearchChange={onSearchChange}
    searchPlaceholder="Search by title, artist, or medium"
    filters={
      <>
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
      </>
    }
  />
);
