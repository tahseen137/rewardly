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
  TouchableOpacity,
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
import { getAllCardsSync, initializeMemoryCacheSync } from '../services/CardDataService';
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
  showCategoryPicker: boolean;
  mode: 'store' | 'manual'; // Store selection or manual category
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
    showCategoryPicker: false,
    mode: 'store',
  });

  const [hasCards, setHasCards] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    initializeMemoryCacheSync();
    const portfolio = getCards();
    setHasCards(portfolio.length > 0);
  }, []);

  // Handle store selection
  const handleStoreSelect = useCallback((store: Store) => {
    setState((prev) => ({
      ...prev,
      selectedStore: store,
      selectedCategory: store.category,
      showCategoryPicker: false,
      mode: 'store',
    }));
  }, []);

  // Handle manual category selection
  const handleCategorySelect = useCallback((category: SpendingCategory) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: category,
      selectedStore: null,
      mode: 'manual',
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

  // Toggle between store and manual mode
  const handleToggleMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mode: prev.mode === 'store' ? 'manual' : 'store',
      showCategoryPicker: prev.mode === 'store',
    }));
  }, []);

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

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              state.mode === 'store' && styles.modeButtonActive,
              { borderColor: theme.colors.border.light },
              state.mode === 'store' && { backgroundColor: theme.colors.primary.main },
            ]}
            onPress={() => {
              setState((prev) => ({ ...prev, mode: 'store', showCategoryPicker: false }));
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: theme.colors.text.secondary },
                state.mode === 'store' && { color: theme.colors.primary.contrast },
              ]}
            >
              🏪 Store
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              state.mode === 'manual' && styles.modeButtonActive,
              { borderColor: theme.colors.border.light },
              state.mode === 'manual' && { backgroundColor: theme.colors.primary.main },
            ]}
            onPress={() => {
              setState((prev) => ({ ...prev, mode: 'manual', showCategoryPicker: true }));
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: theme.colors.text.secondary },
                state.mode === 'manual' && { color: theme.colors.primary.contrast },
              ]}
            >
              📂 Category
            </Text>
          </TouchableOpacity>
        </View>

        {/* Store Selector or Category Picker */}
        {state.mode === 'store' ? (
          <View style={styles.section}>
            <StoreSelector
              onStoreSelect={handleStoreSelect}
              onCategorySelect={handleCategorySelect}
              selectedStore={state.selectedStore}
              selectedCategory={state.selectedCategory}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <CategoryPicker
              onCategorySelect={handleCategorySelect}
              selectedCategory={state.selectedCategory}
              label={t('home.selectCategory') || 'Select Category'}
            />
          </View>
        )}

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
            message={
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
            message={
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
    modeToggle: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    modeButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeButtonActive: {
      borderWidth: 0,
    },
    modeButtonText: {
      fontSize: 16,
      fontWeight: '600',
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
