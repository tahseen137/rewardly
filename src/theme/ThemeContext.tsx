/**
 * ThemeContext - Theme provider and hooks for theming support
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';

import { colors, darkColors, ColorScheme } from './colors';
import type { Colors } from './colors';
import { spacing, layout, Spacing, Layout } from './spacing';
import { textStyles, TextStyles } from './typography';
import { borderRadius, borderWidth, BorderRadius, BorderWidth } from './borders';
import { shadows, Shadows } from './shadows';

export interface Theme {
  colors: Colors;
  spacing: Spacing;
  layout: Layout;
  textStyles: TextStyles;
  borderRadius: BorderRadius;
  borderWidth: BorderWidth;
  shadows: Shadows;
  isDark: boolean;
}

const lightTheme: Theme = {
  colors,
  spacing,
  layout,
  textStyles,
  borderRadius,
  borderWidth,
  shadows,
  isDark: false,
};

const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  layout,
  textStyles,
  borderRadius,
  borderWidth,
  shadows,
  isDark: true,
};

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  forcedColorScheme?: ColorScheme;
}

/**
 * ThemeProvider - Provides theme context to the app
 * Automatically detects system color scheme
 */
export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [manualColorScheme, setManualColorScheme] = React.useState<ColorScheme | null>(null);

  const colorScheme: ColorScheme = forcedColorScheme ?? manualColorScheme ?? systemColorScheme ?? 'light';

  const theme = useMemo(() => {
    return colorScheme === 'dark' ? darkTheme : lightTheme;
  }, [colorScheme]);

  const toggleTheme = React.useCallback(() => {
    setManualColorScheme((prev) => {
      if (prev === null) {
        return systemColorScheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [systemColorScheme]);

  const value = useMemo(
    () => ({
      theme,
      colorScheme,
      toggleTheme,
    }),
    [theme, colorScheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme - Hook to access theme values
 */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return light theme as fallback when not in provider
    return lightTheme;
  }
  return context.theme;
}

/**
 * useThemeContext - Hook to access full theme context including toggle
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * useThemedStyles - Hook to create theme-aware styles
 *
 * @example
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background.primary,
 *     padding: theme.spacing.md,
 *   },
 * }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (theme: Theme) => T
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(createStyles(theme)), [theme, createStyles]);
}

/**
 * createThemedStylesheet - Create a stylesheet factory for consistent styling
 * Returns a hook that provides themed styles
 *
 * @example
 * const useStyles = createThemedStylesheet((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background.primary,
 *   },
 * }));
 *
 * // In component:
 * const styles = useStyles();
 */
export function createThemedStylesheet<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (theme: Theme) => T
): () => T {
  return function useStyles(): T {
    return useThemedStyles(createStyles);
  };
}
