/**
 * CardComparisonService - Side-by-side card comparison
 * 
 * Tier: Free (2 cards), Pro+ (3 cards)
 * Compares cards across all spending categories, fees, bonuses, benefits
 */

import { Card, ComparisonResult, CategoryComparison, SpendingCategory } from '../types';
import { getCardByIdSync } from './CardDataService';
import { calculateReward } from './RewardsCalculatorService';
import { getCurrentTierSync, SubscriptionTier } from './SubscriptionService';
import { getBenefitsForCard } from './BenefitsService';

// ============================================================================
// Constants
// ============================================================================

const COMPARISON_CATEGORIES: (SpendingCategory | string)[] = [
  SpendingCategory.GROCERIES,
  SpendingCategory.DINING,
  SpendingCategory.GAS,
  SpendingCategory.TRAVEL,
  SpendingCategory.ONLINE_SHOPPING,
  SpendingCategory.ENTERTAINMENT,
  SpendingCategory.DRUGSTORES,
  SpendingCategory.HOME_IMPROVEMENT,
  SpendingCategory.OTHER,
  'annual_fee',
  'signup_bonus',
  'benefits_count',
];

// ============================================================================
// Tier Limits
// ============================================================================

/**
 * Get maximum number of cards that can be compared based on tier
 */
export function getMaxCardsForTier(tier?: SubscriptionTier): number {
  const currentTier = tier || getCurrentTierSync();
  return currentTier === 'free' ? 2 : 3;
}

// ============================================================================
// Comparison Logic
// ============================================================================

/**
 * Compare multiple cards side-by-side
 */
export function compareCards(cardIds: string[]): ComparisonResult {
  const cards = cardIds
    .map(id => getCardByIdSync(id))
    .filter(Boolean) as Card[];

  if (cards.length === 0) {
    return {
      cards: [],
      categoryComparisons: [],
      overallScores: [],
      winner: '',
    };
  }

  const categoryComparisons = COMPARISON_CATEGORIES.map(category => 
    compareCategory(cards, category)
  );

  const overallScores = cards.map(card => ({
    cardId: card.id,
    score: calculateOverallScore(card),
  }));

  // Sort scores to find winner
  const sortedScores = [...overallScores].sort((a, b) => b.score - a.score);
  const winner = sortedScores[0]?.cardId || '';

  return {
    cards,
    categoryComparisons,
    overallScores,
    winner,
  };
}

/**
 * Compare cards for a specific category
 */
function compareCategory(
  cards: Card[],
  category: SpendingCategory | string
): CategoryComparison {
  const values = cards.map(card => {
    let value: number | string;

    if (category === 'annual_fee') {
      value = card.annualFee || 0;
    } else if (category === 'signup_bonus') {
      value = card.signupBonus?.amount || 0;
    } else if (category === 'benefits_count') {
      const benefits = getBenefitsForCard(card.id);
      value = benefits.length;
    } else {
      // Spending category - calculate rewards for $100 purchase
      value = calculateReward(card, category as SpendingCategory, 100);
    }

    return {
      cardId: card.id,
      value,
      isWinner: false, // Will be set below
    };
  });

  // Determine winner(s)
  if (category === 'annual_fee') {
    // Lower is better for fees
    const minFee = Math.min(...values.map(v => typeof v.value === 'number' ? v.value : 0));
    values.forEach(v => {
      if (typeof v.value === 'number' && v.value === minFee) {
        v.isWinner = true;
      }
    });
  } else {
    // Higher is better for rewards, bonuses, benefits
    const maxValue = Math.max(...values.map(v => typeof v.value === 'number' ? v.value : 0));
    values.forEach(v => {
      if (typeof v.value === 'number' && v.value === maxValue && maxValue > 0) {
        v.isWinner = true;
      }
    });
  }

  return {
    category: category as any,
    values,
  };
}

/**
 * Calculate overall score for a card (0-100)
 */
export function calculateOverallScore(card: Card): number {
  let score = 0;

  // Base reward rate (0-20 points)
  const baseRate = card.baseRewardRate.value;
  score += Math.min(baseRate * 4, 20);

  // Category bonuses (0-40 points)
  const avgCategoryReward = card.categoryRewards.reduce((sum, cr) => {
    return sum + cr.rewardRate.value;
  }, 0) / (card.categoryRewards.length || 1);
  score += Math.min(avgCategoryReward * 5, 40);

  // Signup bonus (0-20 points)
  if (card.signupBonus) {
    const bonusValue = card.signupBonus.amount;
    score += Math.min(bonusValue / 500, 20); // Cap at 20 for 10K points
  }

  // Annual fee penalty (0-20 points deduction)
  const fee = card.annualFee || 0;
  score -= Math.min(fee / 10, 20);

  // Benefits count (0-20 points)
  const benefits = getBenefitsForCard(card.id);
  score += Math.min(benefits.length * 2, 20);

  return Math.max(0, Math.min(100, score));
}

/**
 * Get all comparison categories
 */
export function getComparisonCategories(): (SpendingCategory | string)[] {
  return [...COMPARISON_CATEGORIES];
}

/**
 * Format comparison value for display
 */
export function formatComparisonValue(
  value: number | string,
  category: SpendingCategory | string
): string {
  if (typeof value === 'string') return value;

  if (category === 'annual_fee') {
    return value === 0 ? 'No fee' : `$${value}`;
  }

  if (category === 'signup_bonus') {
    return value === 0 ? 'None' : value.toLocaleString();
  }

  if (category === 'benefits_count') {
    return value.toString();
  }

  // Rewards - show percentage or multiplier
  if (value === 0) return '0%';
  if (value < 1) return `${(value * 100).toFixed(1)}%`;
  return `${value.toFixed(1)}x`;
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: SpendingCategory | string): string {
  const names: Record<string, string> = {
    [SpendingCategory.GROCERIES]: 'Groceries',
    [SpendingCategory.DINING]: 'Dining',
    [SpendingCategory.GAS]: 'Gas',
    [SpendingCategory.TRAVEL]: 'Travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'Online Shopping',
    [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
    [SpendingCategory.DRUGSTORES]: 'Pharmacy',
    [SpendingCategory.HOME_IMPROVEMENT]: 'Home Improvement',
    [SpendingCategory.OTHER]: 'Everything Else',
    'annual_fee': 'Annual Fee',
    'signup_bonus': 'Sign-Up Bonus',
    'benefits_count': 'Benefits',
  };

  return names[category] || category;
}
