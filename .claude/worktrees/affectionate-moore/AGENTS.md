# AGENTS.md — Judooo AI Coding Guidelines

## Core principles
- Make the smallest diff that solves the problem
- Read before editing — never assume file contents
- Plan before coding on any change touching >2 files
- No premature abstractions — 3 similar lines > a new utility

## Architecture
- Feature-first: new functionality goes in `src/features/<name>/`
- Feature modules contain: `components/`, `hooks/`, `api.ts`, `types.ts`
- No cross-feature imports — features must be fully isolated
- Shared logic only: move to `src/lib/` or `src/components/ui/` when used in 2+ features
- Global types live in `src/types/index.ts`

## Design system
- Always use design tokens — never hardcode colors, spacing, or radius
- Use CSS vars: `text-foreground`, `bg-background`, `border-border`, etc.
- Use `cn()` from `@/lib/utils` for conditional classes
- Use CVA for components with multiple variants
- New UI components go in `src/components/ui/`
- When changing token values: update BOTH `src/styles/tokens.ts` AND `src/app/globals.css`

## TypeScript
- Strict mode is on — no `any`, no `as unknown`
- Prefer `type` over `interface` unless extending
- Use `ApiResponse<T>` from `@/types` for all data-fetching return types
- Export types from each feature's `types.ts`

## File conventions
- Components: PascalCase (`Button.tsx`)
- Hooks: camelCase prefixed with `use` (`useExample.ts`)
- Utilities: camelCase (`utils.ts`)
- Import alias: `@/*` → `src/*` — never use relative `../../` imports

## What NOT to do
- Do not create new files without checking if one already exists
- Do not add dependencies without confirming with the user
- Do not add comments to code that is self-explanatory
- Do not refactor code outside the scope of the current task
- Do not skip the plan step for multi-file changes

## Verification checklist
Before marking work complete:
- [ ] `npm run type-check` passes
- [ ] No new `any` types introduced
- [ ] Design tokens used (no raw hex/px values)
- [ ] Feature module is self-contained
- [ ] Imports use `@/*` alias
