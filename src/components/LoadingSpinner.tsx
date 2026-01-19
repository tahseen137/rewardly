/**
 * LoadingSpinner - Loading indicator components
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color,
  message,
  style,
}: LoadingSpinnerProps) {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary.main;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

/**
 * LoadingOverlay - Full screen loading overlay
 */
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.overlay.medium }]}>
      <View
        style={[
          styles.overlayContent,
          {
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        {message && (
          <Text style={[styles.overlayMessage, { color: theme.colors.text.primary }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * InlineLoader - Inline loading indicator for buttons/inputs
 */
interface InlineLoaderProps {
  size?: number;
  color?: string;
}

export function InlineLoader({ size = 16, color }: InlineLoaderProps) {
  const theme = useTheme();

  return (
    <ActivityIndicator
      size="small"
      color={color || theme.colors.primary.main}
      style={{ transform: [{ scale: size / 20 }] }}
    />
  );
}

/**
 * PulsingDots - Animated pulsing dots loader
 */
interface PulsingDotsProps {
  color?: string;
  size?: number;
}

export function PulsingDots({ color, size = 8 }: PulsingDotsProps) {
  const theme = useTheme();
  const dotColor = color || theme.colors.primary.main;

  const animations = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animations.forEach((anim, index) => {
      animateDot(anim, index * 150);
    });
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: dotColor,
              opacity: anim,
              marginHorizontal: size / 4,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  overlayMessage: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
});

export default LoadingSpinner;
