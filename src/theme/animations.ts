/**
 * Animation tokens for consistent motion design
 */

// Duration values in milliseconds
export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Easing curves
export const easing = {
  linear: [0, 0, 1, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.175, 0.885, 0.32, 1.275] as const,
} as const;

// Common animation configs for Animated API
export const animationConfig = {
  // Spring configs
  springGentle: {
    tension: 100,
    friction: 10,
    useNativeDriver: true,
  },
  springBouncy: {
    tension: 180,
    friction: 8,
    useNativeDriver: true,
  },
  springStiff: {
    tension: 300,
    friction: 20,
    useNativeDriver: true,
  },

  // Timing configs
  fadeIn: {
    duration: duration.normal,
    useNativeDriver: true,
  },
  fadeOut: {
    duration: duration.fast,
    useNativeDriver: true,
  },
  slideIn: {
    duration: duration.normal,
    useNativeDriver: true,
  },
  scale: {
    duration: duration.fast,
    useNativeDriver: true,
  },
} as const;

export type Duration = typeof duration;
export type Easing = typeof easing;
