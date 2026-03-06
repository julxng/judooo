# Architecture Audit

## Current Folder Structure

```text
/
  App.tsx
  index.tsx
  index.html
  components/
  services/
  scripts/
  supabase/
  docs/
  public/
  constants.tsx
  translations.ts
  types.ts
```

## Findings

### 1. Architectural Problems

- The runtime app is flat and root-level. Views, domain models, services, translations, and bootstrapping all live side by side.
- `App.tsx` owns navigation, auth, session hydration, data fetching, filters, optimistic updates, modal state, and screen rendering.
- `services/apiService.ts` combines local persistence, remote Supabase access, request fallback logic, data normalization, and upload behavior in a single module.
- There is no feature boundary for events, marketplace, watchlist, admin, or auth concerns.
- UI composition depends on ad hoc component imports instead of a reusable design system or layout system.

### 2. Technical Debt

- `index.html` depends on the Tailwind CDN and inline theme config at runtime instead of versioned local styles.
- There is no lint configuration, no test setup, and no architecture documentation.
- Domain types mix API shapes, UI shapes, and legacy schema aliases in a single file.
- Translations are a single inline dictionary function with no namespacing or feature ownership.
- The build relies on a root alias only (`@/*`) instead of targeted module aliases.

### 3. Duplicate Logic

- Event and artwork fallback/default shaping is repeated across app state and API service logic.
- Auth/write guards are repeated in several handlers in `App.tsx`.
- Modal overlays, card shells, buttons, and form field styling are duplicated across components.
- Date formatting and currency formatting are implemented locally in multiple components.

### 4. Dead Code

- `components/HomePage.tsx` is not imported anywhere.
- `services/geminiService.ts` is not imported anywhere.
- `OptimizationResult` and `FilterConfig` in `types.ts` are unused.
- `isOptimizing`, `pendingWritesCount`, and `searchQuery` state wiring in `App.tsx` are incomplete or unused in the UI.
- `package-lock 2.json` is a stale duplicate lockfile.

### 5. Overly Large Files

- `services/apiService.ts`: 1049 lines
- `App.tsx`: 684 lines
- `components/AdminDashboard.tsx`: 334 lines
- `components/EventDetail.tsx`: 241 lines

These files violate the intended component/service sizing rule and hide important domain boundaries.

### 6. Separation of Concerns Violations

- `App.tsx` mixes orchestration, data access, session logic, permissions, and rendering.
- `components/AdminDashboard.tsx` mixes CSV parsing, upload logic, event editing, artwork creation, and table rendering.
- `components/MapView.tsx` mixes imperative Leaflet lifecycle, popup templating, and layout presentation.
- `components/EventDetail.tsx` mixes media gallery logic, sharing logic, routing behavior, and related artwork rendering.

### 7. UI Inconsistencies

- Currency is shown as `$` in artwork cards/details while event pricing is rendered as `VND`.
- VN/EN copy is mixed inside the same surfaces.
- Buttons, input borders, spacing, and corner treatment vary between screens without a shared primitive layer.
- Several modals use different overlay densities, paddings, typography rules, and close affordances.
- Responsive spacing is inconsistent across hero sections, cards, detail surfaces, and admin tools.

### 8. Naming Inconsistencies

- File naming mixes `View`, `Detail`, `Dashboard`, `Card`, and generic `Layout` without a consistent convention.
- Type fields mix `snake_case` and `camelCase` in the same interfaces.
- `imageUrl`/`image_url`, `createdBy`/`created_by`, and `startDate`/`start_at` coexist in UI types instead of being normalized at the service boundary.
- `MapView` is an English label while translation keys expose `MapView` as user-facing copy.

### 9. Performance Issues

- The production bundle is a single 562 kB JS chunk.
- `leaflet` is part of the main bundle even when the map tab is never opened.
- The app eagerly imports admin, about, and detail surfaces instead of lazy loading secondary flows.
- `App.tsx` sets a polling interval for pending writes even though the count is not surfaced meaningfully.
- `MapView` uses a static DOM id and imperative HTML popup strings, increasing fragility and XSS risk.

### 10. Dependencies That Are Unused or Unnecessary

- `@google/genai` is installed but unused.
- `react-leaflet` is installed but unused; the code uses `leaflet` directly.
- The runtime Tailwind CDN means the project is styled without a managed local dependency.

## Refactor Goals

- Move the runtime to `src/` with feature-driven modules.
- Split the API layer into smaller local/remote/mapping modules.
- Introduce design tokens, shared UI primitives, and layout primitives.
- Lazy load non-critical screens and the map experience.
- Normalize naming and data mapping at the service boundary.
- Remove dead code, stale lockfiles, and unused dependencies.
