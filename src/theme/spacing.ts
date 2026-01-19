/**
 * Spacing tokens for consistent layout
 * Based on 4px grid system
 */

export const spacing = {
  // Base spacing scale
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,

  // Semantic spacing
  screenPadding: 16,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  inputPadding: 14,
  buttonPadding: {
    horizontal: 24,
    vertical: 14,
  },
  listItemPadding: {
    horizontal: 16,
    vertical: 14,
  },
  modalPadding: 16,
} as const;

// Layout constants
export const layout = {
  // Content widths
  maxContentWidth: 600,
  maxModalWidth: 500,

  // Common heights
  headerHeight: 56,
  tabBarHeight: 49,
  searchInputHeight: 48,
  buttonHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  fabSize: 56,
  iconButtonSize: 44,
  avatarSize: {
    small: 32,
    medium: 40,
    large: 56,
  },
} as const;

export type Spacing = typeof spacing;
export type Layout = typeof layout;
