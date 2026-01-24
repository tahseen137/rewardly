/**
 * HomeScreen - Simplified rewards calculator
 * Redesigned to match web with gradient header and CategoryGrid
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
  AmountInput,
  RewardsDisplay,
  EmptyState,
  GradientText,
} from '../components';
import { StoreSelector } from '../components/StoreSelectorNew';
import { CategoryGrid, CategoryType } from '../components/CategoryGrid';
import { useTheme, Theme } from '../theme';
import { colors } from '../theme/colors';
import { Store, SpendingCategory } from '../types';
import { getCards } from '../services/CardPortfolioManager';
import { getAllCardsSync, getAllCards } from '../services/CardDataService';
import {
  calculateRewards,
  CalculatorInput,
  CalculatorOutput,
} from '../services/RewardsCalculatorService';

// Map CategoryType to SpendingCategory
const categoryTypeToSpendingCategory = (cat: CategoryType): SpendingCategory => {
  const mapping: Record<CategoryType, SpendingCategory> = {
    groceries: SpendingCategory.GROCERIES,
    dining: SpendingCategory.DINING,
    gas: SpendingCategory.GAS,
    travel: SpendingCategory.TRAVEL,
    online: SpendingCategory.ONLINE_SHOPPING,
    entertainment: SpendingCategory.ENTERTAINMENT,
    pharmacy: SpendingCategory.DRUGSTORES,
    homeImprovement: SpendingCategory.HOME_IMPROVEMENT,
    other: SpendingCategory.OTHER,
  };
  return mapping[cat] || SpendingCategory.OTHER;
};

const spendingCategoryToCategoryType = (cat: SpendingCategory): CategoryType | null => {
  const mapping: Record<SpendingCategory, CategoryType> = {
    [SpendingCategory.GROCERIES]: 'groceries',
    [SpendingCategory.DINING]: 'dining',
    [SpendingCategory.GAS]: 'gas',
    [SpendingCategory.TRAVEL]: 'travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'online',
    [SpendingCategory.ENTERTAINMENT]: 'entertainment',
    [SpendingCategory.DRUGSTORES]: 'pharmacy',
    [SpendingCategory.HOME_IMPROVEMENT]: 'homeImprovement',
    [SpendingCategory.OTHER]: 'other',
  };
  return mapping[cat] || null;
};

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
  const handleStoreSelect = useCallback((store: Store | null) => {
    if (store) {
      setState((prev) => ({
        ...prev,
        selectedStore: store,
        selectedCategory: store.category,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        selectedStore: null,
      }));
    }
  }, []);

  // Handle category selection (manual override or when no store selected)
  const handleCategorySelect = useCallback((category: SpendingCategory) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: category,
    }));
  }, []);

  // Handle CategoryGrid selection (converts CategoryType to SpendingCategory)
  const handleCategoryGridSelect = useCallback((categoryType: CategoryType) => {
    const spendingCat = categoryTypeToSpendingCategory(categoryType);
    handleCategorySelect(spendingCat);
  }, [handleCategorySelect]);

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
        {/* Header - Redesigned with GradientText */}
        <View style={styles.header}>
          <GradientText variant="primary" style={styles.title}>
            {t('home.title') || 'Rewards Optimizer'}
          </GradientText>
          <Text style={styles.subtitle}>
            {t('home.subtitle') || 'Find the best card for every purchase'}
          </Text>
        </View>

        {/* Calculator Section */}
        {/* Store Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('home.selectStore') || 'Select Store (Optional)'}
          </Text>
          <StoreSelector
            selectedStore={state.selectedStore}
            onStoreSelect={handleStoreSelect}
            onCategoryChange={handleCategorySelect}
          />
        </View>

        {/* Category Grid - Replaces CategoryPicker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('home.category') || 'Category'}
          </Text>
          <CategoryGrid
            selectedCategory={state.selectedCategory ? spendingCategoryToCategoryType(state.selectedCategory) : null}
            onCategorySelect={handleCategoryGridSelect}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('home.purchaseAmount') || 'Purchase Amount'}
          </Text>
          <AmountInput
            value={state.amount}
            onChange={handleAmountChange}
            error={state.amountError}
            placeholder={t('home.enterAmount') || '0.00'}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Results Section */}
        {!hasCards ? (
          <EmptyState
            icon="💳"
            title={t('home.noCardsTitle') || 'No Cards in Portfolio'}
            description={
              t('home.noCardsMessage') || 'Add cards to your portfolio to see rewards'
            }
          />
        ) : state.results ? (
          <View>
            <Text style={styles.resultsHeader}>
              {t('home.resultsTitle') || 'Best Cards for This Purchase'}
            </Text>
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
              'Select a category and enter an amount to find the best card'
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
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16, // px-4
      paddingVertical: 24, // py-6
      paddingBottom: 100, // Extra padding for tab bar
    },
    header: {
      marginBottom: 24,
      alignItems: 'center', // Center aligned
    },
    title: {
      fontSize: 24, // text-2xl
      fontWeight: '700', // bold
      marginBottom: 4,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13, // text-sm
      color: colors.text.secondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 16, // space-y-4 (16px gap)
    },
    sectionLabel: {
      fontSize: 13, // text-sm
      fontWeight: '500', // font-medium
      color: colors.text.secondary,
      marginBottom: 8, // space-y-2 (8px gap)
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginVertical: 24, // Divider spacing
    },
    resultsHeader: {
      fontSize: 13, // text-sm
      fontWeight: '500', // font-medium
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5, // tracking-wide
      marginBottom: 12,
    },
    emptyResults: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
  });
