/**
 * Rewards Optimizer - Main App Entry Point
 * A mobile app that helps users maximize credit card rewards
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import './src/i18n'; // Initialize i18n
import i18n from './src/i18n';
import { AppNavigator } from './src/navigation';
import { initializePortfolio } from './src/services/CardPortfolioManager';
import { initializePreferences, getLanguage } from './src/services/PreferenceManager';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        await Promise.all([initializePortfolio(), initializePreferences()]);
        // Set i18n language from preferences
        const savedLanguage = getLanguage();
        i18n.changeLanguage(savedLanguage);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize app');
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
