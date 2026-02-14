/**
 * WalletOptimizerService - F21: Portfolio Builder
 * 
 * Finds optimal 2-3 card combinations for a spending profile.
 * Uses aggressive pruning to handle 354 cards within 2 second constraint.
 */

import {
  Card,
  SpendingCategory,
  SpendingProfile,
  SpendingProfileInput,
  WalletConstraints,
  WalletCombination,
  WalletOptimizerResult,
  CategoryAssignment,
  CurrentWalletComparison,
  WalletOptimizerError,
  PrunedCard,
  RewardType,
  Result,
  success,
  failure,
} from '../types';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getCards } from './CardPortfolioManager';
import { getSpendingProfileSync, getSpendForCategory } from './SpendingProfileService';
import { getApplicableMultiplier, pointsToCad } from './RewardsCalculatorService';

// ============================================================================
// Constants
// ============================================================================

// Max cards per category to include in pruning (top performers)
const TOP_CARDS_PER_CATEGORY = 15;

// Max total candidates after pruning (safety limit)
const MAX_CANDIDATE_CARDS = 50;

// Max combinations to evaluate before timeout
const MAX_COMBINATIONS = 10000;

// Timeout in ms
const COMPUTE_TIMEOUT_MS = 1800;

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
  if (card.baseRewardRate.type === RewardType.CASHBACK) {
    // Cashback: annualSpend × (rate / 100)
    return annualSpend * (rate / 100);
  } else {
    // Points: annualSpend × rate × pointValuation / 100
    const pointsEarned = annualSpend * rate;
    const pointValuation = card.programDetails?.optimalRateCents ?? card.pointValuation ?? 1;
    return pointsEarned * (pointValuation / 100);
  }
}

/**
 * Calculate total annual rewards for a card across all spending
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
 * For a wallet (set of cards), determine the best card for each category
 * and calculate total rewards
 */
export function evaluateWalletCombination(
  cards: Card[],
  spendingProfile: SpendingProfileInput
): { categoryAssignments: CategoryAssignment[]; totalRewards: number } {
  const categoryAssignments: CategoryAssignment[] = [];
  let totalRewards = 0;

  for (const category of EVALUATION_CATEGORIES) {
    const monthlySpend = getSpendForCategory(spendingProfile, category);
    
    if (monthlySpend <= 0) {
      continue;
    }

    // Find best card for this category
    let bestCard: Card | null = null;
    let bestRewards = 0;
    let bestRate = 0;

    for (const card of cards) {
      const rewards = calculateCategoryRewards(card, category, monthlySpend);
      if (rewards > bestRewards) {
        bestRewards = rewards;
        bestCard = card;
        bestRate = getApplicableMultiplier(card, category);
      }
    }

    if (bestCard) {
      categoryAssignments.push({
        category,
        bestCardId: bestCard.id,
        bestCardName: bestCard.name,
        rewardRate: bestRate,
        rewardType: bestCard.baseRewardRate.type,
        monthlySpend,
        monthlyRewards: bestRewards / 12,
        annualRewards: bestRewards,
      });
      totalRewards += bestRewards;
    }
  }

  return { categoryAssignments, totalRewards };
}

/**
 * Calculate net annual value (rewards - fees)
 */
export function calculateNetAnnualValue(
  totalRewards: number,
  cards: Card[]
): { netValue: number; totalFees: number } {
  const totalFees = cards.reduce((sum, card) => sum + (card.annualFee || 0), 0);
  return {
    netValue: totalRewards - totalFees,
    totalFees,
  };
}

/**
 * Calculate weighted average effective reward rate
 */
export function calculateEffectiveRewardRate(
  totalRewards: number,
  spendingProfile: SpendingProfileInput
): number {
  let totalSpend = 0;
  for (const category of EVALUATION_CATEGORIES) {
    totalSpend += getSpendForCategory(spendingProfile, category) * 12;
  }
  
  if (totalSpend === 0) return 0;
  return (totalRewards / totalSpend) * 100;
}

/**
 * Prune card list to top performers per category
 * This is the key to making the algorithm fast
 */
