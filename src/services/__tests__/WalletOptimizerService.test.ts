/**
 * WalletOptimizerService - Unit Tests
 * 
 * Tests wallet optimization algorithm, pruning, combination generation, and ranking
 */

import {
  calculateCategoryRewards,
  calculateTotalAnnualRewards,
  evaluateWalletCombination,
  calculateNetAnnualValue,
  calculateEffectiveRewardRate,
  pruneCards,
  generateCombinations,
  rankCombinations,
  compareToCurrentWallet,
  optimizeWallet,
  estimateCardValue,
} from '../WalletOptimizerService';
import {
  Card,
  SpendingCategory,
  SpendingProfileInput,
  WalletConstraints,
  RewardType,
  PrunedCard,
} from '../../types';
import { getAllCardsSync, getCardByIdSync } from '../CardDataService';
import { getCards } from '../CardPortfolioManager';
import { getSpendingProfileSync } from '../SpendingProfileService';

// Mock dependencies
jest.mock('../CardDataService');
jest.mock('../CardPortfolioManager');
jest.mock('../SpendingProfileService', () => {
  const actualModule = jest.requireActual('../SpendingProfileService');
  return {
    ...actualModule,
    getSpendingProfileSync: jest.fn(),
  };
});

const mockGetAllCardsSync = getAllCardsSync as jest.MockedFunction<typeof getAllCardsSync>;
const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;
const mockGetCards = getCards as jest.MockedFunction<typeof getCards>;
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
}; // Total: $1875/month, $22,500/year

const mockGroceryCard: Card = {
  id: 'grocery-card',
  name: 'Grocery Rewards',
  issuer: 'Bank A',
  rewardProgram: 'Points',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.GROCERIES, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  annualFee: 120,
  pointValuation: 1,
};

const mockDiningCard: Card = {
  id: 'dining-card',
  name: 'Dining Rewards',
  issuer: 'Bank B',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [
    { category: SpendingCategory.DINING, rewardRate: { value: 4, type: RewardType.CASHBACK, unit: 'percent' } },
  ],
  annualFee: 95,
};

