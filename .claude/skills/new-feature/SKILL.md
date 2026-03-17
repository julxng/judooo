---
name: new-feature
description: Scaffold a new isolated feature module under src/features/ with the standard directory structure and starter files
disable-model-invocation: true
---

# New Feature Scaffold

Creates a new feature module following the project's feature-isolation conventions.

## Usage

The user provides a feature name, e.g. `/new-feature notifications`.

## Steps

Given feature name `<name>`:

1. Create the directory `src/features/<name>/` with these subdirectories and files:

```
src/features/<name>/
├── components/
│   └── .gitkeep
├── hooks/
│   └── .gitkeep
├── utils/
│   └── .gitkeep
├── api.ts
├── types.ts
└── index.ts
```

2. **`types.ts`** — Create with a placeholder type:
```typescript
// Types for the <name> feature
export type {} // Add feature types here
```

3. **`api.ts`** — Create with the standard import pattern:
```typescript
import { api } from '@/services/api'
// Data access functions for the <name> feature
```

4. **`index.ts`** — Create re-exporting from components and types:
```typescript
export * from './types'
```

5. **Do NOT**:
   - Add the feature to any routing — the user will do that
   - Import from other features
   - Add dependencies
   - Create page components (those go in `src/app/`)

6. Report what was created and remind the user to:
   - Add page routes in `src/app/<name>/` when ready
   - Re-export any shared types from `src/types/index.ts`
