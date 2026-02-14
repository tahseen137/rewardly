/**
 * RecurringService - Manages recurring charges optimization
 * 
 * Tier: Pro+
 * Helps users optimize subscription payments for max rewards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { RecurringCharge, RecurringSummary, SpendingCategory } from '../types';
import { getCardByIdSync } from './CardDataService';
import { calculateReward } from './RewardsCalculatorService';
import { getBestCardForCategory } from './BestCardRecommendationService';

const RECURRING_STORAGE_KEY = '@rewardly/recurring_charges';

// ============================================================================
// In-Memory Cache
// ============================================================================

let recurringCache: RecurringCharge[] | null = null;
let isInitialized = false;

// ============================================================================
// Common Subscriptions Data
// ============================================================================

export interface CommonSubscription {
  name: string;
  amount: number;
  category: SpendingCategory;
}

export function getCommonSubscriptions(): CommonSubscription[] {
  return [
    { name: 'Netflix', amount: 15.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'Spotify', amount: 11.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'Apple Music', amount: 10.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'Disney+', amount: 11.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'Amazon Prime', amount: 139 / 12, category: SpendingCategory.ONLINE_SHOPPING },
    { name: 'YouTube Premium', amount: 13.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'Gym Membership', amount: 50, category: SpendingCategory.OTHER },
    { name: 'iCloud Storage', amount: 2.99, category: SpendingCategory.OTHER },
    { name: 'Google One', amount: 2.99, category: SpendingCategory.OTHER },
    { name: 'Hulu', amount: 7.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'HBO Max', amount: 16.99, category: SpendingCategory.ENTERTAINMENT },
    { name: 'Audible', amount: 14.95, category: SpendingCategory.ENTERTAINMENT },
  ];
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize recurring charges service
 */