const mockTravelCard: Card = {
  id: 'travel-card',
  name: 'Travel Card',
  issuer: 'Bank C',
  rewardProgram: 'Miles',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.TRAVEL, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
    { category: SpendingCategory.DINING, rewardRate: { value: 3, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  annualFee: 150,
  pointValuation: 1,
};

const mockNofeeCard: Card = {
  id: 'nofee-card',
  name: 'No Fee Card',
  issuer: 'Bank D',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1.5, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [],
  annualFee: 0,
};

const mockConstraints: WalletConstraints = {
  maxTotalAnnualFees: 300,
  maxCards: 2,
  country: 'CA',
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  mockGetAllCardsSync.mockReturnValue([mockGroceryCard, mockDiningCard, mockTravelCard, mockNofeeCard]);
  mockGetCardByIdSync.mockImplementation((id: string) => {
    const cards = [mockGroceryCard, mockDiningCard, mockTravelCard, mockNofeeCard];
    return cards.find(c => c.id === id) || null;
  });
  mockGetCards.mockReturnValue([]);
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
  it('should calculate rewards for cashback cards', () => {
    // $200/month × 12 × 4% = $96
    const rewards = calculateCategoryRewards(mockDiningCard, SpendingCategory.DINING, 200);
    expect(rewards).toBeCloseTo(96, 2);
  });

  it('should calculate rewards for points cards', () => {
    // $800/month × 12 × 5x × 1 cent = $480
    const rewards = calculateCategoryRewards(mockGroceryCard, SpendingCategory.GROCERIES, 800);
    expect(rewards).toBeCloseTo(480, 2);
  });

  it('should use base rate when no category bonus exists', () => {
    const rewards = calculateCategoryRewards(mockGroceryCard, SpendingCategory.DINING, 200);
    // $200/month × 12 × 1x × 1 cent = $24
    expect(rewards).toBeCloseTo(24, 2);
  });
});

describe('calculateTotalAnnualRewards', () => {
  it('should sum rewards across all categories', () => {
    const total = calculateTotalAnnualRewards(mockGroceryCard, mockSpendingProfile);
    
    // Groceries: 800 × 12 × 5 × 0.01 = 480
    // Other categories (excluding transit): (1775 - 800) × 12 × 1 × 0.01 = 117
    // Total: ~597
    expect(total).toBeGreaterThan(590);
    expect(total).toBeLessThan(610);
  });

  it('should handle no-fee cards', () => {
    const total = calculateTotalAnnualRewards(mockNofeeCard, mockSpendingProfile);
    // Total evaluated spend (excluding transit): $1775/month × 12 = $21,300/year
    // $21,300 × 1.5% = $319.50
    expect(total).toBeCloseTo(319.5, 0);
  });
});

describe('evaluateWalletCombination', () => {
  it('should assign best card per category', () => {
    const { categoryAssignments, totalRewards } = evaluateWalletCombination(
      [mockGroceryCard, mockDiningCard],
      mockSpendingProfile
    );
    
    // Should have assignments for categories with non-zero spending
    expect(categoryAssignments.length).toBeGreaterThan(0);
    expect(categoryAssignments.length).toBeLessThanOrEqual(9); // Max 9 categories
    
    // Groceries should be assigned to grocery card
    const groceryAssignment = categoryAssignments.find(a => a.category === SpendingCategory.GROCERIES);
    expect(groceryAssignment).toBeDefined();
    expect(groceryAssignment?.bestCardId).toBe('grocery-card');
    
    // Dining should be assigned to dining card (4% > 1%)
    const diningAssignment = categoryAssignments.find(a => a.category === SpendingCategory.DINING);
    expect(diningAssignment).toBeDefined();
    expect(diningAssignment?.bestCardId).toBe('dining-card');
    
    expect(totalRewards).toBeGreaterThan(0);
  });

  it('should skip categories with zero spending', () => {
    const zeroSpendProfile: SpendingProfileInput = {
      ...mockSpendingProfile,
      travel: 0,
      entertainment: 0,
    };
    
    const { categoryAssignments } = evaluateWalletCombination(
      [mockTravelCard],
      zeroSpendProfile
    );
    
    const travelAssignment = categoryAssignments.find(a => a.category === SpendingCategory.TRAVEL);
    expect(travelAssignment).toBeUndefined();
  });

  it('should calculate monthly and annual rewards correctly', () => {
    const { categoryAssignments } = evaluateWalletCombination(
      [mockGroceryCard],
      mockSpendingProfile
    );
    
    const groceryAssignment = categoryAssignments.find(a => a.category === SpendingCategory.GROCERIES);
    if (groceryAssignment) {
      expect(groceryAssignment.annualRewards).toBeCloseTo(480, 0);
      expect(groceryAssignment.monthlyRewards).toBeCloseTo(40, 0);
    }
  });
});

describe('calculateNetAnnualValue', () => {
  it('should calculate net value correctly', () => {
    const { netValue, totalFees } = calculateNetAnnualValue(500, [mockGroceryCard, mockDiningCard]);
    
    expect(totalFees).toBe(215); // 120 + 95
    expect(netValue).toBe(285); // 500 - 215
  });

  it('should handle no-fee cards', () => {
    const { netValue, totalFees } = calculateNetAnnualValue(300, [mockNofeeCard]);
    
    expect(totalFees).toBe(0);
    expect(netValue).toBe(300);
  });
});

describe('calculateEffectiveRewardRate', () => {
  it('should calculate weighted average rate', () => {
    // Total annual spend from mockSpendingProfile: $1875/month × 12 = $22,500
    // $609 rewards / $21,300 actual evaluable spend ≈ 2.86%
    const rate = calculateEffectiveRewardRate(609, mockSpendingProfile);
    expect(rate).toBeGreaterThan(2);
    expect(rate).toBeLessThan(4);
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
    
    const rate = calculateEffectiveRewardRate(100, emptyProfile);
    expect(rate).toBe(0);
  });
});

// ============================================================================
// Pruning Functions
// ============================================================================

describe('pruneCards', () => {
  it('should exclude cards by ID', () => {
    const constraints: WalletConstraints = {
      ...mockConstraints,
      excludedCardIds: ['grocery-card'],
    };
    
    const pruned = pruneCards(
      [mockGroceryCard, mockDiningCard, mockTravelCard, mockNofeeCard],
      mockSpendingProfile,
      constraints
    );
    
    expect(pruned.find(p => p.cardId === 'grocery-card')).toBeUndefined();
  });

  it('should filter by preferred banks', () => {
    const constraints: WalletConstraints = {
      ...mockConstraints,
      preferredBanks: ['Bank A', 'Bank B'],
    };
    
    const pruned = pruneCards(
      [mockGroceryCard, mockDiningCard, mockTravelCard, mockNofeeCard],
      mockSpendingProfile,
      constraints
    );
    
    pruned.forEach(p => {
      expect(['Bank A', 'Bank B']).toContain(p.card.issuer);
    });
  });

  it('should filter by reward type', () => {
    const constraints: WalletConstraints = {
      ...mockConstraints,
      preferredRewardType: 'cashback',
    };
    
    const pruned = pruneCards(
      [mockGroceryCard, mockDiningCard, mockTravelCard, mockNofeeCard],
      mockSpendingProfile,
      constraints
    );
    
    pruned.forEach(p => {
      expect(p.card.baseRewardRate.type).toBe(RewardType.CASHBACK);
    });
  });

  it('should exclude cards exceeding fee limit', () => {
    const highFeeCard: Card = {
      ...mockGroceryCard,
      id: 'high-fee',
      annualFee: 500,
    };
    
    const constraints: WalletConstraints = {
      ...mockConstraints,
      maxTotalAnnualFees: 300,
    };
    
    const pruned = pruneCards(
      [mockGroceryCard, highFeeCard],
      mockSpendingProfile,
      constraints
    );
    
    expect(pruned.find(p => p.cardId === 'high-fee')).toBeUndefined();
  });

  it('should keep top cards per category', () => {
    const pruned = pruneCards(
      [mockGroceryCard, mockDiningCard, mockTravelCard, mockNofeeCard],
      mockSpendingProfile,
      mockConstraints
    );
    
    expect(pruned.length).toBeGreaterThan(0);
    pruned.forEach(p => {
      expect(p.topCategories.length).toBeGreaterThan(0);
      expect(p.maxCategoryRate).toBeGreaterThan(0);
    });
  });

  it('should skip categories with zero spending', () => {
    const zeroGroceryProfile: SpendingProfileInput = {
      ...mockSpendingProfile,
      groceries: 0,
    };
    
    const pruned = pruneCards(
      [mockGroceryCard, mockDiningCard],
      zeroGroceryProfile,
      mockConstraints
    );
    
    // Grocery card should not be top for groceries (zero spend)
    const groceryCardPruned = pruned.find(p => p.cardId === 'grocery-card');
    if (groceryCardPruned) {
      expect(groceryCardPruned.topCategories).not.toContain(SpendingCategory.GROCERIES);
    }
  });
});

// ============================================================================
// Combination Generation
// ============================================================================

describe('generateCombinations', () => {
  const prunedCards: PrunedCard[] = [
    {
      cardId: 'card-1',
      card: mockGroceryCard,
      topCategories: [SpendingCategory.GROCERIES],
      maxCategoryRate: 5,
      annualFee: 120,
    },
    {
      cardId: 'card-2',
      card: mockDiningCard,
      topCategories: [SpendingCategory.DINING],
      maxCategoryRate: 4,
      annualFee: 95,
    },
    {
      cardId: 'card-3',
      card: mockTravelCard,
      topCategories: [SpendingCategory.TRAVEL],
      maxCategoryRate: 5,
      annualFee: 150,
    },
  ];

  it('should generate 2-card combinations', () => {
    const combos = generateCombinations(prunedCards, 2, 300);
    
    expect(combos.length).toBeGreaterThan(0);
    combos.forEach(combo => {
      expect(combo.length).toBe(2);
    });
  });

  it('should generate 3-card combinations', () => {
    const combos = generateCombinations(prunedCards, 3, 500);
    
    expect(combos.length).toBeGreaterThan(0);
    combos.forEach(combo => {
      expect(combo.length).toBe(3);
    });
  });

  it('should respect fee constraints', () => {
    const combos = generateCombinations(prunedCards, 2, 200);
    
    combos.forEach(combo => {
      const totalFee = combo.reduce((sum, card) => sum + (card.annualFee || 0), 0);
      expect(totalFee).toBeLessThanOrEqual(200);
    });
  });

  it('should return empty for impossible constraints', () => {
    const combos = generateCombinations(prunedCards, 2, 50);
    expect(combos.length).toBe(0);
  });
});

// ============================================================================
// Ranking
// ============================================================================

describe('rankCombinations', () => {
  const combos: Card[][] = [
    [mockGroceryCard, mockDiningCard],
    [mockGroceryCard, mockTravelCard],
    [mockDiningCard, mockTravelCard],
  ];

  it('should rank combinations by net value', () => {
    const ranked = rankCombinations(combos, mockSpendingProfile, 3);
    
    expect(ranked.length).toBeLessThanOrEqual(3);
    
    // Verify descending order
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].netAnnualValue).toBeGreaterThanOrEqual(ranked[i].netAnnualValue);
    }
  });

  it('should assign ranks correctly', () => {
    const ranked = rankCombinations(combos, mockSpendingProfile, 3);
    
    ranked.forEach((result, index) => {
      expect(result.rank).toBe(index + 1);
    });
  });

  it('should calculate all result fields', () => {
    const ranked = rankCombinations(combos, mockSpendingProfile, 1);
    
    expect(ranked[0].totalAnnualRewards).toBeGreaterThan(0);
    expect(ranked[0].totalAnnualFees).toBeGreaterThan(0);
    expect(ranked[0].categoryAssignments.length).toBeGreaterThan(0);
    expect(ranked[0].effectiveRewardRate).toBeGreaterThan(0);
  });

  it('should limit results to topN', () => {
    const ranked = rankCombinations(combos, mockSpendingProfile, 1);
    expect(ranked.length).toBe(1);
  });
});

