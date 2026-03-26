export const colors = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.16 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.16 0 0)",
  popover: "oklch(1 0 0)",
  popoverForeground: "oklch(0.16 0 0)",
  primary: "oklch(0.16 0 0)",
  primaryForeground: "oklch(0.99 0 0)",
  secondary: "oklch(0.97 0 0)",
  secondaryForeground: "oklch(0.16 0 0)",
  muted: "oklch(0.985 0 0)",
  mutedForeground: "oklch(0.47 0 0)",
  accent: "oklch(0.95 0 0)",
  accentForeground: "oklch(0.16 0 0)",
  destructive: "oklch(0.56 0.2 25)",
  destructiveForeground: "oklch(0.99 0 0)",
  border: "oklch(0.84 0 0)",
  input: "oklch(0.8 0 0)",
  ring: "oklch(0.16 0 0)",
  surface: "oklch(0.99 0 0)",
  surfaceMuted: "oklch(0.975 0 0)",
  surfaceStrong: "oklch(0.93 0 0)",
  lineStrong: "oklch(0.72 0 0)",
  brandStrong: "oklch(0.1 0 0)",
  success: "oklch(0.5 0.12 150)",
  warning: "oklch(0.58 0.11 78)",
  info: "oklch(0.48 0.09 250)",
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  base: "0.25rem",
  sm: "0.125rem",
  md: "0.25rem",
  lg: "0.5rem",
  xl: "0.75rem",
} as const;

export const typography = {
  fontSans: "\"Inter\", ui-sans-serif, system-ui, sans-serif",
  fontDisplay: "\"Inter\", ui-sans-serif, system-ui, sans-serif",
  fontMono: "ui-monospace, SFMono-Regular, monospace",
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.5rem",
  },
} as const;

export const shadows = {
  soft: "0 10px 30px rgba(0, 0, 0, 0.035)",
  medium: "0 18px 40px rgba(0, 0, 0, 0.06)",
  focus: "0 0 0 3px rgba(0, 0, 0, 0.14)",
} as const;

export const tokens = { colors, spacing, radius, typography, shadows } as const;
export type Tokens = typeof tokens;
