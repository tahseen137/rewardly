/**
 * ErrorBanner - Inline error notification component
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

export type BannerVariant = 'error' | 'warning' | 'success' | 'info';

interface ErrorBannerProps {
  message: string;
  variant?: BannerVariant;
  visible?: boolean;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  style?: ViewStyle;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export function ErrorBanner({
  message,
  variant = 'error',
  visible = true,
  onDismiss,
  onAction,
  actionLabel,
  style,
  autoDismiss = false,
  autoDismissDelay = 5000,
}: ErrorBannerProps) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(visible ? 0 : -100)).current;
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slideAnim, opacityAnim]);

  useEffect(() => {
    if (autoDismiss && visible && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, visible, onDismiss, autoDismissDelay]);

  const variantConfig: Record<BannerVariant, { bg: string; text: string; icon: string }> = {
    error: {
      bg: theme.colors.error.background,
      text: theme.colors.error.main,
      icon: 'error',
    },
    warning: {
      bg: theme.colors.warning.background,
      text: theme.colors.warning.dark,
      icon: 'warning',
    },
    success: {
      bg: theme.colors.success.background,
      text: theme.colors.success.dark,
      icon: 'success',
    },
    info: {
      bg: theme.colors.info.background,
      text: theme.colors.info.dark,
      icon: 'info',
    },
  };

  const config = variantConfig[variant];

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderLeftColor: config.text,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name={config.icon} size={20} color={config.text} />
      <Text style={[styles.message, { color: config.text }]} numberOfLines={2}>
        {message}
      </Text>
      <View style={styles.actions}>
        {actionLabel && onAction && (
          <TouchableOpacity
            onPress={onAction}
            style={styles.actionButton}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: config.text }]}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          >
            <Icon name="close" size={16} color={config.text} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * OfflineBanner - Specialized banner for offline status
 */
interface OfflineBannerProps {
  isOffline: boolean;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function OfflineBanner({ isOffline, onRetry, style }: OfflineBannerProps) {
  const theme = useTheme();

  if (!isOffline) return null;

  return (
    <View
      style={[styles.offlineBanner, { backgroundColor: theme.colors.neutral.gray700 }, style]}
      accessibilityRole="alert"
    >
      <Icon name="offline" size={16} color={theme.colors.neutral.white} />
      <Text style={[styles.offlineText, { color: theme.colors.neutral.white }]}>
        You're offline
      </Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} accessibilityRole="button">
          <Text style={[styles.offlineRetry, { color: theme.colors.primary.light }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  offlineRetry: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ErrorBanner;