// ============================================================================
// Wallet Comparison
// ============================================================================

describe('compareToCurrentWallet', () => {
  it('should return undefined when user has no cards', () => {
    mockGetCards.mockReturnValue([]);
    
    const comparison = compareToCurrentWallet(500, mockSpendingProfile);
    expect(comparison).toBeUndefined();
  });

  it('should calculate improvement correctly', () => {
    mockGetCards.mockReturnValue([
      { cardId: 'nofee-card', addedAt: new Date() },
    ]);
    
    const comparison = compareToCurrentWallet(600, mockSpendingProfile);
    
    expect(comparison).toBeDefined();
    if (comparison) {
      expect(comparison.improvement).toBeGreaterThan(0);
      expect(comparison.currentCardIds).toEqual(['nofee-card']);
    }
  });

  it('should handle negative improvement', () => {
    mockGetCards.mockReturnValue([
      { cardId: 'grocery-card', addedAt: new Date() },
      { cardId: 'dining-card', addedAt: new Date() },
    ]);
    
    const comparison = compareToCurrentWallet(100, mockSpendingProfile);
    
    expect(comparison).toBeDefined();
    if (comparison) {
      expect(comparison.improvement).toBeLessThan(0);
    }
  });
});

// ============================================================================
// Main API
// ============================================================================

