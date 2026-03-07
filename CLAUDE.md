# CLAUDE.md — Judooo (Vietnam Art Network)

## Project Overview

**Judooo** is a React + TypeScript + Supabase marketplace for discovering and collecting Vietnamese art. It connects art lovers, artists, galleries, and dealers through event discovery, artwork listings, and auction functionality.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript ~5.8, Vite 6 |
| Backend/DB | Supabase (PostgreSQL, Auth, RLS, Storage) |
| Maps | Leaflet 1.9 |
| AI (optional) | Google Gemini API |
| Crawlers | Node.js ESM scripts + Python 3 (BeautifulSoup) |

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript check (no emit)

# Data crawlers
npm run crawl:events    # Fetch events from RSS/Google News/Facebook
npm run dedupe:events   # Remove duplicate events
npm run crawl:artworks  # Fetch artwork metadata (Wikidata, web)
```

## Environment Setup

**Frontend** — create `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
GEMINI_API_KEY=YOUR_KEY   # optional
```

**Crawlers** — create `.env.crawl` (copy from `.env.crawl.example`):
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...     # admin key for writes
CRAWL_SOURCE_URLS=...             # comma-separated RSS feeds
CRAWL_GOOGLE_NEWS_QUERIES=...
CRAWL_FACEBOOK_GROUP_IDS=...
FACEBOOK_GRAPH_ACCESS_TOKEN=...
```

**Python scraper** (Nguyen Art Foundation):
```bash
pip3 install requests beautifulsoup4
python3 scripts/scrape_naf_collection.py
```

## Database Setup (Supabase)

Run migrations in order via the Supabase SQL editor:
1. `supabase/migrations/20260226_0001_mvp_foundation.sql` — core schema
2. `supabase/migrations/20260226_0002_crawl_ingestion.sql` — crawler tables
3. `supabase/migrations/20260226_0003_event_source_link.sql` — event sources
4. `supabase/migrations/20260227_0004_artwork_details_placeholder.sql` — artwork details

## Project Structure

```
judooo/
├── src/
│   ├── app/                  # App shell: layouts, providers, routes
│   │   ├── layouts/          # MainLayout
│   │   ├── providers/        # AppProviders, NoticeProvider
│   │   ├── routes/           # Route/tab definitions (tabs.ts)
│   │   └── App.tsx           # Root orchestrator
│   ├── components/
│   │   ├── ui/               # Primitives: Button, Card, Modal, Input, Select, Badge, etc.
│   │   ├── layout/           # Container, Stack, Grid, Section, DashboardLayout
│   │   └── shared/           # AsyncStatusBanner and other cross-cutting components
│   ├── design-system/        # Tokens (color, spacing, typography, radius, motion)
│   ├── features/             # Vertical feature slices
│   │   ├── auth/             # Auth dialog, useAuthController, roles
│   │   ├── events/           # EventCard, EventsGrid, EventDetailModal, EventMap, filters
│   │   ├── marketplace/      # ArtworkCard, ArtworkDetailModal, auction/inquiry flows
│   │   ├── watchlist/        # WatchlistView, useWatchlist
│   │   ├── admin/            # AdminDashboard (lazy-loaded, role-gated)
│   │   └── about/            # About page with i18n
│   ├── services/
│   │   ├── api/              # artNetworkApi.ts (facade), remoteApi.ts, localDb.ts, mappers.ts
│   │   └── supabase/         # Supabase client init
│   ├── hooks/                # useCatalogData.ts, useWatchlist.ts
│   ├── types/                # Shared TypeScript definitions
│   ├── utils/                # Utility functions
│   ├── styles/               # Global CSS, design token CSS vars
│   └── assets/               # Branding/images
├── scripts/                  # Node.js and Python data scripts
├── supabase/
│   ├── migrations/           # Ordered SQL migrations
│   └── seeds/                # Test seed data
├── docs/
│   ├── ARCHITECTURE.md       # Folder structure principles and naming conventions
│   ├── ARCHITECTURE_AUDIT.md # Technical debt findings
│   └── MVP_SPEC.md           # Product spec, user roles, acceptance criteria
├── public/                   # Static assets
├── .env.example              # Frontend env template
├── .env.crawl.example        # Crawler env template
└── metadata.json             # Project metadata
```

## Architecture Patterns

### Feature-Based Organization
Code is organized as vertical feature slices under `src/features/`. Each feature owns its own components, hooks, and local state. Shared UI lives in `src/components/`.

### API Layer (Offline-First)
The `artNetworkApi` facade (src/services/api/) implements an offline-first pattern:
- **localDb** — IndexedDB/localStorage for local persistence
- **remoteApi** — Supabase for remote data
- Pending write queue for offline resilience
- 7–8 second timeout on all remote calls
- Conflict resolution via merge-by-ID

### Data Flow
```
Feature Component
       ↓
  useCatalogData / useWatchlist hooks
       ↓
  artNetworkApi (facade)
     ↙          ↘
localDb       remoteApi (Supabase)
```

### State Management
- No global state library (no Redux/Zustand)
- `App.tsx` holds minimal lifted state (active tab, modal open states)
- Each feature hook owns its domain state
- `useCatalogData` is the primary data-fetching hook, loaded once on mount

### TypeScript Path Aliases
Configured in both `tsconfig.json` and `vite.config.ts`:
```
@/        → src/
@app/     → src/app/
@components/ → src/components/
@features/   → src/features/
@services/   → src/services/
@hooks/      → src/hooks/
@types/      → src/types/
@utils/      → src/utils/
@design-system/ → src/design-system/
```

Always use these aliases — never use relative `../../` paths that cross feature boundaries.

## User Roles

| Role | Capabilities |
|------|-------------|
| `art_lover` | Browse, watchlist, bid on auctions |
| `artist` | All above + list own artworks, manage profile |
| `gallery` | All above + create events, manage artists |
| `art_dealer` | All above + full marketplace management |
| `admin` | Full access including moderation |

Admin dashboard is lazy-loaded and only rendered for `gallery`, `artist`, and `admin` roles.

## Key Conventions

### Component Guidelines
- Use functional components with TypeScript props interfaces
- Co-locate feature components inside their feature directory
- Shared UI primitives go in `src/components/ui/` — keep these generic and unaware of domain logic
- Layout wrappers go in `src/components/layout/`
- Never import from a sibling feature — go through hooks or services

### Naming
- Components: `PascalCase` (`EventCard.tsx`, `ArtworkDetailModal.tsx`)
- Hooks: `camelCase` prefixed with `use` (`useWatchlist.ts`, `useCatalogData.ts`)
- Services/utilities: `camelCase` (`artNetworkApi.ts`, `remoteApi.ts`)
- CSS classes: use design-system token CSS variables from `src/styles/`

### Design System
Design tokens are defined in `src/design-system/tokens/` and exposed as CSS custom properties. Always use tokens — do not hardcode colors, spacing, or font sizes.

### Mappers
When fetching from Supabase, always normalize data through `src/services/api/mappers.ts` before using it in the UI. This enforces consistent shapes regardless of schema changes.

## Sensitive Files

Never commit:
- `.env.local`, `.env.crawl` (real credentials)
- Any file containing `SUPABASE_SERVICE_ROLE_KEY` values
- Files matching patterns in `.gitignore`

## Documentation References

- `docs/ARCHITECTURE.md` — detailed folder structure, component guidelines, scaling patterns
- `docs/ARCHITECTURE_AUDIT.md` — known technical debt and refactoring priorities
- `docs/MVP_SPEC.md` — product spec, role definitions, data model, acceptance criteria
- `README.md` — setup instructions and crawler workflow
