import { JudoooInput } from '@tailwind-ui/components/Input';
import type { ArtworkPriceFilter, ArtworkSaleFilter } from '../types/artwork.types';

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
  <section className="jd:rounded-[28px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-paper jd:p-5 jd:shadow-judooo-card md:jd:p-6">
    <div className="jd:mb-5 jd:flex jd:flex-col jd:gap-3 md:jd:flex-row md:jd:items-end md:jd:justify-between">
      <div>
        <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-ember">
          Filter Collection
        </p>
        <h3 className="jd:mt-3 jd:mb-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">
          Refine the live view
        </h3>
      </div>
      <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
        {resultCount} works visible
      </p>
    </div>

    <div className="jd:grid jd:gap-4 lg:jd:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.5fr)_minmax(220px,0.5fr)]">
      <JudoooInput
        label="Search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by title, artist, or medium"
      />
      <label className="jd:flex jd:flex-col jd:gap-2">
        <span className="jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-smoke">
          Sale Type
        </span>
        <select
          className="jd:h-12 jd:w-full jd:rounded-2xl jd:border jd:border-judooo-ink/10 jd:bg-judooo-paper jd:px-4 jd:text-sm jd:text-judooo-ink jd:outline-none focus:jd:border-judooo-ember focus:jd:ring-4 focus:jd:ring-judooo-ember/10"
          value={saleTypeFilter}
          onChange={(event) => onSaleTypeChange(event.target.value as ArtworkSaleFilter)}
        >
          <option value="all">All sale types</option>
          <option value="fixed">Fixed Price</option>
          <option value="auction">Auction</option>
        </select>
      </label>
      <label className="jd:flex jd:flex-col jd:gap-2">
        <span className="jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-smoke">
          Price Band
        </span>
        <select
          className="jd:h-12 jd:w-full jd:rounded-2xl jd:border jd:border-judooo-ink/10 jd:bg-judooo-paper jd:px-4 jd:text-sm jd:text-judooo-ink jd:outline-none focus:jd:border-judooo-ember focus:jd:ring-4 focus:jd:ring-judooo-ember/10"
          value={priceFilter}
          onChange={(event) => onPriceFilterChange(event.target.value as ArtworkPriceFilter)}
        >
          <option value="all">All prices</option>
          <option value="low">Up to 10,000,000 VND</option>
          <option value="high">Above 10,000,000 VND</option>
        </select>
      </label>
    </div>
  </section>
);
