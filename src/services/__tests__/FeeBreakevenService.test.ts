/**
 * FeeBreakevenService - Unit Tests
 * 
 * Tests fee breakeven calculations, category breakdown, and no-fee comparisons
 */

import {
  calculateCategoryRewards,
  calculateTotalAnnualRewards,
  calculateBreakEvenMonthlySpend,
  calculateEffectiveRewardRate,
  calculateCategoryBreakdown,
  findBestNoFeeCard,
  compareToNoFeeCard,
  determineFeeVerdict,
  calculateFeeBreakeven,
  compareFeeBreakeven,
  findBestFeeCards,
} from '../FeeBreakevenService';
import { Card, SpendingCategory, SpendingProfileInput, RewardType } from '../../types';
import { getAllCardsSync, getCardByIdSync } from '../CardDataService';
import { getSpendingProfileSync } from '../SpendingProfileService';

// Mock dependencies
jest.mock('../CardDataService');
jest.mock('../SpendingProfileService', () => {
  const actualModule = jest.requireActual('../SpendingProfileService');
  return {
    ...actualModule,
    getSpendingProfileSync: jest.fn(),
  };
});

const mockGetAllCardsSync = getAllCardsSync as jest.MockedFunction<typeof getAllCardsSync>;
const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;
const mockGetSpendingProfileSync = getSpendingProfileSync as jest.MockedFunction<typeof getSpendingProfileSync>;

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

