/**
 * CardComparisonService - Unit Tests
 * 
 * Tests card comparison logic, tier gating, and scoring
 */

import {
  compareCards,
  getMaxCardsForTier,
  calculateOverallScore,
  getComparisonCategories,
  formatComparisonValue,
  getCategoryDisplayName,
} from '../CardComparisonService';
import { Card, SpendingCategory, RewardType } from '../../types';

// Mock dependencies
jest.mock('../CardDataService', () => ({
  getCardByIdSync: jest.fn(),
}));

jest.mock('../SubscriptionService', () => ({
  getCurrentTierSync: jest.fn(() => 'free'),
}));

jest.mock('../BenefitsService', () => ({
  getBenefitsForCard: jest.fn(() => []),
}));

jest.mock('../RewardsCalculatorService', () => ({
  calculateReward: jest.fn((card, category, amount) => {
    const categoryReward = card.categoryRewards.find((cr: any) => cr.category === category);
    const rate = categoryReward ? categoryReward.rewardRate.value : card.baseRewardRate.value;
    return (amount * rate) / 100;
  }),
}));

import { getCardByIdSync } from '../CardDataService';
import { getCurrentTierSync } from '../SubscriptionService';
import { getBenefitsForCard } from '../BenefitsService';

const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;
const mockGetCurrentTierSync = getCurrentTierSync as jest.MockedFunction<typeof getCurrentTierSync>;
const mockGetBenefitsForCard = getBenefitsForCard as jest.MockedFunction<typeof getBenefitsForCard>;

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
  annualFee: 120,
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
  annualFee: 0,
  signupBonus: { amount: 20000, currency: RewardType.CASHBACK, spendRequirement: 1000, timeframeDays: 90 },
};

const mockCard3: Card = {
  id: 'card-3',
  name: 'Travel Master',
  issuer: 'Bank C',
  rewardProgram: 'Airline Miles',
  baseRewardRate: { value: 1, type: RewardType.AIRLINE_MILES, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.TRAVEL, rewardRate: { value: 3, type: RewardType.AIRLINE_MILES, unit: 'multiplier' } },
  ],
  annualFee: 200,
  signupBonus: { amount: 75000, currency: RewardType.AIRLINE_MILES, spendRequirement: 5000, timeframeDays: 90 },
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  mockGetCardByIdSync.mockImplementation((id: string) => {
    if (id === 'card-1') return mockCard1;
    if (id === 'card-2') return mockCard2;
    if (id === 'card-3') return mockCard3;
    return null;
  });
  
  mockGetBenefitsForCard.mockReturnValue([]);
});

// ============================================================================
// Tier Limits Tests
// ============================================================================

describe('CardComparisonService - Tier Limits', () => {
  it('should allow 2 cards for free tier', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    expect(getMaxCardsForTier()).toBe(2);
  });

  it('should allow 3 cards for pro tier', () => {
    mockGetCurrentTierSync.mockReturnValue('pro');
    expect(getMaxCardsForTier()).toBe(3);
  });

  it('should allow 3 cards for max tier', () => {
    mockGetCurrentTierSync.mockReturnValue('max');
    expect(getMaxCardsForTier()).toBe(3);
  });

  it('should allow 3 cards for admin tier', () => {
    mockGetCurrentTierSync.mockReturnValue('admin');
    expect(getMaxCardsForTier()).toBe(3);
  });

  it('should handle explicit tier parameter', () => {
    expect(getMaxCardsForTier('free')).toBe(2);
    expect(getMaxCardsForTier('pro')).toBe(3);
  });
});

// ============================================================================
// Card Comparison Tests
// ============================================================================

