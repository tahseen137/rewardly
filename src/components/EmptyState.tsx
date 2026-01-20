/**
 * EmptyState - Reusable empty state component
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Button, ButtonVariant } from './Button';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName | string;
  customIcon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionVariant?: ButtonVariant;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function EmptyState({
  icon,
  customIcon,
  title,
  description,
  actionLabel,
  actionVariant = 'primary',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  compact = false,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {(icon || customIcon) && (
        <View style={styles.iconContainer}>
          {customIcon || (
            <Icon name={icon!} size={compact ? 40 : 48} color={theme.colors.text.tertiary} />
          )}
        </View>
      )}

      <Text
        style={[styles.title, compact && styles.titleCompact, { color: theme.colors.text.primary }]}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            styles.description,
            compact && styles.descriptionCompact,
            { color: theme.colors.text.secondary },
          ]}
        >
          {description}
        </Text>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              variant={actionVariant}
              onPress={onAction}
              size={compact ? 'small' : 'medium'}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              variant="ghost"
              onPress={onSecondaryAction}
              size={compact ? 'small' : 'medium'}
              style={styles.secondaryAction}
            />
          )}
        </View>
      )}
    </View>
  );
}

/**
 * NoResultsState - Specialized empty state for search results
 */
interface NoResultsStateProps {
  searchQuery?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export function NoResultsState({ searchQuery, onClear, style }: NoResultsStateProps) {
  const theme = useTheme();

  return (
    <EmptyState
      icon="notFound"
      title="No results found"
      description={
        searchQuery
          ? `We couldn't find anything matching "${searchQuery}"`
          : 'Try adjusting your search or filters'
      }
      actionLabel={onClear ? 'Clear search' : undefined}
      actionVariant="outline"
      onAction={onClear}
      style={style}
    />
  );
}

/**
 * ErrorState - Specialized empty state for errors
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon="warning"
      title={title}
      description={message}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      style={style}
    />
  );
}

/**
 * OfflineState - Specialized empty state for offline mode
 */
interface OfflineStateProps {
  onRetry?: () => void;
  style?: ViewStyle;
}

export function OfflineState({ onRetry, style }: OfflineStateProps) {
  return (
    <EmptyState
      icon="offline"
      title="You're offline"
      description="Check your internet connection and try again"
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  containerCompact: {
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 18,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  descriptionCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 24,
    alignItems: 'center',
  },
  actionsCompact: {
    marginTop: 16,
  },
  secondaryAction: {
    marginTop: 8,
  },
});

export default EmptyState;
