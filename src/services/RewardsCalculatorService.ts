/**
 * RewardsCalculatorService - Calculates rewards across all portfolio cards for a specific purchase
 *
 * This service takes a spending category and purchase amount, then calculates
 * the rewards earned on each card in the user's portfolio, sorted by CAD value.
 */

import { Card, SpendingCategory, RewardType } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Result of reward calculation for a single card
 */
export interface RewardCalculationResult {
  cardId: string;
  cardName: string;
  issuer: string;
  rewardProgram: string;
  rewardCurrency: RewardType;
  pointsEarned: number;
  cadValue: number;           // Converted value in CAD
  originalPrice: number;      // Purchase amount
  effectivePrice: number;     // originalPrice - cadValue
  multiplierUsed: number;
  isBaseRate: boolean;
  isCashback: boolean;        // true if cashback (no conversion)
  annualFee: number;
  pointValuation: number;     // in CAD cents
}

/**
 * Input for reward calculation
 */
export interface CalculatorInput {
  category: SpendingCategory;
  amount: number; // in CAD dollars
  portfolioCardIds: string[];
}

/**
 * Output from reward calculation
 */
export interface CalculatorOutput {
  results: RewardCalculationResult[];
  bestCard: RewardCalculationResult | null;
  category: SpendingCategory;
  amount: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the applicable reward multiplier for a card and category
 * Returns category-specific multiplier if available, otherwise base reward rate
 *
 * @param card - The credit card to check
 * @param category - The spending category
 * @returns The applicable multiplier value
 */
export function getApplicableMultiplier(card: Card, category: SpendingCategory): number {
  // Check if card has a category-specific reward
  const categoryReward = card.categoryRewards.find((reward) => reward.category === category);

  if (categoryReward) {
    return categoryReward.rewardRate.value;
  }

  // Fall back to base reward rate
  return card.baseRewardRate.value;
}

/**
 * Calculate reward value for a single card purchase
 * Simple helper that combines multiplier lookup and CAD conversion
 *
 * @param card - The credit card
 * @param category - The spending category
 * @param amount - The purchase amount in CAD
 * @returns CAD value of rewards earned
 */
export function calculateReward(card: Card, category: SpendingCategory, amount: number): number {
  const multiplier = getApplicableMultiplier(card, category);
  const pointsEarned = amount * multiplier;
  const pointValuation = card.programDetails?.optimalRateCents ?? card.pointValuation ?? 100;
  return pointsToCad(pointsEarned, card, pointValuation);
}

/**
 * Convert reward points to CAD value
 * Uses optimal rate from program details if available
 * For cashback cards with percentage rates, divides by 100 to get actual dollar value
 *
 * @param points - Number of points earned (amount × rate for cashback, or actual points for points cards)
 * @param card - The credit card (to check for program details and reward type)
 * @param fallbackValuation - Fallback value of one point in CAD cents
 * @returns CAD value of the points/cashback
 */
export function pointsToCad(points: number, card: Card, fallbackValuation: number): number {
  // For cashback cards, the "points" value is actually (amount × percentage rate)
  // We need to divide by 100 to get the actual dollar value
  // e.g., $100 purchase at 4% = 100 × 4 = 400, but actual cashback is $4.00
  if (card.baseRewardRate.type === RewardType.CASHBACK) {
    return points / 100; // Convert percentage calculation to actual dollars
  }

  // For points/miles cards, use optimal rate from program details if available
  const pointValuation = card.programDetails?.optimalRateCents
    ?? card.pointValuation
    ?? fallbackValuation;

  return points * (pointValuation / 100);
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculate rewards for all cards in the portfolio for a specific purchase
 *
 * @param input - Calculator input with category, amount, and portfolio card IDs
 * @param cards - Array of Card objects (must include all portfolio cards)
 * @param pointValuations - Map of card ID to point valuation in CAD cents
 * @returns Calculator output with results sorted by CAD value
 */
export function calculateRewards(
  input: CalculatorInput,
  cards: Card[],
  pointValuations: Map<string, number>
): CalculatorOutput {
  const { category, amount, portfolioCardIds } = input;

  // Calculate rewards for each card in the portfolio
  const results: RewardCalculationResult[] = portfolioCardIds
    .map((cardId) => {
      // Find the card
      const card = cards.find((c) => c.id === cardId);
      if (!card) {
        return null;
      }

      // Check if this is a cashback card
      const isCashback = card.baseRewardRate.type === RewardType.CASHBACK;

      // Get point valuation - require database value for non-cashback cards
      const pointValuation = card.programDetails?.optimalRateCents
        ?? card.pointValuation
        ?? (isCashback ? 100 : null); // For cashback, 100 cents = $1

      // Skip cards without valid point valuation (except cashback)
      if (pointValuation === null) {
        return null;
      }

      // Get applicable multiplier
      const multiplier = getApplicableMultiplier(card, category);

      // Check if using base rate
      const categoryReward = card.categoryRewards.find((r) => r.category === category);
      const isBaseRate = !categoryReward;

      // Calculate points earned
      const pointsEarned = amount * multiplier;

      // Calculate CAD value using the card object
      const cadValue = pointsToCad(pointsEarned, card, pointValuation);

      // Calculate effective price
      const effectivePrice = amount - cadValue;

      // Build result
      const result: RewardCalculationResult = {
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        rewardProgram: card.rewardProgram,
        rewardCurrency: card.baseRewardRate.type,
        pointsEarned,
        cadValue,
        originalPrice: amount,
        effectivePrice,
        multiplierUsed: multiplier,
        isBaseRate,
        isCashback,
        annualFee: card.annualFee || 0,
        pointValuation,
      };

      return result;
    })
    .filter((result): result is RewardCalculationResult => result !== null);

  // Sort by CAD value descending (best value first)
  results.sort((a, b) => b.cadValue - a.cadValue);

  // Identify best card (first in sorted list)
  const bestCard = results.length > 0 ? results[0] : null;

  return {
    results,
    bestCard,
    category,
    amount,
  };
}
