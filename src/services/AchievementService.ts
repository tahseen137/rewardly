/**
 * AchievementService - F15: Achievements & Gamification
 * 
 * Features:
 * - Event-driven achievement tracking (< 5ms per check)
 * - Streak calculation (consecutive days)
 * - Rank system (6 tiers)
 * - Offline-first storage (AsyncStorage) with Supabase sync
 * - Pure calculation functions for testability
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { AchievementEventEmitter } from './AchievementEventEmitter';
import {
  AchievementDefinition,
  AchievementCategory,
  AchievementProgress,
  UserAchievements,
  AchievementUnlockEvent,
  AchievementEvent,
  AchievementEventType,
  RankDefinition,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@rewardly/achievements';

// ============================================================================
// Achievement Definitions (Static Data)
// ============================================================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Getting Started
  { id: 'GS1', name: 'First Card', description: 'Add your first credit card', category: 'getting_started', icon: '💳', progressTarget: 1 },
  { id: 'GS2', name: 'Card Collector', description: 'Add 3 credit cards', category: 'getting_started', icon: '🃏', progressTarget: 3 },
  { id: 'GS3', name: 'Full Deck', description: 'Add 5 credit cards', category: 'getting_started', icon: '🎴', progressTarget: 5 },
  { id: 'GS4', name: 'Profile Set', description: 'Complete your spending profile', category: 'getting_started', icon: '📊', progressTarget: 1 },
  { id: 'GS5', name: 'Sage Seeker', description: 'Ask Sage AI your first question', category: 'getting_started', icon: '🔮', progressTarget: 1 },

  // Optimization
  { id: 'OP1', name: 'Optimizer', description: 'Run the Wallet Optimizer', category: 'optimization', icon: '⚡', progressTarget: 1 },
  { id: 'OP2', name: 'Fee Slayer', description: 'Check a fee breakeven analysis', category: 'optimization', icon: '🗡️', progressTarget: 1 },
  { id: 'OP3', name: 'Bonus Hunter', description: 'Check a signup bonus ROI', category: 'optimization', icon: '🎯', progressTarget: 1 },
  { id: 'OP4', name: 'Gap Finder', description: 'Discover a category gap in your portfolio', category: 'optimization', icon: '🔍', progressTarget: 1 },
  { id: 'OP5', name: 'Perfect Wallet', description: 'Get 90%+ optimization score', category: 'optimization', icon: '👑', progressTarget: 1 },

  // Data & Insights
  { id: 'DI1', name: 'Statement Pro', description: 'Upload your first bank statement', category: 'data_insights', icon: '📄', progressTarget: 1 },
  { id: 'DI2', name: 'Data Driven', description: 'Upload 3 months of statements', category: 'data_insights', icon: '📈', progressTarget: 3 },
  { id: 'DI3', name: 'Insight Seeker', description: 'View the insights dashboard', category: 'data_insights', icon: '💡', progressTarget: 1 },
  { id: 'DI4', name: 'Money Saver', description: 'Discover $100+ left on the table', category: 'data_insights', icon: '💰', progressTarget: 1 },
  { id: 'DI5', name: 'Trend Watcher', description: 'View spending trends', category: 'data_insights', icon: '📉', progressTarget: 1 },

  // Engagement
  { id: 'EN1', name: 'Daily Visitor', description: 'Open the app 7 days in a row', category: 'engagement', icon: '🔥', progressTarget: 7 },
  { id: 'EN2', name: 'Power User', description: 'Open the app 30 days in a row', category: 'engagement', icon: '⚡', progressTarget: 30 },
  { id: 'EN3', name: 'Comparer', description: 'Compare 2 cards side by side', category: 'engagement', icon: '⚖️', progressTarget: 1 },
  { id: 'EN4', name: 'Explorer', description: 'Visit every main screen', category: 'engagement', icon: '🧭', progressTarget: 1 },
  { id: 'EN5', name: 'Card Scholar', description: 'View benefits of 10 different cards', category: 'engagement', icon: '📚', progressTarget: 10 },

  // Mastery
  { id: 'MA1', name: 'Rewards Rookie', description: 'Earn 5 achievements', category: 'mastery', icon: '🌟', progressTarget: 5 },
  { id: 'MA2', name: 'Rewards Pro', description: 'Earn 15 achievements', category: 'mastery', icon: '⭐', progressTarget: 15 },
  { id: 'MA3', name: 'Rewards Master', description: 'Earn all achievements', category: 'mastery', icon: '🏆', progressTarget: 23 },
];

export const RANK_DEFINITIONS: RankDefinition[] = [
  { rank: 1, title: 'Beginner', minAchievements: 0, maxAchievements: 2, emoji: '🌱' },
  { rank: 2, title: 'Card Curious', minAchievements: 3, maxAchievements: 5, emoji: '🔍' },
  { rank: 3, title: 'Rewards Explorer', minAchievements: 6, maxAchievements: 10, emoji: '🧭' },
  { rank: 4, title: 'Optimization Adept', minAchievements: 11, maxAchievements: 15, emoji: '⚡' },
  { rank: 5, title: 'Rewards Expert', minAchievements: 16, maxAchievements: 20, emoji: '🎯' },
  { rank: 6, title: 'Rewards Master', minAchievements: 21, maxAchievements: 23, emoji: '🏆' },
];

// Main screens for Explorer achievement
const MAIN_SCREENS = [
  'Home',
  'Insights',
  'Sage',
  'AutoPilot',
  'MyCards',
  'Settings',
];

// ============================================================================
// In-Memory Cache
// ============================================================================

let achievementsCache: UserAchievements | null = null;
let isInitialized = false;
let unlockCallbacks: Array<(event: AchievementUnlockEvent) => void> = [];

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate rank from achievement count
 */
