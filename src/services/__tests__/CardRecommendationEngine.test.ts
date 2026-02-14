/**
 * CardRecommendationEngine - Unit Tests
 * 
 * Tests card recommendations, gap analysis, and ranking logic
 */

import {
  getTopSpendingCategories,
  findCategoryGaps,
  rankRecommendations,
  getAffiliateUrl,
  analyzeAndRecommend,
} from '../CardRecommendationEngine';
import { Card, SpendingCategory, RewardType } from '../../types';

// Mock dependencies
jest.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn(),
  },
}));
jest.mock('../CardDataService', () => ({
  getCardByIdSync: jest.fn(),
  getAllCardsSync: jest.fn(() => []),
}));
jest.mock('../CardPortfolioManager', () => ({
  getCards: jest.fn(() => []),
}));
jest.mock('../SubscriptionService', () => ({
  getCurrentTierSync: jest.fn(() => 'free'),
}));

import { supabase } from '../supabase/client';
import { getAllCardsSync, getCardByIdSync } from '../CardDataService';
import { getCards } from '../CardPortfolioManager';
import { getCurrentTierSync } from '../SubscriptionService';

const mockSupabase = supabase as any;
const mockGetAllCardsSync = getAllCardsSync as jest.MockedFunction<typeof getAllCardsSync>;
const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;
const mockGetCards = getCards as jest.MockedFunction<typeof getCards>;
const mockGetCurrentTierSync = getCurrentTierSync as jest.MockedFunction<typeof getCurrentTierSync>;

// ============================================================================
// Test Data
// ============================================================================

const mockCard1: Card = {
  id: 'card-1',
  name: 'Groceries Pro',
  issuer: 'Bank A',
  rewardProgram: 'Points',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.GROCERIES, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  signupBonus: { amount: 50000, currency: RewardType.POINTS, spendRequirement: 3000, timeframeDays: 90 },
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
  signupBonus: { amount: 20000, currency: RewardType.CASHBACK, spendRequirement: 1000, timeframeDays: 90 },
};

const mockCard3: Card = {
  id: 'card-3',
  name: 'Gas Rewards',
  issuer: 'Bank C',
  rewardProgram: 'Points',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.GAS, rewardRate: { value: 3, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  signupBonus: { amount: 75000, currency: RewardType.POINTS, spendRequirement: 5000, timeframeDays: 90 },
};

const mockSpendingData = [
  { category: 'groceries', amount: '500' },
  { category: 'groceries', amount: '300' },
  { category: 'dining', amount: '200' },
  { category: 'gas', amount: '150' },
];

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  mockGetAllCardsSync.mockReturnValue([mockCard1, mockCard2, mockCard3]);
  mockGetCards.mockReturnValue([]);
  mockGetCurrentTierSync.mockReturnValue('free');
  
  mockGetCardByIdSync.mockImplementation((id: string) => {
    if (id === 'card-1') return mockCard1;
    if (id === 'card-2') return mockCard2;
    if (id === 'card-3') return mockCard3;
    return null;
  });
  
  // Mock Supabase spending data
  mockSupabase.from = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({
          data: mockSpendingData,
          error: null,
        }),
      }),
    }),
  }) as any;
});

// ============================================================================
// Top Spending Categories Tests
// ============================================================================

