# Components — Shared UI

Reusable UI components used across multiple features.

## Structure

```
components/
├── ui/               # Design system primitives
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Checkbox.tsx
│   ├── Container.tsx
│   ├── Drawer.tsx
│   ├── Dropdown.tsx
│   ├── Footer.tsx
│   ├── Input.tsx
│   ├── Logo.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   ├── Radio.tsx
│   ├── Select.tsx
│   ├── Table.tsx
│   ├── Tabs.tsx
│   ├── Textarea.tsx
│   ├── Tooltip.tsx
│   └── index.ts       # Barrel export (all ui components)
├── layout/           # Layout primitives
│   ├── Container.tsx  # Note: separate from ui/Container
│   ├── DashboardLayout.tsx
│   ├── Grid.tsx
│   ├── Page.tsx
│   ├── Section.tsx
│   ├── SidebarLayout.tsx
│   ├── SiteShell.tsx
│   ├── Stack.tsx
│   └── index.ts       # Barrel export (all layout components)
└── shared/           # Domain-aware shared components
    ├── Field.tsx          # Form field wrapper
    ├── EmptyState.tsx     # Empty state placeholder
    ├── AsyncStatusBanner.tsx  # Loading/error status banner
    └── index.ts
```

## Conventions

- All components use `cn()` from `@/lib/utils` for class merging
- Design tokens from `src/styles/tokens.ts` and CSS variables — never hardcode colors/spacing
- Use CVA (`class-variance-authority`) for components with multiple visual variants
- New primitives go in `ui/`, new layouts in `layout/`, domain-shared in `shared/`
- Import via barrel: `import { Button, Card, Modal } from '@/components/ui'`

## ui/ vs layout/

- **ui/** — interactive primitives (Button, Input, Modal, etc.) and display elements (Badge, Avatar, etc.)
- **layout/** — structural containers (Page, Section, Grid, Stack) and app-level layouts (SidebarLayout, DashboardLayout, SiteShell)

Note: there are two `Container.tsx` files — `ui/Container.tsx` and `layout/Container.tsx`. They serve different purposes. Check the imports when working with containers.
