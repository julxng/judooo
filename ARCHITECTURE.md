# Architecture

## Folder Structure

```text
src/
  app/
    layouts/
    providers/
    routes/
  assets/
  components/
    layout/
    shared/
    ui/
  design-system/
    patterns/
    primitives/
    tokens/
  features/
    about/
    admin/
    auth/
    events/
    marketplace/
    watchlist/
  hooks/
  lib/
  services/
    api/
    supabase/
  styles/
  types/
  utils/
```

## Design System Rules

- Tokens in `src/design-system/tokens` define color, spacing, typography, radius, motion, elevation, breakpoints, and layering.
- Shared UI primitives in `src/components/ui` are the default building blocks for buttons, inputs, cards, tabs, tables, dialogs, badges, and avatars.
- Layout primitives in `src/components/layout` standardize container width, stack/grid spacing, section headers, and dashboard/sidebar composition.
- Global styles in `src/styles/global.css` expose the semantic CSS variable layer and the baseline component classes used by primitives.

## Component Guidelines

- Feature modules own domain-specific rendering and behavior.
- Shared primitives stay generic and do not import feature code.
- Files should stay close to a single concern: screen, detail modal, filter bar, grid, hook, or service boundary.
- Normalize remote schema differences inside `src/services/api/mappers.ts`, not inside components.
- Prefer composing `Card`, `Button`, `Input`, `Modal`, `Tabs`, `Grid`, and `Section` before adding bespoke markup.

## Naming Conventions

- Components: `ProductCard.tsx` style PascalCase.
- Hooks: `useProductData.ts` style camelCase with `use` prefix.
- Services: `productService.ts` or `artNetworkApi.ts`.
- Types: `product.types.ts` when local to a feature, otherwise exported through feature type folders.
- Feature folders should keep `components`, `hooks`, `services`, `types`, and `utils` close to the domain they serve.

## Scaling Guidelines

- New business flows should be introduced as features under `src/features/<feature-name>`.
- Cross-feature sharing belongs in `src/components/shared`, `src/lib`, or `src/services` only when the dependency is truly generic.
- Keep feature services talking to the shared API facade, not directly to Supabase from UI components.
- Add lazy boundaries around secondary experiences and heavy integrations.
- Avoid reintroducing root-level runtime files outside `src/`; keep legacy wrappers thin and temporary.
