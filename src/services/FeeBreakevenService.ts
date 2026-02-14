/**
 * FeeBreakevenService - F23: Annual Fee Breakeven Calculator
 * 
 * Proves whether premium cards pay for themselves with user's spending.
 */

import {
  Card,
  SpendingCategory,
  SpendingProfileInput,
  FeeBreakevenResult,
  FeeCategoryBreakdown,
  NoFeeComparison,
  FeeBreakevenVerdict,
  FeeBreakevenError,
  Result,
  success,
  failure,
} from '../types';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getSpendingProfileSync, getSpendForCategory, calculateTotalMonthlySpend } from './SpendingProfileService';
import { getApplicableMultiplier } from './RewardsCalculatorService';

// ============================================================================
// Constants
// ============================================================================

// Categories to evaluate (excludes transit which maps to OTHER)
const EVALUATION_CATEGORIES: SpendingCategory[] = [
  SpendingCategory.GROCERIES,
  SpendingCategory.DINING,
  SpendingCategory.GAS,
  SpendingCategory.TRAVEL,
  SpendingCategory.ONLINE_SHOPPING,
  SpendingCategory.ENTERTAINMENT,
  SpendingCategory.DRUGSTORES,
  SpendingCategory.HOME_IMPROVEMENT,
  SpendingCategory.OTHER,
];

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate annual rewards for a card in a specific category
 * Returns CAD value
 */
export function calculateCategoryRewards(
  card: Card,
  category: SpendingCategory,
  monthlySpend: number
): number {
  const rate = getApplicableMultiplier(card, category);
  const annualSpend = monthlySpend * 12;
  
  // For cashback cards, rate is percentage (e.g., 4 for 4%)
  // For points cards, rate is multiplier (e.g., 5 for 5x)
  if (card.baseRewardRate.type === 'cashback') {
    // Cashback: annualSpend × (rate / 100)
    return annualSpend * (rate / 100);
  } else {
    // Points: annualSpend × rate × pointValuation / 100
    const pointsEarned = annualSpend * rate;
    const pointValuation = card.programDetails?.optimalRateCents ?? card.pointValuation ?? 100;
    return pointsEarned * (pointValuation / 100);
  }
}

/**
 * Calculate total annual rewards across all categories
 */
export function calculateTotalAnnualRewards(
  card: Card,
  spendingProfile: SpendingProfileInput
): number {
  let total = 0;
  for (const category of EVALUATION_CATEGORIES) {
    const monthlySpend = getSpendForCategory(spendingProfile, category);
    total += calculateCategoryRewards(card, category, monthlySpend);
  }
  return total;
}

/**
 * Calculate breakeven monthly spend
 * This is the total monthly spend needed to justify the annual fee
 */
export function calculateBreakEvenMonthlySpend(
  annualFee: number,
  effectiveRewardRate: number
): number {
  if (effectiveRewardRate <= 0) return Infinity;
  // effectiveRewardRate is a percentage (e.g., 2 for 2%)
  // breakeven annual spend = annualFee / (rate / 100)
  // breakeven monthly = breakeven annual / 12
  const breakEvenAnnual = annualFee / (effectiveRewardRate / 100);
  return breakEvenAnnual / 12;
}

/**
 * Calculate effective reward rate across spending profile
 * Returns weighted average percentage
 */
export function calculateEffectiveRewardRate(
  card: Card,
  spendingProfile: SpendingProfileInput
): number {
  let totalRewards = 0;
  let totalSpend = 0;

  for (const category of EVALUATION_CATEGORIES) {
    const monthlySpend = getSpendForCategory(spendingProfile, category);
    totalSpend += monthlySpend * 12;
    totalRewards += calculateCategoryRewards(card, category, monthlySpend);
  }

  if (totalSpend === 0) return 0;
  return (totalRewards / totalSpend) * 100;
}

/**
 * Calculate category breakdown showing contribution to fee recovery
 */
export function calculateCategoryBreakdown(
  card: Card,
  spendingProfile: SpendingProfileInput,
  annualFee: number
): FeeCategoryBreakdown[] {
  const breakdown: FeeCategoryBreakdown[] = [];

  for (const category of EVALUATION_CATEGORIES) {
    const monthlySpend = getSpendForCategory(spendingProfile, category);
    if (monthlySpend <= 0) continue;

    const annualRewards = calculateCategoryRewards(card, category, monthlySpend);
    const rewardRate = getApplicableMultiplier(card, category);
    
    const percentOfFeeRecovered = annualFee > 0 
      ? (annualRewards / annualFee) * 100 
      : 0;

    breakdown.push({
      category,
      monthlySpend,
      rewardRate,
      annualRewards,
      percentOfFeeRecovered,
    });
  }

  // Sort by annual rewards descending
  return breakdown.sort((a, b) => b.annualRewards - a.annualRewards);
}

/**
 * Find best no-fee card for comparison
 */
export function findBestNoFeeCard(
  spendingProfile: SpendingProfileInput
): Card | null {
  const allCards = getAllCardsSync();
  
  // Filter to no-fee cards
  const noFeeCards = allCards.filter(c => !c.annualFee || c.annualFee === 0);
  
  if (noFeeCards.length === 0) return null;

  // Find the one with highest rewards for this profile
  let bestCard: Card | null = null;
  let bestRewards = 0;

  for (const card of noFeeCards) {
    const rewards = calculateTotalAnnualRewards(card, spendingProfile);
    if (rewards > bestRewards) {
      bestRewards = rewards;
      bestCard = card;
    }
  }

  return bestCard;
}

/**
 * Compare fee card to best no-fee alternative
 */
