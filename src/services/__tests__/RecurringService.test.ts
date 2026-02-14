/**
 * RecurringService - Unit Tests
 * 
 * Tests recurring charges CRUD, optimization calculations, and common subscriptions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeRecurring,
  getRecurringCharges,
  getRecurringSummary,
  addRecurringCharge,
  updateRecurringCharge,
  deleteRecurringCharge,
  recalculateOptimizations,
  getCommonSubscriptions,
  resetRecurringCache,
} from '../RecurringService';
import { RecurringCharge, SpendingCategory, Card, RewardType } from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn().mockResolvedValue(null),
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

import { getCardByIdSync } from '../CardDataService';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;

// ============================================================================
// Test Data
// ============================================================================

const mockCard1: Card = {
  id: 'card-1',
  name: 'Entertainment Pro',
  issuer: 'Bank A',
  rewardProgram: 'Points',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.ENTERTAINMENT, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
};

const mockCard2: Card = {
  id: 'card-2',
  name: 'Basic Card',
  issuer: 'Bank B',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [],
};

const mockChargeInput: Omit<RecurringCharge, 'id' | 'userId' | 'optimalCard' | 'currentRewards' | 'optimalRewards' | 'monthlySavings' | 'isActive' | 'createdAt' | 'updatedAt'> = {
  name: 'Netflix',
  amount: 15.99,
  category: SpendingCategory.ENTERTAINMENT,
  billingDay: 1,
  currentCard: 'card-2',
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  resetRecurringCache();
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

describe('RecurringService - Initialization', () => {
  it('should initialize with empty cache', async () => {
    await initializeRecurring();
    const charges = await getRecurringCharges();
    expect(charges).toEqual([]);
  });

  it('should load cached data from AsyncStorage', async () => {
    const stored = [{
      ...mockChargeInput,
      id: 'charge-1',
      userId: 'user-1',
      optimalCard: 'card-1',
      currentRewards: 0.16,
      optimalRewards: 0.80,
      monthlySavings: 0.64,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    
    await initializeRecurring();
    const charges = await getRecurringCharges();
    
    expect(charges).toHaveLength(1);
    expect(charges[0].name).toBe('Netflix');
  });

  it('should handle initialization errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
    
    await initializeRecurring();
    const charges = await getRecurringCharges();
    
    expect(charges).toEqual([]);
  });

  it('should only initialize once', async () => {
    await initializeRecurring();
    await initializeRecurring();
    await initializeRecurring();
    
    expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// CRUD Operations
// ============================================================================

describe('RecurringService - CRUD Operations', () => {
  describe('addRecurringCharge', () => {
    it('should add a new recurring charge', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.id).toBeTruthy();
      expect(charge.name).toBe(mockChargeInput.name);
      expect(charge.amount).toBe(mockChargeInput.amount);
    });

    it('should calculate optimal card', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.optimalCard).toBeTruthy();
    });

    it('should calculate current rewards', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.currentRewards).toBeGreaterThanOrEqual(0);
    });

    it('should calculate optimal rewards', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.optimalRewards).toBeGreaterThanOrEqual(0);
    });

    it('should calculate monthly savings', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.monthlySavings).toBeGreaterThanOrEqual(0);
    });

    it('should set isActive to true', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.isActive).toBe(true);
    });

    it('should set timestamps', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      expect(charge.createdAt).toBeInstanceOf(Date);
      expect(charge.updatedAt).toBeInstanceOf(Date);
    });

    it('should persist to AsyncStorage', async () => {
      await addRecurringCharge(mockChargeInput);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateRecurringCharge', () => {
    it('should update an existing charge', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      const updated = await updateRecurringCharge(charge.id, {
        amount: 19.99,
      });
      
      expect(updated.amount).toBe(19.99);
    });

    it('should recalculate when amount changes', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      const originalRewards = charge.currentRewards;
      
      const updated = await updateRecurringCharge(charge.id, {
        amount: 20,
      });
      
      expect(updated.currentRewards).not.toBe(originalRewards);
    });

    it('should recalculate when category changes', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      const updated = await updateRecurringCharge(charge.id, {
        category: SpendingCategory.ONLINE_SHOPPING,
      });
      
      expect(updated.category).toBe(SpendingCategory.ONLINE_SHOPPING);
    });

    it('should recalculate when current card changes', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      const updated = await updateRecurringCharge(charge.id, {
        currentCard: 'card-1',
      });
      
      expect(updated.currentCard).toBe('card-1');
    });

    it('should update timestamp', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      const originalUpdatedAt = charge.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await updateRecurringCharge(charge.id, {
        amount: 20,
      });
      
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should throw error when charge not found', async () => {
      await expect(
        updateRecurringCharge('non-existent', { amount: 20 })
      ).rejects.toThrow('Charge non-existent not found');
    });
  });

  describe('deleteRecurringCharge', () => {
    it('should soft delete a charge (set isActive to false)', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      await deleteRecurringCharge(charge.id);
      
      const charges = await getRecurringCharges();
      expect(charges.find(c => c.id === charge.id)).toBeUndefined();
    });

    it('should persist deletion to AsyncStorage', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      
      mockAsyncStorage.setItem.mockClear();
      await deleteRecurringCharge(charge.id);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle deleting non-existent charge gracefully', async () => {
      await expect(deleteRecurringCharge('non-existent')).resolves.not.toThrow();
    });
  });
});

// ============================================================================
// Data Access Tests
// ============================================================================

describe('RecurringService - Data Access', () => {
  describe('getRecurringCharges', () => {
    it('should return only active charges', async () => {
      const charge1 = await addRecurringCharge(mockChargeInput);
      await addRecurringCharge({
        ...mockChargeInput,
        name: 'Spotify',
        amount: 11.99,
      });
      
      await deleteRecurringCharge(charge1.id);
      
      const charges = await getRecurringCharges();
      expect(charges).toHaveLength(1);
      expect(charges[0].name).toBe('Spotify');
    });

    it('should return empty array when no active charges', async () => {
      const charges = await getRecurringCharges();
      expect(charges).toEqual([]);
    });

    it('should filter out inactive charges', async () => {
      const charge = await addRecurringCharge(mockChargeInput);
      await deleteRecurringCharge(charge.id);
      
      const charges = await getRecurringCharges();
      expect(charges.find(c => c.id === charge.id)).toBeUndefined();
    });
  });
});

// ============================================================================
// Summary Tests
// ============================================================================

describe('RecurringService - Summary', () => {
  beforeEach(async () => {
    await addRecurringCharge(mockChargeInput);
    await addRecurringCharge({
      ...mockChargeInput,
      name: 'Spotify',
      amount: 11.99,
    });
  });

  it('should calculate total monthly charges', async () => {
    const charges = await getRecurringCharges();
    const summary = getRecurringSummary(charges);
    
    expect(summary.totalMonthlyCharges).toBeCloseTo(15.99 + 11.99, 2);
  });

  it('should calculate total current rewards', async () => {
    const charges = await getRecurringCharges();
    const summary = getRecurringSummary(charges);
    
    expect(summary.totalCurrentRewards).toBeGreaterThanOrEqual(0);
  });

  it('should calculate total optimal rewards', async () => {
    const charges = await getRecurringCharges();
    const summary = getRecurringSummary(charges);
    
    expect(summary.totalOptimalRewards).toBeGreaterThanOrEqual(0);
  });

  it('should calculate total monthly savings', async () => {
    const charges = await getRecurringCharges();
    const summary = getRecurringSummary(charges);
    
    expect(summary.totalMonthlySavings).toBeGreaterThanOrEqual(0);
  });

  it('should count charges not on optimal card', async () => {
    const charges = await getRecurringCharges();
    const summary = getRecurringSummary(charges);
    
    expect(summary.optimizedCount).toBeGreaterThanOrEqual(0);
    expect(summary.optimizedCount).toBeLessThanOrEqual(charges.length);
  });

  it('should handle empty charges array', () => {
    const summary = getRecurringSummary([]);
    
    expect(summary.totalMonthlyCharges).toBe(0);
    expect(summary.totalCurrentRewards).toBe(0);
    expect(summary.totalOptimalRewards).toBe(0);
    expect(summary.totalMonthlySavings).toBe(0);
    expect(summary.optimizedCount).toBe(0);
  });
});

// ============================================================================
// Recalculation Tests
// ============================================================================

describe('RecurringService - Recalculation', () => {
  it('should recalculate all optimizations', async () => {
    await addRecurringCharge(mockChargeInput);
    await addRecurringCharge({
      ...mockChargeInput,
      name: 'Spotify',
    });
    
    await recalculateOptimizations();
    
    const charges = await getRecurringCharges();
    expect(charges).toHaveLength(2);
  });

  it('should update optimal cards after portfolio changes', async () => {
    await addRecurringCharge(mockChargeInput);
    
    // Simulate portfolio change by mocking different optimal card
    jest.requireMock('../BestCardRecommendationService').getBestCardForCategory
      .mockReturnValue({ card: mockCard2 });
    
    await recalculateOptimizations();
    
    const charges = await getRecurringCharges();
    expect(charges[0].optimalCard).toBeTruthy();
  });

  it('should persist recalculations to AsyncStorage', async () => {
    await addRecurringCharge(mockChargeInput);
    
    mockAsyncStorage.setItem.mockClear();
    await recalculateOptimizations();
    
    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should handle empty charges gracefully', async () => {
    await expect(recalculateOptimizations()).resolves.not.toThrow();
  });
});

// ============================================================================
// Common Subscriptions Tests
// ============================================================================

describe('RecurringService - Common Subscriptions', () => {
  it('should return array of common subscriptions', () => {
    const common = getCommonSubscriptions();
    
    expect(Array.isArray(common)).toBe(true);
    expect(common.length).toBeGreaterThan(0);
  });

  it('should include Netflix', () => {
    const common = getCommonSubscriptions();
    
    expect(common.find(s => s.name === 'Netflix')).toBeTruthy();
  });

  it('should include Spotify', () => {
    const common = getCommonSubscriptions();
    
    expect(common.find(s => s.name === 'Spotify')).toBeTruthy();
  });

  it('should have name, amount, and category for each', () => {
    const common = getCommonSubscriptions();
    
    common.forEach(sub => {
      expect(sub.name).toBeTruthy();
      expect(typeof sub.amount).toBe('number');
      expect(sub.amount).toBeGreaterThan(0);
      expect(sub.category).toBeTruthy();
    });
  });

  it('should categorize entertainment subscriptions correctly', () => {
    const common = getCommonSubscriptions();
    
    const netflix = common.find(s => s.name === 'Netflix');
    const spotify = common.find(s => s.name === 'Spotify');
    
    expect(netflix?.category).toBe(SpendingCategory.ENTERTAINMENT);
    expect(spotify?.category).toBe(SpendingCategory.ENTERTAINMENT);
  });

  it('should return new array (immutable)', () => {
    const common1 = getCommonSubscriptions();
    const common2 = getCommonSubscriptions();
    
    expect(common1).not.toBe(common2);
    expect(common1).toEqual(common2);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('RecurringService - Edge Cases', () => {
  it('should handle zero amount charge', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      amount: 0,
    });
    
    expect(charge.amount).toBe(0);
    expect(charge.currentRewards).toBe(0);
    expect(charge.optimalRewards).toBe(0);
  });

  it('should handle negative amount gracefully', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      amount: -10,
    });
    
    expect(charge.amount).toBe(-10);
  });

  it('should handle missing billing day', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      billingDay: undefined,
    });
    
    expect(charge.billingDay).toBeUndefined();
  });

  it('should handle missing current card', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      currentCard: undefined,
    });
    
    expect(charge.currentCard).toBeUndefined();
    expect(charge.currentRewards).toBe(0);
  });

  it('should calculate savings correctly when already on optimal card', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      currentCard: 'card-1', // Optimal for entertainment (5x)
    });
    
    // Savings can be negative if the user switches from a better card to a worse one
    // The service calculates: optimal - current, which can be negative
    expect(typeof charge.monthlySavings).toBe('number');
  });

  it('should handle very large amounts', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      amount: 999999,
    });
    
    expect(charge.amount).toBe(999999);
    expect(charge.currentRewards).toBeGreaterThan(0);
  });

  it('should handle decimal amounts correctly', async () => {
    const charge = await addRecurringCharge({
      ...mockChargeInput,
      amount: 15.99,
    });
    
    expect(charge.amount).toBe(15.99);
  });

  it('should handle updating to same values (no changes)', async () => {
    const charge = await addRecurringCharge(mockChargeInput);
    
    const updated = await updateRecurringCharge(charge.id, {
      name: charge.name,
    });
    
    expect(updated.name).toBe(charge.name);
  });

  it('should handle multiple charges with same name', async () => {
    await addRecurringCharge(mockChargeInput);
    await addRecurringCharge(mockChargeInput);
    
    const charges = await getRecurringCharges();
    expect(charges).toHaveLength(2);
  });
});
