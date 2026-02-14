/**
 * InsightsService Tests
 * ~35 tests covering all pure calculation functions
 */

import {
  calculateCategoryBreakdown,
  findOptimalCardForCategory,
  estimateCategoryRewards,
  calculateOptimizationScore,
  groupByMonth,
  calculateSpendingTrends,
  generateSmartAlerts,
  calculateMoneyLeftOnTable,
  getTopMerchants,
  generateSpendingInsights,
} from '../InsightsService';
import {
  ParsedTransaction,
  SpendingCategory,
  Card,
  RewardType,
  SupportedBank,
  CategoryBreakdown,
  MonthlySummary,
} from '../../types';

// Mock RewardsCalculatorService
jest.mock('../RewardsCalculatorService', () => ({
  getApplicableMultiplier: jest.fn((card, category) => {
    // Simple mock: return 3 for category match, 1 otherwise
    const categoryMatch = card.categoryRewards?.find((r: any) => r.category === category);
    return categoryMatch ? categoryMatch.rewardRate.value : card.baseRewardRate.value;
  }),
  pointsToCad: jest.fn((points, card, valuation) => {
    if (card.baseRewardRate.type === 'cashback') {
      return points / 100;
    }
    return points * (valuation / 100);
  }),
}));

describe('InsightsService', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const mockCard1: Card = {
    id: 'card1',
    name: 'Grocery Card',
    issuer: 'Test Bank',
    rewardProgram: 'TestPoints',
    baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
    categoryRewards: [
      {
        category: SpendingCategory.GROCERIES,
        rewardRate: { value: 3, type: RewardType.CASHBACK, unit: 'percent' },
      },
    ],
    pointValuation: 100,
  };

  const mockCard2: Card = {
    id: 'card2',
    name: 'Dining Card',
    issuer: 'Test Bank',
    rewardProgram: 'TestPoints',
    baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
    categoryRewards: [
      {
        category: SpendingCategory.DINING,
        rewardRate: { value: 5, type: RewardType.CASHBACK, unit: 'percent' },
      },
    ],
    pointValuation: 100,
  };

  const createMockTransaction = (
    amount: number,
    category: SpendingCategory,
    date: Date,
    merchantName: string = 'Test Merchant',
    isCredit: boolean = false
  ): ParsedTransaction => ({
    id: `tx_${Math.random()}`,
    date,
    description: merchantName,
    normalizedMerchant: merchantName,
    amount,
    isCredit,
    category,
    categoryConfidence: 'high',
    userCorrected: false,
    sourceBank: 'td' as SupportedBank,
  });

  // ============================================================================
  // findOptimalCardForCategory Tests
  // ============================================================================

  describe('findOptimalCardForCategory', () => {
    it('should return null for empty card array', () => {
      const result = findOptimalCardForCategory(SpendingCategory.GROCERIES, []);
      expect(result).toBeNull();
    });

    it('should find card with highest rate for category', () => {
      const result = findOptimalCardForCategory(
        SpendingCategory.GROCERIES,
        [mockCard1, mockCard2]
      );
      expect(result?.id).toBe('card1');
    });

    it('should find dining card for dining category', () => {
      const result = findOptimalCardForCategory(
        SpendingCategory.DINING,
        [mockCard1, mockCard2]
      );
      expect(result?.id).toBe('card2');
    });

    it('should handle single card', () => {
      const result = findOptimalCardForCategory(
        SpendingCategory.GROCERIES,
        [mockCard1]
      );
      expect(result?.id).toBe('card1');
    });
  });

  // ============================================================================
  // estimateCategoryRewards Tests
  // ============================================================================

  describe('estimateCategoryRewards', () => {
    it('should return zeros for no cards', () => {
      const result = estimateCategoryRewards(
        1000,
        SpendingCategory.GROCERIES,
        [],
        null
      );
      expect(result.rewardsEarned).toBe(0);
      expect(result.rewardsPossible).toBe(0);
    });

    it('should calculate rewards with optimal card', () => {
      const result = estimateCategoryRewards(
        1000,
        SpendingCategory.GROCERIES,
        [mockCard1],
        mockCard1
      );
      
      expect(result.rewardsEarned).toBeGreaterThan(0);
      expect(result.rewardsPossible).toBeGreaterThan(0);
    });

    it('should have gap when cards not optimal', () => {
      const result = estimateCategoryRewards(
        1000,
        SpendingCategory.DINING,
        [mockCard1, mockCard2],
        mockCard2
      );
      
      // Possible should be higher than earned (using average)
      expect(result.rewardsPossible).toBeGreaterThan(result.rewardsEarned);
    });
  });

  // ============================================================================
  // calculateCategoryBreakdown Tests
  // ============================================================================

  describe('calculateCategoryBreakdown', () => {
    const mockTransactions = [
      createMockTransaction(100, SpendingCategory.GROCERIES, new Date('2024-01-15'), 'Loblaws'),
      createMockTransaction(50, SpendingCategory.GROCERIES, new Date('2024-01-16'), 'Metro'),
      createMockTransaction(30, SpendingCategory.DINING, new Date('2024-01-17'), 'Starbucks'),
      createMockTransaction(500, SpendingCategory.GROCERIES, new Date('2024-01-18'), 'Payment', true), // Credit
    ];

    it('should calculate breakdown correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, [mockCard1]);
      
      expect(breakdown.length).toBe(2); // Groceries + Dining
    });

    it('should exclude credits from calculations', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, [mockCard1]);
      
      const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
      expect(groceries?.totalSpend).toBe(150); // 100 + 50, no 500 credit
    });

    it('should calculate percentages correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, [mockCard1]);
      
      const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
      const dining = breakdown.find(b => b.category === SpendingCategory.DINING);
      
      // 150 groceries + 30 dining = 180 total
      expect(groceries?.percentOfTotal).toBeCloseTo(83.33, 1);
      expect(dining?.percentOfTotal).toBeCloseTo(16.67, 1);
    });

    it('should sort by total spend (highest first)', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, [mockCard1]);
      
      expect(breakdown[0].category).toBe(SpendingCategory.GROCERIES);
      expect(breakdown[1].category).toBe(SpendingCategory.DINING);
    });

    it('should include top merchants', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, [mockCard1]);
      
      const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
      expect(groceries?.topMerchants.length).toBe(2);
      expect(groceries?.topMerchants[0].name).toBe('Loblaws');
    });

    it('should set optimal card', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, [mockCard1, mockCard2]);
      
      const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
      expect(groceries?.optimalCard?.id).toBe('card1');
      
      const dining = breakdown.find(b => b.category === SpendingCategory.DINING);
      expect(dining?.optimalCard?.id).toBe('card2');
    });
  });

  // ============================================================================
  // calculateOptimizationScore Tests
  // ============================================================================

  describe('calculateOptimizationScore', () => {
    it('should return 0 score for no possible rewards', () => {
      const breakdown: CategoryBreakdown[] = [];
      const score = calculateOptimizationScore(breakdown);
      
      expect(score.score).toBe(0);
      expect(score.label).toBe('Add Cards to Start');
    });

    it('should calculate score correctly', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 100,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 90,
          rewardsPossible: 100,
          rewardsGap: 10,
        },
      ];
      
      const score = calculateOptimizationScore(breakdown);
      
      expect(score.score).toBe(90);
      expect(score.label).toBe('Rewards Master');
      expect(score.emoji).toBe('🏆');
    });

    it('should label Good Optimizer correctly', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 100,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 75,
          rewardsPossible: 100,
          rewardsGap: 25,
        },
      ];
      
      const score = calculateOptimizationScore(breakdown);
      
      expect(score.score).toBe(75);
      expect(score.label).toBe('Good Optimizer');
      expect(score.emoji).toBe('👍');
    });

    it('should label Average User correctly', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 100,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 60,
          rewardsPossible: 100,
          rewardsGap: 40,
        },
      ];
      
      const score = calculateOptimizationScore(breakdown);
      
      expect(score.score).toBe(60);
      expect(score.label).toBe('Average User');
    });

    it('should label Needs Help correctly', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 100,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 30,
          rewardsPossible: 100,
          rewardsGap: 70,
        },
      ];
      
      const score = calculateOptimizationScore(breakdown);
      
      expect(score.score).toBe(30);
      expect(score.label).toBe('Needs Help');
      expect(score.emoji).toBe('🎯');
    });
  });

  // ============================================================================
  // groupByMonth Tests
  // ============================================================================

  describe('groupByMonth', () => {
    it('should group transactions by month', () => {
      const transactions = [
        createMockTransaction(100, SpendingCategory.GROCERIES, new Date('2024-01-15')),
        createMockTransaction(50, SpendingCategory.DINING, new Date('2024-01-20')),
        createMockTransaction(200, SpendingCategory.GROCERIES, new Date('2024-02-15')),
      ];
      
      const monthly = groupByMonth(transactions);
      
      expect(monthly.length).toBe(2);
      expect(monthly[0].totalSpend).toBe(150);
      expect(monthly[1].totalSpend).toBe(200);
    });

    it('should exclude credits', () => {
      const transactions = [
        createMockTransaction(100, SpendingCategory.GROCERIES, new Date('2024-01-15')),
        createMockTransaction(500, SpendingCategory.GROCERIES, new Date('2024-01-16'), 'Payment', true),
      ];
      
      const monthly = groupByMonth(transactions);
      
      expect(monthly[0].totalSpend).toBe(100);
    });

    it('should sort months chronologically', () => {
      const transactions = [
        createMockTransaction(100, SpendingCategory.GROCERIES, new Date('2024-02-15')),
        createMockTransaction(50, SpendingCategory.DINING, new Date('2024-01-15')),
      ];
      
      const monthly = groupByMonth(transactions);
      
      expect(monthly[0].month.getMonth()).toBe(0); // January
      expect(monthly[1].month.getMonth()).toBe(1); // February
    });

    it('should track by category', () => {
      const transactions = [
        createMockTransaction(100, SpendingCategory.GROCERIES, new Date('2024-01-15')),
        createMockTransaction(50, SpendingCategory.DINING, new Date('2024-01-20')),
      ];
      
      const monthly = groupByMonth(transactions);
      
      expect(monthly[0].byCategory[SpendingCategory.GROCERIES]).toBe(100);
      expect(monthly[0].byCategory[SpendingCategory.DINING]).toBe(50);
    });
  });

  // ============================================================================
  // calculateSpendingTrends Tests
  // ============================================================================

  describe('calculateSpendingTrends', () => {
    const currentMonth: MonthlySummary = {
      month: new Date('2024-02-01'),
      totalSpend: 1000,
      byCategory: {
        [SpendingCategory.GROCERIES]: 600,
        [SpendingCategory.DINING]: 200,
        [SpendingCategory.GAS]: 100,
        [SpendingCategory.TRAVEL]: 0,
        [SpendingCategory.ONLINE_SHOPPING]: 50,
        [SpendingCategory.ENTERTAINMENT]: 50,
        [SpendingCategory.DRUGSTORES]: 0,
        [SpendingCategory.HOME_IMPROVEMENT]: 0,
        [SpendingCategory.OTHER]: 0,
      },
      transactionCount: 20,
    };

    const previousMonth: MonthlySummary = {
      month: new Date('2024-01-01'),
      totalSpend: 800,
      byCategory: {
        [SpendingCategory.GROCERIES]: 500,
        [SpendingCategory.DINING]: 150,
        [SpendingCategory.GAS]: 100,
        [SpendingCategory.TRAVEL]: 0,
        [SpendingCategory.ONLINE_SHOPPING]: 50,
        [SpendingCategory.ENTERTAINMENT]: 0,
        [SpendingCategory.DRUGSTORES]: 0,
        [SpendingCategory.HOME_IMPROVEMENT]: 0,
        [SpendingCategory.OTHER]: 0,
      },
      transactionCount: 15,
    };

    it('should detect upward trend', () => {
      const trends = calculateSpendingTrends(currentMonth, previousMonth);
      
      const groceriesTrend = trends.find(t => t.category === SpendingCategory.GROCERIES);
      expect(groceriesTrend?.direction).toBe('up');
      expect(groceriesTrend?.changePercent).toBe(20);
    });

    it('should detect downward trend', () => {
      const modified = {
        ...currentMonth,
        byCategory: {
          ...currentMonth.byCategory,
          [SpendingCategory.GROCERIES]: 300, // Down from 500
        },
      };
      
      const trends = calculateSpendingTrends(modified, previousMonth);
      
      const groceriesTrend = trends.find(t => t.category === SpendingCategory.GROCERIES);
      expect(groceriesTrend?.direction).toBe('down');
    });

    it('should detect stable trend', () => {
      const trends = calculateSpendingTrends(currentMonth, previousMonth);
      
      const gasTrend = trends.find(t => t.category === SpendingCategory.GAS);
      expect(gasTrend?.direction).toBe('stable');
      expect(gasTrend?.changePercent).toBe(0);
    });

    it('should generate alerts for significant changes', () => {
      const trends = calculateSpendingTrends(currentMonth, previousMonth);
      
      const groceriesTrend = trends.find(t => t.category === SpendingCategory.GROCERIES);
      expect(groceriesTrend?.alert).toBeDefined();
      expect(groceriesTrend?.alert?.type).toBe('spending_increase');
    });
  });

  // ============================================================================
  // generateSmartAlerts Tests
  // ============================================================================

  describe('generateSmartAlerts', () => {
    it('should generate card switch alerts for large gaps', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 100,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 50,
          rewardsPossible: 200,
          rewardsGap: 150,
        },
      ];
      
      const alerts = generateSmartAlerts(breakdown, []);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('card_switch');
      expect(alerts[0].potentialSavings).toBe(150);
    });

    it('should sort alerts by priority and savings', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 100,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 50,
          rewardsPossible: 250,
          rewardsGap: 200,
        },
        {
          category: SpendingCategory.DINING,
          totalSpend: 500,
          transactionCount: 5,
          percentOfTotal: 50,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard2,
          rewardsEarned: 20,
          rewardsPossible: 150,
          rewardsGap: 130,
        },
      ];
      
      const alerts = generateSmartAlerts(breakdown, []);
      
      expect(alerts[0].potentialSavings).toBeGreaterThan(alerts[1].potentialSavings!);
    });
  });

  // ============================================================================
  // calculateMoneyLeftOnTable Tests
  // ============================================================================

  describe('calculateMoneyLeftOnTable', () => {
    it('should sum all rewards gaps', () => {
      const breakdown: CategoryBreakdown[] = [
        {
          category: SpendingCategory.GROCERIES,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 50,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard1,
          rewardsEarned: 50,
          rewardsPossible: 100,
          rewardsGap: 50,
        },
        {
          category: SpendingCategory.DINING,
          totalSpend: 1000,
          transactionCount: 10,
          percentOfTotal: 50,
          topMerchants: [],
          currentCard: null,
          optimalCard: mockCard2,
          rewardsEarned: 60,
          rewardsPossible: 140,
          rewardsGap: 80,
        },
      ];
      
      const total = calculateMoneyLeftOnTable(breakdown);
      expect(total).toBe(130);
    });
  });

  // ============================================================================
  // getTopMerchants Tests
  // ============================================================================

  describe('getTopMerchants', () => {
    const transactions = [
      createMockTransaction(100, SpendingCategory.GROCERIES, new Date(), 'Loblaws'),
      createMockTransaction(50, SpendingCategory.GROCERIES, new Date(), 'Loblaws'),
      createMockTransaction(75, SpendingCategory.DINING, new Date(), 'Starbucks'),
      createMockTransaction(30, SpendingCategory.DINING, new Date(), 'Tim Hortons'),
    ];

    it('should return top merchants by amount', () => {
      const top = getTopMerchants(transactions, 3);
      
      expect(top.length).toBe(3);
      expect(top[0].name).toBe('Loblaws');
      expect(top[0].amount).toBe(150);
    });

    it('should limit results', () => {
      const top = getTopMerchants(transactions, 2);
      expect(top.length).toBe(2);
    });

    it('should exclude credits', () => {
      const txWithCredit = [
        ...transactions,
        createMockTransaction(500, SpendingCategory.GROCERIES, new Date(), 'Payment', true),
      ];
      
      const top = getTopMerchants(txWithCredit, 10);
      expect(top.find(m => m.name === 'Payment')).toBeUndefined();
    });
  });

  // ============================================================================
  // generateSpendingInsights Tests
  // ============================================================================

  describe('generateSpendingInsights', () => {
    it('should return error for insufficient transactions', () => {
      const result = generateSpendingInsights([], [mockCard1]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INSUFFICIENT_DATA');
      }
    });

    it('should generate complete insights', () => {
      const transactions = Array.from({ length: 20 }, (_, i) =>
        createMockTransaction(
          50,
          SpendingCategory.GROCERIES,
          new Date(`2024-01-${(i % 28) + 1}`)
        )
      );
      
      const result = generateSpendingInsights(transactions, [mockCard1]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.categoryBreakdown.length).toBeGreaterThan(0);
        expect(result.value.optimizationScore).toBeDefined();
        expect(result.value.topMerchants.length).toBeGreaterThan(0);
      }
    });
  });
});
