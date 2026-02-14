/**
 * AchievementService Tests
 * Target: ~38 tests covering all achievement logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACHIEVEMENT_DEFINITIONS,
  RANK_DEFINITIONS,
  calculateRank,
  calculateStreak,
  checkAllScreensVisited,
  getAchievementDefinition,
  createDefaultUserAchievements,
  checkAchievement,
  getAchievements,
  getAchievementsSync,
  getAchievementDefinitions,
  getAchievementsByCategory,
  getRankDefinitions,
  track,
  onAchievementUnlock,
  resetAchievements,
  resetAchievementsCache,
  initializeAchievements,
} from '../AchievementService';
import { AchievementEventEmitter } from '../AchievementEventEmitter';
import {
  UserAchievements,
  AchievementEvent,
  AchievementCategory,
} from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

// Mock AuthService
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn(() => null),
}));

describe('AchievementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAchievementsCache();
    AchievementEventEmitter.reset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetAchievementsCache();
    AchievementEventEmitter.reset();
  });

  // ============================================================================
  // Achievement Definitions
  // ============================================================================

  describe('Achievement Definitions', () => {
    it('should have 23 total achievements', () => {
      expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(23);
    });

    it('should have correct achievement distribution', () => {
      const byCategory = {
        getting_started: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'getting_started').length,
        optimization: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'optimization').length,
        data_insights: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'data_insights').length,
        engagement: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'engagement').length,
        mastery: ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'mastery').length,
      };

      expect(byCategory.getting_started).toBe(5);
      expect(byCategory.optimization).toBe(5);
      expect(byCategory.data_insights).toBe(5);
      expect(byCategory.engagement).toBe(5);
      expect(byCategory.mastery).toBe(3);
    });

    it('should have unique achievement IDs', () => {
      const ids = ACHIEVEMENT_DEFINITIONS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have emoji icons for all achievements', () => {
      ACHIEVEMENT_DEFINITIONS.forEach(a => {
        expect(a.icon).toBeTruthy();
        expect(typeof a.icon).toBe('string');
      });
    });

    it('should have progress targets for all achievements', () => {
      ACHIEVEMENT_DEFINITIONS.forEach(a => {
        expect(a.progressTarget).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Rank System
  // ============================================================================

  describe('Rank Definitions', () => {
    it('should have 6 rank tiers', () => {
      expect(RANK_DEFINITIONS).toHaveLength(6);
    });

    it('should have correct rank progression', () => {
      expect(RANK_DEFINITIONS[0].title).toBe('Beginner');
      expect(RANK_DEFINITIONS[1].title).toBe('Card Curious');
      expect(RANK_DEFINITIONS[2].title).toBe('Rewards Explorer');
      expect(RANK_DEFINITIONS[3].title).toBe('Optimization Adept');
      expect(RANK_DEFINITIONS[4].title).toBe('Rewards Expert');
      expect(RANK_DEFINITIONS[5].title).toBe('Rewards Master');
    });

    it('should have emoji for each rank', () => {
      RANK_DEFINITIONS.forEach(r => {
        expect(r.emoji).toBeTruthy();
      });
    });

    it('should calculate rank correctly', () => {
      expect(calculateRank(0).rank).toBe(1);
      expect(calculateRank(0).title).toBe('Beginner');

      expect(calculateRank(3).rank).toBe(2);
      expect(calculateRank(3).title).toBe('Card Curious');

      expect(calculateRank(6).rank).toBe(3);
      expect(calculateRank(6).title).toBe('Rewards Explorer');

      expect(calculateRank(11).rank).toBe(4);
      expect(calculateRank(11).title).toBe('Optimization Adept');

      expect(calculateRank(16).rank).toBe(5);
      expect(calculateRank(16).title).toBe('Rewards Expert');

      expect(calculateRank(21).rank).toBe(6);
      expect(calculateRank(21).title).toBe('Rewards Master');
    });

    it('should handle edge cases for rank calculation', () => {
      expect(calculateRank(5).rank).toBe(2);
      expect(calculateRank(10).rank).toBe(3);
      expect(calculateRank(23).rank).toBe(6);
      expect(calculateRank(100).rank).toBe(6); // Max rank
    });
  });

  // ============================================================================
  // Streak Calculation
  // ============================================================================

  describe('Streak Calculation', () => {
    it('should initialize streak on first visit', () => {
      const result = calculateStreak(null, new Date(), 0);
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });

    it('should maintain streak on same day', () => {
      const today = new Date('2026-02-14T10:00:00');
      const lastVisit = '2026-02-14';
      const result = calculateStreak(lastVisit, today, 5);
      expect(result.newStreak).toBe(5);
      expect(result.isNewDay).toBe(false);
    });

    it('should increment streak on consecutive day', () => {
      const today = new Date('2026-02-15T10:00:00');
      const lastVisit = '2026-02-14';
      const result = calculateStreak(lastVisit, today, 5);
      expect(result.newStreak).toBe(6);
      expect(result.isNewDay).toBe(true);
    });

    it('should reset streak when missed a day', () => {
      const today = new Date('2026-02-16T10:00:00');
      const lastVisit = '2026-02-14'; // Missed Feb 15
      const result = calculateStreak(lastVisit, today, 7);
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });

    it('should handle long gaps correctly', () => {
      const today = new Date('2026-03-01T10:00:00');
      const lastVisit = '2026-02-01';
      const result = calculateStreak(lastVisit, today, 10);
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });
  });

  // ============================================================================
  // Pure Helper Functions
  // ============================================================================

  describe('checkAllScreensVisited', () => {
    it('should return false when no screens visited', () => {
      expect(checkAllScreensVisited([])).toBe(false);
    });

    it('should return false when some screens visited', () => {
      expect(checkAllScreensVisited(['Home', 'MyCards'])).toBe(false);
    });

    it('should return true when all main screens visited', () => {
      const allScreens = ['Home', 'Insights', 'Sage', 'SmartWallet', 'MyCards', 'Settings'];
      expect(checkAllScreensVisited(allScreens)).toBe(true);
    });

    it('should return true with extra screens visited', () => {
      const screens = ['Home', 'Insights', 'Sage', 'SmartWallet', 'MyCards', 'Settings', 'CardTracker'];
      expect(checkAllScreensVisited(screens)).toBe(true);
    });
  });

  describe('getAchievementDefinition', () => {
    it('should find achievement by ID', () => {
      const achievement = getAchievementDefinition('GS1');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('First Card');
    });

    it('should return undefined for invalid ID', () => {
      const achievement = getAchievementDefinition('INVALID');
      expect(achievement).toBeUndefined();
    });
  });

  // ============================================================================
  // Default User Achievements
  // ============================================================================

  describe('createDefaultUserAchievements', () => {
    it('should create default achievements with all locked', () => {
      const defaults = createDefaultUserAchievements(null);
      
      expect(defaults.totalUnlocked).toBe(0);
      expect(defaults.totalAchievements).toBe(23);
      expect(defaults.rank).toBe(1);
      expect(defaults.rankTitle).toBe('Beginner');
      expect(defaults.currentStreak).toBe(0);
      expect(defaults.longestStreak).toBe(0);
    });

    it('should initialize all achievements as locked', () => {
      const defaults = createDefaultUserAchievements(null);
      
      Object.values(defaults.achievements).forEach(progress => {
        expect(progress.isUnlocked).toBe(false);
        expect(progress.progress).toBe(0);
        expect(progress.percentComplete).toBe(0);
      });
    });

    it('should set correct progress targets', () => {
      const defaults = createDefaultUserAchievements(null);
      
      expect(defaults.achievements['GS1'].progressTarget).toBe(1);
      expect(defaults.achievements['GS2'].progressTarget).toBe(3);
      expect(defaults.achievements['GS3'].progressTarget).toBe(5);
      expect(defaults.achievements['EN1'].progressTarget).toBe(7);
      expect(defaults.achievements['EN2'].progressTarget).toBe(30);
    });
  });

  // ============================================================================
  // Achievement Unlock Logic
  // ============================================================================

  describe('checkAchievement - Card Added', () => {
    it('should unlock GS1 on first card', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 1 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked).toBeDefined();
      expect(result.unlocked?.id).toBe('GS1');
      expect(result.updatedState.achievements['GS1'].isUnlocked).toBe(true);
      expect(result.updatedState.totalUnlocked).toBe(1);
    });

    it('should unlock GS2 on 3 cards', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 3 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('GS2');
      expect(result.updatedState.achievements['GS2'].isUnlocked).toBe(true);
    });

    it('should unlock GS3 on 5 cards', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 5 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('GS3');
    });

    it('should update progress without unlocking', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 2 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.updatedState.achievements['GS2'].progress).toBe(2);
      expect(result.updatedState.achievements['GS2'].percentComplete).toBe(66.66666666666666);
      expect(result.updatedState.achievements['GS2'].isUnlocked).toBe(false);
    });
  });

  describe('checkAchievement - Other Events', () => {
    it('should unlock GS4 on spending profile saved', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'spending_profile_saved',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('GS4');
    });

    it('should unlock GS5 on first sage chat', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'sage_chat',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('GS5');
      expect(result.updatedState.sageChatsCount).toBe(1);
    });

    it('should unlock OP1 on wallet optimizer used', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'wallet_optimizer_used',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('OP1');
    });

    it('should unlock OP2 on fee breakeven viewed', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'fee_breakeven_viewed',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('OP2');
    });

    it('should unlock OP3 on signup ROI viewed', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'signup_roi_viewed',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('OP3');
    });

    it('should unlock OP4 on gaps found', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'gaps_found',
        data: { gapsCount: 1 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('OP4');
    });

    it('should unlock OP5 on 90+ optimization score', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'optimization_score_calculated',
        data: { optimizationScore: 92 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('OP5');
    });

    it('should not unlock OP5 on low optimization score', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'optimization_score_calculated',
        data: { optimizationScore: 75 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked).toBeNull();
    });
  });

  describe('checkAchievement - Statements', () => {
    it('should unlock DI1 on first statement upload', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'statement_uploaded',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('DI1');
      expect(result.updatedState.statementsUploaded).toBe(1);
    });

    it('should unlock DI2 on 3 statement uploads', () => {
      const state = createDefaultUserAchievements(null);
      state.statementsUploaded = 2;
      
      const event: AchievementEvent = {
        type: 'statement_uploaded',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('DI2');
      expect(result.updatedState.statementsUploaded).toBe(3);
    });
  });

  describe('checkAchievement - Insights', () => {
    it('should unlock DI3 on insights viewed', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'insights_viewed',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('DI3');
    });

    it('should unlock DI4 on $100+ money left on table', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'money_left_on_table_calculated',
        data: { moneyLeftOnTable: 150 },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('DI4');
    });

    it('should unlock DI5 on trends viewed', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'trends_viewed',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('DI5');
    });
  });

  describe('checkAchievement - Engagement', () => {
    it('should unlock EN1 on 7-day streak', () => {
      const state = createDefaultUserAchievements(null);
      state.currentStreak = 6;
      state.lastVisitDate = '2026-02-13';
      
      const event: AchievementEvent = {
        type: 'app_opened',
        timestamp: new Date('2026-02-14T10:00:00'),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('EN1');
      expect(result.updatedState.currentStreak).toBe(7);
    });

    it('should unlock EN2 on 30-day streak', () => {
      const state = createDefaultUserAchievements(null);
      state.currentStreak = 29;
      state.lastVisitDate = '2026-02-13';
      
      const event: AchievementEvent = {
        type: 'app_opened',
        timestamp: new Date('2026-02-14T10:00:00'),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('EN2');
      expect(result.updatedState.currentStreak).toBe(30);
    });

    it('should unlock EN3 on card comparison', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'card_comparison_viewed',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('EN3');
      expect(result.updatedState.comparisonsCount).toBe(1);
    });

    it('should unlock EN4 when all screens visited', () => {
      const state = createDefaultUserAchievements(null);
      state.screensVisited = ['Home', 'Insights', 'Sage', 'SmartWallet', 'MyCards'];
      
      const event: AchievementEvent = {
        type: 'screen_visited',
        data: { screenName: 'Settings' },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('EN4');
      expect(result.updatedState.screensVisited).toContain('Settings');
    });

    it('should unlock EN5 on 10 different card benefits viewed', () => {
      const state = createDefaultUserAchievements(null);
      state.cardBenefitsViewed = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6', 'card7', 'card8', 'card9'];
      
      const event: AchievementEvent = {
        type: 'card_benefits_viewed',
        data: { cardId: 'card10' },
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.unlocked?.id).toBe('EN5');
      expect(result.updatedState.cardBenefitsViewed).toHaveLength(10);
    });
  });

  describe('checkAchievement - Mastery', () => {
    it('should unlock MA1 on 5 achievements', () => {
      const state = createDefaultUserAchievements(null);
      // Simulate 4 previous achievements unlocked
      state.totalUnlocked = 4;
      state.achievements['GS1'].isUnlocked = true;
      state.achievements['GS2'].isUnlocked = true;
      state.achievements['GS3'].isUnlocked = true;
      state.achievements['OP1'].isUnlocked = true;
      
      const event: AchievementEvent = {
        type: 'spending_profile_saved',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      // Should unlock GS4 (making it 5 total), which triggers MA1 unlock (making it 6 total)
      expect(result.updatedState.achievements['GS4'].isUnlocked).toBe(true);
      expect(result.updatedState.achievements['MA1'].isUnlocked).toBe(true);
      expect(result.updatedState.totalUnlocked).toBe(6); // 4 + GS4 + MA1
    });

    it('should update rank when achievements increase', () => {
      const state = createDefaultUserAchievements(null);
      state.totalUnlocked = 2;
      
      const event: AchievementEvent = {
        type: 'spending_profile_saved',
        timestamp: new Date(),
      };
      
      const result = checkAchievement(event, state);
      
      expect(result.updatedState.totalUnlocked).toBe(3);
      expect(result.updatedState.rank).toBe(2);
      expect(result.updatedState.rankTitle).toBe('Card Curious');
    });
  });

  // ============================================================================
  // Public API
  // ============================================================================

  describe('getAchievementDefinitions', () => {
    it('should return all 23 achievement definitions', () => {
      const defs = getAchievementDefinitions();
      expect(defs).toHaveLength(23);
    });

    it('should return a copy (not reference)', () => {
      const defs1 = getAchievementDefinitions();
      const defs2 = getAchievementDefinitions();
      expect(defs1).not.toBe(defs2);
      expect(defs1).toEqual(defs2);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return getting_started achievements', () => {
      const achievements = getAchievementsByCategory('getting_started');
      expect(achievements).toHaveLength(5);
      expect(achievements.every(a => a.category === 'getting_started')).toBe(true);
    });

    it('should return optimization achievements', () => {
      const achievements = getAchievementsByCategory('optimization');
      expect(achievements).toHaveLength(5);
    });

    it('should return data_insights achievements', () => {
      const achievements = getAchievementsByCategory('data_insights');
      expect(achievements).toHaveLength(5);
    });

    it('should return engagement achievements', () => {
      const achievements = getAchievementsByCategory('engagement');
      expect(achievements).toHaveLength(5);
    });

    it('should return mastery achievements', () => {
      const achievements = getAchievementsByCategory('mastery');
      expect(achievements).toHaveLength(3);
    });
  });

  describe('getRankDefinitions', () => {
    it('should return all 6 rank definitions', () => {
      const ranks = getRankDefinitions();
      expect(ranks).toHaveLength(6);
    });

    it('should return a copy', () => {
      const ranks1 = getRankDefinitions();
      const ranks2 = getRankDefinitions();
      expect(ranks1).not.toBe(ranks2);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default achievements when no storage', async () => {
      await initializeAchievements();
      const achievements = getAchievementsSync();
      
      expect(achievements).not.toBeNull();
      expect(achievements?.totalUnlocked).toBe(0);
      expect(achievements?.totalAchievements).toBe(23);
    });

    it('should load from storage when available', async () => {
      const storedData = createDefaultUserAchievements('user123');
      storedData.totalUnlocked = 5;
      storedData.achievements['GS1'].isUnlocked = true;
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          ...storedData,
          updatedAt: storedData.updatedAt.toISOString(),
          achievements: Object.fromEntries(
            Object.entries(storedData.achievements).map(([id, progress]) => [
              id,
              {
                ...progress,
                unlockedAt: progress.unlockedAt?.toISOString(),
              },
            ])
          ),
        })
      );
      
      resetAchievementsCache();
      await initializeAchievements();
      const achievements = getAchievementsSync();
      
      expect(achievements?.totalUnlocked).toBe(5);
      expect(achievements?.achievements['GS1'].isUnlocked).toBe(true);
    });
  });

  describe('Event-Driven Tracking', () => {
    it('should track events via track() function', (done) => {
      const callback = jest.fn();
      AchievementEventEmitter.onEvent(callback);
      
      track('card_added', { cardCount: 1 });
      
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('Performance', () => {
    it('should check achievements in < 5ms', () => {
      const state = createDefaultUserAchievements(null);
      const event: AchievementEvent = {
        type: 'card_added',
        data: { cardCount: 3 },
        timestamp: new Date(),
      };
      
      const start = Date.now();
      checkAchievement(event, state);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(5);
    });
  });
});