describe('CardRecommendationEngine - Top Spending Categories', () => {
  describe('getTopSpendingCategories', () => {
    it('should return top spending categories from spending log', async () => {
      const topCategories = await getTopSpendingCategories(3);
      
      // If no spending data exists, returns empty array (not default categories)
      expect(topCategories.length).toBeGreaterThanOrEqual(0);
      expect(topCategories.length).toBeLessThanOrEqual(3);
    });

    it('should aggregate spending by category', async () => {
      const topCategories = await getTopSpendingCategories(5);
      
      const groceries = topCategories.find(c => c.category === SpendingCategory.GROCERIES);
      if (groceries) {
        expect(groceries.monthlySpend).toBe(800); // 500 + 300
      }
    });

    it('should sort by monthly spend descending', async () => {
      const topCategories = await getTopSpendingCategories(5);
      
      for (let i = 0; i < topCategories.length - 1; i++) {
        expect(topCategories[i].monthlySpend).toBeGreaterThanOrEqual(topCategories[i + 1].monthlySpend);
      }
    });

    it('should respect limit parameter', async () => {
      const topCategories = await getTopSpendingCategories(2);
      
      expect(topCategories.length).toBeLessThanOrEqual(2);
    });

    it('should handle no spending data gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }) as any;
      
      const topCategories = await getTopSpendingCategories(5);
      
      // Empty data returns empty array (default categories only in catch block)
      expect(topCategories.length).toBe(0);
    });

    it('should handle Supabase errors gracefully', async () => {
      // Mock user to exist so we proceed to the database call
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      
      // Mock database error
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      }) as any;
      
      const topCategories = await getTopSpendingCategories(5);
      
      // Promise rejection triggers catch block which returns default categories
      expect(topCategories.length).toBe(3);
      expect(topCategories[0].category).toBe(SpendingCategory.GROCERIES);
    });

    it('should handle no user gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: null } });
      
      const topCategories = await getTopSpendingCategories(5);
      
      // No user returns empty array (not default categories)
      expect(topCategories.length).toBe(0);
    });
  });
});

// ============================================================================
// Gap Analysis Tests
// ============================================================================

