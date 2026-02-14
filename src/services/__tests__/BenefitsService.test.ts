/**
 * BenefitsService - Unit Tests
 * 
 * Tests card benefits data, tier gating, and filtering
 */

import {
  getBenefitsForCard,
  getBenefitsByCategory,
  getVisibleBenefits,
  canViewAllBenefits,
  getLockedBenefitsCount,
  getBenefitCategoryName,
  hasBenefitsData,
  getBenefitCategoryIcon,
  sortBenefitsByPriority,
} from '../BenefitsService';
import { Benefit, BenefitCategory } from '../../types';
import { SubscriptionTier } from '../SubscriptionService';

// Mock dependencies
jest.mock('../CardDataService', () => ({
  getCardByIdSync: jest.fn(),
}));

jest.mock('../SubscriptionService', () => ({
  getCurrentTierSync: jest.fn(() => 'free'),
}));

import { getCardByIdSync } from '../CardDataService';
import { getCurrentTierSync } from '../SubscriptionService';

const mockGetCardByIdSync = getCardByIdSync as jest.MockedFunction<typeof getCardByIdSync>;
const mockGetCurrentTierSync = getCurrentTierSync as jest.MockedFunction<typeof getCurrentTierSync>;

// ============================================================================
// Test Data
// ============================================================================

const mockBenefits: Benefit[] = [
  {
    name: 'Travel Insurance',
    description: 'Up to $500,000 coverage',
    category: 'travel',
    value: '$500,000',
  },
  {
    name: 'Purchase Protection',
    description: '90-day protection on purchases',
    category: 'purchase',
    value: '$500',
  },
  {
    name: 'Cell Phone Protection',
    description: 'Up to $800 coverage',
    category: 'insurance',
    value: '$800',
  },
  {
    name: 'Lounge Access',
    description: 'Priority Pass membership',
    category: 'lifestyle',
    value: 'Unlimited',
  },
  {
    name: 'Extended Warranty',
    description: 'Double manufacturer warranty',
    category: 'purchase',
  },
];

// ============================================================================
// getBenefitsForCard Tests
// ============================================================================

describe('BenefitsService - getBenefitsForCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when card not found', () => {
    mockGetCardByIdSync.mockReturnValue(null);
    const benefits = getBenefitsForCard('invalid-card');
    expect(benefits).toEqual([]);
  });

  it('should return empty array when card exists but has no benefits', () => {
    mockGetCardByIdSync.mockReturnValue({
      id: 'card-1',
      name: 'Test Card',
    } as any);
    
    const benefits = getBenefitsForCard('card-1');
    expect(benefits).toEqual([]);
  });

  it('should handle null card gracefully', () => {
    mockGetCardByIdSync.mockReturnValue(null);
    const benefits = getBenefitsForCard('');
    expect(benefits).toEqual([]);
  });
});

// ============================================================================
// getBenefitsByCategory Tests
// ============================================================================

describe('BenefitsService - getBenefitsByCategory', () => {
  it('should group benefits by category correctly', () => {
    const grouped = getBenefitsByCategory(mockBenefits);
    
    expect(grouped.travel).toHaveLength(1);
    expect(grouped.purchase).toHaveLength(2);
    expect(grouped.insurance).toHaveLength(1);
    expect(grouped.lifestyle).toHaveLength(1);
  });

  it('should handle empty benefits array', () => {
    const grouped = getBenefitsByCategory([]);
    
    expect(grouped.travel).toEqual([]);
    expect(grouped.purchase).toEqual([]);
    expect(grouped.insurance).toEqual([]);
    expect(grouped.lifestyle).toEqual([]);
  });

  it('should initialize all categories even if some are empty', () => {
    const onlyTravel: Benefit[] = [{
      name: 'Travel Insurance',
      description: 'Coverage',
      category: 'travel',
    }];
    
    const grouped = getBenefitsByCategory(onlyTravel);
    
    expect(grouped.travel).toHaveLength(1);
    expect(grouped.purchase).toEqual([]);
    expect(grouped.insurance).toEqual([]);
    expect(grouped.lifestyle).toEqual([]);
  });

  it('should not mutate original array', () => {
    const original = [...mockBenefits];
    getBenefitsByCategory(mockBenefits);
    expect(mockBenefits).toEqual(original);
  });
});

