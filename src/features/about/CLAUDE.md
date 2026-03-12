# About Feature

Static content pages: About, Terms, and Privacy.

## Structure

```
about/
├── components/
│   ├── AboutPage.tsx    # About page content
│   ├── LegalPage.tsx    # Reusable legal page (terms or privacy)
│   └── index.ts
```

## Content source

All text comes from `src/lib/i18n/translations.ts` — the `translations` record contains full Vietnamese and English copy for:
- `about.title` / `about.body`
- `terms.title` / `terms.intro` / `terms.items[]` / `terms.outro`
- `privacy.title` / `privacy.intro` / `privacy.items[]` / `privacy.outro`

Pages use `useLanguage()` to select the active locale and render the corresponding translation.
