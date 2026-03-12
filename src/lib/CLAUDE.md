# Lib — Shared Utilities

Utility functions and helpers used across multiple features.

## Structure

```
lib/
├── supabase/
│   ├── env.ts           # supabaseUrl, supabaseAnonKey, hasSupabaseEnv (reads NEXT_PUBLIC_* and VITE_* env vars)
│   ├── client.ts        # Browser-side Supabase client (createBrowserClient from @supabase/ssr)
│   ├── server.ts        # Server-side Supabase client (for server components/actions)
│   └── middleware.ts     # Supabase session refresh middleware (updateSession)
├── i18n/
│   ├── translations.ts  # Static UI translations (nav, footer, home, about, terms, privacy) for vi/en
│   ├── content.ts       # Bilingual content resolution + translation enrichment
│   └── index.ts         # Re-exports from translations.ts (Locale type)
├── utils.ts             # cn(), formatDate(), slugify()
├── date.ts              # todayIso(), shiftIsoDate(), formatDateRange()
└── format.ts            # formatCurrency()
```

## i18n system

Two separate i18n systems coexist:

1. **Static UI strings** (`translations.ts`): `translations` record maps `Locale` (`'vi' | 'en'`) to a typed schema covering nav, footer, home page, about, terms, privacy. Used in layout/page components.

2. **Dynamic content** (`content.ts`): handles bilingual fields on events/artworks.
   - `detectContentLocale(text)` — detects Vietnamese vs English via character patterns
   - `getLocalizedValue(language, viValue, enValue, fallback)` — picks the right translation at render time
   - `enrichEventTranslations(event)` / `enrichArtworkTranslations(artwork)` — fills missing translations by calling `/api/translate` (batch). Used on create/update.

There is also an older dictionary-based system in `index.ts` that exports `t(key, language)` — this uses a flat key-value dictionary (e.g., `'nav.events'`, `'hero.events.title'`). It's separate from `translations.ts`.

## Supabase helpers

- `env.ts` reads env vars with fallback from `VITE_*` prefixed vars (legacy support)
- `client.ts` creates browser-side client using `@supabase/ssr`
- `server.ts` creates server-side client for server components
- `middleware.ts` exports `updateSession()` — refreshes Supabase auth session on each request

## Key exports

| Function | File | Purpose |
|---|---|---|
| `cn(...inputs)` | `utils.ts` | Tailwind class merging (clsx + twMerge) |
| `formatDate(date, locale)` | `utils.ts` | Localized date string |
| `slugify(str)` | `utils.ts` | URL-safe slug |
| `todayIso()` | `date.ts` | Today as YYYY-MM-DD |
| `shiftIsoDate(days)` | `date.ts` | Date offset as YYYY-MM-DD |
| `formatDateRange(start, end, locale)` | `date.ts` | "Jan 5 - Jan 12" format |
| `formatCurrency(value, currency)` | `format.ts` | "1,000,000 VND" format |
| `getLocalizedValue(...)` | `i18n/content.ts` | Bilingual field resolution |
| `detectContentLocale(text)` | `i18n/content.ts` | Vietnamese detection |