// ============================================================================
// getVisibleBenefits Tests (Tier Gating)
// ============================================================================

describe('BenefitsService - getVisibleBenefits (Tier Gating)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should limit to 2 benefits for free tier', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    const visible = getVisibleBenefits(mockBenefits);
    expect(visible).toHaveLength(2);
  });

  it('should show all benefits for pro tier', () => {
    mockGetCurrentTierSync.mockReturnValue('pro');
    const visible = getVisibleBenefits(mockBenefits);
    expect(visible).toHaveLength(mockBenefits.length);
  });

  it('should show all benefits for max tier', () => {
    mockGetCurrentTierSync.mockReturnValue('max');
    const visible = getVisibleBenefits(mockBenefits);
    expect(visible).toHaveLength(mockBenefits.length);
  });

  it('should show all benefits for admin tier', () => {
    mockGetCurrentTierSync.mockReturnValue('admin');
    const visible = getVisibleBenefits(mockBenefits);
    expect(visible).toHaveLength(mockBenefits.length);
  });

  it('should handle explicit tier parameter', () => {
    const visible = getVisibleBenefits(mockBenefits, 'free');
    expect(visible).toHaveLength(2);
  });

  it('should handle empty benefits for free tier', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    const visible = getVisibleBenefits([]);
    expect(visible).toEqual([]);
  });

  it('should handle single benefit for free tier', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    const visible = getVisibleBenefits([mockBenefits[0]]);
    expect(visible).toHaveLength(1);
  });
});

// ============================================================================
// canViewAllBenefits Tests
// ============================================================================

describe('BenefitsService - canViewAllBenefits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for free tier', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    expect(canViewAllBenefits()).toBe(false);
  });

  it('should return true for pro tier', () => {
    mockGetCurrentTierSync.mockReturnValue('pro');
    expect(canViewAllBenefits()).toBe(true);
  });

  it('should return true for max tier', () => {
    mockGetCurrentTierSync.mockReturnValue('max');
    expect(canViewAllBenefits()).toBe(true);
  });

  it('should return true for admin tier', () => {
    mockGetCurrentTierSync.mockReturnValue('admin');
    expect(canViewAllBenefits()).toBe(true);
  });

  it('should handle explicit tier parameter', () => {
    expect(canViewAllBenefits('free')).toBe(false);
    expect(canViewAllBenefits('pro')).toBe(true);
  });
});

// ============================================================================
// getLockedBenefitsCount Tests
// ============================================================================

describe('BenefitsService - getLockedBenefitsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct count for free tier with 5 benefits', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    const locked = getLockedBenefitsCount(5);
    expect(locked).toBe(3); // 5 - 2 = 3 locked
  });

  it('should return 0 for free tier with 2 or fewer benefits', () => {
    mockGetCurrentTierSync.mockReturnValue('free');
    expect(getLockedBenefitsCount(2)).toBe(0);
    expect(getLockedBenefitsCount(1)).toBe(0);
    expect(getLockedBenefitsCount(0)).toBe(0);
  });

  it('should return 0 for pro tier regardless of count', () => {
    mockGetCurrentTierSync.mockReturnValue('pro');
    expect(getLockedBenefitsCount(10)).toBe(0);
    expect(getLockedBenefitsCount(5)).toBe(0);
  });

  it('should return 0 for max tier', () => {
    mockGetCurrentTierSync.mockReturnValue('max');
    expect(getLockedBenefitsCount(10)).toBe(0);
  });

  it('should handle explicit tier parameter', () => {
    expect(getLockedBenefitsCount(5, 'free')).toBe(3);
    expect(getLockedBenefitsCount(5, 'pro')).toBe(0);
  });
});

