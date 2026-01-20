/**
 * ErrorBoundary - Graceful error handling component
 * Catches JavaScript errors in child components and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage } = this.props;

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>{fallbackTitle || 'Something went wrong'}</Text>
          <Text style={styles.message}>
            {fallbackMessage || 'An unexpected error occurred. Please try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
