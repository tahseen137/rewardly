/**
 * Rewards Optimizer - Main App Entry Point
 * A mobile app that helps users maximize credit card rewards
 * 
 * Error Handling Architecture:
 * 1. AppErrorBoundary (top-level) - catches fatal errors, shows friendly UI
 * 2. ThemeProvider - provides theme context
 * 3. AppContent - handles initialization errors
 * 4. ErrorBoundary (per-navigator) - catches navigation errors
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import './src/i18n'; // Initialize i18n
import i18n from './src/i18n';
import { AppNavigator } from './src/navigation';
import { ErrorBoundary, AppErrorBoundary } from './src/components';
import { initializePortfolio } from './src/services/CardPortfolioManager';
import { initializePreferences, getLanguage } from './src/services/PreferenceManager';
import { getAllCards } from './src/services/CardDataService';
import { ThemeProvider, useTheme } from './src/theme';
import { isWeb, platformLog } from './src/utils/platform';

// Debug: Log app startup
if (__DEV__ || isWeb) {
  platformLog('App module loading...');
}

// Global error handler for unhandled promise rejections
if (isWeb && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Rewardly] Unhandled promise rejection:', event.reason);
  });
}

function AppContent() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        platformLog('Initializing app services...');
        
        // Initialize services and preload cards
        await Promise.all([
          initializePortfolio(),
          initializePreferences(),
          getAllCards(), // Preload cards into memory cache
        ]);
        
        // Set i18n language from preferences
        const savedLanguage = getLanguage();
        i18n.changeLanguage(savedLanguage);
        
        platformLog('App initialization complete');
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize app';
        console.error('[Rewardly] Initialization error:', err);
        setError(errorMessage);
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 56, marginBottom: 16 }}>💳</Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          Rewardly
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            marginBottom: 24,
          }}
        >
          Maximize every swipe
        </Text>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Initialization Error
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.error.main,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Navigation Error"
      fallbackMessage="Something went wrong loading this screen. Please restart the app."
    >
      <AppNavigator />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </ErrorBoundary>
  );
}

/**
 * Root App Component
 * 
 * Wrapped with:
 * 1. AppErrorBoundary - Catches all React errors, prevents white screen
 * 2. GestureHandlerRootView - Required for gesture handling
 * 3. ThemeProvider - Provides theme context to all children
 */
export default function App() {
  return (
    <AppErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in all environments
        console.error('[Rewardly] Fatal error caught by AppErrorBoundary:', error);
        console.error('[Rewardly] Component stack:', errorInfo.componentStack);
        
        // TODO: Send to error tracking service
        // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
