/**
 * Rewards IQ Types - Gamification & Analytics
 * For the mega build session - Feb 12-13, 2026
 */

import { SpendingCategory, Card, RewardType } from './index';

// ============================================================================
// Transaction Types (for missed rewards calculation)
// ============================================================================

/**
 * A user's transaction for analysis
 */
export interface Transaction {
  id: string;
  merchantName: string;
  category: SpendingCategory;
  amount: number; // in CAD
  date: Date;
  cardUsed: string; // cardId
  rewardsEarned: number; // actual rewards earned in CAD equivalent
}

/**
 * Missed reward for a single transaction
 */
export interface MissedReward {
  transaction: Transaction;
  optimalCard: Card;
  actualRewardsCad: number;
  optimalRewardsCad: number;
  missedCad: number;
  percentageLost: number;
}

/**
 * Summary of missed rewards by category
 */
export interface CategoryMissedRewards {
  category: SpendingCategory;
  totalSpend: number;
  totalMissed: number;
  transactionCount: number;
  averageMissedPerTransaction: number;
}

/**
 * Full missed rewards analysis
 */
export interface MissedRewardsAnalysis {
  periodStart: Date;
  periodEnd: Date;
  totalSpend: number;
  totalActualRewards: number;
  totalOptimalRewards: number;
  totalMissed: number;
  missedPercentage: number;
  byCategory: CategoryMissedRewards[];
  topMissedTransactions: MissedReward[];
  projectedYearlyMissed: number;
}

// ============================================================================
// Rewards IQ Types
// ============================================================================

/**
 * Rewards IQ Score breakdown
 */
export interface RewardsIQScore {
  overallScore: number; // 0-100
  
  // Component scores (each 0-100)
  optimalCardUsageScore: number; // 60% weight
  portfolioOptimizationScore: number; // 25% weight
  autoPilotScore: number; // 15% weight
  
  // Percentile ranking
  percentile: number; // e.g., 88 = top 12%
  
  // Trend
  previousScore?: number;
  trend: 'up' | 'down' | 'stable';
  trendAmount: number;
}

/**
 * User's spending profile for optimization
 */
export interface SpendingProfile {
  monthlySpending: Map<SpendingCategory, number>;
  totalMonthly: number;
  topCategories: SpendingCategory[];
  estimatedAnnual: number;
}

// ============================================================================
// Portfolio Optimizer Types
// ============================================================================

/**
 * Card setup with annual rewards calculation
 */
export interface CardSetup {
  cards: Card[];
  annualRewards: number;
  byCategory: Map<SpendingCategory, { card: Card; rewards: number }>;
}

/**
 * Portfolio optimization recommendation
 */
export interface PortfolioOptimization {
  currentSetup: CardSetup;
  recommendedSetup: CardSetup;
  annualGain: number;
  gainPercentage: number;
  cardsToAdd: Card[];
  cardsToRemove: Card[];
  breakdown: CategoryOptimization[];
}

/**
 * Per-category optimization detail
 */
export interface CategoryOptimization {
  category: SpendingCategory;
  monthlySpend: number;
  currentCard: Card | null;
  currentMonthlyRewards: number;
  recommendedCard: Card;
  recommendedMonthlyRewards: number;
  monthlyGain: number;
  annualGain: number;
}

// ============================================================================
// Social Sharing Types
// ============================================================================

/**
 * Shareable stats for social media
 */
export interface ShareableStats {
  rewardsIQ: number;
  percentile: number;
  annualOptimization: number;
  topCategory: SpendingCategory;
  shareText: string;
  shareUrl: string;
}

// ============================================================================
// Onboarding Types
// ============================================================================

/**
 * Spending estimate input during onboarding
 */
export interface SpendingEstimate {
  category: SpendingCategory;
  monthlyAmount: number;
  label: string;
  icon: string;
}

/**
 * Onboarding step data
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: 'value-prop' | 'cards' | 'spending' | 'autopilot' | 'rewards-iq';
}
