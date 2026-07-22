/**
 * Theme - Design System Entry Point
 * Exports all theme tokens and utilities
 */

export { colors, darkColors } from './colors';
export type { Colors, ColorScheme } from './colors';

export { spacing, layout } from './spacing';
export type { Spacing, Layout } from './spacing';

export {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
} from './typography';
export type { TextStyles } from './typography';

export { borderRadius, borderWidth } from './borders';
export type { BorderRadius, BorderWidth } from './borders';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

export { duration, easing, animationConfig } from './animations';
export type { Duration, Easing } from './animations';

export { ThemeProvider, useTheme, useThemedStyles } from './ThemeContext';
export type { Theme } from './ThemeContext';
