/**
 * Rewards Optimizer - Main App Entry Point
 * A mobile app that helps users maximize credit card rewards
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import './src/i18n'; // Initialize i18n
import i18n from './src/i18n';
import { AppNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components';
import { initializePortfolio } from './src/services/CardPortfolioManager';
import { initializePreferences, getLanguage } from './src/services/PreferenceManager';
import { getAllCards } from './src/services/CardDataService';
import { ThemeProvider, useTheme } from './src/theme';

// Debug: Log app startup on web
if (Platform.OS === 'web') {
  console.log('[Rewardly] App module loading...');
}

function AppContent() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize services and preload cards
        await Promise.all([
          initializePortfolio(),
          initializePreferences(),
          getAllCards(), // Preload cards into memory cache
        ]);
        // Set i18n language from preferences
        const savedLanguage = getLanguage();
        i18n.changeLanguage(savedLanguage);
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize app';
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
          backgroundColor: theme.colors.background.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            color: theme.colors.text.secondary,
          }}
        >
          Loading...
        </Text>
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
        <Text
          style={{
            fontSize: 16,
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
      fallbackTitle="App Error"
      fallbackMessage="Something went wrong with the app. Please restart and try again."
    >
      <AppNavigator />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
