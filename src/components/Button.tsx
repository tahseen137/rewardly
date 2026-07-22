/**
 * Button - Reusable button component with multiple variants
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Pressable,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async (event: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.button,
      ...theme.shadows.button,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
      },
      medium: {
        paddingVertical: theme.spacing.buttonPadding.vertical,
        paddingHorizontal: theme.spacing.buttonPadding.horizontal,
        minHeight: 44,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary.main,
      },
      secondary: {
        backgroundColor: theme.colors.secondary.main,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: theme.borderWidth.medium,
        borderColor: theme.colors.primary.main,
        ...theme.shadows.none,
      },
      ghost: {
        backgroundColor: 'transparent',
        ...theme.shadows.none,
      },
      danger: {
        backgroundColor: theme.colors.error.main,
      },
    };

    // Disabled styles
    const disabledStyle: ViewStyle = disabled
      ? {
          opacity: 0.5,
        }
      : {};

    // Full width style
    const fullWidthStyle: ViewStyle = fullWidth
      ? {
          width: '100%',
        }
      : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...fullWidthStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeTextStyles: Record<ButtonSize, TextStyle> = {
      small: {
        fontSize: 14,
        fontWeight: '600',
      },
      medium: {
        fontSize: 16,
        fontWeight: '600',
      },
      large: {
        fontSize: 18,
        fontWeight: '600',
      },
    };

    const variantTextStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: theme.colors.primary.contrast,
      },
      secondary: {
        color: theme.colors.secondary.contrast,
      },
      outline: {
        color: theme.colors.primary.main,
      },
      ghost: {
        color: theme.colors.primary.main,
      },
      danger: {
        color: theme.colors.error.contrast,
      },
    };

    return {
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  const spinnerColor =
    variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary.main
      : theme.colors.primary.contrast;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      <Animated.View style={[getContainerStyle(), style, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : (
          <>
            {leftIcon && <>{leftIcon}</>}
            <Text
              style={[
                getTextStyle(),
                leftIcon ? styles.textWithLeftIcon : null,
                rightIcon ? styles.textWithRightIcon : null,
                textStyle,
              ]}
            >
              {title}
            </Text>
            {rightIcon && <>{rightIcon}</>}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  textWithLeftIcon: {
    marginLeft: 8,
  },
  textWithRightIcon: {
    marginRight: 8,
  },
});

export default Button;
