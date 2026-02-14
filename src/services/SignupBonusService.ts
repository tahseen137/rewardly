/**
 * SignupBonusService - F22: Signup Bonus ROI Calculator
 * 
 * Calculates whether a user can realistically hit minimum spend
 * requirements and the total first-year value of a card.
 */

import {
  Card,
  SignupBonus,
  SpendingProfileInput,
  SignupBonusROI,
  SignupBonusTimelineEntry,
  SignupBonusVerdict,
  SignupBonusError,
  Result,
  success,
  failure,
} from '../types';
import { getCardByIdSync, getAllCardsSync } from './CardDataService';
import { getSpendingProfileSync, calculateTotalMonthlySpend } from './SpendingProfileService';
import { pointsToCad } from './RewardsCalculatorService';
import { calculateTotalAnnualRewards } from './FeeBreakevenService';

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate bonus value in CAD
 */
export function calculateBonusValueCAD(
  bonus: SignupBonus,
  card: Card
): number {
  const pointValuation = card.programDetails?.optimalRateCents ?? card.pointValuation ?? 1;
  
  // For cashback bonuses, the amount is already in cents
  if (bonus.currency === 'cashback') {
    return bonus.amount / 100;
  }
  
  // For points/miles, convert using point valuation
  return pointsToCad(bonus.amount, card, pointValuation);
}

/**
 * Calculate months needed to hit minimum spend
 */
export function calculateMonthsToHit(
  minimumSpend: number,
  monthlySpend: number
): number {
  if (monthlySpend <= 0) return Infinity;
  return Math.ceil(minimumSpend / monthlySpend);
}

/**
 * Calculate monthly spend needed to hit minimum on time
 */
export function calculateMonthlySpendNeeded(
  minimumSpend: number,
  timeframeDays: number
): number {
  const months = timeframeDays / 30;
  return Math.ceil(minimumSpend / months);
}

/**
 * Determine if user can hit minimum spend
 */
export function canHitMinimumSpend(
  monthsToHit: number,
  timeframeDays: number
): boolean {
  const timeframeMonths = timeframeDays / 30;
  return monthsToHit <= timeframeMonths;
}

/**
 * Generate timeline of spend progress
 */
export function generateTimeline(
  monthlySpend: number,
  minimumSpend: number,
  maxMonths: number = 6
): SignupBonusTimelineEntry[] {
  const timeline: SignupBonusTimelineEntry[] = [];
  let cumulative = 0;

  for (let month = 1; month <= maxMonths; month++) {
    cumulative += monthlySpend;
    const hitTarget = cumulative >= minimumSpend;
    const percentComplete = Math.min(100, (cumulative / minimumSpend) * 100);

    timeline.push({
      month,
      cumulativeSpend: cumulative,
      hitTarget,
      percentComplete,
    });

    if (hitTarget) break;
  }

  return timeline;
}

/**
 * Calculate first year value (signup bonus + ongoing rewards - annual fee)
 */
export function calculateFirstYearValue(
  bonusValueCAD: number,
  annualRewards: number,
  annualFee: number
): number {
  return bonusValueCAD + annualRewards - annualFee;
}

/**
 * Calculate ongoing annual value (rewards - fee, no bonus)
 */
export function calculateOngoingValue(
  annualRewards: number,
  annualFee: number
): number {
  return annualRewards - annualFee;
}

/**
 * Determine verdict based on criteria
 */