describe('CardComparisonService - compareCards', () => {
  it('should compare two cards successfully', () => {
    const result = compareCards(['card-1', 'card-2']);
    
    expect(result.cards).toHaveLength(2);
    expect(result.categoryComparisons.length).toBeGreaterThan(0);
    expect(result.overallScores).toHaveLength(2);
    expect(result.winner).toBeTruthy();
  });

  it('should compare three cards successfully', () => {
    const result = compareCards(['card-1', 'card-2', 'card-3']);
    
    expect(result.cards).toHaveLength(3);
    expect(result.overallScores).toHaveLength(3);
  });

  it('should handle empty card array', () => {
    const result = compareCards([]);
    
    expect(result.cards).toEqual([]);
    expect(result.categoryComparisons).toEqual([]);
    expect(result.overallScores).toEqual([]);
    expect(result.winner).toBe('');
  });

  it('should filter out invalid card IDs', () => {
    const result = compareCards(['card-1', 'invalid', 'card-2']);
    
    expect(result.cards).toHaveLength(2);
  });

  it('should identify winner correctly', () => {
    // Mock benefits to make card-3 the clear winner
    mockGetBenefitsForCard.mockImplementation((id: string) => {
      if (id === 'card-3') return Array(10).fill({ name: 'Benefit', category: 'travel' });
      return [];
    });
    
    const result = compareCards(['card-1', 'card-2', 'card-3']);
    
    expect(result.winner).toBeTruthy();
    const winnerScore = result.overallScores.find(s => s.cardId === result.winner);
    expect(winnerScore).toBeTruthy();
  });

  it('should compare all standard categories', () => {
    const result = compareCards(['card-1', 'card-2']);
    
    const categories = result.categoryComparisons.map(c => c.category);
    expect(categories).toContain(SpendingCategory.GROCERIES);
    expect(categories).toContain(SpendingCategory.DINING);
    expect(categories).toContain('annual_fee');
    expect(categories).toContain('signup_bonus');
  });

  it('should mark winners in each category', () => {
    const result = compareCards(['card-1', 'card-2']);
    
    // Check annual fee comparison - card-2 has no fee, should win
    const feeComparison = result.categoryComparisons.find(c => c.category === 'annual_fee');
    expect(feeComparison).toBeTruthy();
    
    const card2FeeValue = feeComparison?.values.find(v => v.cardId === 'card-2');
    expect(card2FeeValue?.isWinner).toBe(true);
  });
});

// ============================================================================
// Score Calculation Tests
// ============================================================================

