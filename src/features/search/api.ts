import type { ArtEvent, Artwork } from '@/types';
import type { SearchCatalogInput, SearchCatalogResult } from './types';

const MAX_RESULTS_PER_TYPE = 24;

const normalizeQueryTokens = (query: string) =>
  query
    .trim()
    .toLowerCase()
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const isApprovedArtwork = (artwork: Artwork) =>
  artwork.moderation_status === 'approved';

const isApprovedEvent = (event: ArtEvent) =>
  !event.moderation_status || event.moderation_status === 'approved';

const matchesTokens = (haystack: Array<string | number | undefined>, tokens: string[]) => {
  if (tokens.length === 0) {
    return true;
  }

  const normalizedHaystack = haystack
    .filter((value): value is string | number => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => normalizedHaystack.includes(token));
};

export const searchCatalog = ({
  artworks,
  events,
  query,
}: SearchCatalogInput): SearchCatalogResult => {
  const normalizedQuery = query.trim();
  const tokens = normalizeQueryTokens(normalizedQuery);

  if (tokens.length === 0) {
    return {
      query: normalizedQuery,
      artworks: [],
      events: [],
    };
  }

  return {
    query: normalizedQuery,
    artworks: artworks
      .filter(
        (artwork) =>
          isApprovedArtwork(artwork) &&
          matchesTokens(
            [
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
              artwork.yearCreated,
            ],
            tokens,
          ),
      )
      .slice(0, MAX_RESULTS_PER_TYPE),
    events: events
      .filter(
        (event) =>
          isApprovedEvent(event) &&
          matchesTokens(
            [
              event.title,
              event.name_en,
              event.name_vie,
              event.organizer,
              event.description,
              event.description_en,
              event.description_vie,
              event.city,
              event.district,
              event.location,
              event.address,
              event.event_type,
              event.art_medium,
              event.place_type,
              ...(event.tags ?? []),
            ],
            tokens,
          ),
      )
      .slice(0, MAX_RESULTS_PER_TYPE),
  };
};
