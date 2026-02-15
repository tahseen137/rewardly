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
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  AmountInput,
  RewardsDisplay,
  EmptyState,
  GradientText,
  SkeletonCard,
  Skeleton,
} from '../components';
import { formatUpToRate } from '../utils/rewardFormatUtils';
import { StoreSelector } from '../components/StoreSelectorNew';
import { CategoryGrid, CategoryType } from '../components/CategoryGrid';
import { useTheme, Theme } from '../theme';
import { colors } from '../theme/colors';
import { Store, SpendingCategory } from '../types';
import { getCards } from '../services/CardPortfolioManager';
import { getAllCardsSync, getAllCards, refreshCards } from '../services/CardDataService';
import { CountryChangeEmitter } from '../services/CountryChangeEmitter';
import { analyzeAndRecommend, CardRecommendation } from '../services/CardRecommendationEngine';
import {
  calculateRewards,
  CalculatorInput,
  CalculatorOutput,
} from '../services/RewardsCalculatorService';
// Achievement imports removed - achievements section moved to Insights tab

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
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Initialize state with sensible defaults for immediate value
  const [state, setState] = useState<CalculatorState>({
    selectedStore: null,
    selectedCategory: SpendingCategory.GROCERIES, // Default to groceries - most common spend
    amount: 100, // Default to $100 - realistic everyday purchase amount
    amountError: null,
    results: null,
    isCalculating: false,
    isLoading: true,
    loadError: null,
  });

  const [hasCards, setHasCards] = useState(false);
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Top cards for category - shown when user has no portfolio
  const [topCardsForCategory, setTopCardsForCategory] = useState<CalculatorOutput | null>(null);

  // Function to load data
  const loadData = useCallback(async () => {
    try {
      await getAllCards();
      const portfolio = getCards();
      setHasCards(portfolio.length > 0);
      setState((prev) => ({ ...prev, isLoading: false, loadError: null }));
      
      // Load recommendations for ALL users (not just those with cards)
      setRecommendationsLoading(true);
      try {
        // analyzeAndRecommend works for both users with and without portfolios
        // For users without a portfolio, it returns general top cards
        const analysis = await analyzeAndRecommend();
        setRecommendations(analysis.recommendations.slice(0, 3)); // Top 3
      } catch (err) {
        console.warn('Failed to load recommendations:', err);
      } finally {
        setRecommendationsLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load card data';
      setState((prev) => ({ ...prev, isLoading: false, loadError: errorMessage }));
    }
  }, []);

  // Initialize data on mount - fetch cards from database
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Subscribe to country changes
  useEffect(() => {
    const unsubscribe = CountryChangeEmitter.subscribe(async () => {
      // Re-fetch data when country changes - use refreshCards to clear cache
      setState((prev) => ({ ...prev, isLoading: true, results: null }));
      setRecommendations([]);
      try {
        await refreshCards(); // Clears cache and fetches new country's cards
        await loadData(); // BUG FIX: Await loadData to prevent race condition
      } catch (err) {
        console.warn('Failed to refresh cards for new country:', err);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });
    return unsubscribe;
  }, [loadData]);

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
    const { selectedCategory, amount, isLoading } = state;

    // Wait until loading is complete before calculating
    if (isLoading) {
      return;
    }

    // Check if we have all required inputs
    if (!selectedCategory || !amount || amount <= 0) {
      setState((prev) => ({ ...prev, results: null }));
      setTopCardsForCategory(null);
      return;
    }

    const allCards = getAllCardsSync();
    if (allCards.length === 0) {
      setState((prev) => ({ ...prev, results: null }));
      setTopCardsForCategory(null);
      return;
    }

    // Build point valuations map
    const pointValuations = new Map<string, number>();
    allCards.forEach((card) => {
      if (card.pointValuation) {
        pointValuations.set(card.id, card.pointValuation);
      }
    });

    // Always calculate top cards for category (from ALL database cards)
    // This powers the "discover cards" experience for users without a portfolio
    try {
      const allCardIds = allCards.map((c) => c.id);
      const topCardsInput: CalculatorInput = {
        category: selectedCategory,
        amount,
        portfolioCardIds: allCardIds,
      };
      const topCardsOutput = calculateRewards(topCardsInput, allCards, pointValuations);
      // Limit to top 5 cards for cleaner display
      topCardsOutput.results = topCardsOutput.results.slice(0, 5);
      setTopCardsForCategory(topCardsOutput);
    } catch (error) {
      console.error('Top cards calculation error:', error);
      setTopCardsForCategory(null);
    }

    // Get portfolio cards for personalized results
    const portfolio = getCards();
    if (portfolio.length === 0) {
      setState((prev) => ({ ...prev, results: null, isCalculating: false }));
      return;
    }

    // Set calculating state
    setState((prev) => ({ ...prev, isCalculating: true }));

    // Perform calculation for portfolio cards
    try {
      const portfolioCardIds = portfolio.map((uc) => uc.cardId);

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
  }, [state.selectedCategory, state.amount, state.isLoading]);

  // Show loading state with skeleton UI
  if (state.isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Skeleton width="60%" height={28} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Skeleton width="80%" height={14} borderRadius={4} style={{ alignSelf: 'center' }} />
          </View>
          <SkeletonCard style={{ marginBottom: 16 }} />
          <SkeletonCard style={{ marginBottom: 16 }} />
          <SkeletonCard style={{ marginBottom: 16 }} />
          <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={100} borderRadius={12} style={{ marginBottom: 16 }} />
        </ScrollView>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
            progressBackgroundColor={colors.background.secondary}
          />
        }
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
            label=""
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Results Section */}
        {!hasCards ? (
          // When user has no portfolio, show top cards from database for selected category
          state.selectedCategory && topCardsForCategory && topCardsForCategory.results.length > 0 ? (
            <View>
              {/* Personalization hint banner */}
              <TouchableOpacity
                style={styles.personalizationBanner}
                onPress={() => navigation.navigate('MyCards' as never)}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerEmoji}>💡</Text>
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerText}>
                    Add your cards for personalized recommendations
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.primary.main} />
              </TouchableOpacity>

              <Text style={styles.resultsHeader}>
                {t('home.topCardsTitle') || `Top Cards for ${state.selectedCategory?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'This Category'}`}
              </Text>
              <RewardsDisplay
                results={topCardsForCategory.results}
                bestCard={topCardsForCategory.bestCard}
                isLoading={false}
                isEmpty={false}
                amount={state.amount || 100}
                cards={getAllCardsSync()}
                category={state.selectedCategory || undefined}
                onCardPress={(result) => navigation.navigate('CardDetail' as never, { cardId: result.cardId } as never)}
              />
            </View>
          ) : (
            <EmptyState
              icon="🔍"
              title={t('home.getStartedTitle') || 'Get Started'}
              description={
                t('home.getStartedMessage') ||
                'Select a category above to discover the best cards'
              }
            />
          )
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
              category={state.selectedCategory || undefined}
              onCardPress={(result) => navigation.navigate('CardDetail' as never, { cardId: result.cardId } as never)}
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

        {/* Recommended Cards Section - Show for ALL users */}
        <View style={styles.recommendationsSection}>
          <View style={styles.divider} />
          <View style={styles.recommendationsHeader}>
            <View style={styles.recommendationsTitle}>
              <Sparkles size={18} color={colors.primary.main} />
              <Text style={styles.resultsHeader}>
                {hasCards 
                  ? (t('home.recommendedCards') || 'Recommended Cards')
                  : (t('home.topCards') || 'Top Cards to Consider')
                }
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Insights', { screen: 'CardRecommendations' } as never)}
              accessibilityRole="button"
              accessibilityLabel="See all card recommendations"
            >
              <Text style={styles.seeAllText}>{t('home.seeAll') || 'See All'}</Text>
              <ChevronRight size={16} color={colors.primary.main} />
            </TouchableOpacity>
          </View>

          {recommendationsLoading ? (
            <View style={styles.recommendationsLoading}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.loadingText}>Finding best cards for you...</Text>
            </View>
          ) : recommendations.length > 0 ? (
            <View style={styles.recommendationsList}>
              {recommendations.map((rec, index) => {
                const upToRate = formatUpToRate(rec.card);
                return (
                  <TouchableOpacity 
                    key={rec.card.id}
                    style={styles.recommendationItem}
                    onPress={() => navigation.navigate('CardDetail' as never, { cardId: rec.card.id } as never)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${rec.card.name} details`}
                  >
                    <View style={styles.recommendationRank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationCardName} numberOfLines={1}>
                        {rec.card.name}
                      </Text>
                      <Text style={styles.recommendationCategoryRate} numberOfLines={1}>
                        {upToRate}
                      </Text>
                      <Text style={styles.recommendationReason} numberOfLines={1}>
                        {rec.reason}
                      </Text>
                    </View>
                    <View style={styles.recommendationValue}>
                      <Text style={styles.rewardValue}>
                        ${rec.estimatedAnnualRewards.toFixed(0)}/yr
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noRecommendations}>
              <Text style={styles.noRecommendationsText}>
                {hasCards 
                  ? (t('home.noRecommendations') || 'Add spending data to get personalized recommendations')
                  : (t('home.exploreCards') || 'Explore cards to find the best rewards for you')
                }
              </Text>
            </View>
          )}
        </View>
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
    heroCard: {
      backgroundColor: colors.primary.light,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.primary.main,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 16,
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroEmoji: {
      fontSize: 28,
    },
    heroText: {
      flex: 1,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary.dark,
      marginBottom: 4,
    },
    heroSubtitle: {
      fontSize: 13,
      color: colors.primary.dark,
      lineHeight: 18,
    },
    heroArrow: {
      marginLeft: 8,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    quickActionEmoji: {
      fontSize: 24,
      marginBottom: 8,
    },
    quickActionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
    uploadCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border.light,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    uploadContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    uploadEmoji: {
      fontSize: 32,
    },
    uploadText: {
      flex: 1,
    },
    uploadTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    uploadSubtitle: {
      fontSize: 13,
      color: colors.text.secondary,
      lineHeight: 18,
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
    // Recommendations section styles
    recommendationsSection: {
      marginTop: 8,
    },
    recommendationsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    recommendationsTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary.main,
    },
    recommendationsLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 24,
    },
    loadingText: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    recommendationsList: {
      gap: 8,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 12,
      gap: 12,
    },
    recommendationRank: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary.bg20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary.main,
    },
    recommendationContent: {
      flex: 1,
    },
    recommendationCardName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    recommendationCategoryRate: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success.main,
      marginBottom: 2,
    },
    recommendationReason: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    recommendationValue: {
      alignItems: 'flex-end',
    },
    rewardValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.success.main,
    },
    noRecommendations: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    noRecommendationsText: {
      fontSize: 13,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    achievementsCard: {
      backgroundColor: colors.primary.bg20,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.primary.main,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    achievementsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    achievementsIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    achievementsText: {
      flex: 1,
    },
    achievementsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary.dark,
      marginBottom: 2,
    },
    achievementsSubtitle: {
      fontSize: 13,
      color: colors.primary.dark,
      lineHeight: 18,
    },
    streakBadge: {
      marginTop: 4,
    },
    streakText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary.dark,
    },
    // Personalization banner styles
    personalizationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary.bg20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary.main,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    bannerEmoji: {
      fontSize: 20,
    },
    bannerTextContainer: {
      flex: 1,
    },
    bannerText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary.dark,
    },
  });
