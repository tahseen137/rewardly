/**
 * Color tokens for the design system
 * Semantic color naming for consistent theming
 */

export const colors = {
  // Primary brand colors
  primary: {
    main: '#007AFF',
    light: '#4DA3FF',
    dark: '#0055B3',
    contrast: '#FFFFFF',
  },

  // Secondary/accent colors
  secondary: {
    main: '#5856D6',
    light: '#7A79E0',
    dark: '#3634A3',
    contrast: '#FFFFFF',
  },

  // Semantic colors
  success: {
    main: '#34C759',
    light: '#A8E6B4',
    dark: '#248A3D',
    background: '#E8F5E9',
    contrast: '#FFFFFF',
  },

  error: {
    main: '#FF3B30',
    light: '#FF6B63',
    dark: '#C62828',
    background: '#FFEBEE',
    contrast: '#FFFFFF',
  },

  warning: {
    main: '#FF9500',
    light: '#FFB84D',
    dark: '#C77700',
    background: '#FFF9E6',
    contrast: '#000000',
  },

  info: {
    main: '#5AC8FA',
    light: '#8DDBFC',
    dark: '#0A84FF',
    background: '#E3F2FD',
    contrast: '#000000',
  },

  // Neutral colors (light theme)
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F2F2F7',
    gray200: '#E5E5EA',
    gray300: '#D1D1D6',
    gray400: '#C7C7CC',
    gray500: '#8E8E93',
    gray600: '#636366',
    gray700: '#48484A',
    gray800: '#3A3A3C',
    gray900: '#1C1C1E',
    black: '#000000',
  },

  // Background colors (light theme)
  background: {
    primary: '#F2F2F7',
    secondary: '#FFFFFF',
    tertiary: '#F9F9F9',
    elevated: '#FFFFFF',
  },

  // Text colors (light theme)
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#8E8E93',
    disabled: '#C7C7CC',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#E5E5EA',
    medium: '#D1D1D6',
    dark: '#C7C7CC',
    focus: '#007AFF',
  },

  // Reward type colors (app-specific)
  rewards: {
    cashback: '#34C759',
    points: '#FFD700',
    miles: '#007AFF',
    hotel: '#FF9500',
  },

  // Overlay colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

// Dark theme color overrides
export const darkColors = {
  ...colors,

  primary: {
    main: '#0A84FF',
    light: '#4DA3FF',
    dark: '#0055B3',
    contrast: '#FFFFFF',
  },

  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
    elevated: '#2C2C2E',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#8E8E93',
    disabled: '#48484A',
    inverse: '#000000',
  },

  border: {
    light: '#38383A',
    medium: '#48484A',
    dark: '#636366',
    focus: '#0A84FF',
  },

  success: {
    ...colors.success,
    main: '#30D158',
    background: '#1C3829',
  },

  error: {
    ...colors.error,
    main: '#FF453A',
    background: '#3C1F1F',
  },

  warning: {
    ...colors.warning,
    main: '#FFD60A',
    background: '#3D3520',
  },
} as const;

// Color palette structure type with string values
interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrast: string;
}

interface SemanticColorPalette extends ColorPalette {
  background: string;
}

export interface Colors {
  primary: ColorPalette;
  secondary: ColorPalette;
  success: SemanticColorPalette;
  error: SemanticColorPalette;
  warning: SemanticColorPalette;
  info: SemanticColorPalette;
  neutral: {
    white: string;
    gray50: string;
    gray100: string;
    gray200: string;
    gray300: string;
    gray400: string;
    gray500: string;
    gray600: string;
    gray700: string;
    gray800: string;
    gray900: string;
    black: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
    focus: string;
  };
  rewards: {
    cashback: string;
    points: string;
    miles: string;
    hotel: string;
  };
  overlay: {
    light: string;
    medium: string;
    dark: string;
  };
}

export type ColorScheme = 'light' | 'dark';
