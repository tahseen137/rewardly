/**
 * Core types and enums for the Rewards Optimizer application
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Reward types supported by the system
 */
export enum RewardType {
  CASHBACK = 'cashback',
  POINTS = 'points',
  AIRLINE_MILES = 'airline_miles',
  HOTEL_POINTS = 'hotel_points',
}

/**
 * Spending categories for reward classification
 */
export enum SpendingCategory {
  GROCERIES = 'groceries',
  DINING = 'dining',
  GAS = 'gas',
  TRAVEL = 'travel',
  ONLINE_SHOPPING = 'online_shopping',
  ENTERTAINMENT = 'entertainment',
  DRUGSTORES = 'drugstores',
  HOME_IMPROVEMENT = 'home_improvement',
  OTHER = 'other',
}

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Reward rate representation
 */
export interface RewardRate {
  value: number; // e.g., 3 for 3% or 3x
  type: RewardType;
  unit: 'percent' | 'multiplier';
}

/**
 * Reward rate for a specific category
 */
export interface CategoryReward {
  category: SpendingCategory;
  rewardRate: RewardRate;
}

/**
 * Credit card with reward structure
 */
export interface Card {
  id: string;
  name: string;
  issuer: string;
  rewardProgram: string;
  baseRewardRate: RewardRate;
  categoryRewards: CategoryReward[];
}

/**
 * User's card in their portfolio (reference to Card by ID)
 */
export interface UserCard {
  cardId: string; // Reference to Card.id
  addedAt: Date;
}

/**
 * Store information
 */
export interface Store {
  id: string;
  name: string;
  category: SpendingCategory;
  aliases: string[]; // Alternative names for matching
}

/**
 * User preferences
 */
export interface UserPreferences {
  rewardType: RewardType;
  newCardSuggestionsEnabled: boolean;
}

// ============================================================================
// Recommendation Results
// ============================================================================

/**
 * Ranked card with calculated reward
 */
export interface RankedCard {
  card: Card;
  rewardRate: RewardRate;
  rank: number;
}

/**
 * Store recommendation result
 */
export interface StoreRecommendation {
  store: Store;
  bestCard: RankedCard | null;
  allCards: RankedCard[];
  suggestedNewCards: Card[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Portfolio operation errors
 */
export type PortfolioError =
  | { type: 'DUPLICATE_CARD'; cardName: string }
  | { type: 'CARD_NOT_FOUND'; cardId: string }
  | { type: 'INVALID_CARD_DATA'; message: string };

/**
 * Recommendation errors
 */
export type RecommendationError =
  | { type: 'STORE_NOT_FOUND'; storeName: string }
  | { type: 'PRODUCT_NOT_FOUND'; productName: string }
  | { type: 'EMPTY_PORTFOLIO' }
  | { type: 'SERVICE_UNAVAILABLE'; service: string };

// ============================================================================
// Result Type
// ============================================================================

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a successful result
 */
export function success<T, E>(value: T): Result<T, E> {
  return { success: true, value };
}

/**
 * Create a failed result
 */
export function failure<T, E>(error: E): Result<T, E> {
  return { success: false, error };
}
