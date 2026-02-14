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
  applicationUrl?: string; // Direct bank application URL for this specific card
  affiliateUrl?: string; // Affiliate/referral tracking URL (monetization)
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
// Cycle 4: CSV Statement Upload + Spending Insights Types
// ============================================================================

/**
 * F24: Supported banks for CSV parsing
 */
export type SupportedBank = 
  | 'td'
  | 'rbc'
  | 'cibc'
  | 'scotiabank'
  | 'bmo'
  | 'tangerine'
  | 'pc_financial'
  | 'amex_canada';

/**
 * F24: Bank detection result
 */
export interface BankDetectionResult {
  bank: SupportedBank | null;
  confidence: number;           // 0-100
  matchedPatterns: string[];    // Which patterns matched
  suggestedBank?: SupportedBank; // If confidence < 80, suggest for user confirmation
}

/**
 * F24: Category confidence levels
 */
export type CategoryConfidence = 'high' | 'medium' | 'low';

/**
 * F24: Single parsed transaction
 */
export interface ParsedTransaction {
  id: string;
  date: Date;
  description: string;          // Raw from CSV
  normalizedMerchant: string;   // Cleaned merchant name
  amount: number;               // Always positive for purchases
  isCredit: boolean;            // true = payment/refund, false = purchase
  category: SpendingCategory;
  categoryConfidence: CategoryConfidence;
  userCorrected: boolean;       // true if user manually changed category
  sourceBank: SupportedBank;
  cardLast4?: string;           // If available from CSV
}

/**
 * F24: Statement upload metadata
 */
export interface StatementUpload {
  id: string;
  userId: string | null;        // null for anonymous/local-only
  fileName: string;
  bank: SupportedBank;
  uploadDate: Date;
  periodStart: Date;
  periodEnd: Date;
  transactionCount: number;
  totalSpend: number;           // Sum of non-credit transactions
  totalCredits: number;         // Sum of credits/payments
}

/**
 * F24: Full statement with transactions
 */
export interface StatementWithTransactions extends StatementUpload {
  transactions: ParsedTransaction[];
}

/**
 * F24: Merchant pattern for categorization
 */
export interface MerchantPattern {
  pattern: RegExp;
  category: SpendingCategory;
  merchantName: string;         // Normalized display name
  confidence: CategoryConfidence;
}

/**
 * F24: User custom merchant mapping
 */
export interface UserMerchantMapping {
  id: string;
  userId: string;
  pattern: string;              // Stored as string, converted to RegExp
  category: SpendingCategory;
  merchantName: string;
  createdAt: Date;
}

/**
 * F24: CSV parsing result
 */
export interface CSVParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  bank: SupportedBank;
  periodStart: Date;
  periodEnd: Date;
  totalSpend: number;
  totalCredits: number;
  errors: CSVParseError[];
  warnings: string[];
}

/**
 * F24: CSV parsing error
 */
export interface CSVParseError {
  line: number;
  message: string;
  rawLine: string;
}

/**
 * F24: Raw CSV row (pre-normalization)
 */
export interface RawCSVRow {
  date: string;
  description: string;
  amount: string;
  debit?: string;
  credit?: string;
  balance?: string;
  cardNumber?: string;
  extras: Record<string, string>;
}

// ============================================================================
// F25: Spending Insights Types
// ============================================================================

/**
 * F25: Category breakdown with optimization analysis
 */
export interface CategoryBreakdown {
  category: SpendingCategory;
  totalSpend: number;
  transactionCount: number;
  percentOfTotal: number;
  topMerchants: MerchantSummary[];
  currentCard: Card | null;     // Which card they used (if known)
  optimalCard: Card | null;     // Which card they SHOULD use
  rewardsEarned: number;        // What they got (estimated)
  rewardsPossible: number;      // What they could get with optimal
  rewardsGap: number;           // Money left on the table
}

/**
 * F25: Merchant spending summary
 */
export interface MerchantSummary {
  name: string;
  amount: number;
  count: number;
  category: SpendingCategory;
}

/**
 * F25: Optimization score (0-100)
 */
export interface OptimizationScore {
  score: number;                // 0-100
  label: string;                // "Rewards Master", "Good Optimizer", etc.
  emoji: string;                // 🏆, 👍, 📊, 🎯
  actualRewards: number;        // Total rewards earned
  maxPossibleRewards: number;   // Max with optimal cards
  rewardsGap: number;           // Difference
  improvementPotential: string; // Human-readable suggestion
}

/**
 * F25: Spending trend analysis
 */
export interface SpendingTrend {
  category: SpendingCategory;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  changeAmount: number;
  direction: 'up' | 'down' | 'stable';
  alert?: SmartAlert;           // Alert if significant change
}

/**
 * F25: Smart alert types
 */
export type SmartAlertType = 
  | 'spending_increase'
  | 'spending_decrease'
  | 'card_switch'
  | 'category_cap'
  | 'new_opportunity'
  | 'seasonal';

/**
 * F25: Smart alert
 */
export interface SmartAlert {
  id: string;
  type: SmartAlertType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category?: SpendingCategory;
  suggestedAction?: string;
  potentialSavings?: number;
  createdAt: Date;
  dismissed: boolean;
}

