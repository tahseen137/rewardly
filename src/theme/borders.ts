/**
 * Border tokens for consistent rounded corners and borders
 */

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,

  // Semantic
  button: 12,
  card: 12,
  input: 10,
  modal: 16,
  badge: 10,
  chip: 20,
  fab: 28,
  avatar: 9999,
} as const;

export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

export type BorderRadius = typeof borderRadius;
export type BorderWidth = typeof borderWidth;
