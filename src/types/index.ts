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
 * Signup bonus details
 */
export interface SignupBonus {
  amount: number;
  currency: RewardType;
  spendRequirement: number; // In CAD
  timeframeDays: number;
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
  annualFee?: number; // Annual fee in CAD
  signupBonus?: SignupBonus; // Signup bonus details
  pointValuation?: number; // Value of one point in CAD cents
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

/**
 * Store-card combination for product recommendations
 */
export interface StoreCardCombination {
  store: Store;
  bestCard: RankedCard | null;
  rewardRate: number; // Numeric reward rate for comparison
}

/**
 * Product recommendation result
 * Requirements: 4.3, 4.4
 */
export interface ProductRecommendation {
  productName: string;
  productCategory: SpendingCategory;
  recommendedStore: Store;
  recommendedCard: RankedCard | null;
  allStoreOptions: StoreCardCombination[];
}

// ============================================================================
// Price Comparison Types (Requirements 6.1-6.6)
// ============================================================================

/**
 * Sort options for price comparison results
 * Requirement 6.5
 */
export enum PriceSortOption {
  LOWEST_PRICE = 'lowest_price',
  HIGHEST_REWARDS = 'highest_rewards',
  LOWEST_EFFECTIVE_PRICE = 'lowest_effective_price',
}

/**
 * Store option with price and reward information
 * Requirements: 6.2, 6.3, 6.4
 */
export interface PricedStoreOption {
  store: Store;
  bestCard: RankedCard | null;
  price: number | null; // null if price unavailable (Req 6.6)
  rewardRate: number; // Reward rate percentage
  rewardValue: number; // Calculated reward value in CAD
  effectivePrice: number | null; // price - rewardValue (Req 6.3, 6.4)
  priceAvailable: boolean; // Indicates if price data exists (Req 6.6)
}

/**
 * Price comparison result for a product
 * Requirements: 6.1-6.6
 */
export interface PriceComparisonResult {
  productName: string;
  productId: string;
  productCategory: SpendingCategory;
  storeOptions: PricedStoreOption[];
  sortedBy: PriceSortOption;
  lowestPrice: PricedStoreOption | null;
  highestRewards: PricedStoreOption | null;
  lowestEffectivePrice: PricedStoreOption | null;
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
