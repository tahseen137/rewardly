/**
 * WalletOptimizerScreen - F21: Wallet Optimizer (Portfolio Builder)
 * 
 * 3-step wizard:
 * Step 1: Spending Profile input
 * Step 2: Constraints (max fees, max cards, preferred banks)
 * Step 3: Results
 * 
 * Tier gating: Free sees top result with some cards blurred, Pro/Max see all
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, Settings, TrendingUp, CreditCard, Award } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  SpendingProfileInput,
  WalletConstraints,
  WalletOptimizerResult,
  WalletCombination,
  SpendingCategory,
} from '../types';
import { SpendingProfileForm } from '../components/SpendingProfileForm';
import { optimizeWallet } from '../services/WalletOptimizerService';
import { getSpendingProfileSync, saveSpendingProfile } from '../services/SpendingProfileService';
import { getCurrentTierSync, SubscriptionTier } from '../services/SubscriptionService';
import { getCards } from '../services/CardPortfolioManager';
import { AchievementEventEmitter } from '../services/AchievementEventEmitter';
import { LockedFeature } from '../components';

type Step = 1 | 2 | 3;

const getCategoryDisplayName = (category: SpendingCategory): string => {
  return category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function WalletOptimizerScreen() {
  const navigation = useNavigation();
  const tier = getCurrentTierSync();

  const [step, setStep] = useState<Step>(1);
  const [spendingProfile, setSpendingProfile] = useState<SpendingProfileInput | null>(null);
  const [constraints, setConstraints] = useState<WalletConstraints>({
    maxTotalAnnualFees: 500,
    maxCards: 3,
    country: 'CA',
    preferredRewardType: 'any',
  });
  const [result, setResult] = useState<WalletOptimizerResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    const existing = getSpendingProfileSync();
    if (existing) {
      setSpendingProfile({
        groceries: existing.groceries,
        dining: existing.dining,
        gas: existing.gas,
        travel: existing.travel,
        onlineShopping: existing.onlineShopping,
        entertainment: existing.entertainment,
        drugstores: existing.drugstores,
        homeImprovement: existing.homeImprovement,
        transit: existing.transit,
        other: existing.other,
      });
    }
  }, []);

  const handleSpendingProfileChange = (profile: SpendingProfileInput) => {
    setSpendingProfile(profile);
  };

  const handleNextFromStep1 = async () => {
    if (!spendingProfile) return;
    
    // Save spending profile
    await saveSpendingProfile(spendingProfile);
    setStep(2);
  };

  const handleNextFromStep2 = async () => {
    if (!spendingProfile) return;

    setIsOptimizing(true);
    setError(null);

    try {
      const optimizerResult = optimizeWallet(spendingProfile, constraints, 5);
      
      if (optimizerResult.success) {
        setResult(optimizerResult.value);
        setStep(3);
        
        // Track achievement
        AchievementEventEmitter.track('wallet_optimizer_used', {});
      } else {
        // Handle error
        const errorMsg = optimizerResult.error;
        if (errorMsg.type === 'NO_CARDS_AVAILABLE') {
          setError('No cards available for your constraints. Try adjusting your filters.');
        } else if (errorMsg.type === 'TIMEOUT') {
          setError('Optimization took too long. Try reducing constraints.');
        } else {
          setError('Unable to optimize wallet. Please try again.');
        }
      }
    } catch (err) {
      console.error('Wallet optimization error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Step 1: Your Spending Profile</Text>
        <Text style={styles.stepSubtitle}>
          Enter your monthly spending by category so we can find the best cards for you
        </Text>
      </View>

      <SpendingProfileForm
        initialValues={spendingProfile || undefined}
        onChange={handleSpendingProfileChange}
        showAutoFill
      />

      <View style={styles.stepActions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, !spendingProfile && styles.buttonDisabled]}
          onPress={handleNextFromStep1}
          disabled={!spendingProfile}
        >
          <Text style={styles.buttonText}>Next: Set Constraints</Text>
          <ArrowRight size={20} color={colors.background.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Step 2: Constraints</Text>
        <Text style={styles.stepSubtitle}>
          Set your preferences for the optimization (optional)
        </Text>
      </View>

      <View style={styles.constraintsContainer}>
        {/* Max Annual Fees */}
        <View style={styles.constraintCard}>
          <Text style={styles.constraintLabel}>Maximum Total Annual Fees</Text>
          <Text style={styles.constraintSubtext}>
            Total fees across all recommended cards
          </Text>
          <View style={styles.constraintOptions}>
            {[0, 200, 500, 1000].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  constraints.maxTotalAnnualFees === value && styles.optionButtonActive,
                ]}
                onPress={() => setConstraints({ ...constraints, maxTotalAnnualFees: value })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    constraints.maxTotalAnnualFees === value && styles.optionButtonTextActive,
                  ]}
                >
                  ${value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max Cards */}
        <View style={styles.constraintCard}>
          <Text style={styles.constraintLabel}>Maximum Cards in Wallet</Text>
          <Text style={styles.constraintSubtext}>
            How many cards do you want to carry?
          </Text>
          <View style={styles.constraintOptions}>
            {[2, 3].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  constraints.maxCards === value && styles.optionButtonActive,
                ]}
                onPress={() => setConstraints({ ...constraints, maxCards: value as 2 | 3 })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    constraints.maxCards === value && styles.optionButtonTextActive,
                  ]}
                >
                  {value} cards
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferred Reward Type */}
        <View style={styles.constraintCard}>
          <Text style={styles.constraintLabel}>Preferred Reward Type</Text>
          <Text style={styles.constraintSubtext}>
            Cashback, points, or both?
          </Text>
          <View style={styles.constraintOptions}>
            {[
              { value: 'any', label: 'Any' },
              { value: 'cashback', label: 'Cashback' },
              { value: 'points', label: 'Points' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  constraints.preferredRewardType === option.value && styles.optionButtonActive,
                ]}
                onPress={() =>
                  setConstraints({
                    ...constraints,
                    preferredRewardType: option.value as 'cashback' | 'points' | 'any',
                  })
                }
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    constraints.preferredRewardType === option.value && styles.optionButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.stepActions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setStep(1)}
        >
          <ArrowLeft size={20} color={colors.text.primary} />
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNextFromStep2}
        >
          <Text style={styles.buttonText}>Optimize My Wallet</Text>
          <TrendingUp size={20} color={colors.background.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => {
    if (!result) return null;

    const userCards = getCards();
    const isFree = tier === SubscriptionTier.FREE;
    const visibleResults = isFree ? result.recommendations.slice(0, 1) : result.recommendations.slice(0, 3);

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>🎯 Your Optimized Wallet</Text>
          <Text style={styles.stepSubtitle}>
            Top {visibleResults.length} card combination{visibleResults.length !== 1 ? 's' : ''} for your spending
          </Text>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Evaluated</Text>
            <Text style={styles.statValue}>{result.totalCombinationsEvaluated}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{result.computeTimeMs}ms</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Candidates</Text>
            <Text style={styles.statValue}>{result.prunedCardCount}</Text>
          </View>
        </View>

        {/* vs Current Wallet (if user has cards) */}
        {result.vsCurrentWallet && userCards.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <Award size={20} color={colors.success.main} />
              <Text style={styles.comparisonTitle}>vs Your Current Wallet</Text>
            </View>
            <View style={styles.comparisonStats}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Your Current Value</Text>
                <Text style={styles.comparisonValue}>
                  ${result.vsCurrentWallet.currentNetValue.toFixed(0)}/yr
                </Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Optimized Value</Text>
                <Text style={[styles.comparisonValue, styles.comparisonValueHighlight]}>
                  ${result.recommendations[0].netAnnualValue.toFixed(0)}/yr
                </Text>
              </View>
              <View style={[styles.comparisonRow, styles.comparisonRowTotal]}>
                <Text style={styles.comparisonLabelTotal}>Improvement</Text>
                <Text style={styles.comparisonImprovement}>
                  +${result.vsCurrentWallet.improvement.toFixed(0)}/yr
                  {' '}
                  ({result.vsCurrentWallet.improvementPercent > 0 ? '+' : ''}
                  {result.vsCurrentWallet.improvementPercent.toFixed(0)}%)
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Results */}
        <View style={styles.resultsContainer}>
          {visibleResults.map((combo, index) => (
            <WalletCombinationCard
              key={index}
              combination={combo}
              index={index}
              isLocked={false}
            />
          ))}

          {/* Locked results for free tier */}
          {isFree && result.recommendations.length > 1 && (
            <LockedFeature
              feature="wallet_optimizer"
              title="Unlock All Recommendations"
              description={`Upgrade to see ${result.recommendations.length - 1} more optimized wallet${result.recommendations.length - 1 !== 1 ? 's' : ''}.`}
              variant="card"
            >
              <View style={styles.lockedResults}>
                <Text style={styles.lockedText}>
                  +{result.recommendations.length - 1} more combination{result.recommendations.length - 1 !== 1 ? 's' : ''}
                </Text>
              </View>
            </LockedFeature>
          )}
        </View>

        <View style={styles.stepActions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setStep(2)}
          >
            <Settings size={20} color={colors.text.primary} />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Adjust Constraints</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Optimizer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step && styles.progressDotActive,
              s === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isOptimizing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Optimizing your wallet...</Text>
            <Text style={styles.loadingSubtext}>
              Evaluating thousands of card combinations
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => {
                setError(null);
                setStep(2);
              }}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Wallet Combination Card Component
// ============================================================================

interface WalletCombinationCardProps {
  combination: WalletCombination;
  index: number;
  isLocked: boolean;
}

function WalletCombinationCard({ combination, index, isLocked }: WalletCombinationCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={[styles.combinationCard, isLocked && styles.combinationCardLocked]}
    >
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{combination.rank}</Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsList}>
        {combination.cards.map((card, idx) => (
          <View key={card.id} style={styles.cardItem}>
            <CreditCard size={16} color={colors.primary.main} />
            <Text style={[styles.cardName, isLocked && idx > 0 && styles.cardNameBlurred]} numberOfLines={1}>
              {isLocked && idx > 0 ? '████████████' : card.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.combinationSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Annual Rewards</Text>
          <Text style={styles.summaryValue}>+${combination.totalAnnualRewards.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Annual Fees</Text>
          <Text style={styles.summaryValueNegative}>-${combination.totalAnnualFees.toFixed(0)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryLabelTotal}>Net Annual Value</Text>
          <Text style={styles.summaryValueTotal}>
            ${combination.netAnnualValue.toFixed(0)}/yr
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      {!isLocked && (
        <View style={styles.categoryBreakdown}>
          <Text style={styles.categoryBreakdownTitle}>Category Breakdown</Text>
          <View style={styles.categoryGrid}>
            {combination.categoryAssignments.slice(0, 6).map((assignment, idx) => (
              <View key={idx} style={styles.categoryItem}>
                <Text style={styles.categoryName}>
                  {getCategoryDisplayName(assignment.category)}
                </Text>
                <Text style={styles.categoryCard} numberOfLines={1}>
                  {assignment.bestCardName}
                </Text>
                <Text style={styles.categoryReward}>
                  {assignment.rewardRate}% • ${assignment.annualRewards.toFixed(0)}/yr
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.medium,
  },
  progressDotActive: {
    backgroundColor: colors.primary.main,
  },
  progressDotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
  },
  buttonPrimary: {
    backgroundColor: colors.primary.main,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  buttonTextSecondary: {
    color: colors.text.primary,
  },
  constraintsContainer: {
    gap: 16,
  },
  constraintCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  constraintLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  constraintSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  constraintOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionButtonActive: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.main,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  optionButtonTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error.main,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  comparisonCard: {
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.dark,
  },
  comparisonStats: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonRowTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.success.main + '30',
  },
  comparisonLabel: {
    fontSize: 14,
    color: colors.success.dark,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.dark,
  },
  comparisonValueHighlight: {
    color: colors.success.main,
    fontWeight: '700',
  },
  comparisonLabelTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success.dark,
  },
  comparisonImprovement: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success.main,
  },
  resultsContainer: {
    gap: 16,
  },
  combinationCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  combinationCardLocked: {
    opacity: 0.7,
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background.primary,
  },
  cardsList: {
    gap: 8,
    marginBottom: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  cardNameBlurred: {
    color: colors.text.tertiary,
  },
  combinationSummary: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.main,
  },
  summaryValueNegative: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error.main,
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.main,
  },
  categoryBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  categoryBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    padding: 12,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  categoryCard: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  categoryReward: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  lockedResults: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  lockedText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