export function calculateRank(unlockedCount: number): RankDefinition {
  for (let i = RANK_DEFINITIONS.length - 1; i >= 0; i--) {
    if (unlockedCount >= RANK_DEFINITIONS[i].minAchievements) {
      return RANK_DEFINITIONS[i];
    }
  }
  return RANK_DEFINITIONS[0];
}

/**
 * Calculate streak from dates
 * @param lastVisitDate - YYYY-MM-DD of last visit
 * @param currentDate - Today's date
 * @param currentStreak - Current streak count
 */
export function calculateStreak(
  lastVisitDate: string | null,
  currentDate: Date,
  currentStreak: number
): { newStreak: number; isNewDay: boolean } {
  const today = formatDateYMD(currentDate);
  
  if (!lastVisitDate) {
    return { newStreak: 1, isNewDay: true };
  }
  
  if (lastVisitDate === today) {
    return { newStreak: currentStreak, isNewDay: false };
  }
  
  const lastDate = new Date(lastVisitDate + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diffDays === 1) {
    // Consecutive day
    return { newStreak: currentStreak + 1, isNewDay: true };
  } else {
    // Streak broken
    return { newStreak: 1, isNewDay: true };
  }
}

/**
 * Check if all main screens have been visited
 */
export function checkAllScreensVisited(visited: string[]): boolean {
  return MAIN_SCREENS.every(screen => visited.includes(screen));
}

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
}

/**
 * Initialize default user achievements
 */
export function createDefaultUserAchievements(userId: string | null): UserAchievements {
  const achievements: Record<string, AchievementProgress> = {};
  
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    achievements[def.id] = {
      achievementId: def.id,
      unlockedAt: undefined,
      progress: 0,
      progressTarget: def.progressTarget || 1,
      isUnlocked: false,
      percentComplete: 0,
    };
  }
  
  return {
    userId,
    achievements,
    currentStreak: 0,
    longestStreak: 0,
    lastVisitDate: '',
    rank: 1,
    rankTitle: 'Beginner',
    totalUnlocked: 0,
    totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
    screensVisited: [],
    cardBenefitsViewed: [],
    sageChatsCount: 0,
    statementsUploaded: 0,
    comparisonsCount: 0,
    updatedAt: new Date(),
  };
}

/**
 * Check and update achievement progress
 * Returns unlocked achievement if newly unlocked, null otherwise
 * 
 * PERFORMANCE: This function must complete in < 5ms
 */
export function checkAchievement(
  event: AchievementEvent,
  state: UserAchievements
): { updatedState: UserAchievements; unlocked: AchievementDefinition | null } {
  const startTime = Date.now();
  
  // Clone state to avoid mutation
  const newState: UserAchievements = {
    ...state,
    achievements: { ...state.achievements },
    screensVisited: [...state.screensVisited],
    cardBenefitsViewed: [...state.cardBenefitsViewed],
    updatedAt: new Date(),
  };
  
  let unlockedDef: AchievementDefinition | null = null;
  
  // Map event types to achievement checks
  switch (event.type) {
    case 'card_added': {
      const count = event.data?.cardCount || 0;
      // Update all progressive achievements, but only return the newly unlocked one
      const unlocked1 = tryUnlockProgressAchievement(newState, 'GS1', count);
      const unlocked2 = tryUnlockProgressAchievement(newState, 'GS2', count);
      const unlocked3 = tryUnlockProgressAchievement(newState, 'GS3', count);
      // Return the highest achievement that was just unlocked
      unlockedDef = unlocked3 || unlocked2 || unlocked1;
      break;
    }
    
    case 'spending_profile_saved':
      unlockedDef = tryUnlockAchievement(newState, 'GS4');
      break;
    
    case 'sage_chat':
      newState.sageChatsCount++;
      unlockedDef = tryUnlockProgressAchievement(newState, 'GS5', newState.sageChatsCount);
      break;
    
    case 'wallet_optimizer_used':
      unlockedDef = tryUnlockAchievement(newState, 'OP1');
      break;
    
    case 'fee_breakeven_viewed':
      unlockedDef = tryUnlockAchievement(newState, 'OP2');
      break;
    
    case 'signup_roi_viewed':
      unlockedDef = tryUnlockAchievement(newState, 'OP3');
      break;
    
    case 'gaps_found': {
      const gapsCount = event.data?.gapsCount || 0;
      if (gapsCount > 0) {
        unlockedDef = tryUnlockAchievement(newState, 'OP4');
      }
      break;
    }
    
    case 'optimization_score_calculated': {
      const score = event.data?.optimizationScore || 0;
      if (score >= 90) {
        unlockedDef = tryUnlockAchievement(newState, 'OP5');
      }
      break;
    }
    
    case 'statement_uploaded':
      newState.statementsUploaded++;
      const unlocked_di1 = tryUnlockProgressAchievement(newState, 'DI1', newState.statementsUploaded);
      const unlocked_di2 = tryUnlockProgressAchievement(newState, 'DI2', newState.statementsUploaded);
      unlockedDef = unlocked_di2 || unlocked_di1;
      break;
    
    case 'insights_viewed':
      unlockedDef = tryUnlockAchievement(newState, 'DI3');
      break;
    
    case 'money_left_on_table_calculated': {
      const amount = event.data?.moneyLeftOnTable || 0;
      if (amount >= 100) {
        unlockedDef = tryUnlockAchievement(newState, 'DI4');
      }
      break;
    }
    
    case 'trends_viewed':
      unlockedDef = tryUnlockAchievement(newState, 'DI5');
      break;
    
    case 'app_opened': {
      const { newStreak, isNewDay } = calculateStreak(
        newState.lastVisitDate || null,
        event.timestamp,
        newState.currentStreak
      );
      
      if (isNewDay) {
        newState.currentStreak = newStreak;
        newState.lastVisitDate = formatDateYMD(event.timestamp);
        newState.longestStreak = Math.max(newState.longestStreak, newStreak);
        
        const unlocked_en1 = tryUnlockProgressAchievement(newState, 'EN1', newStreak);
        const unlocked_en2 = tryUnlockProgressAchievement(newState, 'EN2', newStreak);
        unlockedDef = unlocked_en2 || unlocked_en1;
      }
      break;
    }
    
    case 'card_comparison_viewed':
      newState.comparisonsCount++;
      if (newState.comparisonsCount >= 1) {
        unlockedDef = tryUnlockAchievement(newState, 'EN3');
      }
      break;
    
    case 'screen_visited': {
      const screenName = event.data?.screenName;
      if (screenName && !newState.screensVisited.includes(screenName)) {
        newState.screensVisited.push(screenName);
        
        if (checkAllScreensVisited(newState.screensVisited)) {
          unlockedDef = tryUnlockAchievement(newState, 'EN4');
        }
      }
      break;
    }
    
    case 'card_benefits_viewed': {
      const cardId = event.data?.cardId;
      if (cardId && !newState.cardBenefitsViewed.includes(cardId)) {
        newState.cardBenefitsViewed.push(cardId);
        unlockedDef = tryUnlockProgressAchievement(
          newState, 
          'EN5', 
          newState.cardBenefitsViewed.length
        );
      }
      break;
    }
  }
  
  // Check mastery achievements (always check, even if another achievement was unlocked)
  const unlocked_ma1 = tryUnlockProgressAchievement(newState, 'MA1', newState.totalUnlocked);
  const unlocked_ma2 = tryUnlockProgressAchievement(newState, 'MA2', newState.totalUnlocked);
  const unlocked_ma3 = tryUnlockProgressAchievement(newState, 'MA3', newState.totalUnlocked);
  const masteryUnlocked = unlocked_ma3 || unlocked_ma2 || unlocked_ma1;
  
  // Return mastery achievement if one was unlocked, otherwise return the primary achievement
  if (masteryUnlocked) {
    unlockedDef = masteryUnlocked;
  }
  
  // Update rank if achievements changed
  const newRank = calculateRank(newState.totalUnlocked);
  newState.rank = newRank.rank;
  newState.rankTitle = newRank.title;
  
  // Performance check
  const elapsed = Date.now() - startTime;
  if (elapsed > 5) {
    console.warn(`[AchievementService] Check took ${elapsed}ms (> 5ms target)`);
  }
  
  return { updatedState: newState, unlocked: unlockedDef };
}

