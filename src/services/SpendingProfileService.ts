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
import { AchievementEventEmitter } from './AchievementEventEmitter';
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

  // Track achievement
  AchievementEventEmitter.track('spending_profile_saved', {});

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

/**
 * CYCLE 4 INTEGRATION: Update spending profile from parsed transactions
 * Auto-calculates monthly averages from real transaction data
 */
export async function updateFromParsedTransactions(
  transactions: Array<{ amount: number; category: import('../types').SpendingCategory; transactionDate: Date; isCredit: boolean }>
): Promise<Result<SpendingProfile, SpendingProfileError>> {
  if (!isInitialized) await initializeSpendingProfile();

  // Filter to purchases only
  const purchases = transactions.filter(t => !t.isCredit);
  
  if (purchases.length === 0) {
    return failure({
      type: 'STORAGE_ERROR',
      message: 'No purchase transactions found',
    });
  }

  // Use aggregateSpendingEntries to calculate monthly averages
  const profileData = aggregateSpendingEntries(purchases);

  // Save the updated profile
  return saveSpendingProfile(profileData);
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

  const row = data as any;

  profileCache = {
    id: row.id,
    userId: row.user_id,
    groceries: parseFloat(row.groceries) || 0,
    dining: parseFloat(row.dining) || 0,
    gas: parseFloat(row.gas) || 0,
    travel: parseFloat(row.travel) || 0,
    onlineShopping: parseFloat(row.online_shopping) || 0,
    entertainment: parseFloat(row.entertainment) || 0,
    drugstores: parseFloat(row.drugstores) || 0,
    homeImprovement: parseFloat(row.home_improvement) || 0,
    transit: parseFloat(row.transit) || 0,
    other: parseFloat(row.other) || 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
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
    .upsert(row as any, { onConflict: 'user_id' });
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