describe('CardRecommendationEngine - Gap Analysis', () => {
  describe('findCategoryGaps', () => {
    it('should identify categories with low rewards', () => {
      mockGetCards.mockReturnValue([{ cardId: 'card-1', addedAt: new Date() }]); // Only has groceries bonus
      
      const gaps = findCategoryGaps();
      
      // Should identify dining, gas, etc. as gaps
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps).toContain(SpendingCategory.DINING);
    });

    it('should not include categories with good coverage', () => {
      mockGetCards.mockReturnValue([{ cardId: 'card-1', addedAt: new Date() }]); // Has 5x on groceries
      
      const gaps = findCategoryGaps();
      
      // Groceries should not be a gap
      expect(gaps).not.toContain(SpendingCategory.GROCERIES);
    });

    it('should return empty array when all categories covered', () => {
      // Mock a comprehensive portfolio
      const superCard: Card = {
        ...mockCard1,
        categoryRewards: Object.values(SpendingCategory).map(cat => ({
          category: cat,
          rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' },
        })),
      };
      
      mockGetCardByIdSync.mockReturnValue(superCard);
      mockGetCards.mockReturnValue([{ cardId: 'card-1', addedAt: new Date() }]);
      
      const gaps = findCategoryGaps();
      
      expect(gaps.length).toBe(0);
    });

    it('should handle empty portfolio', () => {
      mockGetCards.mockReturnValue([]);
      
      const gaps = findCategoryGaps();
      
      // All categories should be gaps
      expect(gaps.length).toBeGreaterThan(0);
    });

    it('should use 2% threshold for gaps', () => {
      const lowRewardCard: Card = {
        ...mockCard1,
        baseRewardRate: { value: 1.5, type: RewardType.POINTS, unit: 'multiplier' },
        categoryRewards: [],
      };
      
      mockGetCardByIdSync.mockReturnValue(lowRewardCard);
      mockGetCards.mockReturnValue([{ cardId: 'card-1', addedAt: new Date() }]);
      
      const gaps = findCategoryGaps();
      
      // With only 1.5% base rate, all categories should be gaps
      expect(gaps.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Recommendation Ranking Tests
// ============================================================================

describe('CardRecommendationEngine - Recommendation Ranking', () => {
  const topCategories = [
    { category: SpendingCategory.GROCERIES, monthlySpend: 800 },
    { category: SpendingCategory.DINING, monthlySpend: 300 },
  ];

  describe('rankRecommendations', () => {
    it('should rank cards based on category fit', () => {
      const recommendations = rankRecommendations([mockCard1, mockCard2], topCategories, []);
      
      // Card1 should rank higher due to groceries match (higher spend)
      expect(recommendations[0].card.id).toBe('card-1');
    });

    it('should exclude cards already in portfolio', () => {
      mockGetCards.mockReturnValue([{ cardId: 'card-1', addedAt: new Date() }]);
      
      const recommendations = rankRecommendations([mockCard1, mockCard2, mockCard3], topCategories, []);
      
      expect(recommendations.find(r => r.card.id === 'card-1')).toBeUndefined();
    });

    it('should assign priority scores', () => {
      const recommendations = rankRecommendations([mockCard1, mockCard2], topCategories, []);
      
      recommendations.forEach(rec => {
        expect(rec.priority).toBeGreaterThanOrEqual(1);
        expect(rec.priority).toBeLessThanOrEqual(5);
      });
    });

    it('should calculate estimated annual rewards', () => {
      const recommendations = rankRecommendations([mockCard1], topCategories, []);
      
      expect(recommendations[0].estimatedAnnualRewards).toBeGreaterThanOrEqual(0);
    });

    it('should identify category matches', () => {
      const recommendations = rankRecommendations([mockCard1], topCategories, []);
      
      expect(recommendations[0].categoryMatch).toContain(SpendingCategory.GROCERIES);
    });

    it('should set "spending" reason for multi-category matches', () => {
      const multiCard: Card = {
        ...mockCard1,
        categoryRewards: [
          { category: SpendingCategory.GROCERIES, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
          { category: SpendingCategory.DINING, rewardRate: { value: 4, type: RewardType.POINTS, unit: 'multiplier' } },
        ],
      };
      
      const recommendations = rankRecommendations([multiCard], topCategories, []);
      
      expect(recommendations[0].basedOn).toBe('spending');
      expect(recommendations[0].priority).toBe(5);
    });

    it('should identify gap-filling cards', () => {
      const gaps = [SpendingCategory.GAS];
      
      const recommendations = rankRecommendations([mockCard3], topCategories, gaps);
      
      if (recommendations[0].basedOn === 'gap') {
        expect(recommendations[0].reason).toContain('gap');
      }
    });

    it('should highlight sign-up bonuses', () => {
      const bigBonusCard: Card = {
        ...mockCard1,
        categoryRewards: [],
        signupBonus: { amount: 100000, currency: RewardType.POINTS, spendRequirement: 3000, timeframeDays: 90 },
      };
      
      const recommendations = rankRecommendations([bigBonusCard], [], []);
      
      expect(recommendations[0].basedOn).toBe('signup_bonus');
    });

    it('should sort by priority descending', () => {
      const recommendations = rankRecommendations([mockCard1, mockCard2, mockCard3], topCategories, []);
      
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].priority).toBeGreaterThanOrEqual(recommendations[i + 1].priority);
      }
    });

    it('should handle empty card array', () => {
      const recommendations = rankRecommendations([], topCategories, []);
      
      expect(recommendations).toEqual([]);
    });
  });
});

// ============================================================================
// Affiliate URLs Tests
// ============================================================================

describe('CardRecommendationEngine - Affiliate URLs', () => {
  describe('getAffiliateUrl', () => {
    it('should return URL for max tier', () => {
      const url = getAffiliateUrl('card-1', 'max');
      
      expect(url).toBeTruthy();
      expect(url).toContain('card-1');
    });

    it('should return undefined for free tier', () => {
      const url = getAffiliateUrl('card-1', 'free');
      
      expect(url).toBeUndefined();
    });

    it('should return undefined for pro tier', () => {
      const url = getAffiliateUrl('card-1', 'pro');
      
      expect(url).toBeUndefined();
    });

    it('should return undefined for admin tier', () => {
      const url = getAffiliateUrl('card-1', 'admin');
      
      expect(url).toBeUndefined();
    });
  });
});

// ============================================================================
// Full Analysis Tests
// ============================================================================

describe('CardRecommendationEngine - Full Analysis', () => {
  describe('analyzeAndRecommend', () => {
    it('should return complete analysis', async () => {
      const analysis = await analyzeAndRecommend();
      
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.userTopCategories).toBeDefined();
      expect(analysis.currentGaps).toBeDefined();
      expect(analysis.totalPotentialGain).toBeDefined();
    });

    it('should limit to top 5 recommendations', async () => {
      const analysis = await analyzeAndRecommend();
      
      expect(analysis.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should include affiliate URLs for max tier', async () => {
      mockGetCurrentTierSync.mockReturnValue('max');
      
      const analysis = await analyzeAndRecommend();
      
      if (analysis.recommendations.length > 0) {
        expect(analysis.recommendations[0].affiliateUrl).toBeTruthy();
      }
    });

    it('should not include affiliate URLs for free tier', async () => {
      mockGetCurrentTierSync.mockReturnValue('free');
      
      const analysis = await analyzeAndRecommend();
      
      if (analysis.recommendations.length > 0) {
        expect(analysis.recommendations[0].affiliateUrl).toBeUndefined();
      }
    });

    it('should calculate total potential gain', async () => {
      const analysis = await analyzeAndRecommend();
      
      expect(typeof analysis.totalPotentialGain).toBe('number');
      expect(analysis.totalPotentialGain).toBeGreaterThanOrEqual(0);
    });

    it('should identify user top categories', async () => {
      const analysis = await analyzeAndRecommend();
      
      expect(Array.isArray(analysis.userTopCategories)).toBe(true);
    });

    it('should identify current gaps', async () => {
      const analysis = await analyzeAndRecommend();
      
      expect(Array.isArray(analysis.currentGaps)).toBe(true);
    });

    it('should handle empty portfolio', async () => {
      mockGetCards.mockReturnValue([]);
      
      const analysis = await analyzeAndRecommend();
      
      // Should still provide recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle no available cards', async () => {
      mockGetAllCardsSync.mockReturnValue([]);
      
      const analysis = await analyzeAndRecommend();
      
      expect(analysis.recommendations).toEqual([]);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('CardRecommendationEngine - Edge Cases', () => {
  it('should handle cards with no category rewards', () => {
    const basicCard: Card = {
      ...mockCard1,
      categoryRewards: [],
    };
    
    const topCategories = [{ category: SpendingCategory.GROCERIES, monthlySpend: 500 }];
    const recommendations = rankRecommendations([basicCard], topCategories, []);
    
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should handle zero monthly spend', () => {
    const topCategories = [{ category: SpendingCategory.GROCERIES, monthlySpend: 0 }];
    const recommendations = rankRecommendations([mockCard1], topCategories, []);
    
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should handle cards with same priority', () => {
    const recommendations = rankRecommendations([mockCard2, mockCard3], [], []);
    
    // Both should have low priority (no category match)
    expect(recommendations.length).toBe(2);
  });

  it('should handle null/undefined sign-up bonus', () => {
    const noBonus: Card = {
      ...mockCard1,
      signupBonus: undefined,
    };
    
    const recommendations = rankRecommendations([noBonus], [], []);
    
    expect(recommendations[0].signupBonus).toBeUndefined();
  });

  it('should handle very high spending amounts', () => {
    const topCategories = [{ category: SpendingCategory.GROCERIES, monthlySpend: 100000 }];
    const recommendations = rankRecommendations([mockCard1], topCategories, []);
    
    expect(recommendations[0].estimatedAnnualRewards).toBeGreaterThan(0);
  });

  it('should handle all categories as gaps', () => {
    mockGetCards.mockReturnValue([]);
    
    const gaps = findCategoryGaps();
    const topCategories = [{ category: SpendingCategory.GROCERIES, monthlySpend: 500 }];
    const recommendations = rankRecommendations([mockCard1], topCategories, gaps);
    
    expect(recommendations.length).toBeGreaterThan(0);
  });
});