export function pruneCards(
  cards: Card[],
  spendingProfile: SpendingProfileInput,
  constraints: WalletConstraints
): PrunedCard[] {
  // Apply hard filters first
  let filtered = cards.filter(card => {
    // Excluded cards
    if (constraints.excludedCardIds?.includes(card.id)) {
      return false;
    }

    // Preferred banks (if specified, only include those)
    if (constraints.preferredBanks && constraints.preferredBanks.length > 0) {
      if (!constraints.preferredBanks.includes(card.issuer)) {
        return false;
      }
    }

    // Preferred reward type
    if (constraints.preferredRewardType && constraints.preferredRewardType !== 'any') {
      const cardType = card.baseRewardRate.type === RewardType.CASHBACK ? 'cashback' : 'points';
      if (cardType !== constraints.preferredRewardType) {
        return false;
      }
    }

    // Annual fee constraint - single card fee can't exceed max total
    if (card.annualFee && card.annualFee > constraints.maxTotalAnnualFees) {
      return false;
    }

    return true;
  });

  // For each category, find top N cards
  const topCardsByCategory = new Map<SpendingCategory, Set<string>>();
  
  for (const category of EVALUATION_CATEGORIES) {
    const monthlySpend = getSpendForCategory(spendingProfile, category);
    
    if (monthlySpend <= 0) continue;

    // Rank cards for this category
    const ranked = filtered
      .map(card => ({
        card,
        rewards: calculateCategoryRewards(card, category, monthlySpend),
      }))
      .sort((a, b) => b.rewards - a.rewards)
      .slice(0, TOP_CARDS_PER_CATEGORY);

    topCardsByCategory.set(
      category,
      new Set(ranked.map(r => r.card.id))
    );
  }

  // Collect all cards that appear in any top category
  const candidateCardIds = new Set<string>();
  for (const cardIds of topCardsByCategory.values()) {
    for (const cardId of cardIds) {
      candidateCardIds.add(cardId);
    }
  }

  // Convert to PrunedCard array
  const prunedCards: PrunedCard[] = [];
  
  for (const cardId of candidateCardIds) {
    const card = filtered.find(c => c.id === cardId);
    if (!card) continue;

    // Find which categories this card is top for
    const topCategories: SpendingCategory[] = [];
    let maxRate = 0;

    for (const [category, cardIds] of topCardsByCategory) {
      if (cardIds.has(cardId)) {
        topCategories.push(category);
        const rate = getApplicableMultiplier(card, category);
        maxRate = Math.max(maxRate, rate);
      }
    }

    prunedCards.push({
      cardId,
      card,
      topCategories,
      maxCategoryRate: maxRate,
      annualFee: card.annualFee || 0,
    });
  }

  // If still too many, take top MAX_CANDIDATE_CARDS by max category rate
  if (prunedCards.length > MAX_CANDIDATE_CARDS) {
    prunedCards.sort((a, b) => b.maxCategoryRate - a.maxCategoryRate);
    return prunedCards.slice(0, MAX_CANDIDATE_CARDS);
  }

  return prunedCards;
}

/**
 * Generate all valid combinations of N cards from candidate list
 * Respects fee constraints
 */
export function generateCombinations(
  prunedCards: PrunedCard[],
  maxCards: 2 | 3,
  maxTotalFees: number
): Card[][] {
  const combinations: Card[][] = [];
  const n = prunedCards.length;

  if (maxCards === 2) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const totalFees = prunedCards[i].annualFee + prunedCards[j].annualFee;
        if (totalFees <= maxTotalFees) {
          combinations.push([prunedCards[i].card, prunedCards[j].card]);
        }
        if (combinations.length >= MAX_COMBINATIONS) return combinations;
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const totalFees = 
            prunedCards[i].annualFee + 
            prunedCards[j].annualFee + 
            prunedCards[k].annualFee;
          if (totalFees <= maxTotalFees) {
            combinations.push([
              prunedCards[i].card,
              prunedCards[j].card,
              prunedCards[k].card,
            ]);
          }
          if (combinations.length >= MAX_COMBINATIONS) return combinations;
        }
      }
    }
  }

  return combinations;
}

/**
 * Rank combinations by net annual value
 */
export function rankCombinations(
  combinations: Card[][],
  spendingProfile: SpendingProfileInput,
  topN: number = 5
): WalletCombination[] {
  const results: WalletCombination[] = [];

  for (const cards of combinations) {
    const { categoryAssignments, totalRewards } = evaluateWalletCombination(
      cards,
      spendingProfile
    );
    const { netValue, totalFees } = calculateNetAnnualValue(totalRewards, cards);
    const effectiveRate = calculateEffectiveRewardRate(totalRewards, spendingProfile);

    results.push({
      rank: 0, // Will be set after sorting
      cardIds: cards.map(c => c.id),
      cards,
      totalAnnualRewards: totalRewards,
      totalAnnualFees: totalFees,
      netAnnualValue: netValue,
      categoryAssignments,
      effectiveRewardRate: effectiveRate,
    });
  }

  // Sort by net value descending
  results.sort((a, b) => b.netAnnualValue - a.netAnnualValue);

  // Assign ranks and take top N
  return results.slice(0, topN).map((result, index) => ({
    ...result,
    rank: index + 1,
  }));
}