export function compareToNoFeeCard(
  feeCard: Card,
  feeCardRewards: number,
  spendingProfile: SpendingProfileInput
): NoFeeComparison | undefined {
  const noFeeCard = findBestNoFeeCard(spendingProfile);
  if (!noFeeCard) return undefined;

  const noFeeRewards = calculateTotalAnnualRewards(noFeeCard, spendingProfile);
  const feeCardNetValue = feeCardRewards - (feeCard.annualFee || 0);
  const advantage = feeCardNetValue - noFeeRewards;

  let verdict: string;
  if (advantage > 100) {
    verdict = `The ${feeCard.name} earns $${Math.round(advantage)} more per year even after the fee.`;
  } else if (advantage > 0) {
    verdict = `The ${feeCard.name} is slightly better, earning $${Math.round(advantage)} more per year.`;
  } else if (advantage > -50) {
    verdict = `The cards are roughly equal. Consider the ${feeCard.name}'s perks.`;
  } else {
    verdict = `The no-fee ${noFeeCard.name} is better for your spending, saving you $${Math.round(-advantage)}/year.`;
  }

  return {
    bestNoFeeCard: noFeeCard,
    noFeeAnnualRewards: noFeeRewards,
    feeCardAdvantage: advantage,
    verdict,
  };
}

/**
 * Determine fee breakeven verdict
 */
export function determineFeeVerdict(
  netValue: number,
  annualFee: number
): { verdict: FeeBreakevenVerdict; reason: string } {
  // Easily worth it: rewards > 3x the fee (net value > 2x fee)
  if (netValue > 2 * annualFee) {
    return {
      verdict: 'easily_worth_it',
      reason: `Your rewards are ${((netValue + annualFee) / annualFee).toFixed(1)}× the annual fee!`,
    };
  }

  // Worth it: net value > 0
  if (netValue > 0) {
    return {
      verdict: 'worth_it',
      reason: `You earn $${Math.round(netValue)} more than the fee costs.`,
    };
  }

  // Borderline: net value between -$20 and $0
  if (netValue >= -20) {
    return {
      verdict: 'borderline',
      reason: `You're close to breaking even. Consider the card's perks and benefits.`,
    };
  }

  // Not worth it: net value < -$20
  return {
    verdict: 'not_worth_it',
    reason: `The fee costs $${Math.round(-netValue)} more than you'd earn in rewards.`,
  };
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Calculate fee breakeven analysis for a card
 */
export function calculateFeeBreakeven(
  cardId: string,
  spendingProfile?: SpendingProfileInput
): Result<FeeBreakevenResult, FeeBreakevenError> {
  // Get card
  const card = getCardByIdSync(cardId);
  if (!card) {
    return failure({ type: 'CARD_NOT_FOUND', cardId });
  }

  // Check for annual fee
  const annualFee = card.annualFee || 0;
  if (annualFee === 0) {
    return failure({ type: 'NO_ANNUAL_FEE', cardId });
  }

  // Get spending profile
  const profile = spendingProfile || getSpendingProfileSync();
  if (!profile) {
    return failure({ type: 'SPENDING_PROFILE_REQUIRED' });
  }

  // Calculate metrics
  const annualRewardsEarned = calculateTotalAnnualRewards(card, profile);
  const netValue = annualRewardsEarned - annualFee;
  const userMonthlySpend = calculateTotalMonthlySpend(profile);
  const userAnnualSpend = userMonthlySpend * 12;
  
  const effectiveRewardRate = calculateEffectiveRewardRate(card, profile);
  const breakEvenMonthlySpend = calculateBreakEvenMonthlySpend(annualFee, effectiveRewardRate);
  
  const exceedsBreakeven = userMonthlySpend >= breakEvenMonthlySpend;
  const surplusOverBreakeven = (userMonthlySpend - breakEvenMonthlySpend) * 12;
  const multiplierOverFee = annualFee > 0 ? annualRewardsEarned / annualFee : 0;
  
  const categoryBreakdown = calculateCategoryBreakdown(card, profile, annualFee);
  const noFeeComparison = compareToNoFeeCard(card, annualRewardsEarned, profile);
  
  const { verdict, reason } = determineFeeVerdict(netValue, annualFee);

  return success({
    card,
    annualFee,
    annualRewardsEarned,
    netValue,
    breakEvenMonthlySpend,
    userMonthlySpend,
    userAnnualSpend,
    exceedsBreakeven,
    surplusOverBreakeven,
    multiplierOverFee,
    categoryBreakdown,
    noFeeComparison,
    verdict,
    verdictReason: reason,
  });
}

/**
 * Compare fee breakeven across multiple cards
 * Returns cards sorted by net value
 */
export function compareFeeBreakeven(
  cardIds: string[],
  spendingProfile?: SpendingProfileInput
): FeeBreakevenResult[] {
  const results: FeeBreakevenResult[] = [];

  for (const cardId of cardIds) {
    const result = calculateFeeBreakeven(cardId, spendingProfile);
    if (result.success) {
      results.push(result.value);
    }
  }

  // Sort by net value descending
  return results.sort((a, b) => b.netValue - a.netValue);
}

/**
 * Find cards with best fee value for user's spending
 */
export function findBestFeeCards(
  spendingProfile?: SpendingProfileInput,
  limit: number = 5
): FeeBreakevenResult[] {
  const allCards = getAllCardsSync();
  
  // Filter to cards with annual fees
  const cardsWithFees = allCards.filter(c => c.annualFee && c.annualFee > 0);
  
  // Calculate fee breakeven for each
  return compareFeeBreakeven(
    cardsWithFees.map(c => c.id),
    spendingProfile
  ).slice(0, limit);
}