/**
 * F25: Full insights result
 */
export interface SpendingInsights {
  periodStart: Date;
  periodEnd: Date;
  totalSpend: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  optimizationScore: OptimizationScore;
  trends: SpendingTrend[];
  alerts: SmartAlert[];
  moneyLeftOnTable: number;
  topMerchants: MerchantSummary[];
}

/**
 * F25: Monthly summary for trend analysis
 */
export interface MonthlySummary {
  month: Date;                  // First day of month
  totalSpend: number;
  byCategory: Record<SpendingCategory, number>;
  transactionCount: number;
}

// ============================================================================
// Cycle 4 Error Types
// ============================================================================

export type StatementParseError =
  | { type: 'INVALID_FILE'; message: string }
  | { type: 'UNSUPPORTED_BANK'; detectedFormat?: string }
  | { type: 'EMPTY_FILE' }
  | { type: 'PARSE_FAILED'; errors: CSVParseError[] }
  | { type: 'NO_TRANSACTIONS' }
  | { type: 'STORAGE_ERROR'; message: string };

export type InsightsError =
  | { type: 'NO_TRANSACTIONS'; message: string }
  | { type: 'INSUFFICIENT_DATA'; transactionCount: number; minimumRequired: number }
  | { type: 'DATE_RANGE_ERROR'; message: string }
  | { type: 'CALCULATION_ERROR'; message: string };

// ============================================================================
// Cycle 4 Date Range Filter
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Filter options for transaction queries
 */
