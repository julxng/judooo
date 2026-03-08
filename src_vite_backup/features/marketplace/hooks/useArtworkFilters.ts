import { useMemo } from 'react';
import type {
  Artwork,
  ArtworkPriceFilter,
  ArtworkSaleFilter,
} from '../types/artwork.types';

export const useArtworkFilters = (
  artworks: Artwork[],
  searchQuery: string,
  saleTypeFilter: ArtworkSaleFilter,
  priceFilter: ArtworkPriceFilter,
) =>
  useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return artworks.filter((artwork) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        artwork.title.toLowerCase().includes(normalizedQuery) ||
        artwork.artist.toLowerCase().includes(normalizedQuery) ||
        artwork.medium.toLowerCase().includes(normalizedQuery);

      const matchesSaleType = saleTypeFilter === 'all' || artwork.saleType === saleTypeFilter;
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'high' ? artwork.price > 10000000 : artwork.price <= 10000000);

      return matchesSearch && matchesSaleType && matchesPrice;
    });
  }, [artworks, priceFilter, saleTypeFilter, searchQuery]);
