# Events Feature

The largest feature module. Manages art events (exhibitions, auctions, workshops, performances, talks) across Vietnam.

## Structure

```
events/
├── components/
│   ├── EventCard.tsx              # Card for event grid display
│   ├── EventDetailPage.tsx        # Full event detail (server-rendered)
│   ├── EventDetailModal.tsx       # Modal version of event detail
│   ├── EventsScreen.tsx           # Main events listing (tabs: grid/map)
│   ├── EventsDirectoryPage.tsx    # Directory page variant
│   ├── EventsGrid.tsx             # Grid layout for event cards
│   ├── EventFilters.tsx           # Category + timeline + search filters
│   ├── EventMap.tsx               # Leaflet map with event markers
│   ├── HomePage.tsx               # Landing page with featured events
│   ├── RoutePlannerPage.tsx       # Route planning interface
│   ├── SavedRouteView.tsx         # Display optimized/saved route
│   └── SubmitEventPage.tsx        # Event submission form
├── hooks/
│   ├── useEventFilters.ts         # Client-side event filtering (search + category + timeline)
│   └── useEventsCatalog.ts        # Main data hook: events CRUD, save/unsave, route management
├── types/
│   ├── event.types.ts             # ArtEvent, EventCategory, EventTimeline, EventMedia
│   └── route.types.ts             # RoutePlan, RouteStop, RouteSummary, RoutePlanSet
├── utils/
│   ├── event-utils.ts             # Localized getters, timeline checks, sorting, Google Maps URL
│   └── route-optimizer.ts         # Haversine + nearest-neighbor + 2-opt route optimization
├── services/
│   └── eventFixtures.ts           # Hardcoded seed data for offline/demo mode
├── api.ts                         # Server-side data fetching (getInitialEvents, getInitialEventById, getRelatedInitialEvents)
└── index.ts
```

## Key types

- **`ArtEvent`** — main entity. ~60 fields including bilingual variants (`name_vie`/`name_en`, `description_vie`/`description_en`, etc.), geo coordinates (`lat`/`lng`), moderation status, and metadata
- **`EventCategory`** — `'exhibition' | 'auction' | 'workshop' | 'performance' | 'talk' | 'all'`
- **`EventTimeline`** — `'active' | 'past' | 'all'`
- **`EventModerationStatus`** — `'pending' | 'approved' | 'rejected'`

## Data flow

1. **Server**: `api.ts` uses `unstable_cache` with 5min revalidation. Fetches from Supabase `events` table, falls back to `eventFixtures.ts`
2. **Client**: `useEventsCatalog` is the primary hook. Manages:
   - Event list state (with refresh from `api.getEvents()`)
   - Saved events (synced to Supabase `watchlist` table)
   - Route events (persisted in `localStorage` per user)
   - Event CRUD (create/update flow with translation enrichment)

## Route planner

The route optimizer in `route-optimizer.ts`:
- Calculates Haversine distances between events
- Runs nearest-neighbor from every possible start point
- Improves each candidate with 2-opt swaps
- Returns `RoutePlanSet` with both optimized and saved-order plans
- Summary includes: total stops, total distance km, estimated travel minutes, distance saved

## Localization helpers (`event-utils.ts`)

Always use these instead of accessing bilingual fields directly:
- `getEventTitle(event, language)` — resolves `name_vie` / `name_en` / `title`
- `getEventDescription(event, language)`
- `getEventCity(event, language)`
- `getEventLocation(event, language)`
- `getEventChips(event, language)` — returns tags for art_medium, event_type, place_type

## Important patterns

- Events are filtered client-side via `useEventFilters` (search matches against ALL bilingual field variants)
- `isApprovedEvent()` and `matchesEventTimeline()` are used throughout for display filtering
- The map component uses Leaflet and requires dynamic import (no SSR)
- Event submission goes through `api.createEvent()` which auto-enriches translations before persisting
