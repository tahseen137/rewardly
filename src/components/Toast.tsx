/**
 * Toast - Animated toast notification component
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  /** Message to display */
  message: string;
  /** Toast type determines styling */
  type?: ToastType;
  /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
  duration?: number;
  /** Whether toast is visible */
  visible: boolean;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Optional action button */
  action?: {
    label: string;
    onPress: () => void;
  };
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onDismiss,
  action,
}: ToastProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const backgroundColor = {
    success: theme.colors.success.main,
    error: theme.colors.error.main,
    warning: theme.colors.warning.main,
    info: theme.colors.info.main,
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{ICONS[type]}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.screenPadding,
    right: theme.spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default Toast;