describe('optimizeWallet', () => {
  it('should successfully optimize wallet', () => {
    const result = optimizeWallet(mockSpendingProfile, mockConstraints, 3);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.recommendations.length).toBeGreaterThan(0);
      expect(result.value.recommendations.length).toBeLessThanOrEqual(3);
      expect(result.value.computeTimeMs).toBeLessThan(2000);
    }
  });

  it('should fail for invalid maxCards', () => {
    const invalidConstraints: WalletConstraints = {
      ...mockConstraints,
      maxCards: 5 as any,
    };
    
    const result = optimizeWallet(mockSpendingProfile, invalidConstraints);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_CONSTRAINTS');
    }
  });

  it('should fail for negative maxTotalAnnualFees', () => {
    const invalidConstraints: WalletConstraints = {
      ...mockConstraints,
      maxTotalAnnualFees: -100,
    };
    
    const result = optimizeWallet(mockSpendingProfile, invalidConstraints);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_CONSTRAINTS');
    }
  });

  it('should fail when no cards available', () => {
    mockGetAllCardsSync.mockReturnValue([]);
    
    const result = optimizeWallet(mockSpendingProfile, mockConstraints);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NO_CARDS_AVAILABLE');
    }
  });

  it('should include pruning statistics', () => {
    const result = optimizeWallet(mockSpendingProfile, mockConstraints);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.prunedCardCount).toBeGreaterThan(0);
      expect(result.value.totalCombinationsEvaluated).toBeGreaterThan(0);
    }
  });

  it('should compare to current wallet when user has cards', () => {
    mockGetCards.mockReturnValue([
      { cardId: 'nofee-card', addedAt: new Date() },
    ]);
    
    const result = optimizeWallet(mockSpendingProfile, mockConstraints);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.vsCurrentWallet).toBeDefined();
    }
  });

  it('should handle 3-card optimization', () => {
    const constraints3: WalletConstraints = {
      ...mockConstraints,
      maxCards: 3,
      maxTotalAnnualFees: 500,
    };
    
    const result = optimizeWallet(mockSpendingProfile, constraints3, 2);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.recommendations[0].cards.length).toBe(3);
    }
  });
});

