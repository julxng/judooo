# Design System

## Tokens
Single source of truth: `src/styles/tokens.ts` (TypeScript, light mode defaults).
CSS custom properties: `src/app/globals.css` (includes dark mode overrides).
**When changing token values, update both files.**

### Colors
| Token | CSS Var | Usage |
|-------|---------|-------|
| background | `--color-background` | Page background |
| foreground | `--color-foreground` | Primary text |
| primary | `--color-primary` | CTAs, key actions |
| primary-foreground | `--color-primary-foreground` | Text on primary |
| secondary | `--color-secondary` | Secondary surfaces |
| muted | `--color-muted` | Subtle backgrounds |
| muted-foreground | `--color-muted-foreground` | Subdued text |
| border | `--color-border` | Dividers, outlines |

### Spacing
Scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` px

### Border Radius
| Token | Value |
|-------|-------|
| sm | 4px |
| md | 6px |
| lg | 8px |
| xl | 12px |

### Typography
- Font: Inter (sans-serif)
- Scale: `xs · sm · base · lg · xl · 2xl · 3xl`

## Components
All shared components live in `src/components/ui/`.

### Button
Variants: `default · secondary · outline · ghost · destructive`
Sizes: `sm · md · lg`

### Card
Composable: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
Use `Card` alone for simple cases, or compose sub-components for structured layouts.

### Container
Max-width wrapper. Sizes: `sm · md · lg · xl · full`

## Rules
- Use design tokens — never hardcode colors, spacing, or radius
- Use `cn()` from `src/lib/utils` for conditional classes
- Use CVA for multi-variant components
- When changing tokens: update `tokens.ts` **and** `globals.css`
