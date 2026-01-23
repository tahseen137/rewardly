/**
 * HomeScreen - Simplified rewards calculator
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  StoreSelector,
  AmountInput,
  RewardsDisplay,
  CategoryPicker,
  EmptyState,
} from '../components';
import { useTheme, Theme } from '../theme';
import { Store, SpendingCategory } from '../types';
import { getCards } from '../services/CardPortfolioManager';
import { getAllCardsSync, getAllCards } from '../services/CardDataService';
import {
  calculateRewards,
  CalculatorInput,
  CalculatorOutput,
} from '../services/RewardsCalculatorService';

// ============================================================================
// Calculator State Interface
// ============================================================================

interface CalculatorState {
  selectedStore: Store | null;
  selectedCategory: SpendingCategory | null;
  amount: number | null;
  amountError: string | null;
  results: CalculatorOutput | null;
  isCalculating: boolean;
  isLoading: boolean;
  loadError: string | null;
}

// ============================================================================
// Main HomeScreen Component
// ============================================================================

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Initialize state
  const [state, setState] = useState<CalculatorState>({
    selectedStore: null,
    selectedCategory: null,
    amount: null,
    amountError: null,
    results: null,
    isCalculating: false,
    isLoading: true,
    loadError: null,
  });

  const [hasCards, setHasCards] = useState(false);

  // Initialize data on mount - fetch cards from database
  useEffect(() => {
    const initializeData = async () => {
      try {
        await getAllCards();
        const portfolio = getCards();
        setHasCards(portfolio.length > 0);
        setState((prev) => ({ ...prev, isLoading: false, loadError: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load card data';
        setState((prev) => ({ ...prev, isLoading: false, loadError: errorMessage }));
      }
    };
    initializeData();
  }, []);

  // Handle store selection - auto-set category from store
  const handleStoreSelect = useCallback((store: Store) => {
    setState((prev) => ({
      ...prev,
      selectedStore: store,
      selectedCategory: store.category,
    }));
  }, []);

  // Handle category selection (manual override or when no store selected)
  const handleCategorySelect = useCallback((category: SpendingCategory) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: category,
    }));
  }, []);

  // Handle amount change
  const handleAmountChange = useCallback((amount: number | null) => {
    setState((prev) => ({
      ...prev,
      amount,
      amountError: amount === null ? 'Please enter a valid amount' : null,
    }));
  }, []);

  // Calculate rewards when inputs are ready
  useEffect(() => {
    const { selectedCategory, amount } = state;

    // Check if we have all required inputs
    if (!selectedCategory || !amount || amount <= 0) {
      setState((prev) => ({ ...prev, results: null }));
      return;
    }

    // Get portfolio cards
    const portfolio = getCards();
    if (portfolio.length === 0) {
      setState((prev) => ({ ...prev, results: null }));
      return;
    }

    // Set calculating state
    setState((prev) => ({ ...prev, isCalculating: true }));

    // Perform calculation
    try {
      const allCards = getAllCardsSync();
      const portfolioCardIds = portfolio.map((uc) => uc.cardId);

      // Build point valuations map
      const pointValuations = new Map<string, number>();
      allCards.forEach((card) => {
        if (card.pointValuation) {
          pointValuations.set(card.id, card.pointValuation);
        }
      });

      const input: CalculatorInput = {
        category: selectedCategory,
        amount,
        portfolioCardIds,
      };

      const output = calculateRewards(input, allCards, pointValuations);

      setState((prev) => ({
        ...prev,
        results: output,
        isCalculating: false,
      }));
    } catch (error) {
      console.error('Calculation error:', error);
      setState((prev) => ({
        ...prev,
        results: null,
        isCalculating: false,
      }));
    }
  }, [state.selectedCategory, state.amount]);

  // Show loading state
  if (state.isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.subtitle}>{t('common.loading') || 'Loading...'}</Text>
      </View>
    );
  }

  // Show error state if database failed to load
  if (state.loadError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={[styles.title, { marginBottom: 10 }]}>Unable to Load Data</Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>{state.loadError}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.title') || 'Rewards Calculator'}</Text>
          <Text style={styles.subtitle}>
            {t('home.subtitle') || 'Find the best card for your purchase'}
          </Text>
        </View>

        {/* Store Selector */}
        <View style={styles.section}>
          <StoreSelector
            onStoreSelect={handleStoreSelect}
            onCategorySelect={handleCategorySelect}
            selectedStore={state.selectedStore}
            selectedCategory={state.selectedCategory}
          />
        </View>

        {/* Category Picker - shows auto-filled category or allows manual override */}
        <View style={styles.section}>
          <CategoryPicker
            onCategorySelect={handleCategorySelect}
            selectedCategory={state.selectedCategory}
            label={state.selectedStore
              ? (t('home.categoryFromStore') || 'Category (from store)')
              : (t('home.selectCategory') || 'Select Category')}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <AmountInput
            value={state.amount}
            onChange={handleAmountChange}
            error={state.amountError}
            label={t('home.purchaseAmount') || 'Purchase Amount'}
            placeholder={t('home.enterAmount') || 'Enter amount'}
          />
        </View>

        {/* Results Display */}
        {!hasCards ? (
          <EmptyState
            icon="💳"
            title={t('home.noCardsTitle') || 'No Cards in Portfolio'}
            description={
              t('home.noCardsMessage') || 'Add cards to your portfolio to see rewards'
            }
          />
        ) : state.results ? (
          <View style={styles.section}>
            <RewardsDisplay
              results={state.results.results}
              bestCard={state.results.bestCard}
              isLoading={state.isCalculating}
              isEmpty={!hasCards}
              amount={state.amount || 0}
              cards={getAllCardsSync()}
            />
          </View>
        ) : state.selectedCategory && state.amount ? (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyText}>
              {t('home.calculating') || 'Calculating rewards...'}
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="🔍"
            title={t('home.getStartedTitle') || 'Get Started'}
            description={
              t('home.getStartedMessage') ||
              'Select a store or category and enter an amount to see rewards'
            }
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.screenPadding,
      paddingBottom: 40,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      ...theme.textStyles.h1,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.textStyles.body,
      color: theme.colors.text.secondary,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    emptyResults: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      ...theme.textStyles.body,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });
