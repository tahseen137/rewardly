# Cycle 5 Architecture Document
## Achievements & 5/24 Tracker

**Author:** VP of Engineering | **Date:** Feb 14, 2026 | **Status:** Ready for Development

---

## Table of Contents
1. [Overview](#overview)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Event Emitter Pattern](#event-emitter-pattern)
4. [Service Layer Architecture](#service-layer-architecture)
5. [Database Schema](#database-schema)
6. [Component Hierarchy](#component-hierarchy)
7. [Integration Points](#integration-points)
8. [Achievement Unlock Animation Strategy](#achievement-unlock-animation-strategy)
9. [Tier Gating](#tier-gating)
10. [Test Strategy](#test-strategy)
11. [Build Order](#build-order)
12. [Performance Considerations](#performance-considerations)

---

## Overview

Cycle 5 implements two high-value, moderate-complexity features that add gamification and credit strategy intelligence.

### Features
- **F15: Achievements & Gamification System** — Dopamine loops via achievement unlocks
- **F16: Credit Card 5/24 Tracker** — Application eligibility and strategy advisor

### Key Constraints
- Achievement checking must complete in **< 5ms** per check
- All achievement definitions and checks must be **pure functions** (testable without mocks)
- AchievementService must work **offline-first** (AsyncStorage) with optional Supabase sync
- Target: **95+ new tests**

### Shared Infrastructure
- **EventEmitter** — Cross-service event tracking for achievement triggers
- **Offline-first storage** — Follow SpendingProfileService pattern

---

## TypeScript Interfaces

Add these types to `src/types/index.ts`:

```typescript
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
```

---

## Event Emitter Pattern

The achievement system uses an event-driven architecture to decouple tracking from business logic. Services emit events; AchievementService listens and checks for unlocks.

### AchievementEventEmitter

```typescript
// src/services/AchievementEventEmitter.ts

import { EventEmitter } from 'events';
import { AchievementEvent, AchievementEventType } from '../types';

/**
 * Typed event emitter for achievement tracking
 * 
 * Pattern: Services call emit() when actions occur.
 * AchievementService listens and checks for unlocks.
 * 
 * Benefits:
 * - Decoupled: Services don't need to know about achievements
 * - Lightweight: emit() is fire-and-forget
 * - Testable: Can mock emitter in tests
 */

class AchievementEventEmitterClass extends EventEmitter {
  private static instance: AchievementEventEmitterClass;

  private constructor() {
    super();
    // Increase max listeners (default is 10)
    this.setMaxListeners(50);
  }

  static getInstance(): AchievementEventEmitterClass {
    if (!AchievementEventEmitterClass.instance) {
      AchievementEventEmitterClass.instance = new AchievementEventEmitterClass();
    }
    return AchievementEventEmitterClass.instance;
  }

  /**
   * Emit an achievement event
   * Fire-and-forget — does not block caller
   */
  track(type: AchievementEventType, data?: AchievementEvent['data']): void {
    const event: AchievementEvent = {
      type,
      data,
      timestamp: new Date(),
    };

    // Emit asynchronously to not block caller
    setImmediate(() => {
      this.emit('achievement_event', event);
    });
  }

  /**
   * Subscribe to achievement events
   * Used by AchievementService
   */
  onEvent(callback: (event: AchievementEvent) => void): void {
    this.on('achievement_event', callback);
  }

  /**
   * Unsubscribe from achievement events
   */
  offEvent(callback: (event: AchievementEvent) => void): void {
    this.off('achievement_event', callback);
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.removeAllListeners();
  }
}

// Export singleton instance
export const AchievementEventEmitter = AchievementEventEmitterClass.getInstance();

// Export convenience track function
export function trackAchievement(
  type: AchievementEventType,
  data?: AchievementEvent['data']
): void {
  AchievementEventEmitter.track(type, data);
}
```

### Integration Points for Event Emission

```typescript
// Each existing service adds a single track() call

// CardPortfolioManager.ts
import { trackAchievement } from './AchievementEventEmitter';

export async function addCard(cardId: string): Promise<Result<UserCard, PortfolioError>> {
  // ... existing logic ...
  
  if (result.success) {
    const portfolio = getCards();
    trackAchievement('card_added', { cardCount: portfolio.length });
  }
  
  return result;
}

// SpendingProfileService.ts
export async function saveSpendingProfile(
  input: SpendingProfileInput
): Promise<Result<SpendingProfile, SpendingProfileError>> {
  // ... existing logic ...
  
  if (result.success) {
    trackAchievement('spending_profile_saved');
  }
  
  return result;
}

// WalletOptimizerService.ts
export function optimizeWallet(...): Result<WalletOptimizerResult, WalletOptimizerError> {
  const result = // ... existing logic ...
  
  if (result.success) {
    trackAchievement('wallet_optimizer_used');
    
    // Check for gaps achievement
    const hasGaps = result.value.recommendations.some(r => 
      r.categoryAssignments.some(a => a.rewardRate < 2)
    );
    if (hasGaps) {
      trackAchievement('gaps_found', { gapsCount: 1 });
    }
    
    // Check for optimization score
    const topResult = result.value.recommendations[0];
    if (topResult) {
      trackAchievement('optimization_score_calculated', {
        optimizationScore: topResult.effectiveRewardRate * 25, // Rough conversion
      });
    }
  }
  
  return result;
}
```

---

## Service Layer Architecture

### File Structure

```
src/services/
├── AchievementEventEmitter.ts     # NEW: Event emitter singleton
├── AchievementService.ts          # NEW: F15 Achievement tracking
├── ApplicationTrackerService.ts   # NEW: F16 5/24 tracker
├── __tests__/
│   ├── AchievementEventEmitter.test.ts
│   ├── AchievementService.test.ts
│   ├── ApplicationTrackerService.test.ts
│   └── integration/
│       └── AchievementsIntegration.test.ts
```

---

### AchievementService.ts

```typescript
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
import { getCards } from './CardPortfolioManager';
import {
  AchievementDefinition,
  AchievementCategory,
  AchievementProgress,
  UserAchievements,
  AchievementUnlockEvent,
  AchievementEvent,
  AchievementEventType,
  RankDefinition,
  AchievementError,
  Result,
  success,
  failure,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@rewardly/achievements';
const STORAGE_KEY_STREAK = '@rewardly/streak';

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
  'Cards',
  'WalletOptimizer',
  'Insights',
  'Profile',
  'Achievements',
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
      unlockedDef = tryUnlockProgressAchievement(newState, 'GS1', count) ||
                    tryUnlockProgressAchievement(newState, 'GS2', count) ||
                    tryUnlockProgressAchievement(newState, 'GS3', count);
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
      unlockedDef = tryUnlockProgressAchievement(newState, 'DI1', newState.statementsUploaded) ||
                    tryUnlockProgressAchievement(newState, 'DI2', newState.statementsUploaded);
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
        
        unlockedDef = tryUnlockProgressAchievement(newState, 'EN1', newStreak) ||
                      tryUnlockProgressAchievement(newState, 'EN2', newStreak);
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
  
  // Check mastery achievements (always)
  if (!unlockedDef) {
    unlockedDef = tryUnlockProgressAchievement(newState, 'MA1', newState.totalUnlocked) ||
                  tryUnlockProgressAchievement(newState, 'MA2', newState.totalUnlocked) ||
                  tryUnlockProgressAchievement(newState, 'MA3', newState.totalUnlocked);
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
    const row = data.find((r: any) => r.achievement_id === def.id);
    achievements[def.id] = {
      achievementId: def.id,
      unlockedAt: row?.unlocked_at ? new Date(row.unlocked_at) : undefined,
      progress: row ? def.progressTarget || 1 : 0,
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
      .upsert(unlockedAchievements, { 
        onConflict: 'user_id,achievement_id',
        ignoreDuplicates: false,
      });
  }
}
```

---

### ApplicationTrackerService.ts

```typescript
/**
 * ApplicationTrackerService - F16: 5/24 Tracker
 * 
 * Features:
 * - Application tracking with fall-off dates
 * - Issuer-specific cooldown rules (8 Canadian + Chase 5/24)
 * - Eligibility checking per card
 * - Strategy advisor for application timing
 * - Offline-first storage with Supabase sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { getCardByIdSync, getAllCardsSync } from './CardDataService';
import {
  CardApplication,
  CardApplicationInput,
  ApplicationTracker,
  IssuerRule,
  IssuerCooldownStatus,
  CardEligibility,
  ApplicationTimelineEvent,
  StrategyAdvice,
  ApplicationStrategy,
  WantedCard,
  TrackerAlert,
  ApplicationTrackerError,
  ApplicationStatus,
  Result,
  success,
  failure,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@rewardly/applications';
const MONTHS_24 = 24;
const MONTHS_12 = 12;
const DAYS_IN_MONTH = 30.44; // Average

// ============================================================================
// Issuer Rules (Static Data)
// ============================================================================

export const ISSUER_RULES: IssuerRule[] = [
  // Canadian Issuers
  {
    issuer: 'American Express',
    cooldownDays: 90,
    isStrict: true,
    description: 'Can only apply for 1 Amex card every 90 days',
    welcomeBonusRule: 'Once per lifetime per card (with some exceptions)',
  },
  {
    issuer: 'Amex Canada',
    cooldownDays: 90,
    isStrict: true,
    description: 'Can only apply for 1 Amex card every 90 days',
    welcomeBonusRule: 'Once per lifetime per card (with some exceptions)',
  },
  {
    issuer: 'TD',
    cooldownDays: 90,
    isStrict: false,
    description: 'Not strict but multiple apps flag review',
  },
  {
    issuer: 'CIBC',
    cooldownDays: 0,
    isStrict: false,
    description: 'No hard limit but multiple apps may trigger review',
  },
  {
    issuer: 'RBC',
    cooldownDays: 0,
    isStrict: false,
    description: 'Generally flexible with applications',
  },
  {
    issuer: 'Scotiabank',
    cooldownDays: 0,
    isStrict: false,
    description: 'Generally flexible with applications',
  },
  {
    issuer: 'BMO',
    cooldownDays: 90,
    isStrict: false,
    description: 'Soft 90-day rule, similar to TD',
  },
  // US Issuers
  {
    issuer: 'Chase',
    cooldownDays: 0,
    isStrict: true,
    description: '5/24 Rule: Auto-denied if 5+ cards opened in 24 months',
    maxAppsPerPeriod: 5,
    periodMonths: 24,
  },
];

// ============================================================================
// In-Memory Cache
// ============================================================================

let applicationsCache: CardApplication[] = [];
let wantedCardsCache: WantedCard[] = [];
let isInitialized = false;

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Count applications in last N months
 */
export function countApplicationsInMonths(
  applications: CardApplication[],
  months: number,
  referenceDate: Date = new Date()
): number {
  const cutoffDate = new Date(referenceDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  return applications.filter(
    app => app.applicationDate >= cutoffDate && app.status === 'approved'
  ).length;
}

/**
 * Count applications to specific issuer in period
 */
export function countIssuerApplications(
  applications: CardApplication[],
  issuer: string,
  months: number,
  referenceDate: Date = new Date()
): { count: number; lastDate: Date | null } {
  const cutoffDate = new Date(referenceDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  const issuerApps = applications.filter(
    app => 
      normalizeIssuer(app.issuer) === normalizeIssuer(issuer) &&
      app.applicationDate >= cutoffDate &&
      app.status === 'approved'
  );
  
  const sortedApps = issuerApps.sort(
    (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
  );
  
  return {
    count: issuerApps.length,
    lastDate: sortedApps[0]?.applicationDate || null,
  };
}

/**
 * Get issuer rule (case-insensitive)
 */
export function getIssuerRule(issuer: string): IssuerRule | undefined {
  const normalized = normalizeIssuer(issuer);
  return ISSUER_RULES.find(
    rule => normalizeIssuer(rule.issuer) === normalized
  );
}

/**
 * Calculate cooldown status for an issuer
 */
export function calculateIssuerCooldown(
  applications: CardApplication[],
  issuer: string,
  referenceDate: Date = new Date()
): IssuerCooldownStatus {
  const rule = getIssuerRule(issuer) || {
    issuer,
    cooldownDays: 0,
    isStrict: false,
    description: 'No known restrictions',
  };
  
  const { count, lastDate } = countIssuerApplications(
    applications,
    issuer,
    rule.periodMonths || 12,
    referenceDate
  );
  
  let isEligible = true;
  let nextEligibleDate: Date | undefined;
  let daysUntilEligible = 0;
  
  // Check cooldown period
  if (rule.cooldownDays > 0 && lastDate) {
    const cooldownEnd = new Date(lastDate);
    cooldownEnd.setDate(cooldownEnd.getDate() + rule.cooldownDays);
    
    if (cooldownEnd > referenceDate) {
      isEligible = false;
      nextEligibleDate = cooldownEnd;
      daysUntilEligible = Math.ceil(
        (cooldownEnd.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }
  
  // Check max apps per period (5/24 rule)
  if (rule.maxAppsPerPeriod && count >= rule.maxAppsPerPeriod) {
    // Find oldest app in period - when it falls off, we're eligible
    const periodApps = applications
      .filter(
        app =>
          normalizeIssuer(app.issuer) === normalizeIssuer(issuer) &&
          app.status === 'approved'
      )
      .sort((a, b) => a.applicationDate.getTime() - b.applicationDate.getTime());
    
    const oldestInPeriod = periodApps.find(app => {
      const cutoff = new Date(referenceDate);
      cutoff.setMonth(cutoff.getMonth() - (rule.periodMonths || 24));
      return app.applicationDate >= cutoff;
    });
    
    if (oldestInPeriod) {
      const fallOffDate = new Date(oldestInPeriod.applicationDate);
      fallOffDate.setMonth(fallOffDate.getMonth() + (rule.periodMonths || 24));
      
      if (fallOffDate > referenceDate) {
        isEligible = false;
        if (!nextEligibleDate || fallOffDate > nextEligibleDate) {
          nextEligibleDate = fallOffDate;
          daysUntilEligible = Math.ceil(
            (fallOffDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }
    }
  }
  
  return {
    issuer,
    isEligible,
    lastApplicationDate: lastDate || undefined,
    nextEligibleDate,
    daysUntilEligible,
    rule,
    applicationCountInPeriod: count,
  };
}

/**
 * Check eligibility for a specific card
 */
export function checkCardEligibility(
  cardId: string,
  applications: CardApplication[],
  referenceDate: Date = new Date()
): CardEligibility {
  const card = getCardByIdSync(cardId);
  const cardName = card?.name || 'Unknown Card';
  const issuer = card?.issuer || 'Unknown';
  
  const cooldownStatus = calculateIssuerCooldown(applications, issuer, referenceDate);
  const previousApps = applications.filter(app => app.cardId === cardId);
  
  const reasons: string[] = [];
  let isEligible = true;
  let eligibleDate: Date | undefined;
  let daysUntilEligible = 0;
  
  // Check issuer cooldown
  if (!cooldownStatus.isEligible) {
    isEligible = false;
    reasons.push(
      `${issuer} cooldown: Wait ${cooldownStatus.daysUntilEligible} more days`
    );
    eligibleDate = cooldownStatus.nextEligibleDate;
    daysUntilEligible = cooldownStatus.daysUntilEligible;
  }
  
  // Check 5/24 for Chase cards
  if (normalizeIssuer(issuer) === 'chase') {
    const totalApps = countApplicationsInMonths(applications, 24, referenceDate);
    if (totalApps >= 5) {
      isEligible = false;
      reasons.push(`5/24 Rule: You have ${totalApps} cards in 24 months`);
    }
  }
  
  // Check previous applications to same card (welcome bonus)
  const rule = getIssuerRule(issuer);
  if (rule?.welcomeBonusRule && previousApps.length > 0) {
    reasons.push(`Note: ${rule.welcomeBonusRule}`);
  }
  
  // Check welcome bonus eligibility (simplified)
  const welcomeBonusEligible = previousApps.length === 0 ||
    (previousApps.every(app => {
      const daysSince = Math.floor(
        (referenceDate.getTime() - app.applicationDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince > 365 * 2; // Simplified: 2 years for most issuers
    }));
  
  return {
    cardId,
    cardName,
    issuer,
    isEligible,
    reasons,
    eligibleDate,
    daysUntilEligible,
    cooldownStatus,
    previousApplications: previousApps,
    welcomeBonusEligible,
  };
}

/**
 * Generate application timeline (past + future events)
 */
export function generateTimeline(
  applications: CardApplication[],
  referenceDate: Date = new Date()
): ApplicationTimelineEvent[] {
  const events: ApplicationTimelineEvent[] = [];
  
  // Past applications
  for (const app of applications) {
    events.push({
      date: app.applicationDate,
      type: 'application',
      application: app,
      description: `Applied for ${app.cardName}`,
      isInFuture: false,
    });
    
    // Future fall-off
    if (app.fallOffDate > referenceDate) {
      events.push({
        date: app.fallOffDate,
        type: 'falloff',
        application: app,
        description: `${app.cardName} falls off 24-month count`,
        isInFuture: true,
      });
    }
  }
  
  // Future eligibility dates (from cooldowns)
  const issuers = [...new Set(applications.map(a => a.issuer))];
  for (const issuer of issuers) {
    const cooldown = calculateIssuerCooldown(applications, issuer, referenceDate);
    if (cooldown.nextEligibleDate && cooldown.nextEligibleDate > referenceDate) {
      events.push({
        date: cooldown.nextEligibleDate,
        type: 'eligible',
        description: `Eligible for new ${issuer} card`,
        isInFuture: true,
      });
    }
  }
  
  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Generate strategy advice for wanted cards
 */
export function generateStrategy(
  wantedCards: WantedCard[],
  applications: CardApplication[],
  referenceDate: Date = new Date()
): ApplicationStrategy {
  const advice: StrategyAdvice[] = [];
  const warnings: string[] = [];
  
  // Current 5/24 count
  const current524 = countApplicationsInMonths(applications, 24, referenceDate);
  
  // Sort wanted cards by priority
  const sortedWanted = [...wantedCards].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  let simulated524 = current524;
  
  for (const wanted of sortedWanted) {
    const eligibility = checkCardEligibility(wanted.cardId, applications, referenceDate);
    const cooldown = eligibility.cooldownStatus;
    
    let recommendation: StrategyAdvice['recommendation'];
    const reasons: string[] = [];
    let suggestedDate: Date | undefined;
    let priority = 0;
    
    // Determine recommendation
    if (eligibility.isEligible) {
      // Check if applying would hurt 5/24
      if (simulated524 >= 4 && normalizeIssuer(wanted.issuer) !== 'chase') {
        // About to hit 5/24 - prioritize Chase cards
        const hasChaseWanted = wantedCards.some(
          w => normalizeIssuer(w.issuer) === 'chase' && w.cardId !== wanted.cardId
        );
        
        if (hasChaseWanted) {
          recommendation = 'caution';
          reasons.push('Applying will put you at 5/24 - consider Chase cards first');
          priority = 50;
        } else {
          recommendation = 'apply_now';
          reasons.push('Eligible now');
          priority = 10;
        }
      } else {
        recommendation = 'apply_now';
        reasons.push('Eligible now');
        priority = 10;
      }
    } else {
      // Not eligible - determine why
      if (cooldown.daysUntilEligible > 0) {
        recommendation = 'wait';
        suggestedDate = cooldown.nextEligibleDate;
        reasons.push(
          `Wait until ${formatDate(suggestedDate!)} (${cooldown.daysUntilEligible} days)`
        );
        priority = 100 + cooldown.daysUntilEligible;
      } else {
        recommendation = 'not_recommended';
        reasons.push(...eligibility.reasons);
        priority = 1000;
      }
    }
    
    // Calculate impact
    const will524Increase = eligibility.isEligible;
    const new524Count = will524Increase ? simulated524 + 1 : simulated524;
    const affectedIssuers = eligibility.isEligible ? [wanted.issuer] : [];
    
    if (will524Increase) {
      simulated524++;
    }
    
    advice.push({
      cardId: wanted.cardId,
      cardName: wanted.cardName,
      issuer: wanted.issuer,
      recommendation,
      reasons,
      suggestedDate,
      priority,
      impact: {
        will524Increase,
        new524Count,
        affectedIssuers,
      },
    });
  }
  
  // Sort by priority (lower = apply first)
  advice.sort((a, b) => a.priority - b.priority);
  
  // Generate warnings
  if (current524 >= 4) {
    warnings.push(
      `You're at ${current524}/24 - be strategic with remaining applications`
    );
  }
  
  const chaseWanted = wantedCards.filter(w => normalizeIssuer(w.issuer) === 'chase');
  if (chaseWanted.length > 0 && current524 >= 3) {
    warnings.push(
      'Apply for Chase cards before other issuers to avoid 5/24 lockout'
    );
  }
  
  // Generate summary
  const applyNowCount = advice.filter(a => a.recommendation === 'apply_now').length;
  const waitCount = advice.filter(a => a.recommendation === 'wait').length;
  
  let summary = '';
  if (applyNowCount > 0) {
    summary = `${applyNowCount} card${applyNowCount > 1 ? 's' : ''} ready to apply now.`;
  }
  if (waitCount > 0) {
    summary += ` ${waitCount} card${waitCount > 1 ? 's' : ''} require${waitCount === 1 ? 's' : ''} waiting.`;
  }
  if (warnings.length > 0) {
    summary += ' ⚠️ See warnings below.';
  }
  
  const timeline = generateTimeline(applications, referenceDate);
  
  return {
    wantedCards,
    advice,
    timeline,
    warnings,
    summary: summary.trim(),
  };
}

/**
 * Calculate fall-off date (application date + 24 months)
 */
export function calculateFallOffDate(applicationDate: Date): Date {
  const fallOff = new Date(applicationDate);
  fallOff.setMonth(fallOff.getMonth() + 24);
  return fallOff;
}

/**
 * Generate alerts for upcoming events
 */
export function generateAlerts(
  applications: CardApplication[],
  referenceDate: Date = new Date()
): TrackerAlert[] {
  const alerts: TrackerAlert[] = [];
  
  // Check for approaching 5/24 limit
  const count24 = countApplicationsInMonths(applications, 24, referenceDate);
  if (count24 === 4) {
    alerts.push({
      id: `alert-524-${Date.now()}`,
      type: 'approaching_limit',
      title: 'Approaching 5/24',
      message: "You're at 4/24. One more approval will trigger 5/24 for Chase cards.",
      date: referenceDate,
      dismissed: false,
      createdAt: new Date(),
    });
  }
  
  // Check for cards falling off soon (within 30 days)
  for (const app of applications) {
    const daysUntilFalloff = Math.ceil(
      (app.fallOffDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilFalloff > 0 && daysUntilFalloff <= 30) {
      alerts.push({
        id: `alert-falloff-${app.id}`,
        type: 'falloff_soon',
        title: 'Card Falling Off Soon',
        message: `${app.cardName} will fall off your 24-month count in ${daysUntilFalloff} days`,
        cardId: app.cardId,
        date: app.fallOffDate,
        dismissed: false,
        createdAt: new Date(),
      });
    }
  }
  
  // Check for cooldowns ending soon (within 14 days)
  const issuers = [...new Set(applications.map(a => a.issuer))];
  for (const issuer of issuers) {
    const cooldown = calculateIssuerCooldown(applications, issuer, referenceDate);
    if (
      cooldown.nextEligibleDate &&
      cooldown.daysUntilEligible > 0 &&
      cooldown.daysUntilEligible <= 14
    ) {
      alerts.push({
        id: `alert-cooldown-${issuer}-${Date.now()}`,
        type: 'cooldown_ending',
        title: `${issuer} Cooldown Ending`,
        message: `You'll be eligible for a new ${issuer} card in ${cooldown.daysUntilEligible} days`,
        issuer,
        date: cooldown.nextEligibleDate,
        dismissed: false,
        createdAt: new Date(),
      });
    }
  }
  
  return alerts;
}

// ============================================================================
// Utility Functions
// ============================================================================

function normalizeIssuer(issuer: string): string {
  return issuer.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace('american express', 'amex')
    .replace('amex canada', 'amex');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Initialization
// ============================================================================

export async function initializeApplicationTracker(): Promise<void> {
  if (isInitialized) return;

  try {
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
      const data = JSON.parse(stored);
      applicationsCache = transformApplicationsFromStorage(data.applications || []);
      wantedCardsCache = transformWantedFromStorage(data.wantedCards || []);
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('[ApplicationTrackerService] Initialization error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Add a new card application
 */
export async function addApplication(
  input: CardApplicationInput
): Promise<Result<CardApplication, ApplicationTrackerError>> {
  if (!isInitialized) await initializeApplicationTracker();

  // Validate card exists
  const card = getCardByIdSync(input.cardId);
  if (!card && input.cardId !== 'custom') {
    // Allow custom cards not in DB
  }

  // Check for duplicate
  const duplicate = applicationsCache.find(
    app =>
      app.cardId === input.cardId &&
      formatDateYMD(app.applicationDate) === formatDateYMD(input.applicationDate)
  );

  if (duplicate) {
    return failure({
      type: 'DUPLICATE_APPLICATION',
      cardId: input.cardId,
      date: formatDateYMD(input.applicationDate),
    });
  }

  const application: CardApplication = {
    id: generateId(),
    cardId: input.cardId,
    cardName: input.cardName,
    issuer: input.issuer,
    applicationDate: input.applicationDate,
    status: input.status,
    fallOffDate: calculateFallOffDate(input.applicationDate),
    notes: input.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  applicationsCache.push(application);
  await persistToStorage();
  await syncToSupabase();

  return success(application);
}

/**
 * Update an existing application
 */
export async function updateApplication(
  applicationId: string,
  updates: Partial<CardApplicationInput>
): Promise<Result<CardApplication, ApplicationTrackerError>> {
  if (!isInitialized) await initializeApplicationTracker();

  const index = applicationsCache.findIndex(app => app.id === applicationId);
  if (index === -1) {
    return failure({ type: 'APPLICATION_NOT_FOUND', applicationId });
  }

  const updated: CardApplication = {
    ...applicationsCache[index],
    ...updates,
    updatedAt: new Date(),
  };

  // Recalculate fall-off if application date changed
  if (updates.applicationDate) {
    updated.fallOffDate = calculateFallOffDate(updates.applicationDate);
  }

  applicationsCache[index] = updated;
  await persistToStorage();
  await syncToSupabase();

  return success(updated);
}

/**
 * Delete an application
 */
export async function deleteApplication(
  applicationId: string
): Promise<Result<void, ApplicationTrackerError>> {
  if (!isInitialized) await initializeApplicationTracker();

  const index = applicationsCache.findIndex(app => app.id === applicationId);
  if (index === -1) {
    return failure({ type: 'APPLICATION_NOT_FOUND', applicationId });
  }

  applicationsCache.splice(index, 1);
  await persistToStorage();

  // Delete from Supabase
  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('card_applications')
        .delete()
        .eq('id', applicationId);
    }
  }

  return success(undefined);
}

/**
 * Get all applications
 */
export async function getApplications(): Promise<CardApplication[]> {
  if (!isInitialized) await initializeApplicationTracker();
  return [...applicationsCache].sort(
    (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
  );
}

/**
 * Get full tracker state
 */
export async function getTracker(): Promise<ApplicationTracker> {
  if (!isInitialized) await initializeApplicationTracker();

  const now = new Date();
  const applications = applicationsCache;

  // Calculate all issuer cooldowns
  const issuers = [...new Set(applications.map(a => a.issuer))];
  const issuerCooldowns = issuers.map(issuer =>
    calculateIssuerCooldown(applications, issuer, now)
  );

  // Add any issuers with known rules that user hasn't applied to
  for (const rule of ISSUER_RULES) {
    if (!issuers.includes(rule.issuer)) {
      issuerCooldowns.push({
        issuer: rule.issuer,
        isEligible: true,
        daysUntilEligible: 0,
        rule,
        applicationCountInPeriod: 0,
      });
    }
  }

  const userId = (await getCurrentUser())?.id || null;

  return {
    userId,
    applications,
    countLast24Months: countApplicationsInMonths(applications, 24, now),
    countLast12Months: countApplicationsInMonths(applications, 12, now),
    issuerCooldowns,
    upcoming: generateTimeline(applications, now).filter(e => e.isInFuture),
    alerts: generateAlerts(applications, now),
    updatedAt: now,
  };
}

/**
 * Check eligibility for a specific card
 */
export async function getCardEligibility(
  cardId: string
): Promise<CardEligibility> {
  if (!isInitialized) await initializeApplicationTracker();
  return checkCardEligibility(cardId, applicationsCache);
}

/**
 * Add a card to wanted list
 */
export async function addWantedCard(
  card: Omit<WantedCard, 'addedAt'>
): Promise<WantedCard> {
  if (!isInitialized) await initializeApplicationTracker();

  // Remove if already exists
  wantedCardsCache = wantedCardsCache.filter(w => w.cardId !== card.cardId);

  const wanted: WantedCard = {
    ...card,
    addedAt: new Date(),
  };

  wantedCardsCache.push(wanted);
  await persistToStorage();

  return wanted;
}

/**
 * Remove a card from wanted list
 */
export async function removeWantedCard(cardId: string): Promise<void> {
  if (!isInitialized) await initializeApplicationTracker();
  wantedCardsCache = wantedCardsCache.filter(w => w.cardId !== cardId);
  await persistToStorage();
}

/**
 * Get wanted cards list
 */
export async function getWantedCards(): Promise<WantedCard[]> {
  if (!isInitialized) await initializeApplicationTracker();
  return [...wantedCardsCache];
}

/**
 * Get application strategy for wanted cards
 */
export async function getStrategy(): Promise<ApplicationStrategy> {
  if (!isInitialized) await initializeApplicationTracker();
  return generateStrategy(wantedCardsCache, applicationsCache);
}

/**
 * Get strategy for specific cards (without saving to wanted list)
 */
export async function getStrategyForCards(
  cardIds: string[]
): Promise<ApplicationStrategy> {
  if (!isInitialized) await initializeApplicationTracker();

  const wantedCards: WantedCard[] = cardIds.map(cardId => {
    const card = getCardByIdSync(cardId);
    return {
      cardId,
      cardName: card?.name || 'Unknown',
      issuer: card?.issuer || 'Unknown',
      priority: 'medium' as const,
      addedAt: new Date(),
    };
  });

  return generateStrategy(wantedCards, applicationsCache);
}

/**
 * Reset cache (for testing)
 */
export function resetApplicationTrackerCache(): void {
  applicationsCache = [];
  wantedCardsCache = [];
  isInitialized = false;
}

// ============================================================================
// Storage Functions
// ============================================================================

async function persistToStorage(): Promise<void> {
  const data = {
    applications: applicationsCache.map(app => ({
      ...app,
      applicationDate: app.applicationDate.toISOString(),
      approvalDate: app.approvalDate?.toISOString(),
      fallOffDate: app.fallOffDate.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    })),
    wantedCards: wantedCardsCache.map(w => ({
      ...w,
      addedAt: w.addedAt.toISOString(),
    })),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function transformApplicationsFromStorage(data: any[]): CardApplication[] {
  return data.map(app => ({
    ...app,
    applicationDate: new Date(app.applicationDate),
    approvalDate: app.approvalDate ? new Date(app.approvalDate) : undefined,
    fallOffDate: new Date(app.fallOffDate),
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
  }));
}

function transformWantedFromStorage(data: any[]): WantedCard[] {
  return data.map(w => ({
    ...w,
    addedAt: new Date(w.addedAt),
  }));
}

function formatDateYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// Supabase Sync
// ============================================================================

async function syncFromSupabase(): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('card_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('application_date', { ascending: false });

  if (error || !data) return;

  applicationsCache = data.map((row: any) => ({
    id: row.id,
    cardId: row.card_id,
    cardName: row.card_name,
    issuer: row.issuer,
    applicationDate: new Date(row.application_date),
    approvalDate: row.approval_date ? new Date(row.approval_date) : undefined,
    status: row.status as ApplicationStatus,
    fallOffDate: new Date(row.fall_off_date),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at || row.created_at),
  }));

  await persistToStorage();
}

async function syncToSupabase(): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  const rows = applicationsCache.map(app => ({
    id: app.id,
    user_id: user.id,
    card_id: app.cardId,
    card_name: app.cardName,
    issuer: app.issuer,
    application_date: app.applicationDate.toISOString().split('T')[0],
    approval_date: app.approvalDate?.toISOString().split('T')[0],
    status: app.status,
    fall_off_date: app.fallOffDate.toISOString().split('T')[0],
    notes: app.notes,
  }));

  await supabase
    .from('card_applications')
    .upsert(rows, { onConflict: 'id' });
}
```

---

## Database Schema

### Supabase Migration

```sql
-- ============================================================================
-- Cycle 5: Achievements & 5/24 Tracker
-- Migration: 20260214_achievements_and_applications.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- F15: User Achievements
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,  -- e.g., "GS1", "OP1"
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  
  -- One record per achievement per user
  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id 
  ON user_achievements(user_id);

-- Index for leaderboards (future feature)
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at 
  ON user_achievements(unlocked_at);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
  ON user_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- F16: Card Applications
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS card_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Card info (denormalized for display)
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  
  -- Application details
  application_date DATE NOT NULL,
  approval_date DATE,  -- May differ from application date
  status TEXT NOT NULL DEFAULT 'approved',  -- 'approved', 'pending', 'denied'
  fall_off_date DATE NOT NULL,  -- application_date + 24 months
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('approved', 'pending', 'denied'))
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_card_applications_user_id 
  ON card_applications(user_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_card_applications_date 
  ON card_applications(user_id, application_date);

-- Index for issuer queries
CREATE INDEX IF NOT EXISTS idx_card_applications_issuer 
  ON card_applications(user_id, issuer);

-- Enable RLS
ALTER TABLE card_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own applications"
  ON card_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON card_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON card_applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON card_applications FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_card_applications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_applications_updated_at
  BEFORE UPDATE ON card_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_card_applications_timestamp();

-- ----------------------------------------------------------------------------
-- Helper View: Application Counts
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW user_application_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE application_date > CURRENT_DATE - INTERVAL '24 months' AND status = 'approved') as count_24_months,
  COUNT(*) FILTER (WHERE application_date > CURRENT_DATE - INTERVAL '12 months' AND status = 'approved') as count_12_months,
  COUNT(*) as total_applications,
  MAX(application_date) as last_application_date
FROM card_applications
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_application_stats TO authenticated;
```

---

## Component Hierarchy

### New Screens

```
src/screens/
├── AchievementsScreen.tsx             # F15: Trophy case
├── ApplicationTrackerScreen.tsx       # F16: 5/24 tracker
├── AddApplicationScreen.tsx           # F16: Add new application
├── ApplicationStrategyScreen.tsx      # F16: Strategy advisor (Pro+)
├── components/
│   ├── achievements/
│   │   ├── AchievementCard.tsx        # Single achievement display
│   │   ├── AchievementGrid.tsx        # Grid of achievements by category
│   │   ├── RankBadge.tsx              # Current rank display
│   │   ├── StreakDisplay.tsx          # Streak fire animation
│   │   ├── UnlockToast.tsx            # Unlock notification toast
│   │   └── ProgressBar.tsx            # Achievement progress bar
│   └── tracker/
│       ├── ApplicationCard.tsx        # Single application display
│       ├── FiveTwentyFourGauge.tsx    # Visual X/24 gauge
│       ├── IssuerCooldownCard.tsx     # Issuer status card
│       ├── TimelineView.tsx           # Application timeline
│       ├── StrategyCard.tsx           # Single strategy advice
│       └── EligibilityBadge.tsx       # Eligible/waiting badge
```

### AchievementsScreen Component Tree

```
AchievementsScreen
├── Header
│   ├── Title ("Achievements")
│   └── RankBadge
│       ├── RankEmoji
│       ├── RankTitle
│       └── AchievementCount ("12/23")
│
├── StreakSection
│   ├── StreakDisplay
│   │   ├── FlameIcon (animated)
│   │   ├── StreakCount ("7 days")
│   │   └── StreakLabel
│   └── LongestStreakBadge
│
├── CategoryTabs
│   ├── Tab ("All")
│   ├── Tab ("Getting Started")
│   ├── Tab ("Optimization")
│   ├── Tab ("Data & Insights")
│   ├── Tab ("Engagement")
│   └── Tab ("Mastery")
│
├── AchievementGrid
│   ├── AchievementCard (unlocked, gold border)
│   │   ├── AchievementIcon
│   │   ├── AchievementName
│   │   ├── UnlockDate
│   │   └── GoldGlow (animated)
│   │
│   ├── AchievementCard (locked, progress)
│   │   ├── LockedIcon (grayed)
│   │   ├── AchievementName
│   │   ├── ProgressBar ("2/5 cards")
│   │   └── Description
│   │
│   └── AchievementCard (locked, no progress)
│       ├── LockedIcon (grayed)
│       ├── AchievementName (or "???")
│       └── Description (or "Secret achievement")
│
└── RankProgressFooter
    ├── CurrentRank
    ├── ProgressToNextRank
    └── NextRankPreview
```

### ApplicationTrackerScreen Component Tree

```
ApplicationTrackerScreen
├── Header
│   ├── Title ("Application Tracker")
│   └── AddButton (+)
│
├── FiveTwentyFourHero
│   ├── FiveTwentyFourGauge (circular)
│   │   ├── GaugeArc (filled portion)
│   │   ├── CountDisplay ("3/24")
│   │   └── SubLabel ("cards in 24 months")
│   └── StatusBadge ("Safe" / "Approaching Limit" / "At Limit")
│
├── AlertsSection (if any)
│   ├── AlertCard
│   │   ├── AlertIcon
│   │   ├── AlertTitle
│   │   ├── AlertMessage
│   │   └── DismissButton
│   └── ...more alerts
│
├── IssuerStatusSection
│   ├── SectionHeader ("Issuer Cooldowns")
│   ├── IssuerCooldownCard (Amex)
│   │   ├── IssuerLogo
│   │   ├── IssuerName
│   │   ├── EligibilityBadge (✅ Eligible / ⏳ Wait 45 days)
│   │   └── LastAppDate
│   ├── IssuerCooldownCard (TD)
│   ├── IssuerCooldownCard (Chase)
│   │   └── FiveTwentyFourWarning (if applicable)
│   └── ...more issuers
│
├── ApplicationsSection
│   ├── SectionHeader ("Your Applications")
│   ├── ApplicationCard
│   │   ├── CardIcon
│   │   ├── CardName
│   │   ├── Issuer
│   │   ├── ApplicationDate
│   │   ├── StatusBadge
│   │   ├── FalloffCountdown ("Falls off in 18 months")
│   │   └── EditButton
│   └── ...more applications
│
├── TimelineTab (alternate view)
│   └── TimelineView
│       ├── TimelineEvent (past - application)
│       ├── TimelineEvent (future - falloff)
│       ├── TimelineEvent (future - eligible)
│       └── ...more events
│
└── StrategyFAB (Pro+)
    └── "View Strategy" → ApplicationStrategyScreen
```

### ApplicationStrategyScreen (Pro+ Only)

```
ApplicationStrategyScreen
├── Header
│   └── Title ("Application Strategy")
│
├── SummaryCard
│   ├── Summary text
│   └── Warning badges
│
├── WantedCardsList
│   ├── SectionHeader ("Your Wanted Cards")
│   ├── WantedCardChip (with priority indicator)
│   │   ├── CardName
│   │   ├── PriorityBadge
│   │   └── RemoveButton
│   └── AddWantedCardButton
│
├── StrategyAdviceList
│   ├── StrategyCard (Apply Now)
│   │   ├── CardName + Issuer
│   │   ├── RecommendationBadge (green "Apply Now")
│   │   ├── ReasonsList
│   │   └── ImpactPreview
│   │
│   ├── StrategyCard (Wait)
│   │   ├── CardName + Issuer
│   │   ├── RecommendationBadge (yellow "Wait")
│   │   ├── SuggestedDate
│   │   ├── ReasonsList
│   │   └── CountdownTimer
│   │
│   └── StrategyCard (Caution)
│       ├── CardName + Issuer
│       ├── RecommendationBadge (orange "Caution")
│       └── WarningMessage
│
└── WarningsSection
    └── WarningCard (5/24 approaching, etc.)
```

---

## Integration Points

### Existing Services Modified

| Service | Modification | Achievement Triggered |
|---------|--------------|----------------------|
| `CardPortfolioManager` | Add `trackAchievement('card_added', ...)` | GS1, GS2, GS3 |
| `SpendingProfileService` | Add `trackAchievement('spending_profile_saved')` | GS4 |
| `SageService` | Add `trackAchievement('sage_chat')` | GS5 |
| `WalletOptimizerService` | Add `trackAchievement('wallet_optimizer_used')` | OP1, OP4, OP5 |
| `FeeBreakevenService` | Add `trackAchievement('fee_breakeven_viewed')` | OP2 |
| `SignupBonusService` | Add `trackAchievement('signup_roi_viewed')` | OP3 |
| `StatementParserService` | Add `trackAchievement('statement_uploaded')` | DI1, DI2 |
| `InsightsService` | Add tracking for insights, trends, money left | DI3, DI4, DI5 |

### Navigation Integration

```typescript
// In AppNavigator or screen components:

import { trackAchievement } from '../services/AchievementService';

// Track screen visits
useEffect(() => {
  trackAchievement('screen_visited', { screenName: route.name });
}, [route.name]);

// Track app opens (in App.tsx or root component)
useEffect(() => {
  trackAchievement('app_opened');
}, []);
```

### CardDetailScreen Integration

```typescript
// Track card benefits viewed
const handleViewBenefits = (cardId: string) => {
  trackAchievement('card_benefits_viewed', { cardId });
  // ... existing logic
};

// Track card comparisons
const handleCompareCards = () => {
  trackAchievement('card_comparison_viewed');
  // ... existing logic
};
```

### Home Screen Integration

```typescript
// Add rank badge to user profile area
import { getAchievementsSync } from '../services/AchievementService';

const HomeScreen = () => {
  const achievements = getAchievementsSync();
  
  return (
    <View>
      <ProfileSection>
        <RankBadge 
          rank={achievements?.rank || 1} 
          title={achievements?.rankTitle || 'Beginner'} 
        />
        {achievements?.currentStreak > 0 && (
          <StreakBadge count={achievements.currentStreak} />
        )}
      </ProfileSection>
      {/* ... rest of home screen */}
    </View>
  );
};
```

---

## Achievement Unlock Animation Strategy

### React Native Animated API Implementation

```typescript
// src/screens/components/achievements/UnlockToast.tsx

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AchievementUnlockEvent } from '../../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 100;

interface UnlockToastProps {
  event: AchievementUnlockEvent;
  onDismiss: () => void;
  duration?: number;
}

export const UnlockToast: React.FC<UnlockToastProps> = ({
  event,
  onDismiss,
  duration = 4000,
}) => {
  // Animation values
  const slideAnim = useRef(new Animated.Value(-TOAST_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback on mount
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Entrance animation sequence
    Animated.sequence([
      // Slide in + fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 50, // 50px from top
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),

      // Icon pop animation
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),

      // Wait before exit
      Animated.delay(duration - 1500),

      // Exit animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -TOAST_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onDismiss();
    });
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon with pop animation */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: iconScaleAnim }] },
          ]}
        >
          <Text style={styles.icon}>{event.achievement.icon}</Text>
        </Animated.View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Achievement Unlocked!</Text>
          <Text style={styles.name}>{event.achievement.name}</Text>
          <Text style={styles.description}>
            {event.achievement.description}
          </Text>
        </View>
      </View>

      {/* Rank up indicator (if applicable) */}
      {event.newRank && (
        <View style={styles.rankUp}>
          <Text style={styles.rankUpText}>
            🎉 Rank Up: {event.newRank.title}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 1000,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 2,
  },
  rankUp: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.3)',
  },
  rankUpText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

### UnlockToast Manager

```typescript
// src/services/UnlockToastManager.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { UnlockToast } from '../screens/components/achievements/UnlockToast';
import { onAchievementUnlock, AchievementUnlockEvent } from './AchievementService';

interface ToastContextType {
  showUnlock: (event: AchievementUnlockEvent) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const UnlockToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queue, setQueue] = useState<AchievementUnlockEvent[]>([]);
  const [current, setCurrent] = useState<AchievementUnlockEvent | null>(null);

  // Subscribe to achievement unlocks
  useEffect(() => {
    const unsubscribe = onAchievementUnlock((event) => {
      setQueue((prev) => [...prev, event]);
    });

    return () => unsubscribe();
  }, []);

  // Process queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  const handleDismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  const showUnlock = useCallback((event: AchievementUnlockEvent) => {
    setQueue((prev) => [...prev, event]);
  }, []);

  return (
    <ToastContext.Provider value={{ showUnlock }}>
      {children}
      {current && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <UnlockToast event={current} onDismiss={handleDismiss} />
        </View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});

export const useUnlockToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useUnlockToast must be used within UnlockToastProvider');
  }
  return context;
};
```

### App.tsx Integration

```typescript
// In App.tsx or root component

import { UnlockToastProvider } from './services/UnlockToastManager';
import { initializeAchievements, trackAchievement } from './services/AchievementService';

function App() {
  useEffect(() => {
    // Initialize achievements on app start
    initializeAchievements();
    
    // Track app open for streak
    trackAchievement('app_opened');
  }, []);

  return (
    <UnlockToastProvider>
      <NavigationContainer>
        {/* ... rest of app */}
      </NavigationContainer>
    </UnlockToastProvider>
  );
}
```

---

## Tier Gating

### Feature Access Matrix

| Feature | Free | Pro | Max |
|---------|------|-----|-----|
| **F15: Achievements** | | | |
| View all achievements | ✅ | ✅ | ✅ |
| Earn all achievements | ✅ | ✅ | ✅ |
| Unlock animations | ✅ | ✅ | ✅ |
| Rank system | ✅ | ✅ | ✅ |
| Streak tracking | ✅ | ✅ | ✅ |
| **F16: 5/24 Tracker** | | | |
| View 5/24 count | ✅ | ✅ | ✅ |
| Add applications | ✅ | ✅ | ✅ |
| Basic eligibility check | ✅ | ✅ | ✅ |
| Full issuer cooldowns | 🔒 | ✅ | ✅ |
| Timeline view | 🔒 | ✅ | ✅ |
| Strategy advisor | 🔒 | 🔒 | ✅ |
| Eligibility alerts | 🔒 | 🔒 | ✅ |

### Implementation Pattern

```typescript
// In ApplicationTrackerScreen

import { getCurrentTierSync } from '../services/SubscriptionService';

function ApplicationTrackerScreen() {
  const tier = getCurrentTierSync();
  const canSeeFullCooldowns = tier !== 'free';
  const canSeeStrategy = tier === 'max';

  return (
    <ScrollView>
      {/* Always visible */}
      <FiveTwentyFourHero count={tracker.countLast24Months} />
      
      {/* Gated: Full issuer cooldowns */}
      {canSeeFullCooldowns ? (
        <IssuerCooldownSection cooldowns={tracker.issuerCooldowns} />
      ) : (
        <UpgradePrompt 
          feature="Issuer cooldown tracking" 
          tier="pro" 
        />
      )}
      
      {/* Always visible */}
      <ApplicationsList applications={tracker.applications} />
      
      {/* Gated: Strategy advisor */}
      {canSeeStrategy ? (
        <StrategyButton onPress={navigateToStrategy} />
      ) : (
        <UpgradePrompt 
          feature="Application strategy advisor" 
          tier="max" 
        />
      )}
    </ScrollView>
  );
}
```

---

## Test Strategy

### Test Distribution

| Service | Unit Tests | Integration | Property | Total |
|---------|------------|-------------|----------|-------|
| AchievementEventEmitter | 5 | 2 | - | 7 |
| AchievementService | 30 | 5 | 3 | 38 |
| ApplicationTrackerService | 35 | 5 | 5 | 45 |
| Components | - | 5 | - | 5 |
| **Total** | **70** | **17** | **8** | **95** |

### AchievementService Tests

```typescript
// src/services/__tests__/AchievementService.test.ts

describe('AchievementService', () => {
  beforeEach(() => {
    resetAchievementsCache();
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Pure Function Tests
  // -------------------------------------------------------------------------

  describe('calculateRank', () => {
    it('should return Beginner for 0-2 achievements', () => {
      expect(calculateRank(0).title).toBe('Beginner');
      expect(calculateRank(2).title).toBe('Beginner');
    });

    it('should return Card Curious for 3-5 achievements', () => {
      expect(calculateRank(3).title).toBe('Card Curious');
      expect(calculateRank(5).title).toBe('Card Curious');
    });

    it('should return Rewards Explorer for 6-10 achievements', () => {
      expect(calculateRank(6).title).toBe('Rewards Explorer');
      expect(calculateRank(10).title).toBe('Rewards Explorer');
    });

    it('should return Optimization Adept for 11-15 achievements', () => {
      expect(calculateRank(11).title).toBe('Optimization Adept');
      expect(calculateRank(15).title).toBe('Optimization Adept');
    });

    it('should return Rewards Expert for 16-20 achievements', () => {
      expect(calculateRank(16).title).toBe('Rewards Expert');
      expect(calculateRank(20).title).toBe('Rewards Expert');
    });

    it('should return Rewards Master for 21+ achievements', () => {
      expect(calculateRank(21).title).toBe('Rewards Master');
      expect(calculateRank(23).title).toBe('Rewards Master');
    });
  });

  describe('calculateStreak', () => {
    it('should return 1 for first visit', () => {
      const result = calculateStreak(null, new Date('2026-02-14'), 0);
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });

    it('should increment streak for consecutive days', () => {
      const result = calculateStreak('2026-02-13', new Date('2026-02-14'), 5);
      expect(result.newStreak).toBe(6);
      expect(result.isNewDay).toBe(true);
    });

    it('should reset streak if more than 1 day gap', () => {
      const result = calculateStreak('2026-02-12', new Date('2026-02-14'), 5);
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });

    it('should not change streak for same day', () => {
      const result = calculateStreak('2026-02-14', new Date('2026-02-14'), 5);
      expect(result.newStreak).toBe(5);
      expect(result.isNewDay).toBe(false);
    });
  });

  describe('checkAllScreensVisited', () => {
    it('should return false if not all screens visited', () => {
      expect(checkAllScreensVisited(['Home', 'Cards'])).toBe(false);
    });

    it('should return true if all main screens visited', () => {
      const allScreens = [
        'Home', 'Cards', 'WalletOptimizer', 
        'Insights', 'Profile', 'Achievements'
      ];
      expect(checkAllScreensVisited(allScreens)).toBe(true);
    });
  });

  describe('checkAchievement', () => {
    let defaultState: UserAchievements;

    beforeEach(() => {
      defaultState = createDefaultUserAchievements(null);
    });

    it('should unlock GS1 when first card added', () => {
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 1 },
        timestamp: new Date(),
      };

      const { updatedState, unlocked } = checkAchievement(event, defaultState);

      expect(unlocked?.id).toBe('GS1');
      expect(updatedState.achievements['GS1'].isUnlocked).toBe(true);
      expect(updatedState.totalUnlocked).toBe(1);
    });

    it('should unlock GS2 when 3 cards added', () => {
      // First unlock GS1
      const state1 = checkAchievement(
        { type: 'card_added', data: { cardCount: 1 }, timestamp: new Date() },
        defaultState
      ).updatedState;

      // Then add more cards
      const { updatedState, unlocked } = checkAchievement(
        { type: 'card_added', data: { cardCount: 3 }, timestamp: new Date() },
        state1
      );

      expect(unlocked?.id).toBe('GS2');
      expect(updatedState.achievements['GS2'].isUnlocked).toBe(true);
    });

    it('should not re-unlock already unlocked achievement', () => {
      // Unlock GS1
      const state1 = checkAchievement(
        { type: 'card_added', data: { cardCount: 1 }, timestamp: new Date() },
        defaultState
      ).updatedState;

      // Try to unlock again
      const { updatedState, unlocked } = checkAchievement(
        { type: 'card_added', data: { cardCount: 1 }, timestamp: new Date() },
        state1
      );

      expect(unlocked).toBeNull();
      expect(updatedState.totalUnlocked).toBe(1);
    });

    it('should track screen visits for Explorer achievement', () => {
      let state = defaultState;

      // Visit all screens except one
      const screens = ['Home', 'Cards', 'WalletOptimizer', 'Insights', 'Profile'];
      for (const screen of screens) {
        const result = checkAchievement(
          { type: 'screen_visited', data: { screenName: screen }, timestamp: new Date() },
          state
        );
        state = result.updatedState;
        expect(result.unlocked).toBeNull();
      }

      // Visit final screen
      const { unlocked } = checkAchievement(
        { type: 'screen_visited', data: { screenName: 'Achievements' }, timestamp: new Date() },
        state
      );

      expect(unlocked?.id).toBe('EN4');
    });

    it('should complete in under 5ms', () => {
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 5 },
        timestamp: new Date(),
      };

      const start = performance.now();
      checkAchievement(event, defaultState);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });

    it('should unlock mastery achievements when threshold reached', () => {
      let state = defaultState;
      
      // Manually unlock 5 achievements
      const achievementIds = ['GS1', 'GS2', 'GS4', 'OP1', 'EN3'];
      for (const id of achievementIds) {
        state = {
          ...state,
          achievements: {
            ...state.achievements,
            [id]: {
              ...state.achievements[id],
              isUnlocked: true,
              unlockedAt: new Date(),
            },
          },
          totalUnlocked: state.totalUnlocked + 1,
        };
      }

      // Check mastery achievement
      const { unlocked } = checkAchievement(
        { type: 'card_added', data: { cardCount: 1 }, timestamp: new Date() },
        state
      );

      expect(unlocked?.id).toBe('MA1');
    });
  });

  // -------------------------------------------------------------------------
  // Storage Tests
  // -------------------------------------------------------------------------

  describe('storage', () => {
    it('should persist achievements to AsyncStorage', async () => {
      await initializeAchievements();
      await track('card_added', { cardCount: 1 });
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should load achievements from AsyncStorage', async () => {
      const mockData = {
        ...createDefaultUserAchievements(null),
        totalUnlocked: 3,
        updatedAt: new Date().toISOString(),
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockData)
      );

      await initializeAchievements();
      const achievements = await getAchievements();

      expect(achievements.totalUnlocked).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Property-Based Tests
  // -------------------------------------------------------------------------

  describe('property tests', () => {
    it('streak should never be negative', () => {
      fc.assert(
        fc.property(
          fc.date(),
          fc.integer({ min: 0, max: 1000 }),
          (currentDate, previousStreak) => {
            const lastVisit = new Date(currentDate);
            lastVisit.setDate(lastVisit.getDate() - fc.sample(fc.integer({ min: 0, max: 30 }), 1)[0]);
            
            const { newStreak } = calculateStreak(
              lastVisit.toISOString().split('T')[0],
              currentDate,
              previousStreak
            );
            
            return newStreak >= 0;
          }
        )
      );
    });

    it('rank should always be 1-6', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (count) => {
          const rank = calculateRank(count);
          return rank.rank >= 1 && rank.rank <= 6;
        })
      );
    });

    it('totalUnlocked should never exceed totalAchievements', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...ACHIEVEMENT_DEFINITIONS.map(a => a.id)), { maxLength: 30 }),
          (eventIds) => {
            let state = createDefaultUserAchievements(null);
            
            for (const id of eventIds) {
              state = {
                ...state,
                achievements: {
                  ...state.achievements,
                  [id]: {
                    ...state.achievements[id],
                    isUnlocked: true,
                    unlockedAt: new Date(),
                  },
                },
              };
            }
            
            const uniqueUnlocked = Object.values(state.achievements)
              .filter(a => a.isUnlocked).length;
            
            return uniqueUnlocked <= ACHIEVEMENT_DEFINITIONS.length;
          }
        )
      );
    });
  });
});
```

### ApplicationTrackerService Tests

```typescript
// src/services/__tests__/ApplicationTrackerService.test.ts

describe('ApplicationTrackerService', () => {
  beforeEach(() => {
    resetApplicationTrackerCache();
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Pure Function Tests
  // -------------------------------------------------------------------------

  describe('countApplicationsInMonths', () => {
    const mockApps: CardApplication[] = [
      createMockApplication('2026-01-01'), // 1.5 months ago
      createMockApplication('2025-12-01'), // 2.5 months ago
      createMockApplication('2025-06-01'), // 8.5 months ago
      createMockApplication('2024-06-01'), // 20.5 months ago
      createMockApplication('2023-06-01'), // 32.5 months ago (outside 24)
    ];

    it('should count applications in last 24 months', () => {
      const count = countApplicationsInMonths(mockApps, 24, new Date('2026-02-14'));
      expect(count).toBe(4); // First 4 are within 24 months
    });

    it('should count applications in last 12 months', () => {
      const count = countApplicationsInMonths(mockApps, 12, new Date('2026-02-14'));
      expect(count).toBe(3); // First 3 are within 12 months
    });

    it('should exclude pending and denied applications', () => {
      const appsWithDenied = [
        ...mockApps,
        { ...createMockApplication('2026-01-15'), status: 'denied' as const },
        { ...createMockApplication('2026-01-20'), status: 'pending' as const },
      ];
      
      const count = countApplicationsInMonths(appsWithDenied, 24, new Date('2026-02-14'));
      expect(count).toBe(4); // Only approved count
    });
  });

  describe('calculateIssuerCooldown', () => {
    it('should return eligible for issuer with no cooldown', () => {
      const apps = [createMockApplication('2026-01-01', 'RBC')];
      const status = calculateIssuerCooldown(apps, 'RBC', new Date('2026-02-14'));
      
      expect(status.isEligible).toBe(true);
      expect(status.daysUntilEligible).toBe(0);
    });

    it('should return not eligible during Amex 90-day cooldown', () => {
      const apps = [createMockApplication('2026-01-01', 'American Express')];
      const status = calculateIssuerCooldown(
        apps, 
        'American Express', 
        new Date('2026-02-14')
      );
      
      expect(status.isEligible).toBe(false);
      expect(status.daysUntilEligible).toBeGreaterThan(0);
      expect(status.daysUntilEligible).toBeLessThanOrEqual(90 - 44);
    });

    it('should return eligible after Amex 90-day cooldown', () => {
      const apps = [createMockApplication('2025-10-01', 'American Express')];
      const status = calculateIssuerCooldown(
        apps, 
        'American Express', 
        new Date('2026-02-14')
      );
      
      expect(status.isEligible).toBe(true);
      expect(status.daysUntilEligible).toBe(0);
    });

    it('should handle Chase 5/24 rule', () => {
      const apps = [
        createMockApplication('2025-01-01', 'TD'),
        createMockApplication('2025-03-01', 'CIBC'),
        createMockApplication('2025-05-01', 'RBC'),
        createMockApplication('2025-07-01', 'BMO'),
        createMockApplication('2025-09-01', 'Scotiabank'),
      ];
      
      const status = calculateIssuerCooldown(apps, 'Chase', new Date('2026-02-14'));
      
      expect(status.isEligible).toBe(false);
      expect(status.applicationCountInPeriod).toBe(5);
    });
  });

  describe('checkCardEligibility', () => {
    it('should return eligible for card with no restrictions', () => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue({
        id: 'rbc-avion',
        name: 'RBC Avion',
        issuer: 'RBC',
      } as any);

      const eligibility = checkCardEligibility('rbc-avion', []);
      
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.reasons).toHaveLength(0);
    });

    it('should return not eligible during cooldown', () => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue({
        id: 'amex-gold',
        name: 'Amex Gold',
        issuer: 'American Express',
      } as any);

      const apps = [createMockApplication('2026-01-15', 'American Express')];
      const eligibility = checkCardEligibility(
        'amex-gold', 
        apps, 
        new Date('2026-02-14')
      );
      
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reasons.length).toBeGreaterThan(0);
      expect(eligibility.daysUntilEligible).toBeGreaterThan(0);
    });

    it('should include welcome bonus warning for repeat applications', () => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockReturnValue({
        id: 'amex-gold',
        name: 'Amex Gold',
        issuer: 'American Express',
      } as any);

      const apps = [
        { ...createMockApplication('2023-01-01', 'American Express'), cardId: 'amex-gold' }
      ];
      const eligibility = checkCardEligibility(
        'amex-gold', 
        apps, 
        new Date('2026-02-14')
      );
      
      expect(eligibility.previousApplications.length).toBe(1);
      expect(eligibility.reasons.some(r => r.includes('lifetime'))).toBe(true);
    });
  });

  describe('generateTimeline', () => {
    it('should include past applications', () => {
      const apps = [createMockApplication('2026-01-01')];
      const timeline = generateTimeline(apps, new Date('2026-02-14'));
      
      const pastEvents = timeline.filter(e => !e.isInFuture);
      expect(pastEvents.length).toBeGreaterThan(0);
      expect(pastEvents[0].type).toBe('application');
    });

    it('should include future falloff dates', () => {
      const apps = [createMockApplication('2026-01-01')];
      const timeline = generateTimeline(apps, new Date('2026-02-14'));
      
      const futureEvents = timeline.filter(e => e.isInFuture);
      expect(futureEvents.some(e => e.type === 'falloff')).toBe(true);
    });

    it('should be sorted chronologically', () => {
      const apps = [
        createMockApplication('2026-01-01'),
        createMockApplication('2025-06-01'),
        createMockApplication('2025-12-01'),
      ];
      const timeline = generateTimeline(apps, new Date('2026-02-14'));
      
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].date.getTime()).toBeGreaterThanOrEqual(
          timeline[i - 1].date.getTime()
        );
      }
    });
  });

  describe('generateStrategy', () => {
    beforeEach(() => {
      jest.spyOn(CardDataService, 'getCardByIdSync').mockImplementation((id) => ({
        id,
        name: `Test Card ${id}`,
        issuer: id.includes('amex') ? 'American Express' : 
                id.includes('chase') ? 'Chase' : 'TD',
      } as any));
    });

    it('should recommend apply now for eligible cards', () => {
      const wanted: WantedCard[] = [
        { cardId: 'td-aeroplan', cardName: 'TD Aeroplan', issuer: 'TD', priority: 'high', addedAt: new Date() },
      ];
      
      const strategy = generateStrategy(wanted, [], new Date('2026-02-14'));
      
      expect(strategy.advice[0].recommendation).toBe('apply_now');
    });

    it('should recommend wait for cards in cooldown', () => {
      const wanted: WantedCard[] = [
        { cardId: 'amex-gold', cardName: 'Amex Gold', issuer: 'American Express', priority: 'high', addedAt: new Date() },
      ];
      const apps = [createMockApplication('2026-01-15', 'American Express')];
      
      const strategy = generateStrategy(wanted, apps, new Date('2026-02-14'));
      
      expect(strategy.advice[0].recommendation).toBe('wait');
      expect(strategy.advice[0].suggestedDate).toBeDefined();
    });

    it('should warn about 5/24 impact', () => {
      const wanted: WantedCard[] = [
        { cardId: 'chase-sapphire', cardName: 'Chase Sapphire', issuer: 'Chase', priority: 'high', addedAt: new Date() },
        { cardId: 'td-aeroplan', cardName: 'TD Aeroplan', issuer: 'TD', priority: 'medium', addedAt: new Date() },
      ];
      const apps = [
        createMockApplication('2025-06-01', 'Bank A'),
        createMockApplication('2025-08-01', 'Bank B'),
        createMockApplication('2025-10-01', 'Bank C'),
        createMockApplication('2025-12-01', 'Bank D'),
      ];
      
      const strategy = generateStrategy(wanted, apps, new Date('2026-02-14'));
      
      expect(strategy.warnings.length).toBeGreaterThan(0);
      expect(strategy.warnings.some(w => w.includes('5/24') || w.includes('Chase'))).toBe(true);
    });

    it('should prioritize Chase cards before hitting 5/24', () => {
      const wanted: WantedCard[] = [
        { cardId: 'td-aeroplan', cardName: 'TD Aeroplan', issuer: 'TD', priority: 'high', addedAt: new Date() },
        { cardId: 'chase-sapphire', cardName: 'Chase Sapphire', issuer: 'Chase', priority: 'high', addedAt: new Date() },
      ];
      const apps = [
        createMockApplication('2025-06-01', 'Bank A'),
        createMockApplication('2025-08-01', 'Bank B'),
        createMockApplication('2025-10-01', 'Bank C'),
      ];
      
      const strategy = generateStrategy(wanted, apps, new Date('2026-02-14'));
      
      // Chase should have lower priority number (apply first)
      const chaseAdvice = strategy.advice.find(a => a.cardId === 'chase-sapphire');
      const tdAdvice = strategy.advice.find(a => a.cardId === 'td-aeroplan');
      
      expect(chaseAdvice!.priority).toBeLessThanOrEqual(tdAdvice!.priority);
    });
  });

  describe('generateAlerts', () => {
    it('should alert when at 4/24', () => {
      const apps = [
        createMockApplication('2025-06-01'),
        createMockApplication('2025-08-01'),
        createMockApplication('2025-10-01'),
        createMockApplication('2025-12-01'),
      ];
      
      const alerts = generateAlerts(apps, new Date('2026-02-14'));
      
      expect(alerts.some(a => a.type === 'approaching_limit')).toBe(true);
    });

    it('should alert for upcoming falloffs', () => {
      const apps = [
        { ...createMockApplication('2024-03-01'), fallOffDate: new Date('2026-03-01') },
      ];
      
      const alerts = generateAlerts(apps, new Date('2026-02-14'));
      
      expect(alerts.some(a => a.type === 'falloff_soon')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Property-Based Tests
  // -------------------------------------------------------------------------

  describe('property tests', () => {
    it('falloff date should always be 24 months after application', () => {
      fc.assert(
        fc.property(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }), (appDate) => {
          const falloff = calculateFallOffDate(appDate);
          const diffMonths = (falloff.getFullYear() - appDate.getFullYear()) * 12 +
            (falloff.getMonth() - appDate.getMonth());
          return diffMonths === 24;
        })
      );
    });

    it('24-month count should never exceed total applications', () => {
      fc.assert(
        fc.property(
          fc.array(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }), { maxLength: 20 }),
          (dates) => {
            const apps = dates.map(d => createMockApplication(d.toISOString().split('T')[0]));
            const count = countApplicationsInMonths(apps, 24);
            return count <= apps.length;
          }
        )
      );
    });

    it('eligible date should always be in the future when not eligible', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2026-06-01') }),
          fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }),
          (appDate, refDate) => {
            if (appDate >= refDate) return true; // Skip invalid cases
            
            const apps = [createMockApplication(appDate.toISOString().split('T')[0], 'American Express')];
            const status = calculateIssuerCooldown(apps, 'American Express', refDate);
            
            if (!status.isEligible && status.nextEligibleDate) {
              return status.nextEligibleDate > refDate;
            }
            return true;
          }
        )
      );
    });
  });
});

// Helper function
function createMockApplication(
  dateStr: string,
  issuer: string = 'TD'
): CardApplication {
  const date = new Date(dateStr);
  return {
    id: `app-${Date.now()}-${Math.random()}`,
    cardId: 'test-card',
    cardName: 'Test Card',
    issuer,
    applicationDate: date,
    status: 'approved',
    fallOffDate: calculateFallOffDate(date),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
```

---

## Build Order

### Dependency Graph

```
                    ┌───────────────────────────┐
                    │  AchievementEventEmitter  │  ← Build First (no deps)
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   │
┌─────────────────────┐  ┌─────────────────────┐     │
│  AchievementService │  │ApplicationTracker-  │     │
│                     │  │      Service        │     │
└─────────────┬───────┘  └─────────────┬───────┘     │
              │                        │              │
              │                        │              │
              ▼                        ▼              │
┌─────────────────────┐  ┌─────────────────────┐     │
│  UnlockToast +      │  │  Tracker Components │     │
│  Achievement Comps  │  │  (Gauge, Timeline)  │     │
└─────────────┬───────┘  └─────────────┬───────┘     │
              │                        │              │
              ▼                        ▼              │
┌─────────────────────┐  ┌─────────────────────┐     │
│ AchievementsScreen  │  │ApplicationTracker-  │     │
│                     │  │      Screen         │     │
└─────────────────────┘  └─────────────────────┘     │
                                                      │
                    ┌─────────────────────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  Integration:    │
          │  Wire track()    │
          │  into existing   │
          │  services        │
          └──────────────────┘
```

### Implementation Phases

#### Phase 1: Foundation (Day 1-2)
1. **Types**: Add all new types to `src/types/index.ts`
2. **AchievementEventEmitter**: Implement singleton + tests
3. **Database migration**: Run achievements + applications migration

#### Phase 2: Achievement Service - F15 (Day 3-4)
1. **AchievementService**: Implement + pure function tests
2. **Achievement definitions**: All 23 achievements
3. **Rank system**: 6 ranks implementation
4. **Streak calculation**: Consecutive day logic
5. **Storage**: AsyncStorage + Supabase sync

#### Phase 3: Achievement UI (Day 5-6)
1. **AchievementCard component**: Single achievement display
2. **AchievementGrid component**: Grid layout by category
3. **UnlockToast component**: Animated unlock notification
4. **UnlockToastProvider**: Global toast manager
5. **AchievementsScreen**: Full trophy case UI
6. **RankBadge component**: Profile integration

#### Phase 4: Application Tracker Service - F16 (Day 7-8)
1. **ApplicationTrackerService**: Core implementation
2. **Issuer rules engine**: 8 Canadian + Chase rules
3. **Eligibility checker**: Per-card eligibility
4. **Strategy advisor**: Application timing recommendations
5. **Timeline generator**: Past + future events
6. **Storage**: AsyncStorage + Supabase sync

#### Phase 5: Application Tracker UI (Day 9-10)
1. **FiveTwentyFourGauge component**: Visual gauge
2. **IssuerCooldownCard component**: Issuer status
3. **ApplicationCard component**: Application display
4. **TimelineView component**: Timeline visualization
5. **ApplicationTrackerScreen**: Full tracker UI
6. **AddApplicationScreen**: Add form
7. **ApplicationStrategyScreen**: Strategy advisor (Pro+)

#### Phase 6: Integration (Day 11-12)
1. **Wire track() calls**: CardPortfolioManager, SpendingProfileService, etc.
2. **Navigation integration**: Track screen visits
3. **App.tsx integration**: Initialize services, track app opens
4. **Home screen integration**: Rank badge, streak display
5. **Tier gating**: Implement paywalls
6. **E2E testing**: Full user journeys

### Task Checklist

```
□ Phase 1: Foundation
  □ Add types to src/types/index.ts
  □ Create AchievementEventEmitter.ts
  □ Write AchievementEventEmitter tests (7 tests)
  □ Create database migration

□ Phase 2: Achievement Service (F15)
  □ Create AchievementService.ts
  □ Implement 23 achievement definitions
  □ Implement rank calculation
  □ Implement streak calculation
  □ Write AchievementService tests (38 tests)

□ Phase 3: Achievement UI
  □ Create AchievementCard component
  □ Create AchievementGrid component
  □ Create UnlockToast component
  □ Create UnlockToastProvider
  □ Create StreakDisplay component
  □ Create RankBadge component
  □ Create AchievementsScreen
  □ Write component tests (5 tests)

□ Phase 4: Application Tracker Service (F16)
  □ Create ApplicationTrackerService.ts
  □ Implement issuer rules (8 Canadian + Chase)
  □ Implement eligibility checker
  □ Implement strategy advisor
  □ Implement timeline generator
  □ Write ApplicationTrackerService tests (45 tests)

□ Phase 5: Application Tracker UI
  □ Create FiveTwentyFourGauge component
  □ Create IssuerCooldownCard component
  □ Create ApplicationCard component
  □ Create TimelineView component
  □ Create ApplicationTrackerScreen
  □ Create AddApplicationScreen
  □ Create ApplicationStrategyScreen (Pro+)

□ Phase 6: Integration
  □ Wire track() into CardPortfolioManager
  □ Wire track() into SpendingProfileService
  □ Wire track() into WalletOptimizerService
  □ Wire track() into FeeBreakevenService
  □ Wire track() into SignupBonusService
  □ Wire track() into StatementParserService
  □ Wire track() into InsightsService
  □ Add screen visit tracking to navigation
  □ Add app open tracking to App.tsx
  □ Add RankBadge to HomeScreen
  □ Implement tier gating
  □ Update app navigation
  □ Write integration tests
```

---

## Performance Considerations

### Achievement Check Performance Budget

| Operation | Target | Notes |
|-----------|--------|-------|
| Event emission | < 1 ms | Fire-and-forget via setImmediate |
| Achievement check | < 5 ms | Pure function, no I/O |
| State update | < 1 ms | In-memory only |
| Persist to storage | async | Non-blocking |
| Total sync path | < 6 ms | Event → check → UI update |

### Optimization Techniques

1. **Event emission is async**: `setImmediate()` prevents blocking the caller
2. **Pure check function**: No async operations in `checkAchievement()`
3. **Early exit**: Stop checking once an achievement is unlocked
4. **Minimal state cloning**: Only clone modified portions
5. **Debounced persistence**: Batch writes to AsyncStorage

### Memory Optimization

1. **Achievement definitions are static**: Not stored per-user
2. **Progress stored as numbers**: Minimal memory footprint
3. **Screens visited as string array**: Deduped automatically
4. **No event history**: Events are processed and discarded

### Application Tracker Performance

1. **Issuer rules are static**: Loaded once, no DB queries
2. **Timeline generated on-demand**: Not stored
3. **Strategy computed lazily**: Only when user requests
4. **Falloff dates computed once**: Stored with application

---

## Summary

This architecture document provides everything needed to implement Cycle 5's Achievements & 5/24 Tracker:

- **95+ tests** across 2 new services
- **Event-driven design** for decoupled achievement tracking
- **< 5ms check performance** via pure functions
- **Offline-first** storage with Supabase sync
- **8 Canadian issuer rules** + Chase 5/24
- **Clear tier gating** for monetization
- **Detailed build order** with dependencies mapped
- **Animation strategy** for achievement unlocks

The dev agent should be able to build this with zero clarification. Start with Phase 1 (EventEmitter + Types), validate tests pass, then proceed phase by phase.

---

*Architecture document complete. Ready for implementation.*