export interface TransactionFilter {
  dateRange?: DateRange;
  categories?: SpendingCategory[];
  banks?: SupportedBank[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  excludeCredits?: boolean;
}

// ============================================================================
// Cycle 5: Achievements & 5/24 Tracker Types
// ============================================================================

// ----------------------------------------------------------------------------
// F15: Achievements & Gamification System
// ----------------------------------------------------------------------------

/**
 * Achievement category types
 */
export type AchievementCategory = 
  | 'getting_started'
  | 'optimization'
  | 'data_insights'
  | 'engagement'
  | 'mastery';

/**
 * Achievement definition (static, never changes)
 */
export interface AchievementDefinition {
  id: string;                          // e.g., "GS1", "OP1"
  name: string;                        // Display name
  description: string;                 // What user did to earn it
  category: AchievementCategory;
  icon: string;                        // Emoji
  progressTarget?: number;             // For progressive achievements (e.g., 5 cards)
  secret?: boolean;                    // Hidden until unlocked
}

/**
 * User's progress on a specific achievement
 */
export interface AchievementProgress {
  achievementId: string;
  unlockedAt?: Date;                   // null if locked
  progress: number;                    // Current progress value
  progressTarget: number;              // Target value (from definition)
  isUnlocked: boolean;
  percentComplete: number;             // 0-100
}

/**
 * User's complete achievement state
 */
export interface UserAchievements {
  userId: string | null;               // null for anonymous/local-only
  achievements: Record<string, AchievementProgress>;
  currentStreak: number;               // Consecutive days opened app
  longestStreak: number;               // Best streak ever
  lastVisitDate: string;               // YYYY-MM-DD format
  rank: number;                        // 1-6
  rankTitle: string;                   // "Beginner", "Card Curious", etc.
  totalUnlocked: number;               // Count of unlocked achievements
  totalAchievements: number;           // Total available achievements
  screensVisited: string[];            // For "Explorer" achievement
  cardBenefitsViewed: string[];        // Card IDs viewed for "Card Scholar"
  sageChatsCount: number;              // For "Sage Seeker"
  statementsUploaded: number;          // For "Statement Pro" / "Data Driven"
  comparisonsCount: number;            // For "Comparer"
  updatedAt: Date;
}

/**
 * Achievement unlock event (for animation/notification)
 */
export interface AchievementUnlockEvent {
  achievement: AchievementDefinition;
  progress: AchievementProgress;
  newRank?: { rank: number; title: string }; // If rank changed
  timestamp: Date;
}

/**
 * Rank definition
 */
export interface RankDefinition {
  rank: number;
  title: string;
  minAchievements: number;
  maxAchievements: number;
  emoji: string;
}

/**
 * Achievement event types for tracking
 */
export type AchievementEventType =
  | 'card_added'
  | 'card_removed'
  | 'spending_profile_saved'
  | 'sage_chat'
  | 'wallet_optimizer_used'
  | 'fee_breakeven_viewed'
  | 'signup_roi_viewed'
  | 'gaps_found'
  | 'optimization_score_calculated'
  | 'statement_uploaded'
  | 'insights_viewed'
  | 'trends_viewed'
  | 'money_left_on_table_calculated'
  | 'app_opened'
  | 'card_comparison_viewed'
  | 'screen_visited'
  | 'card_benefits_viewed';

/**
 * Achievement event payload
 */
export interface AchievementEvent {
  type: AchievementEventType;
  data?: {
    cardCount?: number;
    screenName?: string;
    cardId?: string;
    optimizationScore?: number;
    moneyLeftOnTable?: number;
    gapsCount?: number;
    [key: string]: any;
  };
  timestamp: Date;
}

// ----------------------------------------------------------------------------
// F16: Credit Card 5/24 Tracker
// ----------------------------------------------------------------------------

/**
 * Application status
 */
export type ApplicationStatus = 'approved' | 'pending' | 'denied';

/**
 * Single card application record
 */
export interface CardApplication {
  id: string;
  cardId: string;                      // Reference to card in DB
  cardName: string;                    // Denormalized for display
  issuer: string;                      // Issuer name
  applicationDate: Date;
  approvalDate?: Date;                 // May differ from application date
  status: ApplicationStatus;
  fallOffDate: Date;                   // applicationDate + 24 months
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for adding new application
 */
export interface CardApplicationInput {
  cardId: string;
  cardName: string;
  issuer: string;
  applicationDate: Date;
  status: ApplicationStatus;
  notes?: string;
}

/**
 * Issuer-specific cooldown rule
 */
export interface IssuerRule {
  issuer: string;
  cooldownDays: number;                // 0 = no cooldown
  isStrict: boolean;                   // Strict = auto-denial, Soft = may flag review
  description: string;
  maxAppsPerPeriod?: number;           // e.g., 5/24 = 5 apps per 24 months
  periodMonths?: number;               // For maxAppsPerPeriod
  welcomeBonusRule?: string;           // "once per lifetime", etc.
}

/**
 * Issuer cooldown status
 */
export interface IssuerCooldownStatus {
  issuer: string;
  isEligible: boolean;
  lastApplicationDate?: Date;
  nextEligibleDate?: Date;
  daysUntilEligible: number;           // 0 if eligible now
  rule: IssuerRule;
  applicationCountInPeriod: number;    // How many apps to this issuer in period
}

/**
 * Card-specific eligibility check result
 */
export interface CardEligibility {
  cardId: string;
  cardName: string;
  issuer: string;
  isEligible: boolean;
  reasons: string[];                   // All reasons (may be multiple)
  eligibleDate?: Date;                 // When they'll become eligible
  daysUntilEligible: number;
  cooldownStatus: IssuerCooldownStatus;
  previousApplications: CardApplication[]; // Past apps for this card
  welcomeBonusEligible: boolean;       // Based on issuer rules
}

/**
 * Timeline event (for UI display)
 */
export interface ApplicationTimelineEvent {
  date: Date;
  type: 'application' | 'falloff' | 'eligible';
  application?: CardApplication;
  description: string;
  isInFuture: boolean;
}

/**
 * Strategy advice for applying to a card
 */
export interface StrategyAdvice {
  cardId: string;
  cardName: string;
  issuer: string;
  recommendation: 'apply_now' | 'wait' | 'caution' | 'not_recommended';
  reasons: string[];
  suggestedDate?: Date;                // If "wait", when to apply
  priority: number;                    // Lower = apply first
  impact: {
    will524Increase: boolean;          // Will applying increase 5/24 count?
    new524Count: number;               // What 5/24 count would be after
    affectedIssuers: string[];         // Which issuer cooldowns would start
  };
}

/**
 * Full application tracker state
 */
export interface ApplicationTracker {
  userId: string | null;
  applications: CardApplication[];
  countLast24Months: number;           // The "X/24" number
  countLast12Months: number;           // Additional tracking
  issuerCooldowns: IssuerCooldownStatus[];
  upcoming: ApplicationTimelineEvent[];// Future falloffs and eligibility dates
  alerts: TrackerAlert[];              // Active alerts
  updatedAt: Date;
}

/**
 * Tracker alert
 */
export interface TrackerAlert {
  id: string;
  type: 'approaching_limit' | 'now_eligible' | 'cooldown_ending' | 'falloff_soon';
  title: string;
  message: string;
  issuer?: string;
  cardId?: string;
  date: Date;                          // When the event occurs
  dismissed: boolean;
  createdAt: Date;
}

/**
 * Wanted card for strategy planning
 */
export interface WantedCard {
  cardId: string;
  cardName: string;
  issuer: string;
  priority: 'high' | 'medium' | 'low';
  addedAt: Date;
}

/**
 * Full strategy result
 */
export interface ApplicationStrategy {
  wantedCards: WantedCard[];
  advice: StrategyAdvice[];
  timeline: ApplicationTimelineEvent[];
  warnings: string[];
  summary: string;                     // Human-readable summary
}

// ----------------------------------------------------------------------------
// Error Types
// ----------------------------------------------------------------------------

export type AchievementError =
  | { type: 'STORAGE_ERROR'; message: string }
  | { type: 'INVALID_EVENT'; event: string }
  | { type: 'ACHIEVEMENT_NOT_FOUND'; achievementId: string };

export type ApplicationTrackerError =
  | { type: 'STORAGE_ERROR'; message: string }
  | { type: 'INVALID_APPLICATION'; message: string }
  | { type: 'APPLICATION_NOT_FOUND'; applicationId: string }
  | { type: 'CARD_NOT_FOUND'; cardId: string }
  | { type: 'DUPLICATE_APPLICATION'; cardId: string; date: string };

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
