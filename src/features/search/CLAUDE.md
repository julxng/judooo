# Search Feature

Cross-catalog search that queries both events and artworks simultaneously.

## Structure

```
search/
├── components/
│   └── SearchResultsPage.tsx   # Results page with event + artwork sections
├── api.ts                      # searchCatalog() — client-side search logic
└── types.ts                    # SearchCatalogInput, SearchCatalogResult, SearchResultsPageProps
```

## How search works

Search is **client-side only** — no server search endpoint. `searchCatalog()` takes:
- `artworks: Artwork[]` and `events: ArtEvent[]` (full catalogs)
- `query: string` — tokenized by whitespace/commas

Each token must appear in the item's searchable fields (AND logic across tokens). Results are capped at 24 per type.

## Searchable fields

- **Events**: title, name_en/vie, organizer, description, city, district, location, address, event_type, art_medium, place_type, tags
- **Artworks**: title, artist, medium, dimensions, description, story, provenance, authenticity, style, city, country, yearCreated

Only approved items are included (`moderation_status` is `'approved'` or unset).

## Integration

The search page (`src/app/search/page.tsx`) passes `initialSearch` from URL params. The `SearchResultsPage` component loads full catalogs and runs `searchCatalog()` client-side.