/**
 * Try to unlock a simple (non-progressive) achievement
 */
function tryUnlockAchievement(
  state: UserAchievements,
  achievementId: string
): AchievementDefinition | null {
  const progress = state.achievements[achievementId];
  if (!progress || progress.isUnlocked) return null;
  
  // Update progress
  state.achievements[achievementId] = {
    ...progress,
    progress: 1,
    isUnlocked: true,
    unlockedAt: new Date(),
    percentComplete: 100,
  };
  state.totalUnlocked++;
  
  return getAchievementDefinition(achievementId) || null;
}

/**
 * Try to unlock a progressive achievement
 */
function tryUnlockProgressAchievement(
  state: UserAchievements,
  achievementId: string,
  currentProgress: number
): AchievementDefinition | null {
  const progress = state.achievements[achievementId];
  if (!progress || progress.isUnlocked) return null;
  
  const target = progress.progressTarget;
  const newProgress = Math.min(currentProgress, target);
  const percentComplete = (newProgress / target) * 100;
  const isUnlocked = newProgress >= target;
  
  state.achievements[achievementId] = {
    ...progress,
    progress: newProgress,
    percentComplete,
    isUnlocked,
    unlockedAt: isUnlocked ? new Date() : undefined,
  };
  
  if (isUnlocked) {
    state.totalUnlocked++;
    return getAchievementDefinition(achievementId) || null;
  }
  
  return null;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize achievement service
 * Must be called on app start
 */
export async function initializeAchievements(): Promise<void> {
  if (isInitialized) return;

  try {
    // Try Supabase first for authenticated users
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && !user.isAnonymous) {
        await syncFromSupabase();
        isInitialized = true;
        setupEventListener();
        return;
      }
    }

    // Fallback to local storage
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      achievementsCache = transformFromStorage(JSON.parse(stored));
    } else {
      // Initialize default achievements
      achievementsCache = createDefaultUserAchievements(null);
      await persistToStorage(achievementsCache);
    }
    
    isInitialized = true;
    setupEventListener();
  } catch (error) {
    console.error('[AchievementService] Initialization error:', error);
    achievementsCache = createDefaultUserAchievements(null);
    isInitialized = true;
    setupEventListener();
  }
}

/**
 * Set up event listener for achievement tracking
 */
