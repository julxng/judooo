# App — Next.js App Router

Page routes and application providers. Pages are thin wrappers that delegate to feature components.

## Structure

```
app/
├── layout.tsx           # Root layout: fonts, metadata, AppProviders wrapper
├── page.tsx             # Home page → events/components/HomePage
├── globals.css          # Tailwind base + CSS custom properties (design tokens)
├── judooo-global.css    # Additional global styles (notices, custom scrollbar, etc.)
├── providers/
│   ├── AppProviders.tsx     # Nests: LanguageProvider → NoticeProvider → AuthProvider
│   ├── LanguageProvider.tsx # Locale state (en/vi), persisted in localStorage
│   ├── NoticeProvider.tsx   # Toast notifications (notify + auto-dismiss)
│   ├── AuthProvider.tsx     # Auth context + AuthDialog rendering
│   └── index.ts
├── api/
│   └── translate/
│       └── route.ts         # POST /api/translate — bilingual translation endpoint
├── admin/page.tsx           # → admin/AdminPage
├── marketplace/page.tsx     # → marketplace/MarketplaceScreen
├── events/
│   ├── page.tsx             # → events/EventsScreen
│   └── [id]/page.tsx        # → events/EventDetailPage (dynamic route)
├── search/page.tsx          # → search/SearchResultsPage
├── profile/page.tsx         # → profile/ProfilePage
├── route-planner/page.tsx   # → events/RoutePlannerPage
├── submit-artwork/page.tsx  # → marketplace/SubmitArtworkPage
├── submit-event/page.tsx    # → events/SubmitEventPage
├── about/page.tsx           # → about/AboutPage
├── terms/page.tsx           # → about/LegalPage (terms variant)
└── privacy/page.tsx         # → about/LegalPage (privacy variant)
```

## Middleware (`src/middleware.ts`)

The middleware handles:
1. **Supabase session refresh** via `updateSession()`
2. **Auth redirects**: `/login` and `/signup` redirect to `/?auth=signin|signup`
3. **Protected routes**: non-public routes redirect unauthenticated users to sign-in
4. **Role-based access**: `/admin` requires `admin` role, `/dashboard/artist` requires `artist`/`admin`

Public routes: `/`, `/about`, `/admin`, `/events`, `/marketplace`, `/privacy`, `/profile`, `/route-planner`, `/search`, `/submit-event`, `/terms`

## Provider order

`AppProviders` nests providers outermost → innermost:
1. **LanguageProvider** — `useLanguage()` hook for `{ language, setLanguage }`
2. **NoticeProvider** — `useNotice()` hook for `{ notify(message, variant) }`
3. **AuthProvider** — `useAuth()` hook for full auth state + actions

## Page pattern

Each `page.tsx` follows this pattern:
1. Server component fetches initial data (e.g., `getInitialEvents()`)
2. Passes data as props to feature component (e.g., `<EventsScreen initialEvents={events} />`)
3. Feature component hydrates client-side, adds interactivity

## CSS

Two global CSS files:
- `globals.css` — Tailwind directives + CSS custom properties mapping to design tokens
- `judooo-global.css` — App-specific global styles (notice toasts, scrollbar, transitions)

Both are imported in `layout.tsx`.
