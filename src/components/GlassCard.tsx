/**
 * GlassCard Component
 *
 * Renders a card with glass morphism effect (frosted glass look)
 * Uses expo-blur for native platforms and CSS backdrop-filter for web
 */

import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

interface GlassCardProps extends ViewProps {
  intensity?: number; // Blur intensity (0-100), default 25
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = 25,
  children,
  style,
  ...viewProps
}) => {
  // Web fallback using CSS backdrop-filter
  if (Platform.OS === 'web') {
    return (
      <View
        {...viewProps}
        style={[
          styles.container,
          {
            backgroundColor: 'rgba(15, 21, 40, 0.8)', // #0F1528 at 80%
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          } as any,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Native implementation using expo-blur
  return (
    <View style={[styles.wrapper, style]} {...viewProps}>
      <BlurView intensity={intensity} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.md, // 12px
    borderWidth: 1,
    borderColor: colors.border.glass, // 50% opacity
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 21, 40, 0.8)', // Fallback/overlay
  },
  container: {
    borderRadius: borderRadius.md, // 12px
    borderWidth: 1,
    borderColor: colors.border.glass,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
