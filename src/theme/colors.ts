/**
 * Color tokens for the design system
 * Dark blue/green finance theme from web redesign
 * HSL values converted to Hex for React Native compatibility
 */

export const colors = {
  // Primary brand colors (bright green)
  primary: {
    main: '#1DDB82', // hsl(142 76% 46%) - bright green
    light: '#4DE89D',
    dark: '#14B66F',
    contrast: '#0A0E1F', // background color for contrast
    // Opacity variants for backgrounds
    bg10: 'rgba(29, 219, 130, 0.1)',
    bg20: 'rgba(29, 219, 130, 0.2)',
  },

  // Secondary/accent colors (purple)
  accent: {
    main: '#8B5CF6', // hsl(262 83% 58%) - purple
    light: '#A78BFA',
    dark: '#7C3AED',
    contrast: '#F8FAFC',
    bg10: 'rgba(139, 92, 246, 0.1)',
    bg20: 'rgba(139, 92, 246, 0.2)',
  },

  // Semantic colors
  success: {
    main: '#1DDB82', // Same as primary
    light: '#4DE89D',
    dark: '#14B66F',
    background: 'rgba(29, 219, 130, 0.1)',
    contrast: '#F8FAFC',
  },

  error: {
    main: '#F04438', // hsl(0 84% 60%) - destructive
    light: '#F97066',
    dark: '#D92D20',
    background: 'rgba(240, 68, 56, 0.1)',
    contrast: '#F8FAFC',
  },

  warning: {
    main: '#F79009', // hsl(38 92% 50%) - warning
    light: '#FDB022',
    dark: '#DC6803',
    background: 'rgba(247, 144, 9, 0.1)',
    contrast: '#0A0E1F',
  },

  info: {
    main: '#0BA5EC', // hsl(199 89% 48%) - info
    light: '#36BFFA',
    dark: '#0086C9',
    background: 'rgba(11, 165, 236, 0.1)',
    contrast: '#F8FAFC',
  },

  // Dark theme neutrals
  neutral: {
    white: '#FFFFFF',
    gray50: '#F8FAFC', // foreground - hsl(210 40% 98%)
    gray100: '#E2E8F0',
    gray200: '#CBD5E1',
    gray300: '#94A3B8',
    gray400: '#7C8BA1', // muted-foreground - hsl(215 20% 55%)
    gray500: '#64748B',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1E293B',
    gray900: '#0F172A',
    black: '#000000',
  },

  // Background colors (dark blue theme)
  background: {
    primary: '#0A0E1F', // hsl(222 47% 6%) - main background
    secondary: '#0F1528', // hsl(222 47% 9%) - card background
    tertiary: '#1D2639', // hsl(217 33% 17%) - secondary
    elevated: '#171D30', // Slightly elevated card
    muted: '#17202F', // hsl(217 33% 14%) - muted
  },

  // Text colors (light on dark)
  text: {
    primary: '#F8FAFC', // hsl(210 40% 98%) - foreground
    secondary: '#7C8BA1', // hsl(215 20% 55%) - muted-foreground
    tertiary: '#64748B',
    disabled: '#475569',
    inverse: '#0A0E1F',
  },

  // Border colors
  border: {
    light: '#212B3E', // hsl(217 33% 18%) - border
    medium: '#2D3B54',
    dark: '#3A4A6B',
    focus: '#1DDB82', // primary color
    // Opacity variant for glass effect
    glass: 'rgba(33, 43, 62, 0.5)',
  },

  // Reward type colors (app-specific)
  rewards: {
    cashback: '#1DDB82', // primary green
    points: '#F79009', // warning orange
    miles: '#0BA5EC', // info blue
    hotel: '#8B5CF6', // accent purple
  },

  // Overlay colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(10, 14, 31, 0.8)', // Semi-transparent background
  },

  // Gradients (for gradient components)
  gradients: {
    primary: ['#1DDB82', '#14B8A6'], // Green gradient (135deg in CSS)
    accent: ['#8B5CF6', '#7C3AED'], // Purple gradient
    card: ['#0F1528', '#0A0E1F'], // Card gradient (top to bottom)
  },
} as const;

// Dark theme (this is our default theme, matching web redesign)
export const darkColors = {
  ...colors,
} as const;

// Color palette structure type with string values
interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrast: string;
  bg10: string;
  bg20: string;
}

interface SemanticColorPalette {
  main: string;
  light: string;
  dark: string;
  background: string;
  contrast: string;
}

export interface Colors {
  primary: ColorPalette;
  accent: ColorPalette;
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
    muted: string;
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
    glass: string;
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
    backdrop: string;
  };
  gradients: {
    primary: string[];
    accent: string[];
    card: string[];
  };
}

export type ColorScheme = 'light' | 'dark';