export async function initializeRecurring(): Promise<void> {
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
    const stored = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      recurringCache = parsed.map(transformFromStorage);
    } else {
      recurringCache = [];
    }
    isInitialized = true;
  } catch (error) {
    console.error('[RecurringService] Initialization error:', error);
    recurringCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get all recurring charges
 */
export async function getRecurringCharges(): Promise<RecurringCharge[]> {
  if (!isInitialized) await initializeRecurring();
  if (!recurringCache) return [];
  
  return recurringCache.filter(charge => charge.isActive);
}

/**
 * Get recurring summary
 */
export function getRecurringSummary(charges: RecurringCharge[]): RecurringSummary {
  const totalMonthlyCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const totalCurrentRewards = charges.reduce((sum, c) => sum + c.currentRewards, 0);
  const totalOptimalRewards = charges.reduce((sum, c) => sum + c.optimalRewards, 0);
  const totalMonthlySavings = charges.reduce((sum, c) => sum + c.monthlySavings, 0);
  const optimizedCount = charges.filter(c => c.currentCard !== c.optimalCard).length;

  return {
    totalMonthlyCharges,
    totalCurrentRewards,
    totalOptimalRewards,
    totalMonthlySavings,
    optimizedCount,
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Add recurring charge
 */
export async function addRecurringCharge(
  charge: Omit<RecurringCharge, 'id' | 'userId' | 'optimalCard' | 'currentRewards' | 'optimalRewards' | 'monthlySavings' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<RecurringCharge> {
  if (!isInitialized) await initializeRecurring();

  // Calculate optimal card and rewards
  const optimalCardData = await getBestCardForCategory(charge.category);
  const optimalCard = optimalCardData?.card.id;

  const currentCard = charge.currentCard ? getCardByIdSync(charge.currentCard) : null;
  const currentRewards = currentCard
    ? calculateReward(currentCard, charge.category, charge.amount)
    : 0;

  const optimalCardObj = optimalCard ? getCardByIdSync(optimalCard) : null;
  const optimalRewards = optimalCardObj
    ? calculateReward(optimalCardObj, charge.category, charge.amount)
    : currentRewards;

  const monthlySavings = optimalRewards - currentRewards;

  const newCharge: RecurringCharge = {
    id: generateId(),
    userId: '',
    optimalCard,
    currentRewards,
    optimalRewards,
    monthlySavings,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...charge,
  };

  recurringCache = recurringCache || [];
  recurringCache.push(newCharge);

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(newCharge);
  }

  return newCharge;
}

/**
 * Update recurring charge
 */
export async function updateRecurringCharge(
  id: string,
  updates: Partial<Omit<RecurringCharge, 'id' | 'userId' | 'createdAt'>>
): Promise<RecurringCharge> {
  if (!isInitialized) await initializeRecurring();
  if (!recurringCache) throw new Error('Recurring cache not initialized');

  const index = recurringCache.findIndex(c => c.id === id);
  if (index === -1) throw new Error(`Charge ${id} not found`);

  // Recalculate if needed
  let recalculated = {};
  if (updates.amount !== undefined || updates.category !== undefined || updates.currentCard !== undefined) {
    const charge = { ...recurringCache[index], ...updates };
    
    const optimalCardData = await getBestCardForCategory(charge.category);
    const optimalCard = optimalCardData?.card.id;

    const currentCard = charge.currentCard ? getCardByIdSync(charge.currentCard) : null;
    const currentRewards = currentCard
      ? calculateReward(currentCard, charge.category, charge.amount)
      : 0;

    const optimalCardObj = optimalCard ? getCardByIdSync(optimalCard) : null;
    const optimalRewards = optimalCardObj
      ? calculateReward(optimalCardObj, charge.category, charge.amount)
      : currentRewards;

    const monthlySavings = optimalRewards - currentRewards;

    recalculated = {
      optimalCard,
      currentRewards,
      optimalRewards,
      monthlySavings,
    };
  }

  recurringCache[index] = {
    ...recurringCache[index],
    ...updates,
    ...recalculated,
    updatedAt: new Date(),
  };

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(recurringCache[index]);
  }

  return recurringCache[index];
}

/**
 * Delete recurring charge
 */
export async function deleteRecurringCharge(id: string): Promise<void> {
  if (!isInitialized) await initializeRecurring();
  if (!recurringCache) return;

  const index = recurringCache.findIndex(c => c.id === id);
  if (index === -1) return;

  // Soft delete by setting isActive to false
  recurringCache[index] = {
    ...recurringCache[index],
    isActive: false,
    updatedAt: new Date(),
  };

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(recurringCache[index]);
  }
}

/**
 * Recalculate all optimizations (when portfolio changes)
 */
export async function recalculateOptimizations(): Promise<void> {
  if (!isInitialized) await initializeRecurring();
  if (!recurringCache) return;

  const updates = recurringCache.map(async charge => {
    if (!charge.isActive) return;
    
    const optimalCardData = await getBestCardForCategory(charge.category);
    const optimalCard = optimalCardData?.card.id;

    const currentCard = charge.currentCard ? getCardByIdSync(charge.currentCard) : null;
    const currentRewards = currentCard
      ? calculateReward(currentCard, charge.category, charge.amount)
      : 0;

    const optimalCardObj = optimalCard ? getCardByIdSync(optimalCard) : null;
    const optimalRewards = optimalCardObj
      ? calculateReward(optimalCardObj, charge.category, charge.amount)
      : currentRewards;

    const monthlySavings = optimalRewards - currentRewards;

    return {
      ...charge,
      optimalCard,
      currentRewards,
      optimalRewards,
      monthlySavings,
      updatedAt: new Date(),
    };
  });

  recurringCache = await Promise.all(updates.filter(Boolean)) as RecurringCharge[];
  await persistToStorage();

  if (isSupabaseConfigured()) {
    await Promise.all(recurringCache.map(syncToSupabase));
  }
}

// ============================================================================
// Persistence
// ============================================================================

async function persistToStorage(): Promise<void> {
  if (!recurringCache) return;
  
  const serialized = JSON.stringify(
    recurringCache.map(charge => ({
      ...charge,
      createdAt: charge.createdAt.toISOString(),
      updatedAt: charge.updatedAt.toISOString(),
    }))
  );

  await AsyncStorage.setItem(RECURRING_STORAGE_KEY, serialized);
}

function transformFromStorage(item: any): RecurringCharge {
  return {
    ...item,
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
    .from('recurring_charges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('[RecurringService] Sync from Supabase error:', error);
    return;
  }

  if (data) {
    recurringCache = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      amount: parseFloat(row.amount),
      category: row.category as SpendingCategory,
      billingDay: row.billing_day,
      currentCard: row.current_card,
      optimalCard: row.optimal_card,
      currentRewards: parseFloat(row.current_rewards || '0'),
      optimalRewards: parseFloat(row.optimal_rewards || '0'),
      monthlySavings: parseFloat(row.monthly_savings || '0'),
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    await persistToStorage();
  }
}

async function syncToSupabase(charge: RecurringCharge): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !supabase) return;

  const row = {
    id: charge.id,
    user_id: user.id,
    name: charge.name,
    amount: charge.amount,
    category: charge.category,
    billing_day: charge.billingDay,
    current_card: charge.currentCard,
    optimal_card: charge.optimalCard,
    current_rewards: charge.currentRewards,
    optimal_rewards: charge.optimalRewards,
    monthly_savings: charge.monthlySavings,
    is_active: charge.isActive,
  };

  const { error } = await supabase
    .from('recurring_charges')
    .upsert(row as any);

  if (error) {
    console.error('[RecurringService] Sync to Supabase error:', error);
  }
}

// ============================================================================
// Utility
// ============================================================================

function generateId(): string {
  return `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Reset cache (for testing)
 */
export function resetRecurringCache(): void {
  recurringCache = null;
  isInitialized = false;
}
