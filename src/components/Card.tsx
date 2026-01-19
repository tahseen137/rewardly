/**
 * Card - Reusable card component for consistent card styling
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'medium',
  onPress,
  style,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.card,
      overflow: 'hidden',
    };

    const paddingStyles: Record<string, ViewStyle> = {
      none: { padding: 0 },
      small: { padding: theme.spacing.sm },
      medium: { padding: theme.spacing.cardPadding },
      large: { padding: theme.spacing.xl },
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      elevated: {
        backgroundColor: theme.colors.background.secondary,
        ...theme.shadows.card,
      },
      outlined: {
        backgroundColor: theme.colors.background.secondary,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.border.light,
      },
      filled: {
        backgroundColor: theme.colors.background.tertiary,
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...variantStyles[variant],
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getContainerStyle(), style]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getContainerStyle(), style]} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

/**
 * CardHeader - Header section for Card component
 */
interface CardHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          paddingBottom: theme.spacing.md,
          borderBottomWidth: theme.borderWidth.thin,
          borderBottomColor: theme.colors.border.light,
          marginBottom: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * CardContent - Content section for Card component
 */
interface CardContentProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={style}>{children}</View>;
}

/**
 * CardFooter - Footer section for Card component
 */
interface CardFooterProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          paddingTop: theme.spacing.md,
          borderTopWidth: theme.borderWidth.thin,
          borderTopColor: theme.colors.border.light,
          marginTop: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Card;
