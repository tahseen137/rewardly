/**
 * SignupBonusService - Unit Tests
 * 
 * Tests signup bonus ROI calculations, timeline generation, and verdicts
 */

import {
  calculateBonusValueCAD,
  calculateMonthsToHit,
  calculateMonthlySpendNeeded,
  canHitMinimumSpend,
  generateTimeline,
  calculateFirstYearValue,
  calculateOngoingValue,
  determineVerdict,
  calculateSignupBonusROI,
  compareSignupBonuses,
  findBestSignupBonuses,
} from '../SignupBonusService';
import { Card, SignupBonus, SpendingCategory, SpendingProfileInput, RewardType } from '../../types';
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
jest.mock('../FeeBreakevenService', () => ({
  calculateTotalAnnualRewards: jest.fn((card: Card, profile: SpendingProfileInput) => {
    // Simple mock: $1875 annual spend × 1% base rate = $225
    return 225;
  }),
}));

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
}; // Total: $1875/month

const mockSignupBonus: SignupBonus = {
  amount: 50000, // 50,000 points
  currency: RewardType.POINTS,
  spendRequirement: 3000,
  timeframeDays: 90,
};

const mockCardWithBonus: Card = {
  id: 'card-with-bonus',
  name: 'Bonus Card',
  issuer: 'Bank A',
  rewardProgram: 'Points',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [],
  annualFee: 120,
  pointValuation: 1, // 1 cent per point
  signupBonus: mockSignupBonus,
};

const mockCashbackBonus: SignupBonus = {
  amount: 20000, // $200 cashback (in cents)
  currency: RewardType.CASHBACK,
  spendRequirement: 1500,
  timeframeDays: 90,
};

const mockCashbackCard: Card = {
  id: 'cashback-card',
  name: 'Cashback Card',
  issuer: 'Bank B',
  rewardProgram: 'Cashback',
  baseRewardRate: { value: 1.5, type: RewardType.CASHBACK, unit: 'percent' },
  categoryRewards: [],
  annualFee: 0,
  signupBonus: mockCashbackBonus,
};

const mockHighValueBonus: SignupBonus = {
  amount: 100000, // 100,000 points
  currency: RewardType.POINTS,
  spendRequirement: 5000,
  timeframeDays: 90,
};