export function determineVerdict(
  canHit: boolean,
  percentOfTimeframeUsed: number,
  firstYearValue: number,
  ongoingValue: number
): { verdict: SignupBonusVerdict; reason: string } {
  if (!canHit) {
    return {
      verdict: 'not_worth_it',
      reason: `You likely can't hit the minimum spend requirement based on your current spending patterns.`,
    };
  }

  // Excellent: Can hit easily (<70% timeframe), FYV > $500, ongoing > $100
  if (
    percentOfTimeframeUsed < 70 &&
    firstYearValue > 500 &&
    ongoingValue > 100
  ) {
    return {
      verdict: 'excellent',
      reason: `You'll easily hit the minimum spend and earn strong ongoing rewards.`,
    };
  }

  // Good: Can hit (<100% timeframe), FYV > $200, ongoing > $0
  if (
    percentOfTimeframeUsed <= 100 &&
    firstYearValue > 200 &&
    ongoingValue > 0
  ) {
    return {
      verdict: 'good',
      reason: `You can hit the minimum spend, and the card pays for itself after year one.`,
    };
  }

  // Marginal: Can barely hit, or FYV < $200, or ongoing negative but bonus compensates
  if (canHit) {
    if (firstYearValue > 0) {
      return {
        verdict: 'marginal',
        reason: `The bonus makes year one worthwhile, but ongoing value is limited.`,
      };
    }
  }

  return {
    verdict: 'not_worth_it',
    reason: `The annual fee outweighs the rewards for your spending level.`,
  };
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Calculate signup bonus ROI for a card
 * 
 * @param cardId - The card to analyze
 * @param spendingProfile - Optional spending profile (uses cached if not provided)
 */
export function calculateSignupBonusROI(
  cardId: string,
  spendingProfile?: SpendingProfileInput
): Result<SignupBonusROI, SignupBonusError> {
  // Get card
  const card = getCardByIdSync(cardId);
  if (!card) {
    return failure({ type: 'CARD_NOT_FOUND', cardId });
  }

  // Check for signup bonus
  if (!card.signupBonus) {
    return failure({ type: 'NO_SIGNUP_BONUS', cardId });
  }

  // Get spending profile
  const profile = spendingProfile || getSpendingProfileSync();
  if (!profile) {
    return failure({ type: 'SPENDING_PROFILE_REQUIRED' });
  }

  const bonus = card.signupBonus;
  const userMonthlySpend = calculateTotalMonthlySpend(profile);
  
  // Calculate all metrics
  const bonusValueCAD = calculateBonusValueCAD(bonus, card);
  const monthlySpendNeeded = calculateMonthlySpendNeeded(bonus.spendRequirement, bonus.timeframeDays);
  const monthsToHit = calculateMonthsToHit(bonus.spendRequirement, userMonthlySpend);
  const canHit = canHitMinimumSpend(monthsToHit, bonus.timeframeDays);
  const percentOfTimeframeUsed = (monthsToHit / (bonus.timeframeDays / 30)) * 100;
  
  const timeline = generateTimeline(
    userMonthlySpend,
    bonus.spendRequirement,
    Math.ceil(bonus.timeframeDays / 30) + 1
  );

  const annualRewards = calculateTotalAnnualRewards(card, profile);
  const annualFee = card.annualFee || 0;
  
  const firstYearValue = calculateFirstYearValue(bonusValueCAD, annualRewards, annualFee);
  const ongoingValue = calculateOngoingValue(annualRewards, annualFee);

  const { verdict, reason } = determineVerdict(
    canHit,
    percentOfTimeframeUsed,
    firstYearValue,
    ongoingValue
  );

  return success({
    card,
    bonusValueCAD,
    minimumSpend: bonus.spendRequirement,
    timeframeDays: bonus.timeframeDays,
    monthlySpendNeeded,
    userMonthlySpend,
    canHitMinimum: canHit,
    monthsToHit: Math.min(monthsToHit, 12), // Cap at 12 for display
    percentOfTimeframeUsed,
    timeline,
    firstYearValue,
    ongoingAnnualValue: ongoingValue,
    verdict,
    verdictReason: reason,
  });
}

/**
 * Compare signup bonuses across multiple cards
 * Returns cards sorted by first year value
 */
export function compareSignupBonuses(
  cardIds: string[],
  spendingProfile?: SpendingProfileInput
): SignupBonusROI[] {
  const results: SignupBonusROI[] = [];

  for (const cardId of cardIds) {
    const result = calculateSignupBonusROI(cardId, spendingProfile);
    if (result.success) {
      results.push(result.value);
    }
  }

  // Sort by first year value descending
  return results.sort((a, b) => b.firstYearValue - a.firstYearValue);
}

/**
 * Find cards with best signup bonuses for user's spending
 */
export function findBestSignupBonuses(
  spendingProfile?: SpendingProfileInput,
  limit: number = 5
): SignupBonusROI[] {
  const allCards = getAllCardsSync();
  
  // Filter to cards with signup bonuses
  const cardsWithBonus = allCards.filter(c => c.signupBonus);
  
  // Calculate ROI for each
  return compareSignupBonuses(
    cardsWithBonus.map(c => c.id),
    spendingProfile
  ).slice(0, limit);
}
