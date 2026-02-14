/**
 * SubscriptionService - Unit Tests
 * 
 * Tests tier logic, feature gating, card limits, and Sage usage tracking
 */

import {
  SubscriptionTier,
  Feature,
  CARD_LIMITS,
  SAGE_LIMITS,
  SUBSCRIPTION_TIERS,
  TIER_FEATURES,
  getTierConfig,
  getAllTierConfigs,
  getFeatureUnlockTier,
  getPriceDisplay,
  getAnnualSavings,
  isAdminEmail,
  getAdminEmails,
} from '../SubscriptionService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

// Mock AuthService
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn().mockResolvedValue(null),
}));

// ============================================================================
// Tier Definition Tests
// ============================================================================

describe('SubscriptionService - Tier Definitions', () => {
  describe('SUBSCRIPTION_TIERS', () => {
    it('should have Free tier correctly configured', () => {
      const free = SUBSCRIPTION_TIERS.free;
      expect(free.id).toBe('free');
      expect(free.name).toBe('Free');
      expect(free.monthlyPrice).toBe(0);
      expect(free.annualPrice).toBe(0);
    });

    it('should have Pro tier correctly configured', () => {
      const pro = SUBSCRIPTION_TIERS.pro;
      expect(pro.id).toBe('pro');
      expect(pro.name).toBe('Pro');
      expect(pro.monthlyPrice).toBe(5.99);
      expect(pro.annualPrice).toBe(49.99);
      expect(pro.highlighted).toBe(true);
    });

    it('should have Max tier correctly configured', () => {
      const max = SUBSCRIPTION_TIERS.max;
      expect(max.id).toBe('max');
      expect(max.name).toBe('Max');
      expect(max.monthlyPrice).toBe(12.99);
      expect(max.annualPrice).toBe(99.99);
    });

    it('should have Admin tier correctly configured', () => {
      const admin = SUBSCRIPTION_TIERS.admin;
      expect(admin.id).toBe('admin');
      expect(admin.name).toBe('Admin');
      expect(admin.monthlyPrice).toBe(0);
      expect(admin.annualPrice).toBe(0);
    });

    it('should have feature descriptions for each tier', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.featureDescriptions).toBeDefined();
        expect(Array.isArray(tier.featureDescriptions)).toBe(true);
        expect(tier.featureDescriptions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getTierConfig', () => {
    it('should return correct config for each tier', () => {
      const tiers: SubscriptionTier[] = ['free', 'pro', 'max', 'lifetime', 'admin'];
      tiers.forEach(tier => {
        const config = getTierConfig(tier);
        expect(config).toBeDefined();
        expect(config.id).toBe(tier);
      });
    });
  });

  describe('getAllTierConfigs', () => {
    it('should return exactly 4 tiers (excludes admin)', () => {
      const configs = getAllTierConfigs();
      expect(configs.length).toBe(4);
      expect(configs.map(c => c.id)).toEqual(['free', 'pro', 'max', 'lifetime']);
    });
  });
});

// ============================================================================
// Feature Access Tests
// ============================================================================

describe('SubscriptionService - Feature Access', () => {
  describe('TIER_FEATURES', () => {
    it('should have Free tier with limited Sage access', () => {
      expect(TIER_FEATURES.free).toEqual(['sage_ai']);
    });

    it('should have Pro tier with correct features', () => {
      const proFeatures = TIER_FEATURES.pro;
      expect(proFeatures).toContain('unlimited_cards');
      expect(proFeatures).toContain('insights');
      expect(proFeatures).toContain('points_valuator');
      expect(proFeatures).toContain('balance_tracking');
      expect(proFeatures).toContain('sage_ai');
      expect(proFeatures).not.toContain('autopilot');
      expect(proFeatures).not.toContain('multi_country');
    });

    it('should have Max tier with all features including Pro', () => {
      const maxFeatures = TIER_FEATURES.max;
      const proFeatures = TIER_FEATURES.pro;
      
      // Max should include all Pro features
      proFeatures.forEach(feature => {
        expect(maxFeatures).toContain(feature);
      });
      
      // Max should also include exclusive features
      expect(maxFeatures).toContain('autopilot');
      expect(maxFeatures).toContain('multi_country');
      expect(maxFeatures).toContain('export');
      expect(maxFeatures).toContain('family_sharing');
    });

    it('should have Lifetime tier with same features as Max', () => {
      expect(TIER_FEATURES.lifetime).toEqual(TIER_FEATURES.max);
    });

    it('should have Admin tier with same features as Max', () => {
      expect(TIER_FEATURES.admin).toEqual(TIER_FEATURES.max);
    });
  });

  describe('getFeatureUnlockTier', () => {
    it('should return pro for Pro features', () => {
      expect(getFeatureUnlockTier('unlimited_cards')).toBe('pro');
      expect(getFeatureUnlockTier('insights')).toBe('pro');
      expect(getFeatureUnlockTier('sage_ai')).toBe('pro');
    });

    it('should return max for Max-only features', () => {
      expect(getFeatureUnlockTier('autopilot')).toBe('max');
      expect(getFeatureUnlockTier('multi_country')).toBe('max');
      expect(getFeatureUnlockTier('export')).toBe('max');
      expect(getFeatureUnlockTier('family_sharing')).toBe('max');
    });
  });
});

// ============================================================================
// Card Limits Tests
// ============================================================================

describe('SubscriptionService - Card Limits', () => {
  describe('CARD_LIMITS', () => {
    it('should have 3 card limit for Free tier', () => {
      expect(CARD_LIMITS.free).toBe(3);
    });

    it('should have unlimited cards for Pro tier', () => {
      expect(CARD_LIMITS.pro).toBe(Infinity);
    });

    it('should have unlimited cards for Max tier', () => {
      expect(CARD_LIMITS.max).toBe(Infinity);
    });

    it('should have unlimited cards for Lifetime tier', () => {
      expect(CARD_LIMITS.lifetime).toBe(Infinity);
    });

    it('should have unlimited cards for Admin tier', () => {
      expect(CARD_LIMITS.admin).toBe(Infinity);
    });
  });

  describe('Tier limits configuration', () => {
    it('should match CARD_LIMITS with tier config limits', () => {
      expect(SUBSCRIPTION_TIERS.free.limits.cardsInPortfolio).toBe(CARD_LIMITS.free);
      expect(SUBSCRIPTION_TIERS.pro.limits.cardsInPortfolio).toBe(CARD_LIMITS.pro);
      expect(SUBSCRIPTION_TIERS.max.limits.cardsInPortfolio).toBe(CARD_LIMITS.max);
      expect(SUBSCRIPTION_TIERS.lifetime.limits.cardsInPortfolio).toBe(CARD_LIMITS.lifetime);
      expect(SUBSCRIPTION_TIERS.admin.limits.cardsInPortfolio).toBe(CARD_LIMITS.admin);
    });
  });
});

// ============================================================================
// Sage Limits Tests
// ============================================================================

describe('SubscriptionService - Sage Limits', () => {
  describe('SAGE_LIMITS', () => {
    it('should have 3 chats for Free tier (trial access)', () => {
      expect(SAGE_LIMITS.free).toBe(3);
    });

    it('should have 10 chats per month for Pro tier', () => {
      expect(SAGE_LIMITS.pro).toBe(10);
    });

    it('should have unlimited chats for Max tier (null)', () => {
      expect(SAGE_LIMITS.max).toBeNull();
    });

    it('should have unlimited chats for Lifetime tier (null)', () => {
      expect(SAGE_LIMITS.lifetime).toBeNull();
    });

    it('should have unlimited chats for Admin tier (null)', () => {
      expect(SAGE_LIMITS.admin).toBeNull();
    });
  });

  describe('Tier limits configuration', () => {
    it('should match SAGE_LIMITS with tier config limits', () => {
      expect(SUBSCRIPTION_TIERS.free.limits.sageChatsPerMonth).toBe(SAGE_LIMITS.free);
      expect(SUBSCRIPTION_TIERS.pro.limits.sageChatsPerMonth).toBe(SAGE_LIMITS.pro);
      expect(SUBSCRIPTION_TIERS.max.limits.sageChatsPerMonth).toBe(SAGE_LIMITS.max);
      expect(SUBSCRIPTION_TIERS.lifetime.limits.sageChatsPerMonth).toBe(SAGE_LIMITS.lifetime);
      expect(SUBSCRIPTION_TIERS.admin.limits.sageChatsPerMonth).toBe(SAGE_LIMITS.admin);
    });
  });
});

// ============================================================================
// Price Display Tests
// ============================================================================

describe('SubscriptionService - Price Display', () => {
  describe('getPriceDisplay', () => {
    it('should display Free for free tier', () => {
      expect(getPriceDisplay('free', 'monthly')).toBe('Free');
      expect(getPriceDisplay('free', 'annual')).toBe('Free');
    });

    it('should display monthly price for Pro tier', () => {
      expect(getPriceDisplay('pro', 'monthly')).toBe('$5.99/mo');
    });

    it('should display monthly equivalent for Pro annual', () => {
      const display = getPriceDisplay('pro', 'annual');
      // 49.99 / 12 ≈ 4.17
      expect(display).toBe('$4.17/mo');
    });

    it('should display monthly price for Max tier', () => {
      expect(getPriceDisplay('max', 'monthly')).toBe('$12.99/mo');
    });

    it('should display monthly equivalent for Max annual', () => {
      const display = getPriceDisplay('max', 'annual');
      // 99.99 / 12 ≈ 8.33
      expect(display).toBe('$8.33/mo');
    });
  });

  describe('getAnnualSavings', () => {
    it('should calculate savings for Pro tier', () => {
      // Monthly total: 5.99 * 12 = 71.88
      // Annual: 49.99
      // Savings: 71.88 - 49.99 = 21.89
      const savings = getAnnualSavings('pro');
      expect(savings).toBeCloseTo(21.89, 1);
    });

    it('should calculate savings for Max tier', () => {
      // Monthly total: 12.99 * 12 = 155.88
      // Annual: 99.99
      // Savings: 155.88 - 99.99 = 55.89
      const savings = getAnnualSavings('max');
      expect(savings).toBeCloseTo(55.89, 1);
    });

    it('should return 0 for Free tier', () => {
      expect(getAnnualSavings('free')).toBe(0);
    });
  });
});

// ============================================================================
// Admin Email Tests
// ============================================================================

describe('SubscriptionService - Admin Email Detection', () => {
  describe('isAdminEmail', () => {
    it('should recognize tahseen137@gmail.com as admin', () => {
      expect(isAdminEmail('tahseen137@gmail.com')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isAdminEmail('TAHSEEN137@GMAIL.COM')).toBe(true);
      expect(isAdminEmail('Tahseen137@Gmail.Com')).toBe(true);
    });

    it('should not recognize random emails as admin', () => {
      expect(isAdminEmail('random@user.com')).toBe(false);
      expect(isAdminEmail('test@test.com')).toBe(false);
      expect(isAdminEmail('admin@notadmin.com')).toBe(false);
    });

    it('should handle null/undefined gracefully', () => {
      expect(isAdminEmail(null)).toBe(false);
      expect(isAdminEmail(undefined)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isAdminEmail('')).toBe(false);
    });
  });

  describe('getAdminEmails', () => {
    it('should return array of admin emails', () => {
      const emails = getAdminEmails();
      expect(Array.isArray(emails)).toBe(true);
      expect(emails.length).toBeGreaterThan(0);
    });

    it('should include tahseen137@gmail.com', () => {
      expect(getAdminEmails()).toContain('tahseen137@gmail.com');
    });

    it('should return a new array (not mutable)', () => {
      const emails1 = getAdminEmails();
      const emails2 = getAdminEmails();
      expect(emails1).not.toBe(emails2);
      expect(emails1).toEqual(emails2);
    });
  });
});

// ============================================================================
// Lifetime Tier Tests
// ============================================================================

describe('SubscriptionService - Lifetime Tier', () => {
  describe('SUBSCRIPTION_TIERS.lifetime', () => {
    it('should have Lifetime tier correctly configured', () => {
      const lifetime = SUBSCRIPTION_TIERS.lifetime;
      expect(lifetime.id).toBe('lifetime');
      expect(lifetime.name).toBe('Lifetime');
      expect(lifetime.monthlyPrice).toBe(0);
      expect(lifetime.annualPrice).toBe(0);
    });

    it('should have all Max-level features', () => {
      const lifetimeFeatures = TIER_FEATURES.lifetime;
      const maxFeatures = TIER_FEATURES.max;
      maxFeatures.forEach(feature => {
        expect(lifetimeFeatures).toContain(feature);
      });
    });

    it('should have unlimited card limit', () => {
      expect(CARD_LIMITS.lifetime).toBe(Infinity);
    });

    it('should have unlimited Sage chats', () => {
      expect(SAGE_LIMITS.lifetime).toBeNull();
    });

    it('should include feature descriptions', () => {
      expect(SUBSCRIPTION_TIERS.lifetime.featureDescriptions.length).toBeGreaterThan(0);
      const descriptions = SUBSCRIPTION_TIERS.lifetime.featureDescriptions.join(' ');
      expect(descriptions.toLowerCase()).toMatch(/forever/);
    });
  });

  describe('getPriceDisplay for lifetime', () => {
    it('should display $49.99 for lifetime tier', () => {
      expect(getPriceDisplay('lifetime', 'monthly')).toBe('$49.99');
      expect(getPriceDisplay('lifetime', 'annual')).toBe('$49.99');
    });
  });

  describe('getAnnualSavings for lifetime', () => {
    it('should return 0 for Lifetime tier (one-time)', () => {
      expect(getAnnualSavings('lifetime')).toBe(0);
    });
  });
});

// ============================================================================
// Feature Description Tests  
// ============================================================================

describe('SubscriptionService - Feature Descriptions', () => {
  it('should mention Sage AI limit for Pro tier', () => {
    const proDescriptions = SUBSCRIPTION_TIERS.pro.featureDescriptions.join(' ');
    expect(proDescriptions).toMatch(/10/);
    expect(proDescriptions.toLowerCase()).toMatch(/sage/);
  });

  it('should mention unlimited for Max tier', () => {
    const maxDescriptions = SUBSCRIPTION_TIERS.max.featureDescriptions.join(' ');
    expect(maxDescriptions.toLowerCase()).toMatch(/unlimited/i);
  });

  it('should mention AutoPilot for Max tier', () => {
    const maxDescriptions = SUBSCRIPTION_TIERS.max.featureDescriptions.join(' ');
    expect(maxDescriptions.toLowerCase()).toMatch(/autopilot/i);
  });

  it('should mention multi-country for Max tier', () => {
    const maxDescriptions = SUBSCRIPTION_TIERS.max.featureDescriptions.join(' ');
    expect(maxDescriptions.toLowerCase()).toMatch(/multi.*country|ca.*us/i);
  });
});
