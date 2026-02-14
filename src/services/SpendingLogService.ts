/**
 * SpendingLogService - Manual purchase logging with rewards tracking
 * 
 * Tier: Free (last 10 entries), Pro+ (unlimited)
 * Syncs with Supabase, calculates optimal cards and missed rewards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { SpendingEntry, SpendingFilter, SpendingSummary, SpendingCategory } from '../types';
import { getCurrentTierSync, SubscriptionTier } from './SubscriptionService';
import { getCardByIdSync } from './CardDataService';
import { calculateReward } from './RewardsCalculatorService';
import { getBestCardForCategory } from './BestCardRecommendationService';

const SPENDING_STORAGE_KEY = '@rewardly/spending_log';

// ============================================================================
// In-Memory Cache
// ============================================================================

let spendingCache: SpendingEntry[] | null = null;
let isInitialized = false;

// ============================================================================
// Constants
// ============================================================================

const FREE_TIER_ENTRY_LIMIT = 10;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize spending log service
 */
export async function initializeSpendingLog(): Promise<void> {
  if (isInitialized) return;

  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user) {
        await syncFromSupabase();
        isInitialized = true;
        return;
      }
    }

    // Fallback to local storage
    const stored = await AsyncStorage.getItem(SPENDING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      spendingCache = parsed.map(transformFromStorage);
    } else {
      spendingCache = [];
    }
    isInitialized = true;
  } catch (error) {
    console.error('[SpendingLogService] Initialization error:', error);
    spendingCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get spending entries with optional filtering and limit
 */
export async function getSpendingEntries(
  filter?: SpendingFilter,
  limit?: number
): Promise<SpendingEntry[]> {
  if (!isInitialized) await initializeSpendingLog();
  if (!spendingCache) return [];

  let filtered = [...spendingCache];

  // Apply filters
  if (filter) {
    if (filter.cardId) {
      filtered = filtered.filter(e => e.cardUsed === filter.cardId);
    }
    if (filter.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }
    if (filter.startDate) {
      filtered = filtered.filter(e => new Date(e.transactionDate) >= filter.startDate!);
    }
    if (filter.endDate) {
      filtered = filtered.filter(e => new Date(e.transactionDate) <= filter.endDate!);
    }
  }

  // Sort by date descending
  filtered.sort((a, b) => 
    new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );

  // Apply tier limit
  const tier = getCurrentTierSync();
  const maxEntries = limit || getEntryLimitForTier(tier);
  
  if (maxEntries !== Infinity) {
    filtered = filtered.slice(0, maxEntries);
  }

  return filtered;
}

/**
 * Get entry limit based on subscription tier
 */
export function getEntryLimitForTier(tier: SubscriptionTier): number {
  return tier === 'free' ? FREE_TIER_ENTRY_LIMIT : Infinity;
}

/**
 * Get spending summary for filtered entries
 */
export async function getSpendingSummary(filter?: SpendingFilter): Promise<SpendingSummary> {
  const entries = await getSpendingEntries(filter, Infinity); // Get all for summary

  return {
    totalSpend: entries.reduce((sum, e) => sum + e.amount, 0),
    totalRewardsEarned: entries.reduce((sum, e) => sum + e.rewardsEarned, 0),
    totalRewardsMissed: entries.reduce((sum, e) => sum + e.rewardsMissed, 0),
    transactionCount: entries.length,
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Add a spending entry
 */
export async function addSpendingEntry(
  entry: Omit<SpendingEntry, 'id' | 'userId' | 'optimalCard' | 'rewardsEarned' | 'rewardsMissed' | 'createdAt' | 'updatedAt'>
): Promise<SpendingEntry> {
  if (!isInitialized) await initializeSpendingLog();

  // Calculate optimal card and rewards
  const optimalCardData = await getBestCardForCategory(entry.category);
  const optimalCard = optimalCardData?.card.id;

  const usedCard = getCardByIdSync(entry.cardUsed);
  const rewardsEarned = usedCard 
    ? calculateReward(usedCard, entry.category, entry.amount)
    : 0;

  const optimalCardObj = optimalCard ? getCardByIdSync(optimalCard) : null;
  const optimalRewards = optimalCardObj
    ? calculateReward(optimalCardObj, entry.category, entry.amount)
    : rewardsEarned;

  const rewardsMissed = Math.max(0, optimalRewards - rewardsEarned);

  const newEntry: SpendingEntry = {
    id: generateId(),
    userId: '',
    optimalCard,
    rewardsEarned,
    rewardsMissed,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...entry,
  };

  spendingCache = spendingCache || [];
  spendingCache.push(newEntry);

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(newEntry);
  }

  return newEntry;
}

/**
 * Update spending entry
 */
export async function updateSpendingEntry(
  id: string,
  updates: Partial<Omit<SpendingEntry, 'id' | 'userId' | 'createdAt'>>
): Promise<SpendingEntry> {
  if (!isInitialized) await initializeSpendingLog();
  if (!spendingCache) throw new Error('Spending cache not initialized');

  const index = spendingCache.findIndex(e => e.id === id);
  if (index === -1) throw new Error(`Entry ${id} not found`);

  // Recalculate rewards if amount, category, or card changed
  let recalculated = {};
  if (updates.amount || updates.category || updates.cardUsed) {
    const entry = { ...spendingCache[index], ...updates };
    
    const optimalCardData = await getBestCardForCategory(entry.category);
    const optimalCard = optimalCardData?.card.id;

    const usedCard = getCardByIdSync(entry.cardUsed);
    const rewardsEarned = usedCard 
      ? calculateReward(usedCard, entry.category, entry.amount)
      : 0;

    const optimalCardObj = optimalCard ? getCardByIdSync(optimalCard) : null;
    const optimalRewards = optimalCardObj
      ? calculateReward(optimalCardObj, entry.category, entry.amount)
      : rewardsEarned;

    const rewardsMissed = Math.max(0, optimalRewards - rewardsEarned);

    recalculated = {
      optimalCard,
      rewardsEarned,
      rewardsMissed,
    };
  }

  spendingCache[index] = {
    ...spendingCache[index],
    ...updates,
    ...recalculated,
    updatedAt: new Date(),
  };

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(spendingCache[index]);
  }

  return spendingCache[index];
}

/**
 * Delete spending entry
 */
export async function deleteSpendingEntry(id: string): Promise<void> {
  if (!isInitialized) await initializeSpendingLog();
  if (!spendingCache) return;

  const index = spendingCache.findIndex(e => e.id === id);
  if (index === -1) return;

  spendingCache.splice(index, 1);
  await persistToStorage();

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      await supabase.from('spending_log').delete().eq('id', id);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate optimal card for a purchase
 */
export async function calculateOptimalCard(amount: number, category: SpendingCategory): Promise<string | undefined> {
  const best = await getBestCardForCategory(category);
  return best?.card.id;
}

/**
 * Calculate rewards for a specific card and category
 */
export function calculateRewards(amount: number, cardId: string, category: SpendingCategory): number {
  const card = getCardByIdSync(cardId);
  if (!card) return 0;
  return calculateReward(card, category, amount);
}

// ============================================================================
// Persistence
// ============================================================================

async function persistToStorage(): Promise<void> {
  if (!spendingCache) return;
  
  const serialized = JSON.stringify(
    spendingCache.map(entry => ({
      ...entry,
      transactionDate: entry.transactionDate.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }))
  );

  await AsyncStorage.setItem(SPENDING_STORAGE_KEY, serialized);
}

function transformFromStorage(item: any): SpendingEntry {
  return {
    ...item,
    transactionDate: new Date(item.transactionDate),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

// ============================================================================
// Supabase Sync
// ============================================================================

async function syncFromSupabase(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !supabase) return;

  const { data, error } = await supabase
    .from('spending_log')
    .select('*')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('[SpendingLogService] Sync from Supabase error:', error);
    return;
  }

  if (data) {
    spendingCache = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      category: row.category as SpendingCategory,
      storeName: row.store_name,
      cardUsed: row.card_used,
      optimalCard: row.optimal_card,
      rewardsEarned: parseFloat(row.rewards_earned || '0'),
      rewardsMissed: parseFloat(row.rewards_missed || '0'),
      transactionDate: new Date(row.transaction_date),
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    await persistToStorage();
  }
}

async function syncToSupabase(entry: SpendingEntry): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !supabase) return;

  const row = {
    id: entry.id,
    user_id: user.id,
    amount: entry.amount,
    category: entry.category,
    store_name: entry.storeName,
    card_used: entry.cardUsed,
    optimal_card: entry.optimalCard,
    rewards_earned: entry.rewardsEarned,
    rewards_missed: entry.rewardsMissed,
    transaction_date: entry.transactionDate.toISOString().split('T')[0],
    notes: entry.notes,
  };

  const { error } = await supabase
    .from('spending_log')
    .upsert(row as any);

  if (error) {
    console.error('[SpendingLogService] Sync to Supabase error:', error);
  }
}

// ============================================================================
// Utility
// ============================================================================

function generateId(): string {
  return `spending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Reset cache (for testing)
 */
export function resetSpendingCache(): void {
  spendingCache = null;
  isInitialized = false;
}
