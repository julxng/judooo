# Architecture

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS · CVA

## Folder Map

| Path | Purpose |
|------|---------|
| `src/app/` | Pages, layouts, route groups (App Router) |
| `src/components/ui/` | Shared atomic UI (Button, Card, Container) |
| `src/features/<name>/` | Self-contained feature modules |
| `src/lib/` | Pure utility functions (`cn`, formatters) |
| `src/styles/` | Design tokens as typed TS constants |
| `src/types/` | Global TypeScript interfaces |
| `docs/` | Project documentation for humans and AI |

## Feature Module Structure
Each feature in `src/features/<name>/` follows:
```
<name>/
  components/   # UI scoped to this feature
  hooks/        # React hooks scoped to this feature
  api.ts        # Data fetching / server actions
  types.ts      # Types scoped to this feature
```

## Conventions
- Import alias: `@/*` → `src/*`
- No cross-feature imports — features are isolated
- Shared logic lives in `src/lib/` or `src/components/`
- Design tokens must be used via CSS vars — no raw hex in components
- All components receive className prop for overrides
