/**
 * AppErrorBoundary - Top-Level Error Handler
 * 
 * Catches any unhandled errors in the React tree and displays
 * a friendly error screen instead of a white screen.
 * 
 * This should wrap the entire app at the root level.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';

// ============================================================================
// Types
// ============================================================================

interface Props {
  children: ReactNode;
  /** Optional callback when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    console.error('[AppErrorBoundary] Caught error:', error);
    console.error('[AppErrorBoundary] Component stack:', errorInfo.componentStack);

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
    // Example:
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReload = (): void => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      // On native, reset state to try re-rendering
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  handleReportBug = (): void => {
    const subject = encodeURIComponent('Rewardly App Crash Report');
    const body = encodeURIComponent(
      `Error: ${this.state.error?.message || 'Unknown error'}\n\n` +
      `Stack: ${this.state.error?.stack?.slice(0, 500) || 'No stack trace'}\n\n` +
      `Platform: ${Platform.OS}\n` +
      `Time: ${new Date().toISOString()}`
    );
    Linking.openURL(`mailto:support@rewardly.app?subject=${subject}&body=${body}`);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💔</Text>
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            {/* Error Description */}
            <Text style={styles.description}>
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleReload}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {Platform.OS === 'web' ? 'Reload Page' : 'Try Again'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.handleReportBug}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Report Bug</Text>
              </TouchableOpacity>
            </View>

            {/* Debug Info (only in development) */}
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>🔧 Debug Information</Text>
                
                <Text style={styles.debugLabel}>Error Message:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                
                <Text style={styles.debugLabel}>Error Name:</Text>
                <Text style={styles.debugText}>{this.state.error.name}</Text>
                
                {this.state.error.stack && (
                  <>
                    <Text style={styles.debugLabel}>Stack Trace:</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      style={styles.stackScrollView}
                    >
                      <Text style={styles.stackText}>
                        {this.state.error.stack}
                      </Text>
                    </ScrollView>
                  </>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={styles.debugLabel}>Component Stack:</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      style={styles.stackScrollView}
                    >
                      <Text style={styles.stackText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    </ScrollView>
                  </>
                )}
              </View>
            )}

            {/* Platform Info */}
            <Text style={styles.platformInfo}>
              Platform: {Platform.OS} • Version: 1.0.0
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.main,
    marginBottom: 16,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 12,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stackScrollView: {
    maxHeight: 150,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 8,
  },
  stackText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  platformInfo: {
    marginTop: 32,
    fontSize: 12,
    color: colors.text.disabled,
  },
});

export default AppErrorBoundary;