const mockHighValueCard: Card = {
  id: 'high-value-card',
  name: 'Premium Card',
  issuer: 'Bank C',
  rewardProgram: 'Premium Points',
  baseRewardRate: { value: 2, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [],
  annualFee: 500,
  signupBonus: mockHighValueBonus,
  programDetails: {
    programName: 'Premium Points',
    optimalRateCents: 2, // 2 cents per point
  },
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  mockGetAllCardsSync.mockReturnValue([mockCardWithBonus, mockCashbackCard, mockHighValueCard]);
  mockGetCardByIdSync.mockImplementation((id: string) => {
    if (id === 'card-with-bonus') return mockCardWithBonus;
    if (id === 'cashback-card') return mockCashbackCard;
    if (id === 'high-value-card') return mockHighValueCard;
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

describe('calculateBonusValueCAD', () => {
  it('should calculate value for points bonuses correctly', () => {
    // 50,000 points × 1 cent = $500
    const value = calculateBonusValueCAD(mockSignupBonus, mockCardWithBonus);
    expect(value).toBeCloseTo(500, 2);
  });

  it('should calculate value for cashback bonuses correctly', () => {
    // $200 in cents / 100 = $200
    const value = calculateBonusValueCAD(mockCashbackBonus, mockCashbackCard);
    expect(value).toBeCloseTo(200, 2);
  });

  it('should use optimal rate from program details', () => {
    // 100,000 points × 2 cents = $2,000
    const value = calculateBonusValueCAD(mockHighValueBonus, mockHighValueCard);
    expect(value).toBeCloseTo(2000, 2);
  });

  it('should handle missing point valuation', () => {
    const cardNoValuation: Card = {
      ...mockCardWithBonus,
      pointValuation: undefined,
    };
    
    // Should default to 1 cent per point
    const value = calculateBonusValueCAD(mockSignupBonus, cardNoValuation);
    expect(value).toBeCloseTo(500, 2);
  });
});

describe('calculateMonthsToHit', () => {
  it('should calculate correct months for achievable spend', () => {
    // $3000 / $1875/month = 1.6 → 2 months
    const months = calculateMonthsToHit(3000, 1875);
    expect(months).toBe(2);
  });

  it('should return Infinity for zero monthly spend', () => {
    const months = calculateMonthsToHit(3000, 0);
    expect(months).toBe(Infinity);
  });

  it('should handle exact division', () => {
    // $3000 / $1000/month = 3 months
    const months = calculateMonthsToHit(3000, 1000);
    expect(months).toBe(3);
  });

  it('should always round up', () => {
    // $3000 / $2500/month = 1.2 → 2 months
    const months = calculateMonthsToHit(3000, 2500);
    expect(months).toBe(2);
  });
});

describe('calculateMonthlySpendNeeded', () => {
  it('should calculate monthly spend needed for 90-day window', () => {
    // $3000 / 3 months = $1000/month
    const needed = calculateMonthlySpendNeeded(3000, 90);
    expect(needed).toBe(1000);
  });

  it('should round up to nearest dollar', () => {
    // $3333 / 3 months = $1111/month
    const needed = calculateMonthlySpendNeeded(3333, 90);
    expect(needed).toBe(1111);
  });

  it('should handle shorter timeframes', () => {
    // $1500 / 2 months (60 days) = $750/month
    const needed = calculateMonthlySpendNeeded(1500, 60);
    expect(needed).toBe(750);
  });
});

describe('canHitMinimumSpend', () => {
  it('should return true when months to hit is within timeframe', () => {
    const can = canHitMinimumSpend(2, 90); // 2 months within 90 days (3 months)
    expect(can).toBe(true);
  });

  it('should return false when months exceed timeframe', () => {
    const can = canHitMinimumSpend(5, 90); // 5 months exceeds 90 days (3 months)
    expect(can).toBe(false);
  });

  it('should handle exact match', () => {
    const can = canHitMinimumSpend(3, 90); // 3 months = 90 days
    expect(can).toBe(true);
  });
});

describe('generateTimeline', () => {
  it('should generate timeline until target is hit', () => {
    const timeline = generateTimeline(1000, 3000, 6);
    
    expect(timeline.length).toBe(3); // Should stop at month 3
    expect(timeline[0].month).toBe(1);
    expect(timeline[0].cumulativeSpend).toBe(1000);
    expect(timeline[0].hitTarget).toBe(false);
    
    expect(timeline[2].month).toBe(3);
    expect(timeline[2].cumulativeSpend).toBe(3000);
    expect(timeline[2].hitTarget).toBe(true);
  });

  it('should calculate percent complete correctly', () => {
    const timeline = generateTimeline(1000, 3000, 6);
    
    expect(timeline[0].percentComplete).toBeCloseTo(33.33, 1);
    expect(timeline[1].percentComplete).toBeCloseTo(66.67, 1);
    expect(timeline[2].percentComplete).toBe(100);
  });

  it('should cap at maxMonths if target not hit', () => {
    const timeline = generateTimeline(500, 3000, 3);
    
    expect(timeline.length).toBe(3);
    expect(timeline[2].hitTarget).toBe(false);
    expect(timeline[2].percentComplete).toBe(50);
  });

  it('should handle hitting target in month 1', () => {
    const timeline = generateTimeline(3000, 3000, 6);
    
    expect(timeline.length).toBe(1);
    expect(timeline[0].hitTarget).toBe(true);
  });
});

describe('calculateFirstYearValue', () => {
  it('should calculate correct first year value', () => {
    // $500 bonus + $225 rewards - $120 fee = $605
    const value = calculateFirstYearValue(500, 225, 120);
    expect(value).toBe(605);
  });

  it('should handle negative result', () => {
    const value = calculateFirstYearValue(100, 50, 200);
    expect(value).toBe(-50);
  });

  it('should handle no annual fee', () => {
    const value = calculateFirstYearValue(200, 100, 0);
    expect(value).toBe(300);
  });
});

describe('calculateOngoingValue', () => {
  it('should calculate correct ongoing value', () => {
    // $225 rewards - $120 fee = $105
    const value = calculateOngoingValue(225, 120);
    expect(value).toBe(105);
  });

  it('should handle negative result', () => {
    const value = calculateOngoingValue(50, 120);
    expect(value).toBe(-70);
  });
});

describe('determineVerdict', () => {
  it('should return "not_worth_it" when cannot hit minimum', () => {
    const { verdict } = determineVerdict(false, 150, 600, 100);
    expect(verdict).toBe('not_worth_it');
  });

  it('should return "excellent" for ideal conditions', () => {
    const { verdict } = determineVerdict(true, 60, 600, 150);
    expect(verdict).toBe('excellent');
  });

  it('should return "good" for solid conditions', () => {
    const { verdict } = determineVerdict(true, 90, 300, 50);
    expect(verdict).toBe('good');
  });

  it('should return "marginal" for borderline conditions', () => {
    const { verdict } = determineVerdict(true, 95, 150, -20);
    expect(verdict).toBe('marginal');
  });

  it('should return "not_worth_it" for negative first year value', () => {
    const { verdict } = determineVerdict(true, 80, -50, -100);
    expect(verdict).toBe('not_worth_it');
  });

  it('should include reason in result', () => {
    const { reason } = determineVerdict(true, 60, 600, 150);
    expect(reason).toBeDefined();
    expect(reason.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Main API
// ============================================================================

describe('calculateSignupBonusROI', () => {
  it('should calculate complete ROI for card with bonus', () => {
    const result = calculateSignupBonusROI('card-with-bonus', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.card.id).toBe('card-with-bonus');
      expect(result.value.bonusValueCAD).toBeCloseTo(500, 0);
      expect(result.value.canHitMinimum).toBe(true);
      expect(result.value.verdict).toBeDefined();
    }
  });

  it('should fail for non-existent card', () => {
    const result = calculateSignupBonusROI('non-existent', mockSpendingProfile);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CARD_NOT_FOUND');
    }
  });

  it('should fail for card with no signup bonus', () => {
    const cardNoBonus: Card = {
      ...mockCardWithBonus,
      signupBonus: undefined,
    };
    mockGetCardByIdSync.mockReturnValue(cardNoBonus);
    
    const result = calculateSignupBonusROI('card-with-bonus', mockSpendingProfile);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NO_SIGNUP_BONUS');
    }
  });

  it('should fail when no spending profile exists', () => {
    mockGetSpendingProfileSync.mockReturnValue(null);
    
    const result = calculateSignupBonusROI('card-with-bonus');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('SPENDING_PROFILE_REQUIRED');
    }
  });

  it('should detect when user cannot hit minimum spend', () => {
    const lowSpendProfile: SpendingProfileInput = {
      groceries: 200,
      dining: 100,
      gas: 50,
      travel: 0,
      onlineShopping: 50,
      entertainment: 0,
      drugstores: 0,
      homeImprovement: 0,
      transit: 0,
      other: 0,
    }; // Total: $400/month
    
    const result = calculateSignupBonusROI('card-with-bonus', lowSpendProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.canHitMinimum).toBe(false);
      expect(result.value.verdict).toBe('not_worth_it');
    }
  });

  it('should calculate timeline correctly', () => {
    const result = calculateSignupBonusROI('card-with-bonus', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.timeline.length).toBeGreaterThan(0);
      expect(result.value.timeline[0].month).toBe(1);
    }
  });

  it('should handle cashback bonuses', () => {
    const result = calculateSignupBonusROI('cashback-card', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.bonusValueCAD).toBeCloseTo(200, 0);
      expect(result.value.canHitMinimum).toBe(true);
    }
  });

  it('should handle high-value cards with optimal rates', () => {
    const result = calculateSignupBonusROI('high-value-card', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.bonusValueCAD).toBeCloseTo(2000, 0);
    }
  });

  it('should cap monthsToHit at 12', () => {
    const veryLowSpendProfile: SpendingProfileInput = {
      groceries: 100,
      dining: 50,
      gas: 0,
      travel: 0,
      onlineShopping: 0,
      entertainment: 0,
      drugstores: 0,
      homeImprovement: 0,
      transit: 0,
      other: 0,
    }; // Total: $150/month
    
    const result = calculateSignupBonusROI('card-with-bonus', veryLowSpendProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.monthsToHit).toBeLessThanOrEqual(12);
    }
  });
});

