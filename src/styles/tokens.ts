export const colors = {
  background: "#ffffff",
  foreground: "#1a1a1a",
  card: "#ffffff",
  cardForeground: "#1a1a1a",
  popover: "#ffffff",
  popoverForeground: "#1a1a1a",
  primary: "#c05c2c",
  primaryForeground: "#faf8f0",
  secondary: "#f5f5f6",
  secondaryForeground: "#2c2c33",
  muted: "#f7f7f7",
  mutedForeground: "#737373",
  accent: "#f7f7f7",
  accentForeground: "#282828",
  destructive: "#d44020",
  border: "#e8e8e8",
  input: "#e8e8e8",
  ring: "#a8a8a8",
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
  base: "0.625rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "0.875rem",
} as const;

export const typography = {
  fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontMono: "ui-monospace, SFMono-Regular, monospace",
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
} as const;

export const tokens = { colors, spacing, radius, typography } as const;
export type Tokens = typeof tokens;
