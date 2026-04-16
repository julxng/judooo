# CLAUDE.md — Judooo

## What is Judooo?

Judooo is a Vietnamese art discovery platform — a Next.js 15 app that aggregates art exhibitions, workshops, auctions, and artworks across Vietnam. It serves three user segments:

1. **Art lovers / collectors** — browse events, discover artworks, save items, plan gallery visit routes
2. **Artists & gallery managers** — submit events and artworks (with moderation pipeline)
3. **Admins** — approve submissions, manage catalog, bulk-import data

The app is bilingual (Vietnamese / English) with automatic translation via `/api/translate`. All text fields on events and artworks carry `_vie` / `_en` suffixed columns alongside a canonical field.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + design tokens (`src/styles/tokens.ts` ↔ `globals.css`) |
| UI primitives | CVA (`class-variance-authority`), `cn()` from `@/lib/utils` |
| Icons | `lucide-react` |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| Maps | Leaflet |
| Fonts | Instrument Sans (Google Fonts) |

## Architecture overview

```
src/
├── app/               # Next.js App Router pages & providers
│   ├── providers/     # AppProviders → Language → Notice → Auth (nested)
│   ├── api/           # Route handlers (translate)
│   └── [route]/       # Page components (thin wrappers over features)
├── features/          # Feature-first modules (isolated)
│   ├── events/        # Art events: listing, detail, filters, map, route planner
│   ├── marketplace/   # Artworks: catalog, filters, bidding, artwork detail
│   ├── auth/          # Authentication: Supabase OAuth + email/password + roles
│   ├── admin/         # Admin dashboard (event/artwork/user management)
│   ├── search/        # Cross-catalog search (events + artworks)
│   ├── watchlist/     # Saved events view
│   ├── profile/       # User profile page
│   └── about/         # About page + legal pages (terms, privacy)
├── services/          # Data access layer
│   ├── api/           # Unified API facade with local-first + Supabase sync
│   └── supabase/      # Supabase client setup
├── components/        # Shared UI components
│   ├── ui/            # Primitives: Button, Card, Modal, Input, Table, etc.
│   ├── layout/        # Page, Section, Grid, Stack, SidebarLayout, etc.
│   └── shared/        # Field, EmptyState, AsyncStatusBanner
├── lib/               # Shared utilities
│   ├── supabase/      # Server/client/middleware Supabase helpers + env
│   ├── i18n/          # Translation dictionary + bilingual content resolution
│   ├── utils.ts       # cn(), formatDate(), slugify()
│   ├── date.ts        # todayIso(), shiftIsoDate(), formatDateRange()
│   └── format.ts      # formatCurrency()
├── hooks/             # Global hooks (useWatchlist, useCatalogData)
├── styles/            # Design tokens (colors, spacing, radius, typography, shadows)
├── types/             # Global types (ApiResponse, PaginatedResponse, re-exports)
└── assets/            # Branding constants
```

## Data flow: local-first architecture

The app uses an **offline-first pattern**:

1. **`artNetworkApi.ts`** is the unified API facade (exported as `api`). Every method:
   - Reads from `localDb` (in-memory + localStorage mirror)
   - If Supabase is available (`shouldUseRemote()`), fetches from remote and merges
   - On write, attempts remote first; on failure, writes locally and enqueues a `PendingWrite`
2. **`localDb.ts`** manages `LocalDbState` in `localStorage` under key `judooo_local_db_v1`
3. **`remoteApi.ts`** contains all direct Supabase calls
4. **`mappers.ts`** normalizes Supabase rows (snake_case) to app types (camelCase), with dual-schema fallbacks for legacy column names
5. **`shared.ts`** has `DATA_MODE` (`auto`/`local`/`supabase`), `mergeById()`, `withTimeout()`

`DATA_MODE` is controlled by env var `NEXT_PUBLIC_DATA_MODE`. When set to `local`, the app runs entirely offline with fixture data.

## Bilingual content system

Every user-facing text field on events/artworks has three variants:
- Canonical field (e.g., `title`) — defaults to English
- Vietnamese field (`name_vie`, `description_vie`, etc.)
- English field (`name_en`, `description_en`, etc.)

On create/update, `enrichEventTranslations()` / `enrichArtworkTranslations()` in `src/lib/i18n/content.ts` auto-detects the source language and fills missing translations via `/api/translate`.

