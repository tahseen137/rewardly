/**
 * Input - Reusable text input component
 */

import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getInputContainerStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.input,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.border.light,
        paddingHorizontal: theme.spacing.md,
      };

      if (isFocused) {
        baseStyle.borderColor = theme.colors.border.focus;
        baseStyle.borderWidth = theme.borderWidth.medium;
      }

      if (error) {
        baseStyle.borderColor = theme.colors.error.main;
      }

      if (disabled) {
        baseStyle.backgroundColor = theme.colors.neutral.gray100;
        baseStyle.opacity = 0.6;
      }

      return baseStyle;
    };

    const getInputStyle = (): TextStyle => {
      return {
        flex: 1,
        paddingVertical: theme.spacing.inputPadding,
        fontSize: 16,
        color: theme.colors.text.primary,
      };
    };

    return (
      <View style={containerStyle}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: error ? theme.colors.error.main : theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {label}
          </Text>
        )}
        <View style={getInputContainerStyle()}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[getInputStyle(), inputStyle]}
            placeholderTextColor={theme.colors.text.tertiary}
            editable={!disabled}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              style={styles.iconContainer}
              accessibilityRole={onRightIconPress ? 'button' : undefined}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {(error || helper) && (
          <Text
            style={[
              styles.helperText,
              {
                color: error ? theme.colors.error.main : theme.colors.text.tertiary,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
  },
  iconContainer: {
    paddingHorizontal: 4,
  },
});

export default Input;
