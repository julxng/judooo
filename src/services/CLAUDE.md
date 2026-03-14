# Services Layer

The data access layer implementing a local-first architecture with Supabase sync.

## Structure

```
services/
├── api/
│   ├── artNetworkApi.ts   # Unified API facade (exported as `api`)
│   ├── localDb.ts         # In-memory + localStorage state management
│   ├── remoteApi.ts       # Direct Supabase CRUD operations
│   ├── mappers.ts         # Row ↔ type mapping (snake_case ↔ camelCase)
│   ├── shared.ts          # DATA_MODE, mergeById, withTimeout, toIsoDate, toSlug, toId
│   ├── types.ts           # PendingWrite, LocalDbState, DataMode
│   └── index.ts           # Re-exports `api` from artNetworkApi
├── supabase/
│   └── client.ts          # Browser-side Supabase client singleton
└── index.ts
```

## artNetworkApi.ts — the unified facade

**Import**: `import { api } from '@/services/api'`

Every method follows the same pattern:
1. Read from local DB (always available)
2. If `shouldUseRemote()` is true, attempt remote operation with timeout
3. On remote success: merge results into local DB, trigger `flushPendingWrites()`
4. On remote failure: fall back to local, enqueue a `PendingWrite` for later sync

### Available methods

| Method | Description |
|---|---|
| `api.getEvents()` | Fetch all events (merged local + remote) |
| `api.createEvent(partial)` | Create event (auto-translates bilingual fields) |
| `api.updateEvent(id, partial)` | Update event |
| `api.getArtworks(eventId?)` | Fetch artworks (optionally filtered by event) |
| `api.createArtwork(partial)` | Create artwork (auto-translates bilingual fields) |
| `api.updateArtwork(id, partial)` | Update artwork |
| `api.placeBid(artworkId, userId, amount)` | Place auction bid |
| `api.syncUser(user)` | Upsert user profile |
| `api.getProfile(id)` | Get single profile |
| `api.getProfiles()` | Get all profiles |
| `api.getWatchlist(userId)` | Get saved event IDs for user |
| `api.toggleWatchlist(userId, eventId)` | Toggle event bookmark |
| `api.uploadImage(file)` | Upload to Supabase Storage (falls back to data URL) |
| `api.syncPendingWrites()` | Flush queued offline writes |
| `api.getPendingWritesCount()` | Number of queued writes |

## localDb.ts

Manages `LocalDbState` which contains: `events`, `artworks`, `profiles`, `watchlist`, `bids`, `pendingWrites`.

- Storage key: `judooo_local_db_v1`
- Seeds with fixture data when `DATA_MODE === 'local'` or no remote env vars
- Provides CRUD helpers: `upsertLocalEvent`, `patchLocalEvent`, `upsertLocalArtwork`, `patchLocalArtwork`, `applyLocalBid`, `upsertLocalProfile`, etc.
- `hydrateLocalCatalogSnapshot()` merges server-rendered data into local state (called from `useEventsCatalog`)

## remoteApi.ts

Direct Supabase operations. Every function includes **dual-schema fallback** — attempts V2 (snake_case columns) first, retries with legacy (camelCase) columns on failure. This is critical for backward compatibility.

Key function: `shouldUseRemote()` — returns `true` when `DATA_MODE !== 'local'` AND Supabase client exists.

## mappers.ts

- `mapEvent(row)` — normalizes a Supabase row to `ArtEvent`, handling both column naming conventions
- `mapArtwork(row)` — normalizes a Supabase row to `Artwork`
- `buildEventPayloads(event)` — returns array of 2 insert payloads (V2 + legacy) for `tryInsert`
- `buildArtworkPayloads(artwork)` — same for artworks

## shared.ts

- `DATA_MODE` — read from `NEXT_PUBLIC_DATA_MODE` env var (`auto` | `local` | `supabase`)
- `mergeById(primary, secondary)` — deduplicates by `id`, primary wins
- `withTimeout(promise, ms)` — races promise against timeout, returns `null` on timeout
- `toIsoDate(value)` — safe ISO date string conversion
- `toSlug(value)` — URL-safe slug
- `toId(prefix)` — generates unique IDs for local entities

## Important patterns

- All writes auto-enrich bilingual fields via `enrichEventTranslations()` / `enrichArtworkTranslations()` before persisting
- `PendingWrite` is a discriminated union — each kind carries its own typed payload
- `enqueuePendingWrite()` deduplicates: updating the same entity replaces the previous queued write
- `flushPendingWrites()` processes the queue sequentially, removes successful items
