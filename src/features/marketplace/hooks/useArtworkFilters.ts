import { useMemo } from 'react';
import type {
  Artwork,
  ArtworkPriceFilter,
  ArtworkSaleFilter,
} from '../types/artwork.types';

export const useArtworkFilters = (
  artworks: Artwork[],
  searchQuery: string,
  selectedInterests: string[],
  saleTypeFilter: ArtworkSaleFilter,
  priceFilter: ArtworkPriceFilter,
) =>
  useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const queryTokens = normalizedQuery
      .split(/[,\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const normalizedInterests = selectedInterests.map((interest) => interest.trim().toLowerCase()).filter(Boolean);

    return artworks.filter((artwork) => {
      const haystack = [
        artwork.title,
        artwork.artist,
        artwork.medium,
        artwork.dimensions,
        artwork.description,
        artwork.story,
        artwork.provenance,
        artwork.authenticity,
        artwork.style,
        artwork.city,
        artwork.country,
        artwork.yearCreated?.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        queryTokens.length === 0 || queryTokens.every((token) => haystack.includes(token));
      const matchesInterest =
        normalizedInterests.length === 0 ||
        normalizedInterests.some((interest) => haystack.includes(interest));

      const matchesSaleType = saleTypeFilter === 'all' || artwork.saleType === saleTypeFilter;
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'high' ? artwork.price > 10000000 : artwork.price <= 10000000);

      return matchesSearch && matchesInterest && matchesSaleType && matchesPrice;
    });
  }, [artworks, priceFilter, saleTypeFilter, searchQuery, selectedInterests]);
