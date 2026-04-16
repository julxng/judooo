# Marketplace Feature

Manages the art marketplace — browsing, filtering, and purchasing/bidding on artworks.

## Structure

```
marketplace/
├── components/
│   ├── ArtworkCard.tsx              # Card display for artwork grid
│   ├── ArtworkDetailModal.tsx       # Full artwork detail in modal
│   ├── ArtworkActionModal.tsx       # Buy/bid action modal
│   ├── ArtworkShortlistView.tsx     # User's shortlisted artworks
│   ├── MarketplaceScreen.tsx        # Main marketplace view
│   ├── MarketplaceHomePage.tsx      # Marketplace landing page
│   ├── MarketplaceCollectionPage.tsx # Collection browsing
│   ├── MarketplaceGrid.tsx          # Grid layout for artwork cards
│   ├── MarketplaceFilters.tsx       # Sale type + price + search filters
│   └── SubmitArtworkPage.tsx        # Artwork submission form
├── hooks/
│   ├── useArtworkFilters.ts         # Client-side artwork filtering
│   └── index.ts
├── types/
│   ├── artwork.types.ts             # Artwork, SaleType, ArtworkPriceFilter, ArtworkSaleFilter
│   └── index.ts
├── utils/
│   └── artwork-utils.ts             # Localized getters for all artwork bilingual fields
├── services/
│   └── artworkFixtures.ts           # Seed data for offline/demo mode
└── api.ts                           # Server-side data fetching (getInitialArtworks)
```

## Key types

- **`Artwork`** — main entity. Fields include: `title`, `artist`, `price`, `currentBid`, `bidCount`, `saleType`, `medium`, `dimensions`, `description`, plus bilingual variants for ~10 text fields (`_vie`/`_en`), image gallery, moderation status, provenance, authenticity, condition report
- **`SaleType`** — `'fixed' | 'auction'`
- **`ArtworkPriceFilter`** — `'all' | 'high' | 'low'` (threshold: 10,000,000 VND)
- **`ArtworkSaleFilter`** — `SaleType | 'all'`

## Data flow

1. **Server**: `api.ts` uses `unstable_cache` (5min). Fetches from Supabase `artworks` table, falls back to `artworkFixtures.ts`
2. **Client**: Artworks are loaded via `api.getArtworks()` from the services layer. Filtering is done client-side via `useArtworkFilters`

## Filtering

`useArtworkFilters` supports:
- Free-text search (tokenized, matches across ALL bilingual fields + year + dimensions)
- Interest-based filtering (matches against same haystack)
- Sale type filter (fixed/auction/all)
- Price filter (high > 10M VND / low <= 10M VND / all)

## Bidding

Auctions use `api.placeBid(artworkId, userId, amount)`. The bid is persisted to Supabase `bids` table (with local fallback). The artwork's `currentBid` and `bidCount` are updated accordingly.

## Localization helpers (`artwork-utils.ts`)

Always use these instead of accessing bilingual fields directly:
- `getArtworkTitle(artwork, language)`
- `getArtworkDescription(artwork, language)`
- `getArtworkMedium(artwork, language)`
- `getArtworkStyle(artwork, language)`
- `getArtworkLocation(artwork, language)` — combines city + country
- `getArtworkProvenance(artwork, language)`
- `getArtworkAuthenticity(artwork, language)`
- `getArtworkConditionReport(artwork, language)`
- `getArtworkStory(artwork, language)`