`getLocalizedValue(language, viValue, enValue, fallback)` resolves the correct string at render time.

## Auth & roles

| Role | Capabilities |
|---|---|
| `art_lover` | Browse, save, build routes |
| `artist_pending` | Submit (goes to moderation) |
| `artist` | Submit (auto-approved) |
| `gallery_manager_pending` | Submit (goes to moderation) |
| `gallery_manager` / `gallery` | Submit (auto-approved) |
| `admin` | Full access, approve/reject submissions |

Auth flow: Supabase Auth (Google OAuth or email/password). A dev/test admin mode exists via `localStorage` key `judooo_dev_user`. Role checks live in `src/features/auth/utils/roles.ts`.

## Provider nesting order

`AppProviders` wraps in this order (outermost first):
1. `LanguageProvider` — `useLanguage()` returns `{ language: Locale, setLanguage }`
2. `NoticeProvider` — `useNotice()` returns `{ notify(message, variant) }`
3. `AuthProvider` — `useAuth()` returns full auth controller + renders `AuthDialog`

## Route planner

Events can be saved to a "route" (visit plan). The route optimizer (`src/features/events/utils/route-optimizer.ts`) uses:
- Haversine distance calculation
- Nearest-neighbor heuristic + 2-opt improvement
- Produces both "saved order" and "optimized" route plans with distance/time summaries

## Supabase tables

| Table | Purpose |
|---|---|
| `events` | Art events (dual-schema: V2 snake_case + legacy camelCase) |
| `artworks` | Artworks for sale/auction |
| `profiles` | User profiles (synced from Supabase Auth) |
| `watchlist` | User ↔ event bookmarks |
| `bids` | Auction bids |

The DB schema has evolved — mappers and remote API functions include fallback logic for both `snake_case` and `camelCase` column names. When modifying `remoteApi.ts` or `mappers.ts`, always preserve dual-schema fallbacks.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_DATA_MODE` | `auto` (default), `local`, or `supabase` |
| `VITE_SUPABASE_URL` | Legacy fallback for Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Legacy fallback for Supabase anon key |

## Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run type-check     # TypeScript check (tsc --noEmit)
npm run lint           # ESLint
```

## Coding guidelines

### Make the smallest diff
- Read before editing — never assume file contents
- Plan before coding on any change touching >2 files
- No premature abstractions — 3 similar lines > a new utility

### Feature isolation
- New functionality goes in `src/features/<name>/`
- Feature modules contain: `components/`, `hooks/`, `api.ts`, `types.ts`, `utils/`, `services/`
- No cross-feature imports — features must be fully isolated
- Shared logic only: move to `src/lib/` or `src/components/ui/` when used in 2+ features
- Global types live in `src/types/index.ts`

### Design system
- Always use design tokens — never hardcode colors, spacing, or radius
- Use CSS vars: `text-foreground`, `bg-background`, `border-border`, etc.
- Use `cn()` from `@/lib/utils` for conditional classes
- Use CVA for components with multiple variants
- New UI components go in `src/components/ui/`
- When changing token values: update BOTH `src/styles/tokens.ts` AND `src/app/globals.css`

### TypeScript
- Strict mode — no `any`, no `as unknown`
- Prefer `type` over `interface` unless extending
- Use `ApiResponse<T>` from `@/types` for all data-fetching return types
- Export types from each feature's `types.ts` (re-exported via `src/types/index.ts`)

### File conventions
- Components: PascalCase (`Button.tsx`)
- Hooks: camelCase prefixed with `use` (`useExample.ts`)
- Utilities: camelCase (`utils.ts`)
- Import alias: `@/*` → `src/*` — never use relative `../../` imports

### What NOT to do
- Do not create new files without checking if one already exists
- Do not add dependencies without confirming with the user
- Do not add comments to code that is self-explanatory
- Do not refactor code outside the scope of the current task
- Do not skip the plan step for multi-file changes

### Git workflow
- Always commit and push after completing each user request — do not wait to be asked

### Verification checklist
Before marking work complete:
- [ ] `npm run type-check` passes
- [ ] No new `any` types introduced
- [ ] Design tokens used (no raw hex/px values)
- [ ] Feature module is self-contained (no cross-feature imports)
- [ ] Imports use `@/*` alias
- [ ] Bilingual fields handled correctly (canonical + `_vie` + `_en`)
