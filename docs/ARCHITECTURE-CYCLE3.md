# Cycle 3 Architecture Document
## Smart Recommendations Engine

**Author:** VP of Engineering | **Date:** Feb 13, 2026 | **Status:** Ready for Development

---

## Table of Contents
1. [Overview](#overview)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Wallet Optimizer Algorithm](#wallet-optimizer-algorithm)
5. [Database Schema](#database-schema)
6. [Component Hierarchy](#component-hierarchy)
7. [Integration Points](#integration-points)
8. [Tier Gating](#tier-gating)
9. [Test Strategy](#test-strategy)
10. [Build Order](#build-order)
11. [Performance Considerations](#performance-considerations)

---

## Overview

Cycle 3 implements the Smart Recommendations Engine: three tightly integrated features that answer every question a user has before getting a credit card.

### Features
- **F21: Wallet Optimizer** — Find the optimal 2-3 card combination for any spending profile
- **F22: Signup Bonus ROI Calculator** — Determine if you can realistically hit minimum spend
- **F23: Annual Fee Breakeven Calculator** — Prove whether premium cards pay for themselves

### Shared Infrastructure
- **SpendingProfileService** — Central spending profile management, used by all three features

### Key Constraints
- Wallet Optimizer must complete in **< 2 seconds** on mobile
- All calculations must be **pure functions** (testable without mocks)
- SpendingProfileService must work **offline** (AsyncStorage) with optional Supabase sync
- Target: **105+ new tests**

---

## TypeScript Interfaces

Add these types to `src/types/index.ts`:

```typescript
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
```

---

## Service Layer Architecture

### File Structure

```
src/services/
├── SpendingProfileService.ts      # NEW: Shared spending profile management
├── WalletOptimizerService.ts      # NEW: F21 Wallet Optimizer
├── SignupBonusService.ts          # NEW: F22 Signup Bonus ROI
├── FeeBreakevenService.ts         # NEW: F23 Fee Breakeven
├── __tests__/
│   ├── SpendingProfileService.test.ts
│   ├── WalletOptimizerService.test.ts
│   ├── SignupBonusService.test.ts
│   ├── FeeBreakevenService.test.ts
│   └── integration/
│       └── SmartRecommendations.integration.test.ts
```

---

### SpendingProfileService.ts

Central service managing user spending profiles. Works offline (AsyncStorage) with optional Supabase sync.

```typescript
/**
 * SpendingProfileService - Manages user spending profiles
 * 
 * Features:
 * - Local storage (AsyncStorage) for offline support
 * - Optional Supabase sync for authenticated users
 * - Auto-populate from SpendingLog data (F4)
 * - Shared by F21, F22, F23
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { getSpendingEntries } from './SpendingLogService';
import {
  SpendingProfile,
  SpendingProfileInput,
  SpendingProfileError,
  SpendingCategory,
  Result,
  success,
  failure,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@rewardly/spending_profile';

// Default spending profile (average Canadian household)
const DEFAULT_SPENDING: SpendingProfileInput = {
  groceries: 800,
  dining: 200,
  gas: 150,
  travel: 100,
  onlineShopping: 150,
  entertainment: 75,
  drugstores: 50,
  homeImprovement: 50,
  transit: 100,
  other: 200,
};

// ============================================================================
// In-Memory Cache
// ============================================================================

let profileCache: SpendingProfile | null = null;
let isInitialized = false;

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate total monthly spending from a profile
 */
export function calculateTotalMonthlySpend(profile: SpendingProfileInput): number {
  return (
    profile.groceries +
    profile.dining +
    profile.gas +
    profile.travel +
    profile.onlineShopping +
    profile.entertainment +
    profile.drugstores +
    profile.homeImprovement +
    profile.transit +
    profile.other
  );
}

/**
 * Calculate total annual spending
 */
export function calculateTotalAnnualSpend(profile: SpendingProfileInput): number {
  return calculateTotalMonthlySpend(profile) * 12;
}

/**
 * Get spending amount for a category
 */
export function getSpendForCategory(
  profile: SpendingProfileInput,
  category: SpendingCategory
): number {
  const categoryMap: Record<SpendingCategory, keyof SpendingProfileInput> = {
    [SpendingCategory.GROCERIES]: 'groceries',
    [SpendingCategory.DINING]: 'dining',
    [SpendingCategory.GAS]: 'gas',
    [SpendingCategory.TRAVEL]: 'travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'onlineShopping',
    [SpendingCategory.ENTERTAINMENT]: 'entertainment',
    [SpendingCategory.DRUGSTORES]: 'drugstores',
    [SpendingCategory.HOME_IMPROVEMENT]: 'homeImprovement',
    [SpendingCategory.OTHER]: 'other',
  };

  const key = categoryMap[category];
  if (!key) return 0;
  
  // Handle transit specially since it's not a SpendingCategory enum
  return profile[key] ?? 0;
}

/**
 * Validate spending profile input
 */
export function validateSpendingProfile(
  input: SpendingProfileInput
): Result<SpendingProfileInput, SpendingProfileError> {
  const categories = Object.entries(input) as [keyof SpendingProfileInput, number][];
  
  for (const [category, value] of categories) {
    if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
      return failure({
        type: 'INVALID_AMOUNT',
        category,
        value,
      });
    }
  }
  
  return success(input);
}

/**
 * Create a SpendingProfile from input
 */
export function createProfile(
  input: SpendingProfileInput,
  userId: string | null = null,
  existingId?: string
): SpendingProfile {
  const now = new Date();
  return {
    id: existingId || generateId(),
    userId,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Aggregate spending entries into a profile
 * Groups by category and calculates monthly averages
 */
export function aggregateSpendingEntries(
  entries: Array<{ amount: number; category: SpendingCategory; transactionDate: Date }>
): SpendingProfileInput {
  if (entries.length === 0) {
    return { ...DEFAULT_SPENDING };
  }

  // Find date range
  const dates = entries.map(e => e.transactionDate.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daySpan = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
  const monthSpan = Math.max(1, daySpan / 30);

  // Sum by category
  const totals: Record<string, number> = {
    groceries: 0,
    dining: 0,
    gas: 0,
    travel: 0,
    onlineShopping: 0,
    entertainment: 0,
    drugstores: 0,
    homeImprovement: 0,
    transit: 0,
    other: 0,
  };

  for (const entry of entries) {
    const key = categoryToProfileKey(entry.category);
    totals[key] = (totals[key] || 0) + entry.amount;
  }

  // Convert to monthly averages
  return {
    groceries: Math.round(totals.groceries / monthSpan),
    dining: Math.round(totals.dining / monthSpan),
    gas: Math.round(totals.gas / monthSpan),
    travel: Math.round(totals.travel / monthSpan),
    onlineShopping: Math.round(totals.onlineShopping / monthSpan),
    entertainment: Math.round(totals.entertainment / monthSpan),
    drugstores: Math.round(totals.drugstores / monthSpan),
    homeImprovement: Math.round(totals.homeImprovement / monthSpan),
    transit: 0, // Transit not tracked in spending log
    other: Math.round(totals.other / monthSpan),
  };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize spending profile service
 */
export async function initializeSpendingProfile(): Promise<void> {
  if (isInitialized) return;

  try {
    // Try Supabase first for authenticated users
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && !user.isAnonymous) {
        await syncFromSupabase();
        isInitialized = true;
        return;
      }
    }

    // Fallback to local storage
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      profileCache = transformFromStorage(JSON.parse(stored));
    }
    isInitialized = true;
  } catch (error) {
    console.error('[SpendingProfileService] Initialization error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get current spending profile
 * Returns cached profile or null if none exists
 */
export async function getSpendingProfile(): Promise<SpendingProfile | null> {
  if (!isInitialized) await initializeSpendingProfile();
  return profileCache;
}

/**
 * Get spending profile synchronously (from cache)
 */
export function getSpendingProfileSync(): SpendingProfile | null {
  return profileCache;
}

/**
 * Save spending profile
 */
export async function saveSpendingProfile(
  input: SpendingProfileInput
): Promise<Result<SpendingProfile, SpendingProfileError>> {
  if (!isInitialized) await initializeSpendingProfile();

  // Validate input
  const validation = validateSpendingProfile(input);
  if (!validation.success) {
    return validation;
  }

  // Get user ID if authenticated
  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    userId = user?.id ?? null;
  }

  // Create or update profile
  const existingId = profileCache?.id;
  const profile = createProfile(input, userId, existingId);
  profileCache = profile;

  // Persist locally
  await persistToStorage(profile);

  // Sync to Supabase if authenticated
  if (userId && isSupabaseConfigured()) {
    await syncToSupabase(profile);
  }

  return success(profile);
}

/**
 * Auto-populate spending profile from SpendingLog data (F4)
 * Returns null if no spending log data exists
 */
export async function getFromSpendingLog(): Promise<SpendingProfileInput | null> {
  try {
    // Get last 90 days of spending entries
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const entries = await getSpendingEntries(
      { startDate: ninetyDaysAgo },
      Infinity
    );

    if (entries.length < 5) {
      // Not enough data to calculate meaningful averages
      return null;
    }

    return aggregateSpendingEntries(entries);
  } catch (error) {
    console.error('[SpendingProfileService] Error getting from spending log:', error);
    return null;
  }
}

/**
 * Get default spending profile
 */
export function getDefaultSpendingProfile(): SpendingProfileInput {
  return { ...DEFAULT_SPENDING };
}

/**
 * Check if spending profile exists
 */
export async function hasSpendingProfile(): Promise<boolean> {
  if (!isInitialized) await initializeSpendingProfile();
  return profileCache !== null;
}

/**
 * Delete spending profile
 */
export async function deleteSpendingProfile(): Promise<void> {
  profileCache = null;
  await AsyncStorage.removeItem(STORAGE_KEY);

  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('spending_profiles')
        .delete()
        .eq('user_id', user.id);
    }
  }
}

/**
 * Reset cache (for testing)
 */
export function resetSpendingProfileCache(): void {
  profileCache = null;
  isInitialized = false;
}

// ============================================================================
// Storage Functions
// ============================================================================

async function persistToStorage(profile: SpendingProfile): Promise<void> {
  const serialized = JSON.stringify({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

function transformFromStorage(data: any): SpendingProfile {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

// ============================================================================
// Supabase Sync
// ============================================================================

async function syncFromSupabase(): Promise<void> {
  if (!supabase) return;
  
  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('spending_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return;

  profileCache = {
    id: data.id,
    userId: data.user_id,
    groceries: parseFloat(data.groceries) || 0,
    dining: parseFloat(data.dining) || 0,
    gas: parseFloat(data.gas) || 0,
    travel: parseFloat(data.travel) || 0,
    onlineShopping: parseFloat(data.online_shopping) || 0,
    entertainment: parseFloat(data.entertainment) || 0,
    drugstores: parseFloat(data.drugstores) || 0,
    homeImprovement: parseFloat(data.home_improvement) || 0,
    transit: parseFloat(data.transit) || 0,
    other: parseFloat(data.other) || 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };

  await persistToStorage(profileCache);
}

async function syncToSupabase(profile: SpendingProfile): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  const row = {
    id: profile.id,
    user_id: user.id,
    groceries: profile.groceries,
    dining: profile.dining,
    gas: profile.gas,
    travel: profile.travel,
    online_shopping: profile.onlineShopping,
    entertainment: profile.entertainment,
    drugstores: profile.drugstores,
    home_improvement: profile.homeImprovement,
    transit: profile.transit,
    other: profile.other,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from('spending_profiles')
    .upsert(row, { onConflict: 'user_id' });
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function categoryToProfileKey(category: SpendingCategory): string {
  const map: Record<SpendingCategory, string> = {
    [SpendingCategory.GROCERIES]: 'groceries',
    [SpendingCategory.DINING]: 'dining',
    [SpendingCategory.GAS]: 'gas',
    [SpendingCategory.TRAVEL]: 'travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'onlineShopping',
    [SpendingCategory.ENTERTAINMENT]: 'entertainment',
    [SpendingCategory.DRUGSTORES]: 'drugstores',
    [SpendingCategory.HOME_IMPROVEMENT]: 'homeImprovement',
    [SpendingCategory.OTHER]: 'other',
  };
  return map[category] || 'other';
}
```

---

### WalletOptimizerService.ts

The most complex service. Uses pruning to handle 354 cards efficiently.

```typescript
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
  const pointsEarned = annualSpend * rate;
  const pointValuation = card.programDetails?.optimalRateCents ?? card.pointValuation ?? 100;
  return pointsToCad(pointsEarned, card, pointValuation);
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
    // Country filter
    // (Assuming cards have a country field - if not, skip this filter)
    
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
```

---

### SignupBonusService.ts

```typescript
/**
 * SignupBonusService - F22: Signup Bonus ROI Calculator
 * 
 * Calculates whether a user can realistically hit minimum spend
 * requirements and the total first-year value of a card.
 */

import {
  Card,
  SpendingProfile,
  SpendingProfileInput,
  SignupBonus,
  SignupBonusROI,
  SignupBonusTimelineEntry,
  SignupBonusVerdict,
  SignupBonusError,
  Result,
  success,
  failure,
} from '../types';
import { getCardByIdSync } from './CardDataService';
import { getSpendingProfileSync, calculateTotalMonthlySpend } from './SpendingProfileService';
import { pointsToCad } from './RewardsCalculatorService';
import { calculateTotalAnnualRewards } from './WalletOptimizerService';

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
  const pointValuation = card.programDetails?.optimalRateCents ?? card.pointValuation ?? 100;
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

// Import missing function
import { getAllCardsSync } from './CardDataService';
```

---

### FeeBreakevenService.ts

```typescript
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
import { 
  calculateCategoryRewards, 
  calculateTotalAnnualRewards,
  EVALUATION_CATEGORIES 
} from './WalletOptimizerService';

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

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
    const rewardRate = card.categoryRewards.find(cr => cr.category === category)?.rewardRate.value
      ?? card.baseRewardRate.value;
    
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
  
  const effectiveRate = calculateEffectiveRewardRate(card, profile);
  const breakEvenMonthlySpend = calculateBreakEvenMonthlySpend(annualFee, effectiveRate);
  
  const exceedsBreakeven = userMonthlySpend >= breakEvenMonthlySpend;
  const surplusOverBreakeven = (userMonthlySpend - breakEvenMonthlySpend) * 12 * (effectiveRate / 100);
  
  const multiplierOverFee = annualFee > 0 
    ? annualRewardsEarned / annualFee 
    : Infinity;

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
 * Analyze all fee cards in user's portfolio
 */
export function analyzePortfolioFees(
  spendingProfile?: SpendingProfileInput
): FeeBreakevenResult[] {
  const userCards = getCards();
  const results: FeeBreakevenResult[] = [];

  for (const uc of userCards) {
    const card = getCardByIdSync(uc.cardId);
    if (!card || !card.annualFee) continue;

    const result = calculateFeeBreakeven(uc.cardId, spendingProfile);
    if (result.success) {
      results.push(result.value);
    }
  }

  return results.sort((a, b) => b.netValue - a.netValue);
}

/**
 * Find fee cards worth considering for user
 */
export function findWorthwhileFeeCards(
  spendingProfile?: SpendingProfileInput,
  limit: number = 5
): FeeBreakevenResult[] {
  const allCards = getAllCardsSync();
  
  // Filter to cards with annual fees
  const feeCards = allCards.filter(c => c.annualFee && c.annualFee > 0);
  
  const results: FeeBreakevenResult[] = [];
  const profile = spendingProfile || getSpendingProfileSync();
  if (!profile) return [];

  for (const card of feeCards) {
    const result = calculateFeeBreakeven(card.id, profile);
    if (result.success && result.value.verdict !== 'not_worth_it') {
      results.push(result.value);
    }
  }

  return results
    .sort((a, b) => b.netValue - a.netValue)
    .slice(0, limit);
}

// Import missing function
import { getCards } from './CardPortfolioManager';
```

---

## Wallet Optimizer Algorithm

### Pruning Strategy (Key to < 2 Second Performance)

With 354 cards, generating all C(354, 3) = 7,386,524 combinations is computationally infeasible. We use a **category-based pruning** strategy:

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Hard Filters                                        │
│  ────────────────────                                        │
│  • Remove excluded cards                                     │
│  • Remove cards exceeding max fee individually               │
│  • Filter by preferred banks (if specified)                  │
│  • Filter by reward type (if specified)                      │
│  Result: ~200-300 cards                                      │
├─────────────────────────────────────────────────────────────┤
│  Step 2: Category-Based Pruning                              │
│  ─────────────────────────────                               │
│  For each of 9 spending categories:                          │
│    1. Calculate rewards for all remaining cards              │
│    2. Keep top 15 cards for that category                    │
│                                                              │
│  A card survives if it's top-15 in ANY category.             │
│  Result: ~30-50 unique cards (union of all top-15s)          │
├─────────────────────────────────────────────────────────────┤
│  Step 3: Safety Cap                                          │
│  ──────────────                                              │
│  If still > 50 cards, keep top 50 by max category rate.      │
│  Result: ≤50 cards                                           │
├─────────────────────────────────────────────────────────────┤
│  Step 4: Combination Generation                              │
│  ────────────────────────────                                │
│  With 50 cards:                                              │
│    • C(50, 2) = 1,225 pairs                                  │
│    • C(50, 3) = 19,600 triplets                              │
│                                                              │
│  Fee filtering during generation reduces this further.       │
│  Result: ~2,000-5,000 valid combinations                     │
├─────────────────────────────────────────────────────────────┤
│  Step 5: Evaluation & Ranking                                │
│  ───────────────────────────                                 │
│  For each combination:                                       │
│    1. Assign best card per category                          │
│    2. Calculate total annual rewards                         │
│    3. Subtract fees for net value                            │
│                                                              │
│  Sort by net value, return top 3.                            │
│  Result: 3 optimal wallet recommendations                    │
└─────────────────────────────────────────────────────────────┘
```

### Why This Works

1. **Category Champions**: The optimal wallet will contain cards that excel in at least one high-spend category. By keeping top-15 per category, we ensure no optimal card is pruned.

2. **Overlap Efficiency**: Many top cards excel in multiple categories, so the union of top-15s is much smaller than 9 × 15.

3. **Fee-Based Early Exit**: Rejecting invalid fee combinations during generation (not after) prevents wasted computation.

4. **Pure Functions**: Every calculation is a pure function — no database calls during the hot loop.

### Complexity Analysis

```
Before pruning: O(n³) where n = 354 → ~44 million operations
After pruning:  O(m³) where m ≤ 50 → ~125,000 operations

Speedup factor: ~350x
```

---

## Database Schema

### Supabase Migration

```sql
-- ============================================================================
-- Cycle 3: Smart Recommendations Engine
-- Migration: 20260213_spending_profiles.sql
-- ============================================================================

-- Create spending_profiles table
CREATE TABLE IF NOT EXISTS spending_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Monthly spending amounts in dollars
  groceries NUMERIC(10,2) NOT NULL DEFAULT 0,
  dining NUMERIC(10,2) NOT NULL DEFAULT 0,
  gas NUMERIC(10,2) NOT NULL DEFAULT 0,
  travel NUMERIC(10,2) NOT NULL DEFAULT 0,
  online_shopping NUMERIC(10,2) NOT NULL DEFAULT 0,
  entertainment NUMERIC(10,2) NOT NULL DEFAULT 0,
  drugstores NUMERIC(10,2) NOT NULL DEFAULT 0,
  home_improvement NUMERIC(10,2) NOT NULL DEFAULT 0,
  transit NUMERIC(10,2) NOT NULL DEFAULT 0,
  other NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One profile per user
  CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_spending_profiles_user_id 
  ON spending_profiles(user_id);

-- Enable RLS
ALTER TABLE spending_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own spending profile"
  ON spending_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending profile"
  ON spending_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending profile"
  ON spending_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending profile"
  ON spending_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spending_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER spending_profiles_updated_at
  BEFORE UPDATE ON spending_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_spending_profile_timestamp();

-- ============================================================================
-- Optional: Wallet optimizer results cache (for Pro/Max users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_optimizer_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input hash for cache invalidation
  profile_hash TEXT NOT NULL, -- Hash of spending profile + constraints
  
  -- Cached result (JSON)
  result JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  
  -- One cache entry per profile hash per user
  CONSTRAINT unique_user_cache UNIQUE(user_id, profile_hash)
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_wallet_cache_lookup 
  ON wallet_optimizer_cache(user_id, profile_hash)
  WHERE expires_at > now();

-- Enable RLS
ALTER TABLE wallet_optimizer_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cache"
  ON wallet_optimizer_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON wallet_optimizer_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cleanup expired cache entries (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_wallet_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM wallet_optimizer_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

---

## Component Hierarchy

### New Screens

```
src/screens/
├── WalletOptimizerScreen.tsx       # F21: Main optimizer screen
├── SpendingProfileScreen.tsx       # Shared: Spending input form
├── components/
│   ├── SpendingProfileForm.tsx     # Reusable spending input
│   ├── WalletResultCard.tsx        # Single wallet combo display
│   ├── CategoryAssignmentChart.tsx # Category breakdown visualization
│   ├── SignupBonusSection.tsx      # F22: Card detail integration
│   ├── FeeBreakevenSection.tsx     # F23: Card detail integration
│   └── ComparisonModal.tsx         # Side-by-side card comparison
```

### WalletOptimizerScreen Component Tree

```
WalletOptimizerScreen
├── Header
│   └── "Wallet Optimizer"
├── StepIndicator (1 of 3)
├── ContentArea
│   ├── [Step 1: SpendingProfile]
│   │   ├── SpendingProfileForm
│   │   │   ├── CategoryInput (groceries)
│   │   │   ├── CategoryInput (dining)
│   │   │   ├── CategoryInput (gas)
│   │   │   ├── ... (9 total)
│   │   │   └── TotalDisplay
│   │   ├── AutoFillButton ("From Spending Log")
│   │   └── NextButton
│   │
│   ├── [Step 2: Constraints]
│   │   ├── ConstraintsForm
│   │   │   ├── MaxFeeSlider ($0-$500)
│   │   │   ├── CardCountSelector (2 or 3)
│   │   │   ├── BankPreferences (optional)
│   │   │   ├── RewardTypeToggle (any/cashback/points)
│   │   │   └── ExcludedCards (optional)
│   │   ├── BackButton
│   │   └── OptimizeButton
│   │
│   └── [Step 3: Results]
│       ├── LoadingAnimation
│       ├── ResultsList
│       │   ├── WalletResultCard (rank #1, expanded)
│       │   │   ├── CardImages (2-3 cards)
│       │   │   ├── NetValueBadge ("$412/year")
│       │   │   ├── CategoryAssignmentChart
│       │   │   ├── ExpandedDetails
│       │   │   │   ├── RewardsBreakdown
│       │   │   │   ├── FeesBreakdown
│       │   │   │   └── SignupBonusLinks
│       │   │   └── TierGatedContent (Pro+: full details)
│       │   ├── WalletResultCard (rank #2, collapsed)
│       │   └── WalletResultCard (rank #3, collapsed)
│       ├── CurrentWalletComparison (if user has cards)
│       │   ├── ImprovementBadge ("+$150/year")
│       │   └── DetailedComparison
│       ├── ShareButton
│       └── StartOverButton
```

### CardDetailScreen Integration (F22 + F23)

```
CardDetailScreen (existing)
├── ... existing content ...
├── SignupBonusSection (F22)    ← NEW
│   ├── BonusValueDisplay
│   ├── CanHitMinimumBadge
│   ├── TimelineVisualization (Pro+)
│   ├── FirstYearValueDisplay
│   ├── OngoingValueDisplay
│   ├── VerdictBadge (🟢/🟡/🟠/🔴)
│   └── CompareButton
│
├── FeeAnalysisSection (F23)    ← NEW
│   ├── NetValueDisplay
│   ├── BreakevenDisplay
│   ├── CategoryDonutChart (Pro+)
│   ├── NoFeeComparison (Pro+)
│   ├── VerdictBadge
│   └── DetailToggle
│
└── ... existing content ...
```

### SpendingProfileForm Component

```typescript
// src/screens/components/SpendingProfileForm.tsx

interface SpendingProfileFormProps {
  initialValues?: SpendingProfileInput;
  onSubmit: (profile: SpendingProfileInput) => void;
  onCancel?: () => void;
  showAutoFill?: boolean;  // Show "From Spending Log" button
  submitLabel?: string;    // e.g., "Save" or "Next"
}

// Category input with slider + manual entry
interface CategoryInputProps {
  category: string;
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}
```

---

## Integration Points

### Existing Services Used

| Service | Functions Used | Purpose |
|---------|---------------|---------|
| `CardDataService` | `getAllCardsSync`, `getCardByIdSync` | Card database access |
| `CardPortfolioManager` | `getCards` | User's current cards |
| `RewardsCalculatorService` | `getApplicableMultiplier`, `pointsToCad` | Reward calculations |
| `SpendingLogService` | `getSpendingEntries` | Auto-populate spending profile |
| `SubscriptionService` | `getCurrentTierSync`, `canAccessFeatureSync` | Tier gating |

### New Service Dependencies

```
SpendingProfileService
├── Uses: AsyncStorage, Supabase, AuthService, SpendingLogService
└── Used by: WalletOptimizerService, SignupBonusService, FeeBreakevenService

WalletOptimizerService
├── Uses: SpendingProfileService, CardDataService, CardPortfolioManager,
│         RewardsCalculatorService
└── Used by: WalletOptimizerScreen, Sage AI

SignupBonusService
├── Uses: SpendingProfileService, CardDataService, RewardsCalculatorService,
│         WalletOptimizerService (for calculateTotalAnnualRewards)
└── Used by: CardDetailScreen (SignupBonusSection), WalletOptimizerScreen

FeeBreakevenService
├── Uses: SpendingProfileService, CardDataService, CardPortfolioManager,
│         WalletOptimizerService (for calculateTotalAnnualRewards)
└── Used by: CardDetailScreen (FeeAnalysisSection), Sage AI
```

### Sage AI Integration

Add tools for Sage to access Cycle 3 features:

```typescript
// In Sage tool definitions

// F21: Wallet Optimizer
{
  name: 'optimize_wallet',
  description: 'Find optimal 2-3 card combination for spending profile',
  parameters: {
    maxCards: { type: 'number', enum: [2, 3] },
    maxFees: { type: 'number' },
    rewardType: { type: 'string', enum: ['any', 'cashback', 'points'] }
  }
}

// F22: Signup Bonus Analysis
{
  name: 'analyze_signup_bonus',
  description: 'Calculate if user can hit signup bonus and its value',
  parameters: {
    cardId: { type: 'string' }
  }
}

// F23: Fee Analysis
{
  name: 'analyze_fee_breakeven',
  description: 'Determine if card fee is worth it for user spending',
  parameters: {
    cardId: { type: 'string' }
  }
}
```

---

## Tier Gating

### Feature Access Matrix

| Feature | Free | Pro | Max |
|---------|------|-----|-----|
| **F21: Wallet Optimizer** | | | |
| Run optimizer | ✅ | ✅ | ✅ |
| See #1 result (card names visible) | ✅ | ✅ | ✅ |
| See #1 result (full details) | 🔒 | ✅ | ✅ |
| See #2, #3 results | 🔒 | ✅ | ✅ |
| Category breakdown chart | 🔒 | ✅ | ✅ |
| Compare to current wallet | 🔒 | ✅ | ✅ |
| Unlimited combo results | 🔒 | 🔒 | ✅ |
| Affiliate links | 🔒 | 🔒 | ✅ |
| **F22: Signup Bonus ROI** | | | |
| See verdict + first year value | ✅ | ✅ | ✅ |
| Full timeline visualization | 🔒 | ✅ | ✅ |
| Detailed breakdown | 🔒 | ✅ | ✅ |
| Compare multiple bonuses | 🔒 | 🔒 | ✅ |
| **F23: Fee Breakeven** | | | |
| See verdict + net value | ✅ | ✅ | ✅ |
| Full category breakdown | 🔒 | ✅ | ✅ |
| No-fee comparison | 🔒 | ✅ | ✅ |
| Batch portfolio analysis | 🔒 | 🔒 | ✅ |
| **Shared** | | | |
| Save spending profile | ✅ | ✅ | ✅ |
| Sync profile to cloud | ✅ (logged in) | ✅ | ✅ |
| Auto-fill from spending log | 🔒 | ✅ | ✅ |

### Implementation Pattern

```typescript
// In screen/component code:

import { getCurrentTierSync, canAccessFeatureSync } from '../services/SubscriptionService';

function WalletResultCard({ result, rank }: Props) {
  const tier = getCurrentTierSync();
  const canSeeFullDetails = tier !== 'free';
  const canSeeAffiliate = tier === 'max';

  return (
    <View>
      {/* Always show basic info */}
      <Text>Rank #{rank}</Text>
      <CardImages cards={result.cards} blur={!canSeeFullDetails && rank > 1} />
      <NetValueBadge value={result.netAnnualValue} />

      {/* Gated content */}
      {canSeeFullDetails ? (
        <CategoryAssignmentChart data={result.categoryAssignments} />
      ) : (
        <UpgradePrompt feature="Full category breakdown" tier="pro" />
      )}

      {canSeeAffiliate && result.cards.map(card => (
        <AffiliateLink key={card.id} card={card} />
      ))}
    </View>
  );
}
```

---

## Test Strategy

### Test Distribution

| Service | Unit Tests | Integration | Property | Total |
|---------|------------|-------------|----------|-------|
| SpendingProfileService | 15 | 3 | 2 | 20 |
| WalletOptimizerService | 25 | 5 | 5 | 35 |
| SignupBonusService | 18 | 4 | 3 | 25 |
| FeeBreakevenService | 18 | 4 | 3 | 25 |
| **Total** | **76** | **16** | **13** | **105** |

### SpendingProfileService Tests

```typescript
// src/services/__tests__/SpendingProfileService.test.ts

describe('SpendingProfileService', () => {
  // Pure function tests
  describe('calculateTotalMonthlySpend', () => {
    it('should sum all categories', () => {
      const profile: SpendingProfileInput = {
        groceries: 800,
        dining: 200,
        gas: 150,
        travel: 100,
        onlineShopping: 150,
        entertainment: 75,
        drugstores: 50,
        homeImprovement: 50,
        transit: 100,
        other: 200,
      };
      expect(calculateTotalMonthlySpend(profile)).toBe(1875);
    });

    it('should handle zero values', () => {
      const profile: SpendingProfileInput = {
        groceries: 0, dining: 0, gas: 0, travel: 0,
        onlineShopping: 0, entertainment: 0, drugstores: 0,
        homeImprovement: 0, transit: 0, other: 0,
      };
      expect(calculateTotalMonthlySpend(profile)).toBe(0);
    });
  });

  describe('validateSpendingProfile', () => {
    it('should accept valid profile', () => {
      const result = validateSpendingProfile({
        groceries: 800, dining: 200, gas: 150, travel: 100,
        onlineShopping: 150, entertainment: 75, drugstores: 50,
        homeImprovement: 50, transit: 100, other: 200,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const result = validateSpendingProfile({
        groceries: -100, dining: 200, gas: 150, travel: 100,
        onlineShopping: 150, entertainment: 75, drugstores: 50,
        homeImprovement: 50, transit: 100, other: 200,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_AMOUNT');
        expect(result.error.category).toBe('groceries');
      }
    });

    it('should reject NaN values', () => {
      const result = validateSpendingProfile({
        groceries: NaN, dining: 200, gas: 150, travel: 100,
        onlineShopping: 150, entertainment: 75, drugstores: 50,
        homeImprovement: 50, transit: 100, other: 200,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aggregateSpendingEntries', () => {
    it('should calculate monthly averages from entries', () => {
      const entries = [
        { amount: 400, category: SpendingCategory.GROCERIES, transactionDate: new Date('2026-01-01') },
        { amount: 400, category: SpendingCategory.GROCERIES, transactionDate: new Date('2026-01-15') },
        { amount: 400, category: SpendingCategory.GROCERIES, transactionDate: new Date('2026-02-01') },
      ];
      const result = aggregateSpendingEntries(entries);
      // Roughly 1 month span, ~$1200 total, ~$800-1200/month
      expect(result.groceries).toBeGreaterThan(0);
    });

    it('should return defaults for empty entries', () => {
      const result = aggregateSpendingEntries([]);
      expect(result.groceries).toBe(800); // Default
    });
  });

  // Storage tests
  describe('saveSpendingProfile', () => {
    beforeEach(() => {
      resetSpendingProfileCache();
      jest.clearAllMocks();
    });

    it('should persist to AsyncStorage', async () => {
      const profile = { groceries: 500, dining: 100, /* ... */ };
      await saveSpendingProfile(profile);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should update cache', async () => {
      const profile = { groceries: 500, /* ... */ };
      await saveSpendingProfile(profile);
      const cached = getSpendingProfileSync();
      expect(cached?.groceries).toBe(500);
    });
  });
});
```

### WalletOptimizerService Tests

```typescript
// src/services/__tests__/WalletOptimizerService.test.ts

describe('WalletOptimizerService', () => {
  // Test data
  const mockCards: Card[] = [
    createMockCard('card-groceries', { 
      groceries: 5, // 5% on groceries
      baseRate: 1,
      annualFee: 0 
    }),
    createMockCard('card-dining', { 
      dining: 4, // 4% on dining
      baseRate: 1,
      annualFee: 99 
    }),
    createMockCard('card-everything', { 
      groceries: 2, dining: 2, gas: 2,
      baseRate: 2,
      annualFee: 150 
    }),
  ];

  const mockSpending: SpendingProfileInput = {
    groceries: 800, dining: 200, gas: 150, travel: 100,
    onlineShopping: 150, entertainment: 75, drugstores: 50,
    homeImprovement: 50, transit: 100, other: 200,
  };

  describe('calculateCategoryRewards', () => {
    it('should calculate annual rewards correctly', () => {
      const card = mockCards[0]; // 5% groceries card
      const rewards = calculateCategoryRewards(
        card,
        SpendingCategory.GROCERIES,
        800 // $800/month
      );
      // 800 * 12 * 0.05 = $480/year (for cashback)
      expect(rewards).toBeCloseTo(480, 0);
    });

    it('should use base rate for uncategorized spending', () => {
      const card = mockCards[0]; // 1% base rate
      const rewards = calculateCategoryRewards(
        card,
        SpendingCategory.TRAVEL, // No bonus
        100
      );
      // 100 * 12 * 0.01 = $12/year
      expect(rewards).toBeCloseTo(12, 0);
    });
  });

  describe('evaluateWalletCombination', () => {
    it('should assign best card per category', () => {
      const cards = [mockCards[0], mockCards[1]]; // groceries + dining cards
      const { categoryAssignments } = evaluateWalletCombination(cards, mockSpending);
      
      const groceryAssignment = categoryAssignments.find(
        a => a.category === SpendingCategory.GROCERIES
      );
      expect(groceryAssignment?.bestCardId).toBe('card-groceries');

      const diningAssignment = categoryAssignments.find(
        a => a.category === SpendingCategory.DINING
      );
      expect(diningAssignment?.bestCardId).toBe('card-dining');
    });

    it('should calculate total rewards correctly', () => {
      const { totalRewards } = evaluateWalletCombination([mockCards[0]], mockSpending);
      expect(totalRewards).toBeGreaterThan(0);
    });
  });

  describe('pruneCards', () => {
    it('should reduce card count significantly', () => {
      // Create 100 mock cards
      const manyCards = Array.from({ length: 100 }, (_, i) => 
        createMockCard(`card-${i}`, { baseRate: 1 + (i % 5) })
      );
      
      const constraints: WalletConstraints = {
        maxTotalAnnualFees: 500,
        maxCards: 3,
        country: 'CA',
      };

      const pruned = pruneCards(manyCards, mockSpending, constraints);
      expect(pruned.length).toBeLessThanOrEqual(50);
    });

    it('should keep top performers', () => {
      const constraints: WalletConstraints = {
        maxTotalAnnualFees: 500,
        maxCards: 2,
        country: 'CA',
      };

      const pruned = pruneCards(mockCards, mockSpending, constraints);
      const prunedIds = pruned.map(p => p.cardId);
      
      // Best groceries card should survive
      expect(prunedIds).toContain('card-groceries');
    });

    it('should respect preferred banks filter', () => {
      const cardsWithIssuers = mockCards.map((c, i) => ({
        ...c,
        issuer: i % 2 === 0 ? 'TD' : 'RBC'
      }));

      const constraints: WalletConstraints = {
        maxTotalAnnualFees: 500,
        maxCards: 2,
        country: 'CA',
        preferredBanks: ['TD'],
      };

      const pruned = pruneCards(cardsWithIssuers, mockSpending, constraints);
      pruned.forEach(p => {
        expect(p.card.issuer).toBe('TD');
      });
    });
  });

  describe('generateCombinations', () => {
    it('should generate all pairs for maxCards=2', () => {
      const prunedCards = mockCards.map(c => ({
        cardId: c.id,
        card: c,
        topCategories: [],
        maxCategoryRate: 1,
        annualFee: c.annualFee || 0,
      }));

      const combos = generateCombinations(prunedCards, 2, 500);
      // C(3, 2) = 3 combinations
      expect(combos.length).toBe(3);
    });

    it('should respect fee constraints', () => {
      const highFeeCards = mockCards.map(c => ({
        cardId: c.id,
        card: c,
        topCategories: [],
        maxCategoryRate: 1,
        annualFee: 200, // All $200 fee
      }));

      const combos = generateCombinations(highFeeCards, 2, 300);
      // Total fee would be $400 > $300, so no valid combos
      expect(combos.length).toBe(0);
    });
  });

  describe('optimizeWallet', () => {
    beforeEach(() => {
      // Mock CardDataService
      jest.spyOn(CardDataService, 'getAllCardsSync').mockReturnValue(mockCards);
    });

    it('should return top 3 combinations', () => {
      const result = optimizeWallet(mockSpending, {
        maxTotalAnnualFees: 500,
        maxCards: 2,
        country: 'CA',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.recommendations.length).toBeLessThanOrEqual(3);
        expect(result.value.recommendations[0].rank).toBe(1);
      }
    });

    it('should complete in under 2 seconds', () => {
      const start = Date.now();
      
      const result = optimizeWallet(mockSpending, {
        maxTotalAnnualFees: 500,
        maxCards: 3,
        country: 'CA',
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);

      if (result.success) {
        expect(result.value.computeTimeMs).toBeLessThan(2000);
      }
    });

    it('should sort results by net value', () => {
      const result = optimizeWallet(mockSpending, {
        maxTotalAnnualFees: 500,
        maxCards: 2,
        country: 'CA',
      });

      if (result.success && result.value.recommendations.length > 1) {
        const values = result.value.recommendations.map(r => r.netAnnualValue);
        for (let i = 1; i < values.length; i++) {
          expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
        }
      }
    });
  });

  // Property-based tests
  describe('property tests', () => {
    it('net value should equal rewards minus fees', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            totalRewards: fc.float({ min: 0, max: 10000 }),
            annualFee: fc.float({ min: 0, max: 500 }),
          }), { minLength: 2, maxLength: 3 }),
          (cardData) => {
            const totalRewards = cardData.reduce((sum, c) => sum + c.totalRewards, 0);
            const totalFees = cardData.reduce((sum, c) => sum + c.annualFee, 0);
            const netValue = totalRewards - totalFees;
            
            // Net value should be deterministic
            expect(netValue).toBe(totalRewards - totalFees);
          }
        )
      );
    });
  });
});
```

### SignupBonusService Tests

```typescript
// src/services/__tests__/SignupBonusService.test.ts

describe('SignupBonusService', () => {
  const mockCard: Card = {
    id: 'amex-gold',
    name: 'Amex Gold',
    issuer: 'American Express',
    rewardProgram: 'Membership Rewards',
    baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
    categoryRewards: [
      { category: SpendingCategory.DINING, rewardRate: { value: 4, type: RewardType.POINTS, unit: 'multiplier' } },
      { category: SpendingCategory.GROCERIES, rewardRate: { value: 4, type: RewardType.POINTS, unit: 'multiplier' } },
    ],
    annualFee: 250,
    signupBonus: {
      amount: 60000,
      currency: RewardType.POINTS,
      spendRequirement: 6000,
      timeframeDays: 90,
    },
    pointValuation: 200, // 2 cents per point
  };

  const mockSpending: SpendingProfileInput = {
    groceries: 800, dining: 300, gas: 150, travel: 100,
    onlineShopping: 150, entertainment: 75, drugstores: 50,
    homeImprovement: 50, transit: 100, other: 200,
  };

  describe('calculateBonusValueCAD', () => {
    it('should convert points to CAD correctly', () => {
      const value = calculateBonusValueCAD(mockCard.signupBonus!, mockCard);
      // 60000 points * 2 cents = $1200
      expect(value).toBeCloseTo(1200, 0);
    });
  });

  describe('calculateMonthsToHit', () => {
    it('should calculate months correctly', () => {
      // $6000 minimum, $2000/month spend
      expect(calculateMonthsToHit(6000, 2000)).toBe(3);
    });

    it('should round up', () => {
      // $6000 minimum, $2500/month = 2.4 months → 3
      expect(calculateMonthsToHit(6000, 2500)).toBe(3);
    });

    it('should return Infinity for zero spend', () => {
      expect(calculateMonthsToHit(6000, 0)).toBe(Infinity);
    });
  });

  describe('canHitMinimumSpend', () => {
    it('should return true when easily achievable', () => {
      expect(canHitMinimumSpend(2, 90)).toBe(true); // 2 months < 3 month window
    });

    it('should return false when impossible', () => {
      expect(canHitMinimumSpend(5, 90)).toBe(false); // 5 months > 3 month window
    });
  });

  describe('generateTimeline', () => {
    it('should show progress correctly', () => {
      const timeline = generateTimeline(2000, 6000, 6);
      
      expect(timeline.length).toBe(3); // Should stop after hitting target
      expect(timeline[0].cumulativeSpend).toBe(2000);
      expect(timeline[0].hitTarget).toBe(false);
      expect(timeline[2].hitTarget).toBe(true);
    });
  });

  describe('determineVerdict', () => {
    it('should return excellent for easy bonus + strong ongoing', () => {
      const { verdict } = determineVerdict(true, 50, 800, 200);
      expect(verdict).toBe('excellent');
    });

    it('should return not_worth_it when cannot hit', () => {
      const { verdict } = determineVerdict(false, 150, 800, 200);
      expect(verdict).toBe('not_worth_it');
    });
  });

  describe('calculateSignupBonusROI', () => {
    beforeEach(() => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue(mockCard);
      // Mock spending profile
      jest.spyOn(SpendingProfileService, 'getSpendingProfileSync').mockReturnValue({
        id: 'test',
        userId: null,
        ...mockSpending,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should return full ROI analysis', () => {
      const result = calculateSignupBonusROI('amex-gold');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.bonusValueCAD).toBeGreaterThan(0);
        expect(result.value.timeline.length).toBeGreaterThan(0);
        expect(result.value.verdict).toBeDefined();
      }
    });

    it('should fail for card without signup bonus', () => {
      const noBonus = { ...mockCard, signupBonus: undefined };
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue(noBonus);

      const result = calculateSignupBonusROI('amex-gold');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NO_SIGNUP_BONUS');
      }
    });
  });
});
```

### FeeBreakevenService Tests

```typescript
// src/services/__tests__/FeeBreakevenService.test.ts

describe('FeeBreakevenService', () => {
  const mockFeeCard: Card = {
    id: 'premium-card',
    name: 'Premium Rewards',
    issuer: 'Big Bank',
    rewardProgram: 'Premium Points',
    baseRewardRate: { value: 2, type: RewardType.POINTS, unit: 'multiplier' },
    categoryRewards: [
      { category: SpendingCategory.DINING, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
      { category: SpendingCategory.TRAVEL, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
    ],
    annualFee: 150,
    pointValuation: 150, // 1.5 cents per point
  };

  const mockNoFeeCard: Card = {
    id: 'no-fee-card',
    name: 'Basic Cashback',
    issuer: 'Another Bank',
    rewardProgram: 'Cashback',
    baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
    categoryRewards: [],
    annualFee: 0,
  };

  const mockSpending: SpendingProfileInput = {
    groceries: 800, dining: 300, gas: 150, travel: 200,
    onlineShopping: 150, entertainment: 75, drugstores: 50,
    homeImprovement: 50, transit: 100, other: 200,
  };

  describe('calculateBreakEvenMonthlySpend', () => {
    it('should calculate breakeven correctly', () => {
      // $150 fee, 2% effective rate
      // Breakeven annual = $150 / 0.02 = $7500
      // Breakeven monthly = $625
      const breakeven = calculateBreakEvenMonthlySpend(150, 2);
      expect(breakeven).toBeCloseTo(625, 0);
    });

    it('should return Infinity for zero rate', () => {
      expect(calculateBreakEvenMonthlySpend(150, 0)).toBe(Infinity);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should show fee recovery by category', () => {
      const breakdown = calculateCategoryBreakdown(mockFeeCard, mockSpending, 150);
      
      // Should have entries for categories with spend
      expect(breakdown.length).toBeGreaterThan(0);
      
      // Should be sorted by annual rewards
      for (let i = 1; i < breakdown.length; i++) {
        expect(breakdown[i].annualRewards).toBeLessThanOrEqual(breakdown[i - 1].annualRewards);
      }
    });
  });

  describe('compareToNoFeeCard', () => {
    beforeEach(() => {
      jest.spyOn(CardDataService, 'getAllCardsSync').mockReturnValue([mockFeeCard, mockNoFeeCard]);
    });

    it('should find best no-fee alternative', () => {
      const feeCardRewards = calculateTotalAnnualRewards(mockFeeCard, mockSpending);
      const comparison = compareToNoFeeCard(mockFeeCard, feeCardRewards, mockSpending);

      expect(comparison).toBeDefined();
      expect(comparison?.bestNoFeeCard.id).toBe('no-fee-card');
    });
  });

  describe('determineFeeVerdict', () => {
    it('should return easily_worth_it when rewards > 3x fee', () => {
      // Net value $350, fee $150 → rewards = $500 = 3.3x fee
      const { verdict } = determineFeeVerdict(350, 150);
      expect(verdict).toBe('easily_worth_it');
    });

    it('should return worth_it when net positive', () => {
      const { verdict } = determineFeeVerdict(50, 150);
      expect(verdict).toBe('worth_it');
    });

    it('should return borderline near breakeven', () => {
      const { verdict } = determineFeeVerdict(-10, 150);
      expect(verdict).toBe('borderline');
    });

    it('should return not_worth_it when significantly negative', () => {
      const { verdict } = determineFeeVerdict(-100, 150);
      expect(verdict).toBe('not_worth_it');
    });
  });

  describe('calculateFeeBreakeven', () => {
    beforeEach(() => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue(mockFeeCard);
      jest.spyOn(CardDataService, 'getAllCardsSync').mockReturnValue([mockFeeCard, mockNoFeeCard]);
      jest.spyOn(SpendingProfileService, 'getSpendingProfileSync').mockReturnValue({
        id: 'test',
        userId: null,
        ...mockSpending,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should return full breakeven analysis', () => {
      const result = calculateFeeBreakeven('premium-card');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.annualFee).toBe(150);
        expect(result.value.categoryBreakdown.length).toBeGreaterThan(0);
        expect(result.value.verdict).toBeDefined();
      }
    });

    it('should fail for no-fee card', () => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue(mockNoFeeCard);
      
      const result = calculateFeeBreakeven('no-fee-card');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NO_ANNUAL_FEE');
      }
    });
  });
});
```

---

## Build Order

### Dependency Graph

```
            ┌─────────────────────────┐
            │  SpendingProfileService │  ← Build First (no dependencies)
            └───────────┬─────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│FeeBreakeven │  │SignupBonus  │  │WalletOptim- │
│  Service    │  │  Service    │  │  izer       │
└─────────────┘  └─────────────┘  └─────────────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │    UI Components        │
            │  (Forms, Cards, Charts) │
            └───────────┬─────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │    New Screens          │
            │  (Optimizer, Detail)    │
            └─────────────────────────┘
```

### Implementation Phases

#### Phase 1: Foundation (Day 1-2)
1. **Types**: Add all new types to `src/types/index.ts`
2. **SpendingProfileService**: Implement + tests
3. **Database migration**: Run spending_profiles migration
4. **SpendingProfileForm component**: Build UI component

#### Phase 2: Fee Breakeven - F23 (Day 3-4)
*Simplest calculation, immediate value*
1. **FeeBreakevenService**: Implement + tests
2. **FeeBreakevenSection component**: Card detail integration
3. **Integration tests**: Service + UI

#### Phase 3: Signup Bonus - F22 (Day 5-6)
*Medium complexity, high impact*
1. **SignupBonusService**: Implement + tests
2. **SignupBonusSection component**: Card detail integration
3. **Timeline visualization**: Build chart component
4. **Integration tests**: Service + UI

#### Phase 4: Wallet Optimizer - F21 (Day 7-10)
*Most complex, biggest wow factor*
1. **WalletOptimizerService**: Implement core algorithm
2. **Performance testing**: Verify < 2 second constraint
3. **WalletOptimizerService tests**: All pure function + integration tests
4. **WalletOptimizerScreen**: Build 3-step UI flow
5. **Results components**: WalletResultCard, CategoryChart
6. **Comparison feature**: Current wallet comparison
7. **Integration tests**: Full flow testing

#### Phase 5: Polish (Day 11-12)
1. **Sage integration**: Add tools for Cycle 3 features
2. **Tier gating**: Implement paywall components
3. **Navigation**: Update nav to include new screens
4. **E2E testing**: Full user journey tests
5. **Documentation**: Update README, inline docs

### Task Checklist

```
□ Phase 1: Foundation
  □ Add types to src/types/index.ts
  □ Create SpendingProfileService.ts
  □ Write SpendingProfileService tests (20 tests)
  □ Create database migration
  □ Build SpendingProfileForm component

□ Phase 2: Fee Breakeven (F23)
  □ Create FeeBreakevenService.ts
  □ Write FeeBreakevenService tests (25 tests)
  □ Build FeeBreakevenSection component
  □ Integrate into CardDetailScreen
  □ Add tier gating

□ Phase 3: Signup Bonus (F22)
  □ Create SignupBonusService.ts
  □ Write SignupBonusService tests (25 tests)
  □ Build SignupBonusSection component
  □ Build TimelineChart component
  □ Integrate into CardDetailScreen
  □ Add tier gating

□ Phase 4: Wallet Optimizer (F21)
  □ Create WalletOptimizerService.ts
  □ Write WalletOptimizerService tests (35 tests)
  □ Performance validation (< 2 sec)
  □ Build WalletOptimizerScreen
  □ Build SpendingProfileScreen (Step 1)
  □ Build ConstraintsForm (Step 2)
  □ Build WalletResultCard
  □ Build CategoryAssignmentChart
  □ Build CurrentWalletComparison
  □ Add tier gating

□ Phase 5: Polish
  □ Add Sage AI tools
  □ Update navigation
  □ Write integration tests
  □ Performance optimization
  □ Code review
```

---

## Performance Considerations

### Wallet Optimizer Performance Budget

| Operation | Target | Notes |
|-----------|--------|-------|
| Card data access | 0 ms | Use `getAllCardsSync()` from memory |
| Pruning | < 100 ms | O(n × categories) where n = 354 |
| Combination generation | < 200 ms | O(m³) where m ≤ 50 |
| Evaluation | < 1000 ms | O(combinations × categories) |
| Ranking | < 100 ms | Simple sort |
| **Total** | **< 1500 ms** | 300ms buffer for GC/UI |

### Memory Optimization

1. **Avoid card object copying**: Pass card IDs, look up full objects only when needed
2. **Prune early**: Filter before generating combinations
3. **Lazy loading**: Don't load full Card objects in PrunedCard
4. **Limit result set**: Only materialize top N combinations

### UI Performance

1. **Step-based loading**: Only run optimizer when user clicks "Optimize"
2. **Debounced inputs**: Debounce spending form inputs
3. **Virtualized lists**: Use FlatList for results
4. **Animated reveals**: Use LayoutAnimation for smooth result reveals
5. **Skeleton loading**: Show placeholders during computation

### Caching Strategy

1. **SpendingProfile**: Cached in memory + AsyncStorage
2. **Cards**: Already cached by CardDataService
3. **Optimizer results**: Cache for 24 hours (Supabase, Pro+ only)
4. **Fee/Bonus calculations**: Pure functions, no caching needed

### Mobile-Specific Optimizations

```typescript
// Use InteractionManager for heavy computation
import { InteractionManager } from 'react-native';

async function runOptimizer() {
  setLoading(true);
  
  // Wait for animations to complete
  await InteractionManager.runAfterInteractions();
  
  // Run in next tick to avoid blocking UI
  setTimeout(() => {
    const result = optimizeWallet(spending, constraints);
    setResults(result);
    setLoading(false);
  }, 0);
}
```

---

## Appendix: Helper Utilities

### Test Helpers

```typescript
// src/services/__tests__/testUtils.ts

export function createMockCard(
  id: string,
  options: {
    groceries?: number;
    dining?: number;
    gas?: number;
    travel?: number;
    baseRate?: number;
    annualFee?: number;
    issuer?: string;
  }
): Card {
  const categoryRewards: CategoryReward[] = [];
  
  if (options.groceries) {
    categoryRewards.push({
      category: SpendingCategory.GROCERIES,
      rewardRate: { value: options.groceries, type: RewardType.CASHBACK, unit: 'percent' },
    });
  }
  // ... similar for other categories

  return {
    id,
    name: `Test Card ${id}`,
    issuer: options.issuer || 'Test Bank',
    rewardProgram: 'Test Program',
    baseRewardRate: {
      value: options.baseRate || 1,
      type: RewardType.CASHBACK,
      unit: 'percent',
    },
    categoryRewards,
    annualFee: options.annualFee || 0,
    pointValuation: 100,
  };
}

export function createMockSpendingProfile(
  overrides?: Partial<SpendingProfileInput>
): SpendingProfileInput {
  return {
    groceries: 800,
    dining: 200,
    gas: 150,
    travel: 100,
    onlineShopping: 150,
    entertainment: 75,
    drugstores: 50,
    homeImprovement: 50,
    transit: 100,
    other: 200,
    ...overrides,
  };
}
```

---

## Summary

This architecture document provides everything needed to implement Cycle 3's Smart Recommendations Engine:

- **105+ tests** across 4 new services
- **Pure function design** for testability
- **< 2 second performance** via category-based pruning
- **Offline-first** SpendingProfileService with optional sync
- **Clear tier gating** for monetization
- **Detailed build order** with dependencies mapped

The Sonnet dev agent should be able to build this with zero clarification. Start with Phase 1 (SpendingProfileService), validate tests pass, then proceed phase by phase.

---

*Architecture document complete. Ready for implementation.*
