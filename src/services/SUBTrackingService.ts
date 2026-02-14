/**
 * SUBTrackingService - Manages Sign-Up Bonus tracking
 * 
 * Free feature (hook to get users to add cards)
 * Syncs with Supabase when available, falls back to AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { SUBTracking, SUBProgress, SUBStatus } from '../types';

const SUB_STORAGE_KEY = '@rewardly/sub_tracking';

// ============================================================================
// In-Memory Cache
// ============================================================================

let subCache: SUBTracking[] | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize SUB tracking service
 */
export async function initializeSUBTracking(): Promise<void> {
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
    const stored = await AsyncStorage.getItem(SUB_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      subCache = parsed.map(transformFromStorage);
    } else {
      subCache = [];
    }
    isInitialized = true;
  } catch (error) {
    console.error('[SUBTrackingService] Initialization error:', error);
    subCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get all SUB trackings for the current user
 */
export async function getAllSUBs(): Promise<SUBTracking[]> {
  if (!isInitialized) await initializeSUBTracking();
  if (!subCache) return [];
  return [...subCache];
}

/**
 * Get active SUB trackings
 */
export async function getActiveSUBs(): Promise<SUBTracking[]> {
  const all = await getAllSUBs();
  return all.filter(sub => sub.status === 'active');
}

/**
 * Get SUB by ID
 */
export async function getSUBById(id: string): Promise<SUBTracking | null> {
  if (!isInitialized) await initializeSUBTracking();
  if (!subCache) return null;
  return subCache.find(sub => sub.id === id) || null;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Add a new SUB tracking
 */
export async function addSUB(
  sub: Omit<SUBTracking, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<SUBTracking> {
  if (!isInitialized) await initializeSUBTracking();

  const newSUB: SUBTracking = {
    id: generateId(),
    userId: '', // Will be set in Supabase sync
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...sub,
  };

  subCache = subCache || [];
  subCache.push(newSUB);

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(newSUB);
  }

  return newSUB;
}

/**
 * Update SUB tracking
 */
export async function updateSUB(
  id: string,
  updates: Partial<Omit<SUBTracking, 'id' | 'userId' | 'createdAt'>>
): Promise<SUBTracking> {
  if (!isInitialized) await initializeSUBTracking();
  if (!subCache) throw new Error('SUB cache not initialized');

  const index = subCache.findIndex(sub => sub.id === id);
  if (index === -1) throw new Error(`SUB ${id} not found`);

  subCache[index] = {
    ...subCache[index],
    ...updates,
    updatedAt: new Date(),
  };

  await persistToStorage();

  if (isSupabaseConfigured()) {
    await syncToSupabase(subCache[index]);
  }

  return subCache[index];
}

/**
 * Delete SUB tracking
 */
export async function deleteSUB(id: string): Promise<void> {
  if (!isInitialized) await initializeSUBTracking();
  if (!subCache) return;

  const index = subCache.findIndex(sub => sub.id === id);
  if (index === -1) return;

  subCache.splice(index, 1);
  await persistToStorage();

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      await supabase.from('sub_tracking').delete().eq('id', id);
    }
  }
}

/**
 * Add spending amount to a SUB
 */
export async function addSpendingToSUB(id: string, amount: number): Promise<SUBTracking> {
  const sub = await getSUBById(id);
  if (!sub) throw new Error(`SUB ${id} not found`);

  const newAmount = sub.currentAmount + amount;
  const updates: Partial<SUBTracking> = {
    currentAmount: newAmount,
  };

  // Check if completed
  if (newAmount >= sub.targetAmount && sub.status === 'active') {
    updates.status = 'completed';
    updates.completedAt = new Date();
  }

  return updateSUB(id, updates);
}

// ============================================================================
// Progress Calculations
// ============================================================================

/**
 * Calculate progress for a SUB
 */
export function calculateProgress(sub: SUBTracking): SUBProgress {
  const percentComplete = Math.min((sub.currentAmount / sub.targetAmount) * 100, 100);
  const amountRemaining = Math.max(sub.targetAmount - sub.currentAmount, 0);
  
  const now = new Date();
  const deadline = new Date(sub.deadlineDate);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const dailyTargetNeeded = amountRemaining > 0 && daysRemaining > 0 
    ? amountRemaining / daysRemaining 
    : 0;

  // On track if spending is proportional to time passed
  const start = new Date(sub.startDate);
  const totalDays = Math.ceil((deadline.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = totalDays - daysRemaining;
  const expectedProgress = (daysElapsed / totalDays) * 100;
  const isOnTrack = percentComplete >= expectedProgress || percentComplete >= 100;

  const isUrgent = daysRemaining <= 7 && daysRemaining > 0 && percentComplete < 100;

  return {
    sub,
    percentComplete,
    amountRemaining,
    daysRemaining,
    dailyTargetNeeded,
    isOnTrack,
    isUrgent,
  };
}

/**
 * Get urgent SUBs (for notifications)
 */
export async function getUrgentSUBs(): Promise<SUBProgress[]> {
  const active = await getActiveSUBs();
  return active
    .map(calculateProgress)
    .filter(progress => progress.isUrgent);
}

// ============================================================================
// Persistence
// ============================================================================

async function persistToStorage(): Promise<void> {
  if (!subCache) return;
  
  const serialized = JSON.stringify(
    subCache.map(sub => ({
      ...sub,
      startDate: sub.startDate.toISOString(),
      deadlineDate: sub.deadlineDate.toISOString(),
      completedAt: sub.completedAt?.toISOString(),
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }))
  );

  await AsyncStorage.setItem(SUB_STORAGE_KEY, serialized);
}

function transformFromStorage(item: any): SUBTracking {
  return {
    ...item,
    startDate: new Date(item.startDate),
    deadlineDate: new Date(item.deadlineDate),
    completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
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
    .from('sub_tracking')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('[SUBTrackingService] Sync from Supabase error:', error);
    return;
  }

  if (data) {
    subCache = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      cardId: row.card_id,
      targetAmount: parseFloat(row.target_amount),
      currentAmount: parseFloat(row.current_amount),
      startDate: new Date(row.start_date),
      deadlineDate: new Date(row.deadline_date),
      bonusDescription: row.bonus_description,
      bonusAmount: row.bonus_amount,
      bonusCurrency: row.bonus_currency,
      status: row.status as SUBStatus,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    await persistToStorage();
  }
}

async function syncToSupabase(sub: SUBTracking): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !supabase) return;

  const row = {
    id: sub.id,
    user_id: user.id,
    card_id: sub.cardId,
    target_amount: sub.targetAmount,
    current_amount: sub.currentAmount,
    start_date: sub.startDate.toISOString().split('T')[0],
    deadline_date: sub.deadlineDate.toISOString().split('T')[0],
    bonus_description: sub.bonusDescription,
    bonus_amount: sub.bonusAmount,
    bonus_currency: sub.bonusCurrency,
    status: sub.status,
    completed_at: sub.completedAt?.toISOString(),
  };

  const { error } = await supabase
    .from('sub_tracking')
    .upsert(row as any);

  if (error) {
    console.error('[SUBTrackingService] Sync to Supabase error:', error);
  }
}

// ============================================================================
// Utility
// ============================================================================

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Reset cache (for testing)
 */
export function resetSUBCache(): void {
  subCache = null;
  isInitialized = false;
}