describe('estimateCardValue', () => {
  it('should estimate annual rewards and net value', () => {
    const { annualRewards, netValue } = estimateCardValue(mockGroceryCard, mockSpendingProfile);
    
    expect(annualRewards).toBeGreaterThan(0);
    expect(netValue).toBe(annualRewards - 120);
  });

  it('should handle no-fee cards', () => {
    const { annualRewards, netValue } = estimateCardValue(mockNofeeCard, mockSpendingProfile);
    
    expect(netValue).toBe(annualRewards);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
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
    
    const result = optimizeWallet(minimalProfile, mockConstraints);
    expect(result.success).toBe(true);
  });

  it('should handle very high fee constraints', () => {
    const highFeeConstraints: WalletConstraints = {
      ...mockConstraints,
      maxTotalAnnualFees: 10000,
    };
    
    const result = optimizeWallet(mockSpendingProfile, highFeeConstraints);
    expect(result.success).toBe(true);
  });

  it('should handle very low fee constraints', () => {
    // Need at least 2 no-fee cards for this test
    const noFeeCard2: Card = {
      ...mockNofeeCard,
      id: 'nofee-card-2',
      name: 'Another No Fee Card',
    };
    
    mockGetAllCardsSync.mockReturnValue([mockNofeeCard, noFeeCard2]);
    
    const lowFeeConstraints: WalletConstraints = {
      ...mockConstraints,
      maxTotalAnnualFees: 0,
    };
    
    const result = optimizeWallet(mockSpendingProfile, lowFeeConstraints);
    
    expect(result.success).toBe(true);
    if (result.success) {
      result.value.recommendations.forEach(rec => {
        expect(rec.totalAnnualFees).toBe(0);
      });
    }
  });

  it('should handle single high-spend category', () => {
    const singleCategoryProfile: SpendingProfileInput = {
      groceries: 2000,
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
    
    const result = optimizeWallet(singleCategoryProfile, mockConstraints);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const topResult = result.value.recommendations[0];
      const groceryAssignment = topResult.categoryAssignments.find(
        a => a.category === SpendingCategory.GROCERIES
      );
      expect(groceryAssignment).toBeDefined();
    }
  });
});
