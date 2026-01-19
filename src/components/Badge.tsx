/**
 * Badge - Reusable badge/chip component
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const theme = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const sizeStyles: Record<BadgeSize, ViewStyle> = {
      small: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
      },
      medium: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.badge,
      },
      large: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
      },
    };

    const variantStyles: Record<BadgeVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary.main,
      },
      secondary: {
        backgroundColor: theme.colors.secondary.main,
      },
      success: {
        backgroundColor: theme.colors.success.main,
      },
      warning: {
        backgroundColor: theme.colors.warning.main,
      },
      error: {
        backgroundColor: theme.colors.error.main,
      },
      info: {
        backgroundColor: theme.colors.info.main,
      },
      neutral: {
        backgroundColor: theme.colors.neutral.gray200,
      },
    };

    return {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeTextStyles: Record<BadgeSize, TextStyle> = {
      small: {
        fontSize: 10,
        fontWeight: '500',
      },
      medium: {
        fontSize: 12,
        fontWeight: '600',
      },
      large: {
        fontSize: 14,
        fontWeight: '600',
      },
    };

    const variantTextStyles: Record<BadgeVariant, TextStyle> = {
      primary: { color: theme.colors.primary.contrast },
      secondary: { color: theme.colors.secondary.contrast },
      success: { color: theme.colors.success.contrast },
      warning: { color: theme.colors.warning.contrast },
      error: { color: theme.colors.error.contrast },
      info: { color: theme.colors.info.contrast },
      neutral: { color: theme.colors.text.secondary },
    };

    return {
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
}

/**
 * RankBadge - Specialized badge for showing rank numbers
 */
interface RankBadgeProps {
  rank: number;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function RankBadge({ rank, size = 'medium', style }: RankBadgeProps) {
  const theme = useTheme();

  const sizeStyles: Record<BadgeSize, ViewStyle & { fontSize: number }> = {
    small: {
      width: 20,
      height: 20,
      borderRadius: 10,
      fontSize: 10,
    },
    medium: {
      width: 28,
      height: 28,
      borderRadius: 14,
      fontSize: 12,
    },
    large: {
      width: 36,
      height: 36,
      borderRadius: 18,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.rankBadge,
        {
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: currentSize.borderRadius,
          backgroundColor: theme.colors.neutral.gray200,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.rankText,
          {
            fontSize: currentSize.fontSize,
            color: theme.colors.text.secondary,
          },
        ]}
      >
        #{rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 4,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: '600',
  },
});

export default Badge;
