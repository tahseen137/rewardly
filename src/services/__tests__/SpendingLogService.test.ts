/**
 * SpendingLogService - Unit Tests
 * 
 * Tests spending log CRUD, rewards calculation, tier limits, and filters
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeSpendingLog,
  getSpendingEntries,
  getEntryLimitForTier,
  getSpendingSummary,
  addSpendingEntry,
  updateSpendingEntry,
  deleteSpendingEntry,
  calculateOptimalCard,
  calculateRewards,
  resetSpendingCache,
} from '../SpendingLogService';
import { SpendingEntry, SpendingCategory, Card, RewardType } from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn().mockResolvedValue(null),
}));
jest.mock('../SubscriptionService', () => ({
  getCurrentTierSync: jest.fn(() => 'free'),
}));
jest.mock('../CardDataService', () => ({
  getCardByIdSync: jest.fn(),
}));
jest.mock('../RewardsCalculatorService', () => ({
  calculateReward: jest.fn((card, category, amount) => {
    const categoryReward = card.categoryRewards.find((cr: any) => cr.category === category);
    const rate = categoryReward ? categoryReward.rewardRate.value : card.baseRewardRate.value;
    return (amount * rate) / 100;
  }),
}));
jest.mock('../BestCardRecommendationService', () => ({
  getBestCardForCategory: jest.fn(() => ({ card: mockCard1 })),
}));

import { getCurrentTierSync } from '../SubscriptionService';
import { getCardByIdSync } from '../CardDataService';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetCurrentTierSync = getCurrentTierSync as jest.MockedFunction<typeof getCurrentTierSync>;
const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;

// ============================================================================
// Test Data
// ============================================================================

const mockCard1: Card = {
  id: 'card-1',
  name: 'Groceries King',
  issuer: 'Bank A',
  rewardProgram: 'Points',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.GROCERIES, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
};

const mockCard2: Card = {
  id: 'card-2',
  name: 'Dining Expert',
  issuer: 'Bank B',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [
    { category: SpendingCategory.DINING, rewardRate: { value: 4, type: RewardType.CASHBACK, unit: 'percent' } },
  ],
};

const mockEntryInput: Omit<SpendingEntry, 'id' | 'userId' | 'optimalCard' | 'rewardsEarned' | 'rewardsMissed' | 'createdAt' | 'updatedAt'> = {
  amount: 100,
  category: SpendingCategory.GROCERIES,
  storeName: 'Walmart',
  cardUsed: 'card-1',
  transactionDate: new Date('2026-02-01'),
  notes: 'Weekly groceries',
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  resetSpendingCache();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue();
  
  mockGetCardByIdSync.mockImplementation((id: string) => {
    if (id === 'card-1') return mockCard1;
    if (id === 'card-2') return mockCard2;
    return null;
  });
});

// ============================================================================
// Initialization Tests
// ============================================================================

describe('SpendingLogService - Initialization', () => {
  it('should initialize with empty cache', async () => {
    await initializeSpendingLog();
    const entries = await getSpendingEntries();
    expect(entries).toEqual([]);
  });

  it('should load cached data from AsyncStorage', async () => {
    const stored = [{
      ...mockEntryInput,
      id: 'entry-1',
      userId: 'user-1',
      optimalCard: 'card-1',
      rewardsEarned: 5,
      rewardsMissed: 0,
      transactionDate: mockEntryInput.transactionDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    
    await initializeSpendingLog();
    const entries = await getSpendingEntries();
    
    expect(entries).toHaveLength(1);
  });

  it('should handle initialization errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
    
    await initializeSpendingLog();
    const entries = await getSpendingEntries();
    
    expect(entries).toEqual([]);
  });

  it('should only initialize once', async () => {
    await initializeSpendingLog();
    await initializeSpendingLog();
    await initializeSpendingLog();
    
    expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Tier Limits Tests
// ============================================================================

describe('SpendingLogService - Tier Limits', () => {
  it('should limit free tier to 10 entries', () => {
    expect(getEntryLimitForTier('free')).toBe(10);
  });

  it('should allow unlimited entries for pro tier', () => {
    expect(getEntryLimitForTier('pro')).toBe(Infinity);
  });

  it('should allow unlimited entries for max tier', () => {
    expect(getEntryLimitForTier('max')).toBe(Infinity);
  });

  it('should allow unlimited entries for admin tier', () => {
    expect(getEntryLimitForTier('admin')).toBe(Infinity);
  });

  it('should enforce free tier limit when fetching entries', async () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    
    // Add 15 entries
    for (let i = 0; i < 15; i++) {
      await addSpendingEntry({
        ...mockEntryInput,
        amount: 100 + i,
      });
    }
    
    const entries = await getSpendingEntries();
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('should return all entries for pro tier', async () => {
    mockGetCurrentTierSync.mockReturnValue('pro');
    
    // Add 15 entries
    for (let i = 0; i < 15; i++) {
      await addSpendingEntry({
        ...mockEntryInput,
        amount: 100 + i,
      });
    }
    
    const entries = await getSpendingEntries();
    expect(entries).toHaveLength(15);
  });
});

// ============================================================================
// CRUD Operations
// ============================================================================

describe('SpendingLogService - CRUD Operations', () => {
  describe('addSpendingEntry', () => {
    it('should add a new spending entry', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      expect(entry.id).toBeTruthy();
      expect(entry.amount).toBe(mockEntryInput.amount);
      expect(entry.category).toBe(mockEntryInput.category);
    });

    it('should calculate rewards earned', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      // card-1 has 5x on groceries, so $100 * 5% = $5
      expect(entry.rewardsEarned).toBe(5);
    });

    it('should calculate optimal card and missed rewards', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      expect(entry.optimalCard).toBeTruthy();
      expect(entry.rewardsMissed).toBeGreaterThanOrEqual(0);
    });

    it('should set timestamps automatically', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it('should persist to AsyncStorage', async () => {
      await addSpendingEntry(mockEntryInput);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should generate unique IDs', async () => {
      const entry1 = await addSpendingEntry(mockEntryInput);
      const entry2 = await addSpendingEntry(mockEntryInput);
      
      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('updateSpendingEntry', () => {
    it('should update an existing entry', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      const updated = await updateSpendingEntry(entry.id, {
        amount: 150,
      });
      
      expect(updated.amount).toBe(150);
    });

    it('should recalculate rewards when amount changes', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      const originalRewards = entry.rewardsEarned;
      
      const updated = await updateSpendingEntry(entry.id, {
        amount: 200,
      });
      
      expect(updated.rewardsEarned).not.toBe(originalRewards);
      expect(updated.rewardsEarned).toBe(10); // $200 * 5% = $10
    });

    it('should recalculate rewards when category changes', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      const updated = await updateSpendingEntry(entry.id, {
        category: SpendingCategory.DINING,
      });
      
      expect(updated.rewardsEarned).not.toBe(entry.rewardsEarned);
    });

    it('should recalculate rewards when card changes', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      const updated = await updateSpendingEntry(entry.id, {
        cardUsed: 'card-2',
      });
      
      expect(updated.rewardsEarned).not.toBe(entry.rewardsEarned);
    });

    it('should update timestamp', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      const originalUpdatedAt = entry.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await updateSpendingEntry(entry.id, {
        amount: 150,
      });
      
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should throw error when entry not found', async () => {
      await expect(
        updateSpendingEntry('non-existent', { amount: 100 })
      ).rejects.toThrow('Entry non-existent not found');
    });
  });

  describe('deleteSpendingEntry', () => {
    it('should delete an entry', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      await deleteSpendingEntry(entry.id);
      
      const entries = await getSpendingEntries(undefined, Infinity);
      expect(entries.find(e => e.id === entry.id)).toBeUndefined();
    });

    it('should persist deletion to AsyncStorage', async () => {
      const entry = await addSpendingEntry(mockEntryInput);
      
      mockAsyncStorage.setItem.mockClear();
      await deleteSpendingEntry(entry.id);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle deleting non-existent entry gracefully', async () => {
      await expect(deleteSpendingEntry('non-existent')).resolves.not.toThrow();
    });
  });
});

// ============================================================================
// Filtering Tests
// ============================================================================

describe('SpendingLogService - Filtering', () => {
  beforeEach(async () => {
    // Add diverse entries for filtering
    await addSpendingEntry({
      ...mockEntryInput,
      amount: 100,
      category: SpendingCategory.GROCERIES,
      cardUsed: 'card-1',
      transactionDate: new Date('2026-02-01'),
    });
    
    await addSpendingEntry({
      ...mockEntryInput,
      amount: 50,
      category: SpendingCategory.DINING,
      cardUsed: 'card-2',
      transactionDate: new Date('2026-02-15'),
    });
    
    await addSpendingEntry({
      ...mockEntryInput,
      amount: 75,
      category: SpendingCategory.GROCERIES,
      cardUsed: 'card-1',
      transactionDate: new Date('2026-03-01'),
    });
  });

  it('should filter by card ID', async () => {
    const entries = await getSpendingEntries({ cardId: 'card-1' }, Infinity);
    
    expect(entries).toHaveLength(2);
    entries.forEach(e => expect(e.cardUsed).toBe('card-1'));
  });

  it('should filter by category', async () => {
    const entries = await getSpendingEntries({ category: SpendingCategory.DINING }, Infinity);
    
    expect(entries).toHaveLength(1);
    expect(entries[0].category).toBe(SpendingCategory.DINING);
  });

  it('should filter by start date', async () => {
    const entries = await getSpendingEntries({
      startDate: new Date('2026-02-10'),
    }, Infinity);
    
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(e => {
      expect(new Date(e.transactionDate).getTime()).toBeGreaterThanOrEqual(new Date('2026-02-10').getTime());
    });
  });

  it('should filter by end date', async () => {
    const entries = await getSpendingEntries({
      endDate: new Date('2026-02-20'),
    }, Infinity);
    
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(e => {
      expect(new Date(e.transactionDate).getTime()).toBeLessThanOrEqual(new Date('2026-02-20').getTime());
    });
  });

  it('should filter by date range', async () => {
    const entries = await getSpendingEntries({
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
    }, Infinity);
    
    expect(entries).toHaveLength(2);
  });

  it('should combine multiple filters', async () => {
    const entries = await getSpendingEntries({
      cardId: 'card-1',
      category: SpendingCategory.GROCERIES,
    }, Infinity);
    
    expect(entries).toHaveLength(2);
    entries.forEach(e => {
      expect(e.cardUsed).toBe('card-1');
      expect(e.category).toBe(SpendingCategory.GROCERIES);
    });
  });

  it('should return empty array when no matches', async () => {
    const entries = await getSpendingEntries({
      category: SpendingCategory.GAS,
    }, Infinity);
    
    expect(entries).toEqual([]);
  });
});

// ============================================================================
// Summary Tests
// ============================================================================

describe('SpendingLogService - Summary', () => {
  beforeEach(async () => {
    mockGetCurrentTierSync.mockReturnValue('pro');
    
    await addSpendingEntry({
      ...mockEntryInput,
      amount: 100,
    });
    
    await addSpendingEntry({
      ...mockEntryInput,
      amount: 50,
    });
  });

  it('should calculate total spend', async () => {
    const summary = await getSpendingSummary();
    
    expect(summary.totalSpend).toBe(150);
  });

  it('should calculate total rewards earned', async () => {
    const summary = await getSpendingSummary();
    
    expect(summary.totalRewardsEarned).toBeGreaterThan(0);
  });

  it('should calculate total rewards missed', async () => {
    const summary = await getSpendingSummary();
    
    expect(summary.totalRewardsMissed).toBeGreaterThanOrEqual(0);
  });

  it('should count transactions', async () => {
    const summary = await getSpendingSummary();
    
    expect(summary.transactionCount).toBe(2);
  });

  it('should respect filters in summary', async () => {
    const summary = await getSpendingSummary({ cardId: 'card-1' });
    
    expect(summary.transactionCount).toBe(2);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

describe('SpendingLogService - Helper Functions', () => {
  describe('calculateOptimalCard', () => {
    it('should return optimal card ID for category', async () => {
      const optimal = await calculateOptimalCard(100, SpendingCategory.GROCERIES);
      
      expect(optimal).toBeTruthy();
      expect(typeof optimal).toBe('string');
    });

    it('should handle invalid category', async () => {
      const optimal = await calculateOptimalCard(100, 'invalid' as any);
      
      expect(optimal).toBeDefined();
    });
  });

  describe('calculateRewards', () => {
    it('should calculate rewards for specific card', () => {
      const rewards = calculateRewards(100, 'card-1', SpendingCategory.GROCERIES);
      
      expect(rewards).toBe(5); // $100 * 5% = $5
    });

    it('should return 0 for invalid card', () => {
      const rewards = calculateRewards(100, 'invalid', SpendingCategory.GROCERIES);
      
      expect(rewards).toBe(0);
    });

    it('should handle zero amount', () => {
      const rewards = calculateRewards(0, 'card-1', SpendingCategory.GROCERIES);
      
      expect(rewards).toBe(0);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('SpendingLogService - Edge Cases', () => {
  it('should handle zero amount transaction', async () => {
    const entry = await addSpendingEntry({
      ...mockEntryInput,
      amount: 0,
    });
    
    expect(entry.amount).toBe(0);
    expect(entry.rewardsEarned).toBe(0);
  });

  it('should handle negative amount gracefully', async () => {
    const entry = await addSpendingEntry({
      ...mockEntryInput,
      amount: -50,
    });
    
    expect(entry.amount).toBe(-50);
  });

  it('should handle missing store name', async () => {
    const entry = await addSpendingEntry({
      ...mockEntryInput,
      storeName: undefined,
    });
    
    expect(entry.storeName).toBeUndefined();
  });

  it('should handle missing notes', async () => {
    const entry = await addSpendingEntry({
      ...mockEntryInput,
      notes: undefined,
    });
    
    expect(entry.notes).toBeUndefined();
  });

  it('should handle future transaction dates', async () => {
    const futureDate = new Date('2030-01-01');
    
    const entry = await addSpendingEntry({
      ...mockEntryInput,
      transactionDate: futureDate,
    });
    
    expect(entry.transactionDate).toEqual(futureDate);
  });

  it('should sort entries by date descending', async () => {
    await addSpendingEntry({
      ...mockEntryInput,
      transactionDate: new Date('2026-01-01'),
    });
    
    await addSpendingEntry({
      ...mockEntryInput,
      transactionDate: new Date('2026-03-01'),
    });
    
    await addSpendingEntry({
      ...mockEntryInput,
      transactionDate: new Date('2026-02-01'),
    });
    
    const entries = await getSpendingEntries(undefined, Infinity);
    
    // Should be sorted newest first
    expect(new Date(entries[0].transactionDate).getTime())
      .toBeGreaterThanOrEqual(new Date(entries[1].transactionDate).getTime());
  });
});
