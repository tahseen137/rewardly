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
  programDetails?: ProgramDetails; // Detailed reward program information
}

/**
 * Detailed reward program information
 */
export interface ProgramDetails {
  programName: string;
  programCategory?: string; // 'Airline Miles', 'Credit Card Points', etc.
  directRateCents?: number; // Direct/baseline redemption value in cents
  optimalRateCents?: number; // Best possible redemption value in cents
  optimalMethod?: string; // How to achieve optimal rate
  redemptionOptions?: RedemptionOption[]; // All available redemption methods
}

/**
 * Redemption option for a reward program
 */
export interface RedemptionOption {
  redemption_type: string;
  cents_per_point: number;
  minimum_redemption: number | null;
  notes: string | null;
}

/**
 * User's card in their portfolio (reference to Card by ID)
 */
export interface UserCard {
  cardId: string; // Reference to Card.id
  addedAt: Date;
  pointBalance?: number; // User's current point balance for this card
  balanceUpdatedAt?: Date; // When the balance was last updated
  nickname?: string; // Optional nickname for the card
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
  | { type: 'INVALID_CARD_DATA'; message: string }
  | { type: 'LIMIT_REACHED'; message: string; limit: number };

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
// Cycle 1 Features (F1-F10)
// ============================================================================

/**
 * F1: Card Benefits
 */
export type BenefitCategory = 'travel' | 'purchase' | 'insurance' | 'lifestyle';

export interface Benefit {
  name: string;
  description: string;
  category: BenefitCategory;
  value?: string; // "$500,000 coverage"
}

/**
 * F2: SUB (Sign-Up Bonus) Tracking
 */
export type SUBStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface SUBTracking {
  id: string;
  userId: string;
  cardId: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  deadlineDate: Date;
  bonusDescription?: string;
  bonusAmount?: number;
  bonusCurrency?: string;
  status: SUBStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SUBProgress {
  sub: SUBTracking;
  percentComplete: number;
  amountRemaining: number;
  daysRemaining: number;
  dailyTargetNeeded: number; // To hit goal
  isOnTrack: boolean;
  isUrgent: boolean; // <7 days and under target
}

/**
 * F4: Spending Log
 */
export interface SpendingEntry {
  id: string;
  userId: string;
  amount: number;
  category: SpendingCategory;
  storeName?: string;
  cardUsed: string; // cardId
  optimalCard?: string;
  rewardsEarned: number;
  rewardsMissed: number;
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpendingFilter {
  cardId?: string;
  category?: SpendingCategory;
  startDate?: Date;
  endDate?: Date;
}

export interface SpendingSummary {
  totalSpend: number;
  totalRewardsEarned: number;
  totalRewardsMissed: number;
  transactionCount: number;
}

/**
 * F5: Recurring Charges
 */
export interface RecurringCharge {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: SpendingCategory;
  billingDay?: number;
  currentCard?: string;
  optimalCard?: string;
  currentRewards: number;
  optimalRewards: number;
  monthlySavings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringSummary {
  totalMonthlyCharges: number;
  totalCurrentRewards: number;
  totalOptimalRewards: number;
  totalMonthlySavings: number;
  optimizedCount: number; // charges not on optimal card
}

/**
 * F3: Card Comparison
 */
export interface ComparisonResult {
  cards: Card[];
  categoryComparisons: CategoryComparison[];
  overallScores: { cardId: string; score: number }[];
  winner: string; // cardId
}

export interface CategoryComparison {
  category: SpendingCategory | 'annual_fee' | 'signup_bonus' | 'benefits_count';
  values: { cardId: string; value: number | string; isWinner: boolean }[];
}

/**
 * F9: Notifications
 */
export type NotificationType = 
  | 'sub_deadline' 
  | 'fee_renewal' 
  | 'bonus_category' 
  | 'monthly_report' 
  | 'new_card_offer'
  | 'spending_alert'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string; // Screen name or deep link
  actionData?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Cycle 3: Smart Recommendations Engine Types
// ============================================================================

/**
 * Spending categories matching existing SpendingCategory enum
 * Extended to include 'transit' for the spending profile
 */
export type SpendingProfileCategory = 
  | 'groceries'
  | 'dining'
  | 'gas'
  | 'travel'
  | 'online_shopping'
  | 'entertainment'
  | 'drugstores'
  | 'home_improvement'
  | 'transit'
  | 'other';

/**
 * F21/F22/F23 Shared: User's monthly spending profile
 */
export interface SpendingProfile {
  id: string;
  userId: string | null;  // null for anonymous/local-only users
  groceries: number;      // Monthly $ amount
  dining: number;
  gas: number;
  travel: number;
  onlineShopping: number;
  entertainment: number;
  drugstores: number;
  homeImprovement: number;
  transit: number;
  other: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Spending profile input (without metadata)
 */
export interface SpendingProfileInput {
  groceries: number;
  dining: number;
  gas: number;
  travel: number;
  onlineShopping: number;
  entertainment: number;
  drugstores: number;
  homeImprovement: number;
  transit: number;
  other: number;
}

/**
 * F21: Wallet Optimizer Constraints
 */
export interface WalletConstraints {
  maxTotalAnnualFees: number;        // e.g., $300/yr max across all cards
  maxCards: 2 | 3;                   // Number of cards in combination
  preferredBanks?: string[];         // e.g., ["TD", "RBC"]
  excludedCardIds?: string[];        // Cards user doesn't want
  country: 'CA' | 'US';
  preferredRewardType?: 'cashback' | 'points' | 'any';
}

/**
 * F21: Category assignment in wallet result
 */
export interface CategoryAssignment {
  category: SpendingCategory;
  bestCardId: string;
  bestCardName: string;
  rewardRate: number;                // e.g., 4 for 4% or 4x
  rewardType: RewardType;
  monthlySpend: number;
  monthlyRewards: number;            // In CAD
  annualRewards: number;             // In CAD
}

/**
 * F21: Single wallet combination result
 */
export interface WalletCombination {
  rank: number;
  cardIds: string[];
  cards: Card[];
  totalAnnualRewards: number;        // Before fees, in CAD
  totalAnnualFees: number;
  netAnnualValue: number;            // Rewards - Fees
  categoryAssignments: CategoryAssignment[];
  effectiveRewardRate: number;       // Weighted average across all spending
}

/**
 * F21: Comparison to current wallet
 */
export interface CurrentWalletComparison {
  currentCardIds: string[];
  currentNetValue: number;
  improvement: number;               // $ more per year
  improvementPercent: number;
}

/**
 * F21: Full wallet optimizer result
 */
export interface WalletOptimizerResult {
  spendingProfile: SpendingProfile;
  constraints: WalletConstraints;
  recommendations: WalletCombination[];  // Top N combinations
  totalCombinationsEvaluated: number;
  prunedCardCount: number;               // Cards after pruning
  computeTimeMs: number;
  vsCurrentWallet?: CurrentWalletComparison;
}

/**
 * F22: Timeline entry for signup bonus progress
 */
export interface SignupBonusTimelineEntry {
  month: number;                     // 1, 2, 3, etc.
  cumulativeSpend: number;
  hitTarget: boolean;
  percentComplete: number;
}

/**
 * F22: Signup bonus verdict
 */
export type SignupBonusVerdict = 'excellent' | 'good' | 'marginal' | 'not_worth_it';

/**
 * F22: Signup Bonus ROI result
 */
export interface SignupBonusROI {
  card: Card;
  bonusValueCAD: number;             // Converted to CAD
  minimumSpend: number;
  timeframeDays: number;
  monthlySpendNeeded: number;        // To hit minimum on time
  userMonthlySpend: number;          // From spending profile
  canHitMinimum: boolean;
  monthsToHit: number;
  percentOfTimeframeUsed: number;    // monthsToHit / (timeframeDays / 30)
  timeline: SignupBonusTimelineEntry[];
  firstYearValue: number;            // Bonus + rewards - fee
  ongoingAnnualValue: number;        // Year 2+ rewards - fee
  verdict: SignupBonusVerdict;
  verdictReason: string;
}

/**
 * F23: Fee breakeven category breakdown
 */
export interface FeeCategoryBreakdown {
  category: SpendingCategory;
  monthlySpend: number;
  rewardRate: number;
  annualRewards: number;
  percentOfFeeRecovered: number;     // This category alone covers X% of fee
}

/**
 * F23: No-fee card comparison
 */
export interface NoFeeComparison {
  bestNoFeeCard: Card;
  noFeeAnnualRewards: number;
  feeCardAdvantage: number;          // Can be negative
  verdict: string;                   // Human-readable verdict
}

/**
 * F23: Fee breakeven verdict
 */
export type FeeBreakevenVerdict = 'easily_worth_it' | 'worth_it' | 'borderline' | 'not_worth_it';

/**
 * F23: Fee breakeven result
 */
export interface FeeBreakevenResult {
  card: Card;
  annualFee: number;
  annualRewardsEarned: number;
  netValue: number;                  // Rewards - Fee
  breakEvenMonthlySpend: number;     // Total spend needed to justify fee
  userMonthlySpend: number;
  userAnnualSpend: number;
  exceedsBreakeven: boolean;
  surplusOverBreakeven: number;      // How much above breakeven (or deficit if negative)
  multiplierOverFee: number;         // e.g., 2.5 means rewards are 2.5x the fee
  categoryBreakdown: FeeCategoryBreakdown[];
  noFeeComparison?: NoFeeComparison;
  verdict: FeeBreakevenVerdict;
  verdictReason: string;
}

/**
 * Pruned card for wallet optimizer (lightweight)
 */
export interface PrunedCard {
  cardId: string;
  card: Card;
  topCategories: SpendingCategory[]; // Categories where this card is top 15
  maxCategoryRate: number;           // Highest category rate
  annualFee: number;
}

/**
 * Error types for Cycle 3 services
 */
export type SpendingProfileError =
  | { type: 'INVALID_AMOUNT'; category: string; value: number }
  | { type: 'PROFILE_NOT_FOUND' }
  | { type: 'STORAGE_ERROR'; message: string };

export type WalletOptimizerError =
  | { type: 'NO_CARDS_AVAILABLE'; country: string }
  | { type: 'INVALID_CONSTRAINTS'; message: string }
  | { type: 'TIMEOUT'; computeTimeMs: number }
  | { type: 'SPENDING_PROFILE_REQUIRED' };

export type SignupBonusError =
  | { type: 'NO_SIGNUP_BONUS'; cardId: string }
  | { type: 'SPENDING_PROFILE_REQUIRED' }
  | { type: 'CARD_NOT_FOUND'; cardId: string };

export type FeeBreakevenError =
  | { type: 'NO_ANNUAL_FEE'; cardId: string }
  | { type: 'SPENDING_PROFILE_REQUIRED' }
  | { type: 'CARD_NOT_FOUND'; cardId: string };

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
