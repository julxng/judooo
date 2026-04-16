# Design System

## Single System
There is one active design system in this repo.

- Tokens live in `src/styles/tokens.ts`
- CSS variables and shared type utilities live in `src/app/globals.css`
- Shared component primitives live in `src/components/ui/`
- Shared structural CSS lives in `src/app/judooo-global.css`

The older parallel `src/tailwind-ui/` system has been removed. Do not recreate a second component or token layer.

## Visual Direction
- Editorial, monochrome, image-first
- Sharp borders, restrained shadows, small radii
- Sans-first typography with strong display sizing
- White canvas, black primary actions, neutral grays for support surfaces

## Usage Rules
- Import app code through the `@/*` alias only
- Prefer imports from `@/components/ui` for shared primitives
- Use tokens and CSS vars instead of hardcoded colors, spacing, or radius
- When token values change, update both `src/styles/tokens.ts` and `src/app/globals.css`
- Add new shared UI only in `src/components/ui/`
- If a pattern is needed app-wide, extend the current primitives instead of creating a parallel design system

## Core Primitives
- `Button`: `default`, `secondary`, `outline`, `ghost`, `destructive`
- `Card`: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`
- `Modal`, `Tabs`, `Badge`, `Avatar`, `Container`

## Shared Utility Classes
- `.surface-card`, `.surface-panel`, `.surface-stat`
- `.section-kicker`, `.display-heading`, `.section-heading`
- `.field`, `.field__label`, `.field__hint`
- `.empty-state`, `.auth-dialog__*`, `.ui-modal__*`

## Default For New Work
Build new pages and features on top of the current `@/components/ui` primitives and token variables first. Only add new abstractions when the same pattern is used in more than one live feature.
