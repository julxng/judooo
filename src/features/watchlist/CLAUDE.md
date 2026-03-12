# Watchlist Feature

Displays the user's saved/bookmarked events.

## Structure

```
watchlist/
├── components/
│   ├── WatchlistView.tsx   # Renders saved events as a list/grid
│   └── index.ts
```

## Data flow

Saved event IDs come from `useEventsCatalog().savedEventIds` (synced to Supabase `watchlist` table and local DB). The watchlist view filters the full event list to show only saved items.

The toggle is handled by `useEventsCatalog().toggleSavedEvent(eventId)` which uses optimistic updates with rollback on failure.