const mockPremiumCard: Card = {
  id: 'premium-card',
  name: 'Premium Rewards Card',
  issuer: 'Bank A',
  rewardProgram: 'Points Plus',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.GROCERIES, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
    { category: SpendingCategory.TRAVEL, rewardRate: { value: 3, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  annualFee: 120,
  pointValuation: 1, // 1 cent per point
};

const mockNoFeeCard: Card = {
  id: 'no-fee-card',
  name: 'No Fee Cashback',
  issuer: 'Bank B',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [
    { category: SpendingCategory.GROCERIES, rewardRate: { value: 2, type: RewardType.CASHBACK, unit: 'percent' } },
  ],
  annualFee: 0,
};

const mockHighFeeCard: Card = {
  id: 'high-fee-card',
  name: 'Elite Card',
  issuer: 'Bank C',
  rewardProgram: 'Elite Points',
  baseRewardRate: { value: 2, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.DINING, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
    { category: SpendingCategory.TRAVEL, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  annualFee: 500,
  programDetails: {
    programName: 'Elite Points',
    optimalRateCents: 2, // 2 cents per point
  },
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  mockGetAllCardsSync.mockReturnValue([mockPremiumCard, mockNoFeeCard, mockHighFeeCard]);
  mockGetCardByIdSync.mockImplementation((id: string) => {
    if (id === 'premium-card') return mockPremiumCard;
    if (id === 'no-fee-card') return mockNoFeeCard;
    if (id === 'high-fee-card') return mockHighFeeCard;
    return null;
  });
  mockGetSpendingProfileSync.mockReturnValue({
    id: 'profile-1',
    userId: 'user-1',
    ...mockSpendingProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

// ============================================================================
// Pure Calculation Functions
// ============================================================================

describe('calculateCategoryRewards', () => {
  it('should calculate rewards for cashback cards correctly', () => {
    // $800/month × 12 months × 2% = $192
    const rewards = calculateCategoryRewards(mockNoFeeCard, SpendingCategory.GROCERIES, 800);
    expect(rewards).toBeCloseTo(192, 2);
  });

  it('should calculate rewards for points cards correctly', () => {
    // $800/month × 12 months × 5x × 1 cent = $480
    const rewards = calculateCategoryRewards(mockPremiumCard, SpendingCategory.GROCERIES, 800);
    expect(rewards).toBeCloseTo(480, 2);
  });

  it('should use base rate when no category reward exists', () => {
    const rewards = calculateCategoryRewards(mockPremiumCard, SpendingCategory.DINING, 200);
    // $200/month × 12 months × 1x × 1 cent = $24
    expect(rewards).toBeCloseTo(24, 2);
  });

  it('should return 0 for zero spending', () => {
    const rewards = calculateCategoryRewards(mockPremiumCard, SpendingCategory.GROCERIES, 0);
    expect(rewards).toBe(0);
  });

  it('should use optimal rate cents from program details', () => {
    // $200/month × 12 months × 5x × 2 cents = $240
    const rewards = calculateCategoryRewards(mockHighFeeCard, SpendingCategory.DINING, 200);
    expect(rewards).toBeCloseTo(240, 2);
  });
});

describe('calculateTotalAnnualRewards', () => {
  it('should sum rewards across all categories', () => {
    const total = calculateTotalAnnualRewards(mockPremiumCard, mockSpendingProfile);
    
    // Groceries: 800 × 12 × 5 × 0.01 = 480
    // Travel: 100 × 12 × 3 × 0.01 = 36
    // Other categories: (1875 - 800 - 100) × 12 × 1 × 0.01 = 141
    // Total ≈ 657
    expect(total).toBeGreaterThan(600);
    expect(total).toBeLessThan(700);
  });

  it('should return 0 for empty spending profile', () => {
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
    
    const total = calculateTotalAnnualRewards(mockPremiumCard, emptyProfile);
    expect(total).toBe(0);
  });

  it('should handle high-value cards with optimal rates', () => {
    const total = calculateTotalAnnualRewards(mockHighFeeCard, mockSpendingProfile);
    expect(total).toBeGreaterThan(800); // Should be higher due to 2 cents per point
  });
});

describe('calculateBreakEvenMonthlySpend', () => {
  it('should calculate correct breakeven spend', () => {
    // $120 fee / 2% = $6,000/year = $500/month
    const breakeven = calculateBreakEvenMonthlySpend(120, 2);
    expect(breakeven).toBeCloseTo(500, 0);
  });

  it('should return Infinity for zero reward rate', () => {
    const breakeven = calculateBreakEvenMonthlySpend(120, 0);
    expect(breakeven).toBe(Infinity);
  });

  it('should handle high fees', () => {
    // $500 fee / 3% = $16,666/year = $1,388.89/month
    const breakeven = calculateBreakEvenMonthlySpend(500, 3);
    expect(breakeven).toBeCloseTo(1388.89, 1);
  });
});

describe('calculateEffectiveRewardRate', () => {
  it('should calculate weighted average reward rate', () => {
    const rate = calculateEffectiveRewardRate(mockPremiumCard, mockSpendingProfile);
    
    // Should be between base rate (1%) and max rate (5%)
    expect(rate).toBeGreaterThan(1);
    expect(rate).toBeLessThan(5);
  });

  it('should return 0 for zero spending', () => {
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
    
    const rate = calculateEffectiveRewardRate(mockPremiumCard, emptyProfile);
    expect(rate).toBe(0);
  });

  it('should calculate higher rate for high-value cards', () => {
    const rate = calculateEffectiveRewardRate(mockHighFeeCard, mockSpendingProfile);
    expect(rate).toBeGreaterThan(3);
  });
});

describe('calculateCategoryBreakdown', () => {
  it('should return breakdown sorted by annual rewards', () => {
    const breakdown = calculateCategoryBreakdown(mockPremiumCard, mockSpendingProfile, 120);
    
    expect(breakdown.length).toBeGreaterThan(0);
    expect(breakdown[0].category).toBe(SpendingCategory.GROCERIES); // Highest spend + bonus
    
    // Verify descending order
    for (let i = 1; i < breakdown.length; i++) {
      expect(breakdown[i - 1].annualRewards).toBeGreaterThanOrEqual(breakdown[i].annualRewards);
    }
  });

  it('should calculate percent of fee recovered', () => {
    const breakdown = calculateCategoryBreakdown(mockPremiumCard, mockSpendingProfile, 120);
    
    const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
    expect(groceries).toBeDefined();
    if (groceries) {
      // $480 rewards / $120 fee = 400%
      expect(groceries.percentOfFeeRecovered).toBeCloseTo(400, 0);
    }
  });

  it('should only include categories with spending', () => {
    const sparseProfile: SpendingProfileInput = {
      groceries: 800,
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
    
    const breakdown = calculateCategoryBreakdown(mockPremiumCard, sparseProfile, 120);
    expect(breakdown.length).toBe(1);
    expect(breakdown[0].category).toBe(SpendingCategory.GROCERIES);
  });
});

describe('findBestNoFeeCard', () => {
  it('should find best no-fee card for spending profile', () => {
    const bestCard = findBestNoFeeCard(mockSpendingProfile);
    
    expect(bestCard).not.toBeNull();
    expect(bestCard?.id).toBe('no-fee-card');
  });

  it('should return null when no no-fee cards exist', () => {
    mockGetAllCardsSync.mockReturnValue([mockPremiumCard, mockHighFeeCard]);
    
    const bestCard = findBestNoFeeCard(mockSpendingProfile);
    expect(bestCard).toBeNull();
  });
});

describe('compareToNoFeeCard', () => {
  it('should compare fee card to best no-fee alternative', () => {
    const feeCardRewards = calculateTotalAnnualRewards(mockPremiumCard, mockSpendingProfile);
    const comparison = compareToNoFeeCard(mockPremiumCard, feeCardRewards, mockSpendingProfile);
    
    expect(comparison).toBeDefined();
    expect(comparison?.bestNoFeeCard.id).toBe('no-fee-card');
    expect(comparison?.verdict).toContain('Premium Rewards Card');
  });

  it('should return positive advantage when fee card is better', () => {
    const feeCardRewards = calculateTotalAnnualRewards(mockPremiumCard, mockSpendingProfile);
    const comparison = compareToNoFeeCard(mockPremiumCard, feeCardRewards, mockSpendingProfile);
    
    expect(comparison).toBeDefined();
    if (comparison) {
      // Premium card should have positive advantage over no-fee
      expect(comparison.feeCardAdvantage).toBeGreaterThan(0);
    }
  });

  it('should return undefined when no no-fee cards exist', () => {
    mockGetAllCardsSync.mockReturnValue([mockPremiumCard, mockHighFeeCard]);
    
    const feeCardRewards = calculateTotalAnnualRewards(mockPremiumCard, mockSpendingProfile);
    const comparison = compareToNoFeeCard(mockPremiumCard, feeCardRewards, mockSpendingProfile);
    
    expect(comparison).toBeUndefined();
  });
});

describe('determineFeeVerdict', () => {
  it('should return "easily_worth_it" for rewards > 3x fee', () => {
    const { verdict, reason } = determineFeeVerdict(300, 100);
    expect(verdict).toBe('easily_worth_it');
    expect(reason).toContain('4.0×');
  });

  it('should return "worth_it" for positive net value', () => {
    const { verdict, reason } = determineFeeVerdict(50, 100);
    expect(verdict).toBe('worth_it');
    expect(reason).toContain('$50');
  });

  it('should return "borderline" for near-zero net value', () => {
    const { verdict } = determineFeeVerdict(-10, 100);
    expect(verdict).toBe('borderline');
  });

  it('should return "not_worth_it" for large negative net value', () => {
    const { verdict, reason } = determineFeeVerdict(-50, 100);
    expect(verdict).toBe('not_worth_it');
    expect(reason).toContain('$50');
  });
});

// ============================================================================
// Main API
// ============================================================================

describe('calculateFeeBreakeven', () => {
  it('should calculate complete fee breakeven result', () => {
    const result = calculateFeeBreakeven('premium-card', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.card.id).toBe('premium-card');
      expect(result.value.annualFee).toBe(120);
      expect(result.value.annualRewardsEarned).toBeGreaterThan(0);
      expect(result.value.categoryBreakdown.length).toBeGreaterThan(0);
      expect(result.value.verdict).toBeDefined();
    }
  });

  it('should fail for non-existent card', () => {
    const result = calculateFeeBreakeven('non-existent', mockSpendingProfile);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CARD_NOT_FOUND');
    }
  });

  it('should fail for card with no annual fee', () => {
    const result = calculateFeeBreakeven('no-fee-card', mockSpendingProfile);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NO_ANNUAL_FEE');
    }
  });

  it('should fail when no spending profile exists', () => {
    mockGetSpendingProfileSync.mockReturnValue(null);
    
    const result = calculateFeeBreakeven('premium-card');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('SPENDING_PROFILE_REQUIRED');
    }
  });

  it('should calculate correct net value', () => {
    const result = calculateFeeBreakeven('premium-card', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const { annualRewardsEarned, annualFee, netValue } = result.value;
      expect(netValue).toBeCloseTo(annualRewardsEarned - annualFee, 2);
    }
  });

  it('should include no-fee comparison', () => {
    const result = calculateFeeBreakeven('premium-card', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.noFeeComparison).toBeDefined();
      expect(result.value.noFeeComparison?.bestNoFeeCard.id).toBe('no-fee-card');
    }
  });
});

describe('compareFeeBreakeven', () => {
  it('should compare multiple cards and sort by net value', () => {
    const results = compareFeeBreakeven(
      ['premium-card', 'high-fee-card'],
      mockSpendingProfile
    );
    
    expect(results.length).toBe(2);
    // Verify descending order by net value
    expect(results[0].netValue).toBeGreaterThanOrEqual(results[1].netValue);
  });

  it('should skip cards with errors', () => {
    const results = compareFeeBreakeven(
      ['premium-card', 'non-existent', 'high-fee-card'],
      mockSpendingProfile
    );
    
    expect(results.length).toBe(2);
  });

  it('should handle empty input', () => {
    const results = compareFeeBreakeven([], mockSpendingProfile);
    expect(results.length).toBe(0);
  });
});

describe('findBestFeeCards', () => {
  it('should find best fee cards for spending profile', () => {
    const results = findBestFeeCards(mockSpendingProfile, 2);
    
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0].card.annualFee).toBeGreaterThan(0);
  });

  it('should limit results to specified count', () => {
    const results = findBestFeeCards(mockSpendingProfile, 1);
    expect(results.length).toBe(1);
  });

  it('should use cached spending profile when not provided', () => {
    const results = findBestFeeCards();
    expect(results.length).toBeGreaterThan(0);
    expect(mockGetSpendingProfileSync).toHaveBeenCalled();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('should handle very high annual fees', () => {
    const veryHighFeeCard: Card = {
      ...mockPremiumCard,
      id: 'very-high-fee',
      annualFee: 5000,
    };
    
    mockGetCardByIdSync.mockReturnValue(veryHighFeeCard);
    
    const result = calculateFeeBreakeven('very-high-fee', mockSpendingProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.verdict).toBe('not_worth_it');
    }
  });

  it('should handle minimal spending profile', () => {
    const minimalProfile: SpendingProfileInput = {
      groceries: 100,
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
    
    const result = calculateFeeBreakeven('premium-card', minimalProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.categoryBreakdown.length).toBe(1);
    }
  });

  it('should handle cards with only base rate', () => {
    const baseRateCard: Card = {
      id: 'base-rate',
      name: 'Base Rate Card',
      issuer: 'Bank D',
      rewardProgram: 'Basic',
      baseRewardRate: { value: 1.5, type: RewardType.CASHBACK, unit: 'percent' },
      categoryRewards: [],
      annualFee: 50,
    };
    
    mockGetCardByIdSync.mockReturnValue(baseRateCard);
    
    const result = calculateFeeBreakeven('base-rate', mockSpendingProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.annualRewardsEarned).toBeGreaterThan(0);
    }
  });
});