describe('compareSignupBonuses', () => {
  it('should compare multiple cards and sort by first year value', () => {
    const results = compareSignupBonuses(
      ['card-with-bonus', 'cashback-card', 'high-value-card'],
      mockSpendingProfile
    );
    
    expect(results.length).toBe(3);
    // Should be sorted descending by first year value
    expect(results[0].firstYearValue).toBeGreaterThanOrEqual(results[1].firstYearValue);
    expect(results[1].firstYearValue).toBeGreaterThanOrEqual(results[2].firstYearValue);
  });

  it('should skip cards with errors', () => {
    const results = compareSignupBonuses(
      ['card-with-bonus', 'non-existent', 'cashback-card'],
      mockSpendingProfile
    );
    
    expect(results.length).toBe(2);
  });

  it('should handle empty input', () => {
    const results = compareSignupBonuses([], mockSpendingProfile);
    expect(results.length).toBe(0);
  });
});

describe('findBestSignupBonuses', () => {
  it('should find best signup bonuses for spending profile', () => {
    const results = findBestSignupBonuses(mockSpendingProfile, 2);
    
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0].card.signupBonus).toBeDefined();
  });

  it('should limit results to specified count', () => {
    const results = findBestSignupBonuses(mockSpendingProfile, 1);
    expect(results.length).toBe(1);
  });

  it('should use cached spending profile when not provided', () => {
    const results = findBestSignupBonuses();
    expect(results.length).toBeGreaterThan(0);
    expect(mockGetSpendingProfileSync).toHaveBeenCalled();
  });

  it('should only include cards with signup bonuses', () => {
    const cardNoBonus: Card = {
      id: 'no-bonus-card',
      name: 'No Bonus',
      issuer: 'Bank D',
      rewardProgram: 'Basic',
      baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
      categoryRewards: [],
      annualFee: 0,
    };
    
    mockGetAllCardsSync.mockReturnValue([
      mockCardWithBonus,
      cardNoBonus,
      mockCashbackCard,
    ]);
    
    const results = findBestSignupBonuses(mockSpendingProfile, 10);
    
    // Should only return cards with bonuses
    results.forEach(result => {
      expect(result.card.signupBonus).toBeDefined();
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('should handle very short timeframes', () => {
    const shortBonus: SignupBonus = {
      amount: 10000,
      currency: RewardType.POINTS,
      spendRequirement: 1000,
      timeframeDays: 30,
    };
    
    const card: Card = {
      ...mockCardWithBonus,
      signupBonus: shortBonus,
    };
    
    mockGetCardByIdSync.mockReturnValue(card);
    
    const result = calculateSignupBonusROI('card-with-bonus', mockSpendingProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.canHitMinimum).toBe(true);
    }
  });

  it('should handle very long timeframes', () => {
    const longBonus: SignupBonus = {
      amount: 50000,
      currency: RewardType.POINTS,
      spendRequirement: 10000,
      timeframeDays: 365,
    };
    
    const card: Card = {
      ...mockCardWithBonus,
      signupBonus: longBonus,
    };
    
    mockGetCardByIdSync.mockReturnValue(card);
    
    const result = calculateSignupBonusROI('card-with-bonus', mockSpendingProfile);
    expect(result.success).toBe(true);
  });

  it('should handle very high minimum spend requirements', () => {
    const highSpendBonus: SignupBonus = {
      amount: 200000,
      currency: RewardType.POINTS,
      spendRequirement: 20000,
      timeframeDays: 90,
    };
    
    const card: Card = {
      ...mockCardWithBonus,
      signupBonus: highSpendBonus,
    };
    
    mockGetCardByIdSync.mockReturnValue(card);
    
    const result = calculateSignupBonusROI('card-with-bonus', mockSpendingProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.canHitMinimum).toBe(false);
    }
  });

  it('should handle zero annual fee cards', () => {
    const result = calculateSignupBonusROI('cashback-card', mockSpendingProfile);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.firstYearValue).toBeGreaterThan(0);
      expect(result.value.ongoingAnnualValue).toBeGreaterThan(0);
    }
  });
});
