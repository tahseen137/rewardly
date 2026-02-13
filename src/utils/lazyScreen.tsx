/**
 * Lazy Screen Loader - Safe Screen Loading with Error Boundaries
 * 
 * Wrap screens that use native-only features with this utility to:
 * 1. Lazy load the screen (reduce initial bundle impact)
 * 2. Catch errors during loading and render a fallback
 * 3. Prevent a single broken screen from crashing the whole app
 * 
 * Usage:
 *   const MyScreen = lazyScreen(() => import('../screens/MyScreen'));
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

// ============================================================================
// Loading Fallback Component
// ============================================================================

interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({ message = 'Loading...' }: LoadingFallbackProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ============================================================================
// Error Fallback Component  
// ============================================================================

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  screenName?: string;
}

export function ScreenErrorFallback({ error, resetError, screenName }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>
        {screenName ? `${screenName} failed to load` : 'Screen failed to load'}
      </Text>
      <Text style={styles.errorMessage}>
        {error.message || 'An unexpected error occurred'}
      </Text>
      {resetError && (
        <TouchableOpacity style={styles.retryButton} onPress={resetError}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{error.stack?.slice(0, 500)}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Error Boundary for Lazy Screens
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface LazyErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
  fallback?: React.ReactNode;
}

class LazyScreenErrorBoundary extends React.Component<LazyErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[LazyScreen] Error in ${this.props.screenName || 'screen'}:`, error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ScreenErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          screenName={this.props.screenName}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Lazy Screen Factory
// ============================================================================

type LazyComponentFactory<P> = () => Promise<{ default: ComponentType<P> }>;

interface LazyScreenOptions {
  /** Display name for error messages */
  screenName?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

/**
 * Create a lazy-loaded screen component with built-in error handling
 * 
 * @example
 * const AutoPilotScreen = lazyScreen(
 *   () => import('../screens/AutoPilotScreen'),
 *   { screenName: 'AutoPilot' }
 * );
 */
export function lazyScreen<P extends object>(
  factory: LazyComponentFactory<P>,
  options: LazyScreenOptions = {}
): ComponentType<P> {
  const LazyComponent = lazy(factory);
  const { screenName, loadingComponent, errorComponent } = options;

  const WrappedScreen: ComponentType<P> = (props: P) => (
    <LazyScreenErrorBoundary screenName={screenName} fallback={errorComponent}>
      <Suspense fallback={loadingComponent || <LoadingFallback message={screenName ? `Loading ${screenName}...` : 'Loading...'} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyScreenErrorBoundary>
  );

  WrappedScreen.displayName = `LazyScreen(${screenName || 'Unknown'})`;

  return WrappedScreen;
}

/**
 * HOC to wrap an existing component with error boundary
 * Use for components that are already imported but may throw
 */
export function withScreenErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  screenName?: string
): ComponentType<P> {
  const WrappedComponent: ComponentType<P> = (props: P) => (
    <LazyScreenErrorBoundary screenName={screenName}>
      <Component {...props} />
    </LazyScreenErrorBoundary>
  );

  WrappedComponent.displayName = `WithErrorBoundary(${screenName || Component.displayName || 'Unknown'})`;

  return WrappedComponent;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning.main,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
