import type { ArtEvent, Artwork } from '@/types';

export type SearchCatalogInput = {
  artworks: Artwork[];
  events: ArtEvent[];
  query: string;
};

export type SearchCatalogResult = {
  query: string;
  artworks: Artwork[];
  events: ArtEvent[];
};

export type SearchResultsPageProps = {
  initialArtworks?: Artwork[];
  initialEvents?: ArtEvent[];
  initialSearch?: string | null;
};