/**
 * Compare optimized wallet to user's current wallet
 */
export function compareToCurrentWallet(
  optimizedNetValue: number,
  spendingProfile: SpendingProfileInput
): CurrentWalletComparison | undefined {
  const userCards = getCards();
  if (userCards.length === 0) return undefined;

  const currentCards: Card[] = [];
  for (const uc of userCards) {
    const card = getCardByIdSync(uc.cardId);
    if (card) currentCards.push(card);
  }

  if (currentCards.length === 0) return undefined;

  const { totalRewards } = evaluateWalletCombination(currentCards, spendingProfile);
  const { netValue: currentNetValue } = calculateNetAnnualValue(totalRewards, currentCards);

  const improvement = optimizedNetValue - currentNetValue;
  const improvementPercent = currentNetValue !== 0
    ? (improvement / Math.abs(currentNetValue)) * 100
    : improvement > 0 ? 100 : 0;

  return {
    currentCardIds: currentCards.map(c => c.id),
    currentNetValue,
    improvement,
    improvementPercent,
  };
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Run the wallet optimizer
 * 
 * @param spendingProfile - User's spending profile
 * @param constraints - Optimization constraints
 * @param topN - Number of top combinations to return (default 3)
 */
export function optimizeWallet(
  spendingProfile: SpendingProfileInput,
  constraints: WalletConstraints,
  topN: number = 3
): Result<WalletOptimizerResult, WalletOptimizerError> {
  const startTime = Date.now();

  // Validate constraints
  if (constraints.maxCards !== 2 && constraints.maxCards !== 3) {
    return failure({
      type: 'INVALID_CONSTRAINTS',
      message: 'maxCards must be 2 or 3',
    });
  }

  if (constraints.maxTotalAnnualFees < 0) {
    return failure({
      type: 'INVALID_CONSTRAINTS',
      message: 'maxTotalAnnualFees must be non-negative',
    });
  }

  // Get all cards for the specified country
  const allCards = getAllCardsSync();
  if (allCards.length === 0) {
    return failure({
      type: 'NO_CARDS_AVAILABLE',
      country: constraints.country,
    });
  }

  // Step 1: Prune cards to top performers
  const prunedCards = pruneCards(allCards, spendingProfile, constraints);
  
  if (prunedCards.length < constraints.maxCards) {
    return failure({
      type: 'NO_CARDS_AVAILABLE',
      country: constraints.country,
    });
  }

  // Step 2: Generate valid combinations
  const combinations = generateCombinations(
    prunedCards,
    constraints.maxCards,
    constraints.maxTotalAnnualFees
  );

  // Check timeout
  if (Date.now() - startTime > COMPUTE_TIMEOUT_MS) {
    return failure({
      type: 'TIMEOUT',
      computeTimeMs: Date.now() - startTime,
    });
  }

  // Step 3: Rank combinations
  const recommendations = rankCombinations(combinations, spendingProfile, topN);

  // Step 4: Compare to current wallet (if user has cards)
  const vsCurrentWallet = recommendations.length > 0
    ? compareToCurrentWallet(recommendations[0].netAnnualValue, spendingProfile)
    : undefined;

  const computeTimeMs = Date.now() - startTime;

  // Build full profile for result
  const fullProfile = getSpendingProfileSync() || {
    id: 'temp',
    userId: null,
    ...spendingProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return success({
    spendingProfile: fullProfile,
    constraints,
    recommendations,
    totalCombinationsEvaluated: combinations.length,
    prunedCardCount: prunedCards.length,
    computeTimeMs,
    vsCurrentWallet,
  });
}

/**
 * Quick estimate for a single card in wallet context
 * Used for display purposes
 */
export function estimateCardValue(
  card: Card,
  spendingProfile: SpendingProfileInput
): { annualRewards: number; netValue: number } {
  const annualRewards = calculateTotalAnnualRewards(card, spendingProfile);
  const netValue = annualRewards - (card.annualFee || 0);
  return { annualRewards, netValue };
}
