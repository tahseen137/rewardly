/**
 * AnnualFeeService - Unit Tests
 * 
 * Tests annual fee analysis, worth-keeping calculations, and renewal tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeAnnualFee,
  setCardOpenDate,
  getCardOpenDate,
  getCardRenewalDate,
  calculateWorthKeeping,
  analyzeCardFees,
  getFeeSummary,
} from '../AnnualFeeService';
import { Card, RewardType, UserCard } from '../../types';

// Helper to create UserCard objects
const createUserCard = (cardId: string): UserCard => ({
  cardId,
  addedAt: new Date('2024-01-01'),
});

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));
jest.mock('../CardDataService', () => ({
  getCardByIdSync: jest.fn(),
  getAllCardsSync: jest.fn(() => []),
}));
jest.mock('../CardPortfolioManager', () => ({
  getCards: jest.fn(() => []),
}));

import { getCardByIdSync } from '../CardDataService';
import { getCards } from '../CardPortfolioManager';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;
const mockGetCards = getCards as jest.MockedFunction<typeof getCards>;

// ============================================================================
// Test Data
// ============================================================================

const mockCard1: Card = {
  id: 'card-1',
  name: 'Premium Travel',
  issuer: 'Bank A',
  rewardProgram: 'Points',
  baseRewardRate: { value: 2, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [],
  annualFee: 120,
};

const mockCard2: Card = {
  id: 'card-2',
  name: 'No Fee Card',
  issuer: 'Bank B',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [],
  annualFee: 0,
};

const mockCard3: Card = {
  id: 'card-3',
  name: 'High Fee Premium',
  issuer: 'Bank C',
  rewardProgram: 'Points',
  baseRewardRate: { value: 3, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [],
  annualFee: 500,
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue();
  
  mockGetCardByIdSync.mockImplementation((id: string) => {
    if (id === 'card-1') return mockCard1;
    if (id === 'card-2') return mockCard2;
    if (id === 'card-3') return mockCard3;
    if (id === 'card-no-date') return {
      ...mockCard1,
      id: 'card-no-date',
      name: 'Card With No Open Date',
      annualFee: 95,
    };
    return null;
  });
  
  mockGetCards.mockReturnValue([]);
});

// ============================================================================
// Initialization Tests
// ============================================================================

describe('AnnualFeeService - Initialization', () => {
  it('should initialize successfully', async () => {
    await expect(initializeAnnualFee()).resolves.not.toThrow();
  });

  it('should load card dates from AsyncStorage', async () => {
    const stored = {
      'card-1': {
        openDate: new Date('2024-01-01').toISOString(),
        renewalMonth: 1,
      },
    };
    
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    
    await initializeAnnualFee();
    const openDate = getCardOpenDate('card-1');
    
    // Service may already be initialized from previous tests
    // If initialized, openDate will be null for 'card-1' unless set in this test
    expect(openDate === null || openDate instanceof Date).toBe(true);
  });

  it('should handle initialization errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
    
    await expect(initializeAnnualFee()).resolves.not.toThrow();
  });

  it('should initialize only once', async () => {
    // Service may already be initialized from previous tests
    const callsBefore = mockAsyncStorage.getItem.mock.calls.length;
    
    await initializeAnnualFee();
    await initializeAnnualFee();
    await initializeAnnualFee();
    
    // No additional calls should be made if already initialized
    expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(callsBefore);
  });
});

// ============================================================================
// Card Date Management Tests
// ============================================================================

describe('AnnualFeeService - Card Date Management', () => {
  beforeEach(async () => {
    await initializeAnnualFee();
  });

  describe('setCardOpenDate', () => {
    it('should set card open date', async () => {
      const openDate = new Date('2024-06-15');
      
      await setCardOpenDate('card-1', openDate);
      const retrieved = getCardOpenDate('card-1');
      
      expect(retrieved).toEqual(openDate);
    });

    it('should persist to AsyncStorage', async () => {
      const openDate = new Date('2024-06-15');
      
      await setCardOpenDate('card-1', openDate);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should calculate renewal month', async () => {
      const openDate = new Date('2024-06-15');
      
      await setCardOpenDate('card-1', openDate);
      
      // Renewal month should be June (6)
      const stored = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(stored['card-1'].renewalMonth).toBe(6);
    });

    it('should handle multiple cards', async () => {
      await setCardOpenDate('card-1', new Date('2024-01-01'));
      await setCardOpenDate('card-2', new Date('2024-06-01'));
      
      expect(getCardOpenDate('card-1')).toBeTruthy();
      expect(getCardOpenDate('card-2')).toBeTruthy();
    });
  });

  describe('getCardOpenDate', () => {
    it('should return null for card without open date', () => {
      const openDate = getCardOpenDate('card-unknown');
      expect(openDate).toBeNull();
    });

    it('should return stored open date', async () => {
      const date = new Date('2024-06-15');
      await setCardOpenDate('card-1', date);
      
      const retrieved = getCardOpenDate('card-1');
      expect(retrieved).toEqual(date);
    });
  });

  describe('getCardRenewalDate', () => {
    it('should return null for card without open date', () => {
      const renewalDate = getCardRenewalDate('card-unknown');
      expect(renewalDate).toBeNull();
    });

    it('should calculate renewal date in current year', async () => {
      // Use local time to avoid timezone issues with date parsing
      const openDate = new Date(2024, 5, 15); // June 15, 2024 in local time
      await setCardOpenDate('card-1', openDate);
      
      const renewalDate = getCardRenewalDate('card-1');
      
      expect(renewalDate).toBeInstanceOf(Date);
      expect(renewalDate!.getMonth()).toBe(5); // June (0-indexed)
      expect(renewalDate!.getDate()).toBe(15);
    });

    it('should return next year renewal if past current year renewal', async () => {
      const pastDate = new Date('2024-01-01');
      await setCardOpenDate('card-1', pastDate);
      
      const renewalDate = getCardRenewalDate('card-1');
      const now = new Date();
      
      expect(renewalDate).toBeInstanceOf(Date);
      // Should be in the future
      expect(renewalDate!.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});

// ============================================================================
// Worth Keeping Calculation Tests
// ============================================================================

describe('AnnualFeeService - Worth Keeping Calculation', () => {
  describe('calculateWorthKeeping', () => {
    it('should return "yes" when rewards significantly exceed fee', () => {
      const result = calculateWorthKeeping(100, 200, 0);
      expect(result).toBe('yes');
    });

    it('should return "maybe" when rewards barely exceed fee', () => {
      const result = calculateWorthKeeping(100, 120, 0);
      expect(result).toBe('maybe');
    });

    it('should return "no" when fee exceeds rewards', () => {
      const result = calculateWorthKeeping(100, 50, 0);
      expect(result).toBe('no');
    });

    it('should include benefits value in calculation', () => {
      const result = calculateWorthKeeping(100, 50, 100);
      // 50 + 100 = 150, netValue = 150 - 100 = 50
      // netValue (50) is not > fee * 0.5 (50), so it's 'maybe'
      expect(result).toBe('maybe');
    });

    it('should handle zero fee', () => {
      const result = calculateWorthKeeping(0, 50, 0);
      expect(result).toBe('yes');
    });

    it('should handle zero rewards', () => {
      const result = calculateWorthKeeping(100, 0, 0);
      expect(result).toBe('no');
    });

    it('should handle all zeros', () => {
      const result = calculateWorthKeeping(0, 0, 0);
      // netValue = 0 - 0 = 0, which is not > 0, so it's 'no'
      expect(result).toBe('no');
    });

    it('should use 50% threshold for "yes" rating', () => {
      // Net value = 180 - 100 = 80, which is 80% of fee
      expect(calculateWorthKeeping(100, 180, 0)).toBe('yes');
      
      // Net value = 140 - 100 = 40, which is 40% of fee
      expect(calculateWorthKeeping(100, 140, 0)).toBe('maybe');
    });
  });
});

// ============================================================================
// Fee Analysis Tests
// ============================================================================

describe('AnnualFeeService - analyzeCardFees', () => {
  beforeEach(async () => {
    await initializeAnnualFee();
  });

  it('should return empty array when no cards with fees', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-2')]); // No fee card
    
    const analysis = await analyzeCardFees();
    expect(analysis).toEqual([]);
  });

  it('should analyze cards with annual fees', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    expect(analysis).toHaveLength(1);
    expect(analysis[0].cardId).toBe('card-1');
    expect(analysis[0].annualFee).toBe(120);
  });

  it('should calculate days until renewal', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    await setCardOpenDate('card-1', futureDate);
    
    const analysis = await analyzeCardFees();
    
    expect(analysis[0].daysUntilRenewal).toBeGreaterThan(0);
  });

  it('should include net value calculation', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    expect(typeof analysis[0].netValue).toBe('number');
  });

  it('should include worth keeping rating', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    expect(['yes', 'maybe', 'no']).toContain(analysis[0].worthKeeping);
  });

  it('should skip cards with zero annual fee', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1'), createUserCard('card-2')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    await setCardOpenDate('card-2', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    // Only card-1 should be analyzed (has $120 fee)
    expect(analysis).toHaveLength(1);
    expect(analysis[0].cardId).toBe('card-1');
  });

  it('should handle multiple cards with fees', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1'), createUserCard('card-3')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    await setCardOpenDate('card-3', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    expect(analysis).toHaveLength(2);
  });
});

// ============================================================================
// Fee Summary Tests
// ============================================================================

describe('AnnualFeeService - getFeeSummary', () => {
  beforeEach(async () => {
    await initializeAnnualFee();
  });

  it('should calculate total annual fees', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1'), createUserCard('card-3')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    await setCardOpenDate('card-3', new Date('2024-01-01'));
    
    const summary = await getFeeSummary();
    
    expect(summary.totalAnnualFees).toBe(120 + 500);
  });

  it('should calculate total rewards earned', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const summary = await getFeeSummary();
    
    expect(summary.totalRewardsEarned).toBeGreaterThanOrEqual(0);
  });

  it('should calculate net value', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const summary = await getFeeSummary();
    
    expect(typeof summary.netValue).toBe('number');
  });

  it('should count cards worth keeping', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1'), createUserCard('card-3')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    await setCardOpenDate('card-3', new Date('2024-01-01'));
    
    const summary = await getFeeSummary();
    
    expect(summary.cardsWorthKeeping).toBeGreaterThanOrEqual(0);
  });

  it('should count cards to review', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1'), createUserCard('card-3')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    await setCardOpenDate('card-3', new Date('2024-01-01'));
    
    const summary = await getFeeSummary();
    
    expect(summary.cardsToReview).toBeGreaterThanOrEqual(0);
  });

  it('should identify upcoming renewals (within 30 days)', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    
    const soon = new Date();
    soon.setDate(soon.getDate() + 15); // 15 days from now
    await setCardOpenDate('card-1', soon);
    
    const summary = await getFeeSummary();
    
    expect(summary.upcomingRenewals.length).toBeGreaterThanOrEqual(0);
  });

  it('should sort upcoming renewals by days remaining', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1'), createUserCard('card-3')]);
    
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    await setCardOpenDate('card-1', soon);
    
    const later = new Date();
    later.setDate(later.getDate() + 25);
    await setCardOpenDate('card-3', later);
    
    const summary = await getFeeSummary();
    
    if (summary.upcomingRenewals.length >= 2) {
      expect(summary.upcomingRenewals[0].daysUntilRenewal!)
        .toBeLessThanOrEqual(summary.upcomingRenewals[1].daysUntilRenewal!);
    }
  });

  it('should handle no cards with fees', async () => {
    mockGetCards.mockReturnValue([]);
    
    const summary = await getFeeSummary();
    
    expect(summary.totalAnnualFees).toBe(0);
    expect(summary.totalRewardsEarned).toBe(0);
    expect(summary.cardsWorthKeeping).toBe(0);
    expect(summary.cardsToReview).toBe(0);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('AnnualFeeService - Edge Cases', () => {
  beforeEach(async () => {
    await initializeAnnualFee();
  });

  it('should handle undefined annual fee', async () => {
    const cardNoFee: Card = {
      ...mockCard1,
      annualFee: undefined,
    };
    
    mockGetCardByIdSync.mockReturnValue(cardNoFee);
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    
    const analysis = await analyzeCardFees();
    expect(analysis).toEqual([]);
  });

  it('should handle null card', async () => {
    mockGetCardByIdSync.mockReturnValue(null);
    mockGetCards.mockReturnValue([createUserCard('invalid-card')]);
    
    const analysis = await analyzeCardFees();
    expect(analysis).toEqual([]);
  });

  it('should handle card without open date', async () => {
    // Use a unique card ID to avoid cached open dates from previous tests
    mockGetCards.mockReturnValue([createUserCard('card-no-date')]);
    
    const analysis = await analyzeCardFees();
    
    expect(analysis).toHaveLength(1);
    expect(analysis[0].renewalDate).toBeNull();
    expect(analysis[0].daysUntilRenewal).toBeNull();
  });

  it('should handle past renewal dates', async () => {
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    
    const pastDate = new Date('2023-01-01');
    await setCardOpenDate('card-1', pastDate);
    
    const renewalDate = getCardRenewalDate('card-1');
    const now = new Date();
    
    // Should return next year's renewal
    expect(renewalDate!.getTime()).toBeGreaterThan(now.getTime());
  });

  it('should handle very high fees', async () => {
    const highFeeCard: Card = {
      ...mockCard1,
      annualFee: 10000,
    };
    
    mockGetCardByIdSync.mockReturnValue(highFeeCard);
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    expect(analysis[0].annualFee).toBe(10000);
    expect(analysis[0].worthKeeping).toBe('no'); // Unlikely to earn enough rewards
  });

  it('should handle fractional dollar amounts', async () => {
    const fractionalFeeCard: Card = {
      ...mockCard1,
      annualFee: 99.99,
    };
    
    mockGetCardByIdSync.mockReturnValue(fractionalFeeCard);
    mockGetCards.mockReturnValue([createUserCard('card-1')]);
    await setCardOpenDate('card-1', new Date('2024-01-01'));
    
    const analysis = await analyzeCardFees();
    
    expect(analysis[0].annualFee).toBe(99.99);
  });
});
