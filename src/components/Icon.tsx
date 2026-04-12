/**
 * Icon - Icon component with semantic icon mapping
 * Uses text-based icons for simplicity, can be extended to use vector icons
 */

import React from 'react';
import { Text, StyleSheet, TextStyle, ViewStyle, View } from 'react-native';
import { useTheme } from '../theme';

// Icon name to emoji/character mapping
const iconMap: Record<string, string> = {
  // Navigation
  home: '🏠',
  search: '🔍',
  cards: '💳',
  settings: '⚙️',

  // Actions
  close: '✕',
  check: '✓',
  chevronRight: '›',
  chevronLeft: '‹',
  chevronDown: '▼',
  chevronUp: '▲',
  plus: '+',
  minus: '−',
  refresh: '🔄',

  // Status
  success: '✓',
  error: '✕',
  warning: '⚠️',
  info: 'ℹ️',

  // Content
  trophy: '🏆',
  star: '⭐',
  gift: '🎁',
  dollar: '💵',
  plane: '✈️',
  hotel: '🏨',
  cart: '🛒',

  // UI
  empty: '📭',
  notFound: '🤔',
  loading: '⏳',
  offline: '📡',
};

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

export function Icon({ name, size = 24, color, style }: IconProps) {
  const theme = useTheme();
  const iconChar = iconMap[name] || name;

  return (
    <Text
      style={[
        styles.icon,
        {
          fontSize: size,
          color: color || theme.colors.text.primary,
          lineHeight: size * 1.2,
        },
        style,
      ]}
      accessibilityLabel={name}
      accessibilityRole="image"
    >
      {iconChar}
    </Text>
  );
}

/**
 * IconButton - Touchable icon with proper hit area
 */
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  name: IconName | string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function IconButton({
  name,
  size = 24,
  color,
  backgroundColor,
  style,
  ...props
}: IconButtonProps) {
  const _theme = useTheme();
  const buttonSize = Math.max(44, size + 16); // Minimum 44px touch target

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: backgroundColor || 'transparent',
        },
        style,
      ]}
      accessibilityRole="button"
      {...props}
    >
      <Icon name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

/**
 * CircleIcon - Icon displayed in a colored circle
 */
interface CircleIconProps {
  name: IconName | string;
  size?: number;
  iconColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function CircleIcon({
  name,
  size = 40,
  iconColor,
  backgroundColor,
  style,
}: CircleIconProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.circleIcon,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || theme.colors.primary.main + '20',
        },
        style,
      ]}
    >
      <Icon name={name} size={size * 0.5} color={iconColor || theme.colors.primary.main} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