// ============================================================================
// getBenefitCategoryName Tests
// ============================================================================

describe('BenefitsService - getBenefitCategoryName', () => {
  it('should return correct name for travel category', () => {
    expect(getBenefitCategoryName('travel')).toBe('Travel Benefits');
  });

  it('should return correct name for purchase category', () => {
    expect(getBenefitCategoryName('purchase')).toBe('Purchase Protection');
  });

  it('should return correct name for insurance category', () => {
    expect(getBenefitCategoryName('insurance')).toBe('Insurance Coverage');
  });

  it('should return correct name for lifestyle category', () => {
    expect(getBenefitCategoryName('lifestyle')).toBe('Lifestyle Perks');
  });

  it('should return name for all valid categories', () => {
    const categories: BenefitCategory[] = ['travel', 'purchase', 'insurance', 'lifestyle'];
    categories.forEach(cat => {
      const name = getBenefitCategoryName(cat);
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
    });
  });
});

// ============================================================================
// hasBenefitsData Tests
// ============================================================================

describe('BenefitsService - hasBenefitsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when card not found', () => {
    mockGetCardByIdSync.mockReturnValue(null);
    expect(hasBenefitsData('invalid-card')).toBe(false);
  });

  it('should return false when card has no benefits', () => {
    mockGetCardByIdSync.mockReturnValue({ id: 'card-1' } as any);
    expect(hasBenefitsData('card-1')).toBe(false);
  });

  it('should handle empty card id', () => {
    mockGetCardByIdSync.mockReturnValue(null);
    expect(hasBenefitsData('')).toBe(false);
  });
});

// ============================================================================
// getBenefitCategoryIcon Tests
// ============================================================================

describe('BenefitsService - getBenefitCategoryIcon', () => {
  it('should return plane icon for travel', () => {
    expect(getBenefitCategoryIcon('travel')).toBe('plane');
  });

  it('should return shield-check icon for purchase', () => {
    expect(getBenefitCategoryIcon('purchase')).toBe('shield-check');
  });

  it('should return umbrella icon for insurance', () => {
    expect(getBenefitCategoryIcon('insurance')).toBe('umbrella');
  });

  it('should return star icon for lifestyle', () => {
    expect(getBenefitCategoryIcon('lifestyle')).toBe('star');
  });

  it('should return valid icon name for all categories', () => {
    const categories: BenefitCategory[] = ['travel', 'purchase', 'insurance', 'lifestyle'];
    categories.forEach(cat => {
      const icon = getBenefitCategoryIcon(cat);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    });
  });
});

// ============================================================================
// sortBenefitsByPriority Tests
// ============================================================================

describe('BenefitsService - sortBenefitsByPriority', () => {
  it('should sort benefits by priority (travel > insurance > purchase > lifestyle)', () => {
    const sorted = sortBenefitsByPriority(mockBenefits);
    
    expect(sorted[0].category).toBe('travel');
    expect(sorted[sorted.length - 1].category).toBe('lifestyle');
  });

  it('should not mutate original array', () => {
    const original = [...mockBenefits];
    sortBenefitsByPriority(mockBenefits);
    expect(mockBenefits).toEqual(original);
  });

  it('should handle empty array', () => {
    const sorted = sortBenefitsByPriority([]);
    expect(sorted).toEqual([]);
  });

  it('should handle single benefit', () => {
    const sorted = sortBenefitsByPriority([mockBenefits[0]]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toEqual(mockBenefits[0]);
  });

  it('should maintain stable sort for same priority', () => {
    const twoPurchase: Benefit[] = [
      mockBenefits[1], // Purchase Protection
      mockBenefits[4], // Extended Warranty
    ];
    
    const sorted = sortBenefitsByPriority(twoPurchase);
    expect(sorted).toHaveLength(2);
    expect(sorted[0].category).toBe('purchase');
    expect(sorted[1].category).toBe('purchase');
  });
});
