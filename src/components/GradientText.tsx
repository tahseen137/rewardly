/**
 * GradientText Component
 *
 * Renders text with a gradient effect using expo-linear-gradient and MaskedView
 * Cross-platform support for iOS, Android, and Web
 */

import React from 'react';
import { Text, TextProps, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { colors } from '../theme/colors';

interface GradientTextProps extends TextProps {
  variant?: 'primary' | 'accent';
  children: React.ReactNode;
}

export const GradientText: React.FC<GradientTextProps> = ({
  variant = 'primary',
  children,
  style,
  ...textProps
}) => {
  const gradientColors =
    variant === 'primary' ? colors.gradients.primary : colors.gradients.accent;

  // Web fallback using inline styles
  if (Platform.OS === 'web') {
    const webGradient =
      variant === 'primary'
        ? 'linear-gradient(135deg, #1DDB82, #14B8A6)'
        : 'linear-gradient(135deg, #8B5CF6, #7C3AED)';

    return (
      <Text
        {...textProps}
        style={[
          style,
          {
            background: webGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } as any,
        ]}
      >
        {children}
      </Text>
    );
  }

  // Native implementation using MaskedView
  return (
    <MaskedView
      maskElement={
        <Text {...textProps} style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }} // 135deg diagonal
      >
        <Text {...textProps} style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};
