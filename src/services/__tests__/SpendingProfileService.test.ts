/**
 * SpendingProfileService - Unit Tests
 * 
 * Tests spending profile CRUD, validation, aggregation, and storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeSpendingProfile,
  getSpendingProfile,
  getSpendingProfileSync,
  saveSpendingProfile,
  getFromSpendingLog,
  getDefaultSpendingProfile,
  hasSpendingProfile,
  deleteSpendingProfile,
  resetSpendingProfileCache,
  calculateTotalMonthlySpend,
  calculateTotalAnnualSpend,
  getSpendForCategory,
  validateSpendingProfile,
  createProfile,
  aggregateSpendingEntries,
} from '../SpendingProfileService';
import { SpendingProfileInput, SpendingCategory, SpendingEntry } from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn().mockResolvedValue(null),
}));
jest.mock('../SpendingLogService', () => ({
  getSpendingEntries: jest.fn().mockResolvedValue([]),
}));

import { getSpendingEntries } from '../SpendingLogService';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetSpendingEntries = getSpendingEntries as jest.MockedFunction<typeof getSpendingEntries>;

// ============================================================================
// Test Data
// ============================================================================

const mockSpendingProfile: SpendingProfileInput = {
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

const mockSpendingEntries = [
  {
    id: 'entry-1',
    userId: 'user-1',
    amount: 100,
    category: SpendingCategory.GROCERIES,
    cardUsed: 'card-1',
    rewardsEarned: 5,
    rewardsMissed: 0,
    transactionDate: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'entry-2',
    userId: 'user-1',
    amount: 50,
    category: SpendingCategory.DINING,
    cardUsed: 'card-1',
    rewardsEarned: 2,
    rewardsMissed: 0,
    transactionDate: new Date('2026-01-05'),
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
  },
  {
    id: 'entry-3',
    userId: 'user-1',
    amount: 40,
    category: SpendingCategory.GAS,
    cardUsed: 'card-1',
    rewardsEarned: 1,
    rewardsMissed: 0,
    transactionDate: new Date('2026-01-10'),
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'entry-4',
    userId: 'user-1',
    amount: 200,
    category: SpendingCategory.GROCERIES,
    cardUsed: 'card-1',
    rewardsEarned: 10,
    rewardsMissed: 0,
    transactionDate: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'entry-5',
    userId: 'user-1',
    amount: 75,
    category: SpendingCategory.DINING,
    cardUsed: 'card-1',
    rewardsEarned: 3,
    rewardsMissed: 0,
    transactionDate: new Date('2026-01-20'),
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'entry-6',
    userId: 'user-1',
    amount: 60,
    category: SpendingCategory.GAS,
    cardUsed: 'card-1',
    rewardsEarned: 2,
    rewardsMissed: 0,
    transactionDate: new Date('2026-01-25'),
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-25'),
  },
];

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  resetSpendingProfileCache();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue();
});

// ============================================================================
// Pure Calculation Functions
// ============================================================================

describe('calculateTotalMonthlySpend', () => {
  it('should calculate correct total monthly spend', () => {
    const total = calculateTotalMonthlySpend(mockSpendingProfile);
    expect(total).toBe(1875);
  });

  it('should return 0 for empty profile', () => {
    const emptyProfile: SpendingProfileInput = {
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
    const total = calculateTotalMonthlySpend(emptyProfile);
    expect(total).toBe(0);
  });

  it('should handle partial spending profile', () => {
    const partial: SpendingProfileInput = {
      groceries: 500,
      dining: 200,
      gas: 0,
      travel: 0,
      onlineShopping: 0,
      entertainment: 0,
      drugstores: 0,
      homeImprovement: 0,
      transit: 0,
      other: 0,
    };
    const total = calculateTotalMonthlySpend(partial);
    expect(total).toBe(700);
  });
});

describe('calculateTotalAnnualSpend', () => {
  it('should calculate correct annual spend', () => {
    const annual = calculateTotalAnnualSpend(mockSpendingProfile);
    expect(annual).toBe(1875 * 12);
  });

  it('should return 0 for empty profile', () => {
    const emptyProfile: SpendingProfileInput = {
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
    const annual = calculateTotalAnnualSpend(emptyProfile);
    expect(annual).toBe(0);
  });
});

describe('getSpendForCategory', () => {
  it('should return correct amount for each category', () => {
    expect(getSpendForCategory(mockSpendingProfile, SpendingCategory.GROCERIES)).toBe(800);
    expect(getSpendForCategory(mockSpendingProfile, SpendingCategory.DINING)).toBe(200);
    expect(getSpendForCategory(mockSpendingProfile, SpendingCategory.GAS)).toBe(150);
    expect(getSpendForCategory(mockSpendingProfile, SpendingCategory.TRAVEL)).toBe(100);
  });

  it('should return 0 for zero-spending categories', () => {
    const profile: SpendingProfileInput = {
      ...mockSpendingProfile,
      entertainment: 0,
    };
    expect(getSpendForCategory(profile, SpendingCategory.ENTERTAINMENT)).toBe(0);
  });
});

describe('validateSpendingProfile', () => {
  it('should validate correct spending profile', () => {
    const result = validateSpendingProfile(mockSpendingProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(mockSpendingProfile);
    }
  });

  it('should reject negative amounts', () => {
    const invalid: SpendingProfileInput = {
      ...mockSpendingProfile,
      groceries: -100,
    };
    const result = validateSpendingProfile(invalid);
    expect(result.success).toBe(false);
    if (!result.success && result.error.type === 'INVALID_AMOUNT') {
      expect(result.error.type).toBe('INVALID_AMOUNT');
      expect(result.error.category).toBe('groceries');
      expect(result.error.value).toBe(-100);
    }
  });

  it('should reject non-finite amounts', () => {
    const invalid: SpendingProfileInput = {
      ...mockSpendingProfile,
      dining: Infinity,
    };
    const result = validateSpendingProfile(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject NaN amounts', () => {
    const invalid: SpendingProfileInput = {
      ...mockSpendingProfile,
      gas: NaN,
    };
    const result = validateSpendingProfile(invalid);
    expect(result.success).toBe(false);
  });
});

describe('createProfile', () => {
  it('should create profile with all required fields', () => {
    const profile = createProfile(mockSpendingProfile);
    
    expect(profile.id).toBeDefined();
    expect(profile.id).toMatch(/^sp_/);
    expect(profile.userId).toBeNull();
    expect(profile.groceries).toBe(800);
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('should create profile with userId if provided', () => {
    const profile = createProfile(mockSpendingProfile, 'user-123');
    expect(profile.userId).toBe('user-123');
  });

  it('should use existing ID if provided', () => {
    const existingId = 'sp_existing_123';
    const profile = createProfile(mockSpendingProfile, null, existingId);
    expect(profile.id).toBe(existingId);
  });
});

describe('aggregateSpendingEntries', () => {
  it('should return default profile for empty entries', () => {
    const result = aggregateSpendingEntries([]);
    const defaults = getDefaultSpendingProfile();
    expect(result).toEqual(defaults);
  });

  it('should aggregate entries into monthly averages', () => {
    const result = aggregateSpendingEntries(mockSpendingEntries);
    
    // Entries span 24 days (Jan 1 to Jan 25), so monthSpan ≈ 0.8
    // Groceries: 300 total
    // Dining: 125 total
    // Gas: 100 total
    // Monthly averages should be close to these totals adjusted for the month span
    expect(result.groceries).toBeGreaterThanOrEqual(300);
    expect(result.dining).toBeGreaterThanOrEqual(125);
    expect(result.gas).toBeGreaterThanOrEqual(100);
  });

  it('should handle single month of data', () => {
    const singleMonthEntries = [
      {
        amount: 800,
        category: SpendingCategory.GROCERIES,
        transactionDate: new Date('2026-01-15'),
      },
      {
        amount: 200,
        category: SpendingCategory.DINING,
        transactionDate: new Date('2026-01-20'),
      },
    ];

    const result = aggregateSpendingEntries(singleMonthEntries);
    // With minimal date span, should be close to actual amounts
    expect(result.groceries).toBeGreaterThan(0);
    expect(result.dining).toBeGreaterThan(0);
  });

  it('should map all spending categories correctly', () => {
    const allCategories = [
      {
        amount: 100,
        category: SpendingCategory.GROCERIES,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 50,
        category: SpendingCategory.DINING,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 40,
        category: SpendingCategory.GAS,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 200,
        category: SpendingCategory.TRAVEL,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 75,
        category: SpendingCategory.ONLINE_SHOPPING,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 60,
        category: SpendingCategory.ENTERTAINMENT,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 30,
        category: SpendingCategory.DRUGSTORES,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 80,
        category: SpendingCategory.HOME_IMPROVEMENT,
        transactionDate: new Date('2026-01-01'),
      },
      {
        amount: 45,
        category: SpendingCategory.OTHER,
        transactionDate: new Date('2026-01-01'),
      },
    ];

    const result = aggregateSpendingEntries(allCategories);
    
    expect(result.groceries).toBeGreaterThan(0);
    expect(result.dining).toBeGreaterThan(0);
    expect(result.gas).toBeGreaterThan(0);
    expect(result.travel).toBeGreaterThan(0);
    expect(result.onlineShopping).toBeGreaterThan(0);
    expect(result.entertainment).toBeGreaterThan(0);
    expect(result.drugstores).toBeGreaterThan(0);
    expect(result.homeImprovement).toBeGreaterThan(0);
    expect(result.other).toBeGreaterThan(0);
    expect(result.transit).toBe(0); // Not tracked in spending log
  });
});

// ============================================================================
// Service Operations
// ============================================================================

describe('getDefaultSpendingProfile', () => {
  it('should return default Canadian household spending', () => {
    const defaults = getDefaultSpendingProfile();
    
    expect(defaults.groceries).toBe(800);
    expect(defaults.dining).toBe(200);
    expect(defaults.gas).toBe(150);
    expect(defaults.travel).toBe(100);
    expect(calculateTotalMonthlySpend(defaults)).toBeGreaterThan(0);
  });
});

describe('getSpendingProfile', () => {
  it('should return null when no profile exists', async () => {
    const profile = await getSpendingProfile();
    expect(profile).toBeNull();
  });

  it('should return cached profile after save', async () => {
    await saveSpendingProfile(mockSpendingProfile);
    const profile = await getSpendingProfile();
    
    expect(profile).not.toBeNull();
    expect(profile?.groceries).toBe(800);
  });
});

describe('getSpendingProfileSync', () => {
  it('should return null initially', () => {
    const profile = getSpendingProfileSync();
    expect(profile).toBeNull();
  });

  it('should return profile after initialization', async () => {
    await saveSpendingProfile(mockSpendingProfile);
    const profile = getSpendingProfileSync();
    expect(profile).not.toBeNull();
  });
});

describe('saveSpendingProfile', () => {
  it('should save valid profile', async () => {
    const result = await saveSpendingProfile(mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.groceries).toBe(800);
      expect(result.value.id).toBeDefined();
    }
    
    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should reject invalid profile', async () => {
    const invalid: SpendingProfileInput = {
      ...mockSpendingProfile,
      groceries: -100,
    };
    
    const result = await saveSpendingProfile(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_AMOUNT');
    }
  });

  it('should update existing profile ID', async () => {
    const result1 = await saveSpendingProfile(mockSpendingProfile);
    expect(result1.success).toBe(true);
    
    const firstId = result1.success ? result1.value.id : '';
    
    const updated: SpendingProfileInput = {
      ...mockSpendingProfile,
      groceries: 900,
    };
    
    const result2 = await saveSpendingProfile(updated);
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.value.id).toBe(firstId);
      expect(result2.value.groceries).toBe(900);
    }
  });
});

describe('hasSpendingProfile', () => {
  it('should return false initially', async () => {
    const has = await hasSpendingProfile();
    expect(has).toBe(false);
  });

  it('should return true after saving', async () => {
    await saveSpendingProfile(mockSpendingProfile);
    const has = await hasSpendingProfile();
    expect(has).toBe(true);
  });
});

describe('deleteSpendingProfile', () => {
  it('should delete profile and clear cache', async () => {
    await saveSpendingProfile(mockSpendingProfile);
    expect(await hasSpendingProfile()).toBe(true);
    
    await deleteSpendingProfile();
    expect(await hasSpendingProfile()).toBe(false);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
  });
});

describe('getFromSpendingLog', () => {
  it('should return null when no spending data exists', async () => {
    mockGetSpendingEntries.mockResolvedValue([]);
    const result = await getFromSpendingLog();
    expect(result).toBeNull();
  });

  it('should return null when insufficient data (<5 entries)', async () => {
    mockGetSpendingEntries.mockResolvedValue(mockSpendingEntries.slice(0, 4));
    const result = await getFromSpendingLog();
    expect(result).toBeNull();
  });

  it('should aggregate data when sufficient entries exist', async () => {
    mockGetSpendingEntries.mockResolvedValue(mockSpendingEntries);
    const result = await getFromSpendingLog();
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.groceries).toBeGreaterThan(0);
      expect(result.dining).toBeGreaterThan(0);
    }
  });

  it('should query last 90 days of data', async () => {
    await getFromSpendingLog();
    
    expect(mockGetSpendingEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(Date),
      }),
      Infinity
    );
    
    const callArgs = mockGetSpendingEntries.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    
    if (callArgs && callArgs.startDate) {
      const startDate = callArgs.startDate;
      const daysDiff = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(90, 0);
    }
  });
});

// ============================================================================
// Storage Integration
// ============================================================================

describe('storage integration', () => {
  it('should persist profile to AsyncStorage', async () => {
    await saveSpendingProfile(mockSpendingProfile);
    
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      '@rewardly/spending_profile',
      expect.stringContaining('"groceries":800')
    );
  });

  it('should serialize dates correctly', async () => {
    const result = await saveSpendingProfile(mockSpendingProfile);
    
    const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
    const serialized = setItemCall[1];
    const parsed = JSON.parse(serialized);
    
    expect(parsed.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(parsed.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('should restore profile from storage', async () => {
    const savedProfile = createProfile(mockSpendingProfile, null, 'sp_test_123');
    const serialized = JSON.stringify({
      ...savedProfile,
      createdAt: savedProfile.createdAt.toISOString(),
      updatedAt: savedProfile.updatedAt.toISOString(),
    });
    
    mockAsyncStorage.getItem.mockResolvedValue(serialized);
    resetSpendingProfileCache();
    
    await initializeSpendingProfile();
    const restored = getSpendingProfileSync();
    
    expect(restored).not.toBeNull();
    expect(restored?.id).toBe('sp_test_123');
    expect(restored?.groceries).toBe(800);
    expect(restored?.createdAt).toBeInstanceOf(Date);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('should handle maximum spending values', () => {
    const maxProfile: SpendingProfileInput = {
      groceries: 99999,
      dining: 99999,
      gas: 99999,
      travel: 99999,
      onlineShopping: 99999,
      entertainment: 99999,
      drugstores: 99999,
      homeImprovement: 99999,
      transit: 99999,
      other: 99999,
    };
    
    const result = validateSpendingProfile(maxProfile);
    expect(result.success).toBe(true);
  });

  it('should handle zero spending profile', () => {
    const zeroProfile: SpendingProfileInput = {
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
    
    const result = validateSpendingProfile(zeroProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(calculateTotalMonthlySpend(result.value)).toBe(0);
    }
  });

  it('should handle decimal spending amounts', () => {
    const decimalProfile: SpendingProfileInput = {
      groceries: 799.99,
      dining: 199.50,
      gas: 149.75,
      travel: 99.25,
      onlineShopping: 149.99,
      entertainment: 74.50,
      drugstores: 49.99,
      homeImprovement: 49.99,
      transit: 99.99,
      other: 199.99,
    };
    
    const total = calculateTotalMonthlySpend(decimalProfile);
    expect(total).toBeCloseTo(1872.94, 2);
  });

  it('should handle initialization errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
    
    await expect(initializeSpendingProfile()).resolves.not.toThrow();
    const profile = getSpendingProfileSync();
    expect(profile).toBeNull();
  });
});