describe('CardComparisonService - calculateOverallScore', () => {
  it('should calculate score for card with good rewards', () => {
    const score = calculateOverallScore(mockCard1);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should penalize cards with high annual fees', () => {
    const highFeeCard = { ...mockCard1, annualFee: 500 };
    const noFeeCard = { ...mockCard1, annualFee: 0 };
    
    const highFeeScore = calculateOverallScore(highFeeCard);
    const noFeeScore = calculateOverallScore(noFeeCard);
    
    expect(noFeeScore).toBeGreaterThan(highFeeScore);
  });

  it('should reward cards with sign-up bonuses', () => {
    const withBonus = mockCard1;
    const withoutBonus = { ...mockCard1, signupBonus: undefined };
    
    const bonusScore = calculateOverallScore(withBonus);
    const noBonus = calculateOverallScore(withoutBonus);
    
    expect(bonusScore).toBeGreaterThan(noBonus);
  });

  it('should reward cards with benefits', () => {
    mockGetBenefitsForCard.mockReturnValue(Array(5).fill({ name: 'Benefit', category: 'travel' }));
    
    const score1 = calculateOverallScore(mockCard1);
    
    mockGetBenefitsForCard.mockReturnValue([]);
    const score2 = calculateOverallScore(mockCard1);
    
    expect(score1).toBeGreaterThan(score2);
  });

  it('should never return score below 0', () => {
    const terribleCard: Card = {
      ...mockCard1,
      baseRewardRate: { value: 0, type: RewardType.POINTS, unit: 'multiplier' },
      categoryRewards: [],
      annualFee: 1000,
      signupBonus: undefined,
    };
    
    const score = calculateOverallScore(terribleCard);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should never return score above 100', () => {
    const amazingCard: Card = {
      ...mockCard1,
      baseRewardRate: { value: 10, type: RewardType.POINTS, unit: 'multiplier' },
      categoryRewards: [
        { category: SpendingCategory.GROCERIES, rewardRate: { value: 20, type: RewardType.POINTS, unit: 'multiplier' } },
        { category: SpendingCategory.DINING, rewardRate: { value: 20, type: RewardType.POINTS, unit: 'multiplier' } },
      ],
      signupBonus: { amount: 1000000, currency: RewardType.POINTS, spendRequirement: 1, timeframeDays: 365 },
      annualFee: 0,
    };
    
    mockGetBenefitsForCard.mockReturnValue(Array(50).fill({ name: 'Benefit', category: 'travel' }));
    
    const score = calculateOverallScore(amazingCard);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Formatting Tests
// ============================================================================

describe('CardComparisonService - formatComparisonValue', () => {
  it('should format annual fee correctly', () => {
    expect(formatComparisonValue(120, 'annual_fee')).toBe('$120');
    expect(formatComparisonValue(0, 'annual_fee')).toBe('No fee');
  });

  it('should format signup bonus correctly', () => {
    expect(formatComparisonValue(50000, 'signup_bonus')).toBe('50,000');
    expect(formatComparisonValue(0, 'signup_bonus')).toBe('None');
  });

  it('should format benefits count correctly', () => {
    expect(formatComparisonValue(5, 'benefits_count')).toBe('5');
    expect(formatComparisonValue(0, 'benefits_count')).toBe('0');
  });

  it('should format rewards as percentage for values < 1', () => {
    expect(formatComparisonValue(0.5, SpendingCategory.GROCERIES)).toBe('50.0%');
    expect(formatComparisonValue(0, SpendingCategory.DINING)).toBe('0%');
  });

  it('should format rewards as multiplier for values >= 1', () => {
    expect(formatComparisonValue(5, SpendingCategory.GROCERIES)).toBe('5.0x');
    expect(formatComparisonValue(1, SpendingCategory.DINING)).toBe('1.0x');
  });

  it('should handle string values', () => {
    expect(formatComparisonValue('Free', 'annual_fee')).toBe('Free');
  });
});

describe('CardComparisonService - getCategoryDisplayName', () => {
  it('should return display name for spending categories', () => {
    expect(getCategoryDisplayName(SpendingCategory.GROCERIES)).toBe('Groceries');
    expect(getCategoryDisplayName(SpendingCategory.DINING)).toBe('Dining');
    expect(getCategoryDisplayName(SpendingCategory.GAS)).toBe('Gas');
  });

  it('should return display name for special categories', () => {
    expect(getCategoryDisplayName('annual_fee')).toBe('Annual Fee');
    expect(getCategoryDisplayName('signup_bonus')).toBe('Sign-Up Bonus');
    expect(getCategoryDisplayName('benefits_count')).toBe('Benefits');
  });

  it('should handle all valid categories', () => {
    const categories = getComparisonCategories();
    
    categories.forEach(cat => {
      const displayName = getCategoryDisplayName(cat as any);
      expect(displayName).toBeTruthy();
      expect(typeof displayName).toBe('string');
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('CardComparisonService - Edge Cases', () => {
  it('should handle card with no category rewards', () => {
    const noCategories: Card = {
      ...mockCard1,
      categoryRewards: [],
    };
    
    mockGetCardByIdSync.mockReturnValue(noCategories);
    
    const score = calculateOverallScore(noCategories);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should handle card with null/undefined fields', () => {
    const incompleteCard: Card = {
      id: 'card-incomplete',
      name: 'Incomplete',
      issuer: 'Bank',
      rewardProgram: 'Points',
      baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
      categoryRewards: [],
      annualFee: undefined,
      signupBonus: undefined,
    };
    
    mockGetCardByIdSync.mockReturnValue(incompleteCard);
    
    const score = calculateOverallScore(incompleteCard);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should handle comparison with single card', () => {
    const result = compareCards(['card-1']);
    
    expect(result.cards).toHaveLength(1);
    expect(result.winner).toBe('card-1');
  });

  it('should handle comparison with duplicate card IDs', () => {
    const result = compareCards(['card-1', 'card-1']);
    
    expect(result.cards.length).toBeGreaterThan(0);
  });

  it('should handle zero values in all categories', () => {
    const zeroCard: Card = {
      id: 'zero',
      name: 'Zero Card',
      issuer: 'Bank',
      rewardProgram: 'Points',
      baseRewardRate: { value: 0, type: RewardType.POINTS, unit: 'multiplier' },
      categoryRewards: [],
      annualFee: 0,
    };
    
    mockGetCardByIdSync.mockReturnValue(zeroCard);
    
    const score = calculateOverallScore(zeroCard);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Category Comparisons
// ============================================================================

describe('CardComparisonService - Category Comparisons', () => {
  it('should correctly identify winner for annual fee (lower is better)', () => {
    const result = compareCards(['card-1', 'card-2']);
    
    const feeComparison = result.categoryComparisons.find(c => c.category === 'annual_fee');
    const card2Value = feeComparison?.values.find(v => v.cardId === 'card-2');
    
    expect(card2Value?.isWinner).toBe(true); // card-2 has $0 fee
  });

  it('should correctly identify winner for signup bonus (higher is better)', () => {
    const result = compareCards(['card-1', 'card-3']);
    
    const bonusComparison = result.categoryComparisons.find(c => c.category === 'signup_bonus');
    const card3Value = bonusComparison?.values.find(v => v.cardId === 'card-3');
    
    expect(card3Value?.isWinner).toBe(true); // card-3 has 75,000 bonus
  });

  it('should handle ties in categories', () => {
    const tiedCards: Card[] = [
      { ...mockCard1, annualFee: 100 },
      { ...mockCard2, annualFee: 100 },
    ];
    
    mockGetCardByIdSync.mockImplementation((id: string) => {
      if (id === 'card-1') return tiedCards[0];
      if (id === 'card-2') return tiedCards[1];
      return null;
    });
    
    const result = compareCards(['card-1', 'card-2']);
    const feeComparison = result.categoryComparisons.find(c => c.category === 'annual_fee');
    
    const winnersCount = feeComparison?.values.filter(v => v.isWinner).length || 0;
    expect(winnersCount).toBeGreaterThan(0); // Both should be marked as winners in a tie
  });

  it('should compare all spending categories', () => {
    const result = compareCards(['card-1', 'card-2', 'card-3']);
    
    const categories = result.categoryComparisons.map(c => c.category);
    
    expect(categories).toContain(SpendingCategory.GROCERIES);
    expect(categories).toContain(SpendingCategory.DINING);
    expect(categories).toContain(SpendingCategory.GAS);
    expect(categories).toContain(SpendingCategory.TRAVEL);
  });
});

// ============================================================================
// getComparisonCategories Tests
// ============================================================================

describe('CardComparisonService - getComparisonCategories', () => {
  it('should return array of categories', () => {
    const categories = getComparisonCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should include spending categories', () => {
    const categories = getComparisonCategories();
    expect(categories).toContain(SpendingCategory.GROCERIES);
    expect(categories).toContain(SpendingCategory.DINING);
  });

  it('should include special categories', () => {
    const categories = getComparisonCategories();
    expect(categories).toContain('annual_fee');
    expect(categories).toContain('signup_bonus');
    expect(categories).toContain('benefits_count');
  });

  it('should return new array (immutable)', () => {
    const cat1 = getComparisonCategories();
    const cat2 = getComparisonCategories();
    
    expect(cat1).not.toBe(cat2);
    expect(cat1).toEqual(cat2);
  });
});
