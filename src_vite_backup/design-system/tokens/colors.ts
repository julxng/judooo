export const colors = {
  brand: {
    primary: '#f14c23',
    primaryHover: '#d8431e',
    secondary: '#1a1a1a',
    accent: '#d96d3f',
  },
  surface: {
    base: '#fffdf9',
    muted: '#f5f1ea',
    raised: '#ffffff',
    inverse: '#171717',
  },
  border: {
    subtle: '#e7e0d6',
    strong: '#c5b8a6',
  },
  text: {
    primary: '#1f1b17',
    secondary: '#5e554b',
    muted: '#86796a',
    inverse: '#fffdf9',
  },
  status: {
    success: '#2f8f4f',
    warning: '#9e6700',
    danger: '#b42318',
    info: '#1d4ed8',
  },
} as const;

export type ColorToken = typeof colors;