function setupEventListener(): void {
  AchievementEventEmitter.onEvent(async (event: AchievementEvent) => {
    if (!achievementsCache) return;
    
    const { updatedState, unlocked } = checkAchievement(event, achievementsCache);
    achievementsCache = updatedState;
    
    // Persist changes
    await persistToStorage(updatedState);
    
    // Notify listeners if achievement unlocked
    if (unlocked) {
      const unlockEvent: AchievementUnlockEvent = {
        achievement: unlocked,
        progress: updatedState.achievements[unlocked.id],
        newRank: updatedState.rank > (achievementsCache?.rank || 0)
          ? { rank: updatedState.rank, title: updatedState.rankTitle }
          : undefined,
        timestamp: new Date(),
      };
      
      notifyUnlock(unlockEvent);
    }
    
    // Sync to Supabase (non-blocking)
    syncToSupabase(updatedState).catch(console.error);
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get current user achievements
 */
export async function getAchievements(): Promise<UserAchievements> {
  if (!isInitialized) await initializeAchievements();
  return achievementsCache || createDefaultUserAchievements(null);
}

/**
 * Get achievements synchronously (from cache)
 */
export function getAchievementsSync(): UserAchievements | null {
  return achievementsCache;
}

/**
 * Get all achievement definitions
 */
export function getAchievementDefinitions(): AchievementDefinition[] {
  return [...ACHIEVEMENT_DEFINITIONS];
}

/**
 * Get achievement definitions by category
 */
export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

/**
 * Get all rank definitions
 */
export function getRankDefinitions(): RankDefinition[] {
  return [...RANK_DEFINITIONS];
}

/**
 * Manually track an event (alternative to auto-tracking)
 */
export async function track(
  type: AchievementEventType,
  data?: AchievementEvent['data']
): Promise<void> {
  AchievementEventEmitter.track(type, data);
}

/**
 * Subscribe to achievement unlock events
 * Returns unsubscribe function
 */
export function onAchievementUnlock(
  callback: (event: AchievementUnlockEvent) => void
): () => void {
  unlockCallbacks.push(callback);
  return () => {
    unlockCallbacks = unlockCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Notify all unlock listeners
 */
function notifyUnlock(event: AchievementUnlockEvent): void {
  for (const callback of unlockCallbacks) {
    try {
      callback(event);
    } catch (error) {
      console.error('[AchievementService] Unlock callback error:', error);
    }
  }
}

/**
 * Reset achievements (for testing or user request)
 */
export async function resetAchievements(): Promise<void> {
  achievementsCache = createDefaultUserAchievements(null);
  await AsyncStorage.removeItem(STORAGE_KEY);
  
  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', user.id);
    }
  }
}

/**
 * Reset cache (for testing)
 */
export function resetAchievementsCache(): void {
  achievementsCache = null;
  isInitialized = false;
  unlockCallbacks = [];
  AchievementEventEmitter.reset();
}

// ============================================================================
// Storage Functions
// ============================================================================

async function persistToStorage(state: UserAchievements): Promise<void> {
  const serialized = JSON.stringify({
    ...state,
    updatedAt: state.updatedAt.toISOString(),
    achievements: Object.fromEntries(
      Object.entries(state.achievements).map(([id, progress]) => [
        id,
        {
          ...progress,
          unlockedAt: progress.unlockedAt?.toISOString(),
        },
      ])
    ),
  });
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

function transformFromStorage(data: any): UserAchievements {
  const achievements: Record<string, AchievementProgress> = {};
  
  for (const [id, progress] of Object.entries(data.achievements || {})) {
    const p = progress as any;
    achievements[id] = {
      ...p,
      unlockedAt: p.unlockedAt ? new Date(p.unlockedAt) : undefined,
    };
  }
  
  return {
    ...data,
    achievements,
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
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id);

  if (error || !data) {
    // No achievements yet, create defaults
    achievementsCache = createDefaultUserAchievements(user.id);
    return;
  }

  // Build achievements from rows
  const achievements: Record<string, AchievementProgress> = {};
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const row = data.find((r: any) => r.achievement_id === def.id) as any;
    achievements[def.id] = {
      achievementId: def.id,
      unlockedAt: row?.unlocked_at ? new Date(row.unlocked_at) : undefined,
      progress: row ? (def.progressTarget || 1) : 0,
      progressTarget: def.progressTarget || 1,
      isUnlocked: !!row,
      percentComplete: row ? 100 : 0,
    };
  }

  // Get metadata from separate storage
  const metaStored = await AsyncStorage.getItem(STORAGE_KEY);
  const meta = metaStored ? JSON.parse(metaStored) : {};

  achievementsCache = {
    userId: user.id,
    achievements,
    currentStreak: meta.currentStreak || 0,
    longestStreak: meta.longestStreak || 0,
    lastVisitDate: meta.lastVisitDate || '',
    rank: calculateRank(data.length).rank,
    rankTitle: calculateRank(data.length).title,
    totalUnlocked: data.length,
    totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
    screensVisited: meta.screensVisited || [],
    cardBenefitsViewed: meta.cardBenefitsViewed || [],
    sageChatsCount: meta.sageChatsCount || 0,
    statementsUploaded: meta.statementsUploaded || 0,
    comparisonsCount: meta.comparisonsCount || 0,
    updatedAt: new Date(),
  };

  await persistToStorage(achievementsCache);
}

async function syncToSupabase(state: UserAchievements): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  // Upsert unlocked achievements
  const unlockedAchievements = Object.entries(state.achievements)
    .filter(([_, progress]) => progress.isUnlocked)
    .map(([id, progress]) => ({
      user_id: user.id,
      achievement_id: id,
      unlocked_at: progress.unlockedAt?.toISOString(),
    }));

  if (unlockedAchievements.length > 0) {
    await supabase
      .from('user_achievements')
      .upsert(unlockedAchievements as any, { 
        onConflict: 'user_id,achievement_id',
        ignoreDuplicates: false,
      });
  }
}
