/**
 * HomeScreen - Simplified rewards calculator
 * Redesigned to match web with gradient header and CategoryGrid
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
import { ApplyNowButton } from '../components/ApplyNowButton';
import { formatUpToRate } from '../utils/rewardFormatUtils';
import { StoreSelector } from '../components/StoreSelectorNew';
import { CategoryGrid, CategoryType } from '../components/CategoryGrid';
import { useTheme, Theme } from '../theme';
import { colors } from '../theme/colors';
import { Store, SpendingCategory } from '../types';
import { getCards } from '../services/CardPortfolioManager';
import { getAllCardsSync, getAllCards, refreshCards } from '../services/CardDataService';
import { CountryChangeEmitter } from '../services/CountryChangeEmitter';
import { getCurrentTierSync } from '../services/SubscriptionService';
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
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Initialize state with null values - show results only after user input
  const [state, setState] = useState<CalculatorState>({
    selectedStore: null,
    selectedCategory: null, // User must select category
    amount: null, // User must enter amount
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

  // Subscription tier — used to show Pro teaser to free users
  const isFreeTier = getCurrentTierSync() === 'free';

  // Top cards for category - shown when user has no portfolio
  const [, setTopCardsForCategory] = useState<CalculatorOutput | null>(null);

  // Function to load data
  const loadData = useCallback(async () => {
    try {
      await getAllCards();
      const portfolio = getCards();
      const userHasCards = portfolio.length > 0;
      setHasCards(userHasCards);
      setState((prev) => ({ ...prev, isLoading: false, loadError: null }));

      // Load recommendations only for users with cards
      if (userHasCards) {
        setRecommendationsLoading(true);
        try {
          const analysis = await analyzeAndRecommend();
          setRecommendations(analysis.recommendations.slice(0, 3)); // Top 3
        } catch (err) {
          console.warn('Failed to load recommendations:', err);
        } finally {
          setRecommendationsLoading(false);
        }
      } else {
        setRecommendations([]);
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

  // Refresh portfolio state when tab comes into focus (e.g. after adding cards)
  useFocusEffect(
    useCallback(() => {
      const portfolio = getCards();
      const hadCards = hasCards;
      const nowHasCards = portfolio.length > 0;
      if (hadCards !== nowHasCards) {
        loadData();
      }
    }, [hasCards, loadData])
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Subscribe to country changes. Use a monotonic request ID to discard
  // stale responses — if the user toggles country twice rapidly, only the
  // most recent refresh is allowed to update state.
  const countryRequestId = useRef(0);
  useEffect(() => {
    const unsubscribe = CountryChangeEmitter.subscribe(async () => {
      const requestId = ++countryRequestId.current;
      setState((prev) => ({ ...prev, isLoading: true, results: null }));
      setRecommendations([]);
      try {
        await refreshCards(); // Clears cache and fetches new country's cards
        // Abort if a newer country change has started in the meantime.
        if (requestId !== countryRequestId.current) return;
        await loadData();
      } catch (err) {
        console.warn('Failed to refresh cards for new country:', err);
        if (requestId === countryRequestId.current) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
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
  const handleCategoryGridSelect = useCallback(
    (categoryType: CategoryType) => {
      const spendingCat = categoryTypeToSpendingCategory(categoryType);
      handleCategorySelect(spendingCat);
    },
    [handleCategorySelect]
  );

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
  }, [state.selectedCategory, state.amount, state.isLoading, hasCards]);

  // Show loading state with skeleton UI
  if (state.isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        >
          <View style={styles.header}>
            <Skeleton
              width="60%"
              height={28}
              borderRadius={8}
              style={{ alignSelf: 'center', marginBottom: 8 }}
            />
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
      <View
        style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}
      >
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
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
            {t('home.title') || 'Rewardly'}
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
          <Text style={styles.sectionLabel}>{t('home.category') || 'Category'}</Text>
          <CategoryGrid
            selectedCategory={
              state.selectedCategory ? spendingCategoryToCategoryType(state.selectedCategory) : null
            }
            onCategorySelect={handleCategoryGridSelect}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('home.purchaseAmount') || 'Purchase Amount'}</Text>
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
          // When user has no portfolio, show empty state prompting them to add cards
          <EmptyState
            icon="💳"
            title={t('home.noCardsTitle') || 'No Cards Yet'}
            description={
              t('home.noCardsMessage') ||
              'Add your credit cards to see personalized recommendations and maximize your rewards'
            }
            actionLabel={t('home.addCards') || 'Add Cards'}
            onAction={() => (navigation as any).navigate('MyCards')}
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
              category={state.selectedCategory || undefined}
              onCardPress={(result) =>
                (navigation as any).navigate('CardDetail', { cardId: result.cardId })
              }
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

        {/* Recommended Cards Section - Only show when user has cards */}
        {hasCards && (
          <View style={styles.recommendationsSection}>
            <View style={styles.divider} />
            <View style={styles.recommendationsHeader}>
              <View style={styles.recommendationsTitle}>
                <Sparkles size={18} color={colors.primary.main} />
                <Text style={styles.resultsHeader}>
                  {t('home.recommendedCards') || 'Recommended Cards'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => (navigation as any).navigate('Insights', { screen: 'ExploreCards' })}
                accessibilityRole="button"
                accessibilityLabel="Explore all cards"
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
                    <View key={rec.card.id} style={styles.recommendationItem}>
                      <TouchableOpacity
                        style={styles.recommendationMainRow}
                        onPress={() =>
                          (navigation as any).navigate('CardDetail', { cardId: rec.card.id })
                        }
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
                          {rec.estimatedAnnualRewards > 0 ? (
                            <Text style={styles.rewardValue}>
                              ${rec.estimatedAnnualRewards.toFixed(0)}/yr
                            </Text>
                          ) : (
                            <Text style={styles.rewardValue}>{upToRate}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <ApplyNowButton
                        card={rec.card}
                        sourceScreen="home_recommendations"
                        variant="compact"
                        showDisclosure={false}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noRecommendations}>
                <Text style={styles.noRecommendationsText}>
                  {t('home.noRecommendations') ||
                    'Add spending data to get personalized recommendations'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Pro teaser for free users with cards ── */}
        {isFreeTier && hasCards && (
          <TouchableOpacity
            style={styles.proTeaser}
            onPress={() => (navigation as any).navigate('Upgrade', { feature: 'insights', source: 'home_teaser' })}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Unlock Pro features"
          >
            <View style={styles.proTeaserHeader}>
              <Text style={styles.proTeaserBadge}>PRO</Text>
              <Text style={styles.proTeaserTitle}>Unlock deeper insights</Text>
            </View>
            <View style={styles.proTeaserItems}>
              <Text style={styles.proTeaserItem}>✦ Unlimited wallet cards</Text>
              <Text style={styles.proTeaserItem}>✦ 10 Sage AI chats / month</Text>
              <Text style={styles.proTeaserItem}>✦ Rewards IQ score + missed rewards</Text>
            </View>
            <Text style={styles.proTeaserCta}>See Pro plans →</Text>
          </TouchableOpacity>
        )}

        {/* ── Referral banner ── */}
        <TouchableOpacity
          style={styles.referralBanner}
          onPress={() => (navigation as any).navigate('ReferralDashboard')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Share Rewardly to earn free Pro access"
        >
          <Text style={styles.referralEmoji}>🎁</Text>
          <View style={styles.referralText}>
            <Text style={styles.referralTitle}>Share Rewardly, get free Pro</Text>
            <Text style={styles.referralSub}>Earn 1 month free for every friend who signs up</Text>
          </View>
          <ChevronRight size={16} color={colors.primary.main} />
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (_t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    header: {
      marginBottom: 24,
      alignItems: 'center', // Center aligned
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: -0.5,
      marginBottom: 4,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13, // text-sm
      color: colors.text.secondary,
      textAlign: 'center',
    },
    // Removed: heroCard, heroContent, heroIcon, heroEmoji, heroText, heroTitle, heroSubtitle, heroArrow, quickActionsRow, quickActionButton, quickActionEmoji, quickActionLabel, uploadCard, uploadContent, uploadEmoji, uploadText, uploadTitle, uploadSubtitle
    section: {
      marginBottom: 16, // space-y-4 (16px gap)
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginVertical: 14,
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
      minHeight: 44, // Accessibility: minimum touch target 44px
      paddingVertical: 12,
      paddingHorizontal: 8,
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
      flexDirection: 'column',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 12,
      gap: 10,
    },
    recommendationMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
    // Removed: achievementsCard, achievementsContent, achievementsIconContainer, achievementsText, achievementsTitle, achievementsSubtitle, streakBadge, streakText
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
    // Referral banner
    referralBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 14,
      marginTop: 16,
      marginBottom: 8,
      gap: 10,
    },
    referralEmoji: {
      fontSize: 22,
    },
    referralText: {
      flex: 1,
    },
    referralTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    referralSub: {
      fontSize: 11,
      color: colors.text.secondary,
    },
    // Pro teaser for free users
    proTeaser: {
      backgroundColor: colors.background.secondary,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary.main + '50',
      padding: 16,
      marginTop: 16,
      marginBottom: 4,
    },
    proTeaserHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    proTeaserBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.background.primary,
      backgroundColor: colors.primary.main,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      letterSpacing: 0.5,
      overflow: 'hidden',
    },
    proTeaserTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
    },
    proTeaserItems: {
      gap: 5,
      marginBottom: 12,
    },
    proTeaserItem: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    proTeaserCta: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary.main,
    },
  });
