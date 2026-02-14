/**
 * AffiliateService - Unit Tests
 * 
 * Tests URL resolution, UTM parameters, issuer mapping, and click tracking.
 */

import {
  getApplicationUrl,
  getIssuerApplicationUrl,
  appendUTMParams,
  generateUTMParams,
  trackAffiliateClick,
  handleApplyNow,
  ISSUER_APPLICATION_URLS,
} from '../AffiliateService';
import { Card, RewardType, SpendingCategory } from '../../types';

// Mock dependencies
jest.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

jest.mock('../SubscriptionService', () => ({
  getCurrentTierSync: jest.fn(() => 'free'),
}));

// Mock react-native Linking
jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn().mockResolvedValue(true),
  },
  StyleSheet: {
    create: jest.fn((styles: any) => styles),
  },
  Platform: { OS: 'ios' },
}));

import { Linking } from 'react-native';
import { supabase } from '../supabase/client';

const mockLinking = Linking as jest.Mocked<typeof Linking>;
const mockSupabase = supabase as any;

// ============================================================================
// Test Data
// ============================================================================

const mockCard: Card = {
  id: 'td-infinite-visa',
  name: 'TD Aeroplan Visa Infinite',
  issuer: 'TD',
  rewardProgram: 'Aeroplan',
  baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
  categoryRewards: [
    { category: SpendingCategory.GROCERIES, rewardRate: { value: 1.5, type: RewardType.POINTS, unit: 'multiplier' } },
  ],
  annualFee: 139,
};

const mockCardWithUrls: Card & { applicationUrl: string; affiliateUrl: string } = {
  ...mockCard,
  id: 'custom-card',
  applicationUrl: 'https://example.com/apply/custom',
  affiliateUrl: 'https://affiliate.example.com/track/custom',
};

const mockUnknownIssuerCard: Card = {
  ...mockCard,
  id: 'unknown-card',
  issuer: 'Unknown Bank XYZ',
};

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// UTM Parameter Tests
// ============================================================================

describe('AffiliateService - UTM Parameters', () => {
  describe('generateUTMParams', () => {
    it('should generate correct UTM parameters', () => {
      const params = generateUTMParams('card-123');
      
      expect(params.utm_source).toBe('rewardly');
      expect(params.utm_medium).toBe('app');
      expect(params.utm_campaign).toBe('card_apply');
      expect(params.utm_content).toBe('card-123');
    });

    it('should handle special characters in card ID', () => {
      const params = generateUTMParams('td-aeroplan-visa-infinite');
      
      expect(params.utm_content).toBe('td-aeroplan-visa-infinite');
    });
  });

  describe('appendUTMParams', () => {
    it('should append UTM parameters with ? for clean URLs', () => {
      const url = appendUTMParams('https://example.com/apply', 'card-1');
      
      expect(url).toContain('?');
      expect(url).toContain('utm_source=rewardly');
      expect(url).toContain('utm_medium=app');
      expect(url).toContain('utm_campaign=card_apply');
      expect(url).toContain('utm_content=card-1');
    });

    it('should append UTM parameters with & for URLs with existing params', () => {
      const url = appendUTMParams('https://example.com/apply?ref=123', 'card-1');
      
      expect(url).toContain('&utm_source=rewardly');
      expect(url).not.toContain('?utm_source');
    });

    it('should URL-encode the card ID', () => {
      const url = appendUTMParams('https://example.com', 'card with spaces');
      
      expect(url).toContain('utm_content=card%20with%20spaces');
    });
  });
});

// ============================================================================
// Issuer URL Mapping Tests
// ============================================================================

describe('AffiliateService - Issuer URL Mapping', () => {
  describe('ISSUER_APPLICATION_URLS', () => {
    it('should have URLs for all major Canadian issuers', () => {
      const requiredIssuers = [
        'TD', 'RBC', 'Scotiabank', 'CIBC', 'American Express',
        'BMO', 'Capital One', 'MBNA', 'National Bank', 'Desjardins',
        'HSBC', 'Tangerine',
      ];

      for (const issuer of requiredIssuers) {
        expect(ISSUER_APPLICATION_URLS[issuer]).toBeTruthy();
        expect(ISSUER_APPLICATION_URLS[issuer]).toMatch(/^https:\/\//);
      }
    });

    it('should have valid URLs (https)', () => {
      for (const [issuer, url] of Object.entries(ISSUER_APPLICATION_URLS)) {
        expect(url).toMatch(/^https:\/\//);
      }
    });
  });

  describe('getIssuerApplicationUrl', () => {
    it('should return URL for exact issuer match', () => {
      const url = getIssuerApplicationUrl('TD');
      
      expect(url).toBeTruthy();
      expect(url).toContain('td.com');
    });

    it('should handle case-insensitive matching', () => {
      const url = getIssuerApplicationUrl('td');
      
      expect(url).toBeTruthy();
      expect(url).toContain('td.com');
    });

    it('should handle partial matching', () => {
      const url = getIssuerApplicationUrl('TD Canada Trust');
      
      expect(url).toBeTruthy();
      expect(url).toContain('td.com');
    });

    it('should return null for unknown issuer', () => {
      const url = getIssuerApplicationUrl('Unknown Bank XYZ');
      
      expect(url).toBeNull();
    });

    it('should find Amex by alias', () => {
      const url1 = getIssuerApplicationUrl('Amex');
      const url2 = getIssuerApplicationUrl('American Express');
      
      expect(url1).toBeTruthy();
      expect(url2).toBeTruthy();
    });
  });
});

// ============================================================================
// Application URL Resolution Tests
// ============================================================================

describe('AffiliateService - Application URL Resolution', () => {
  describe('getApplicationUrl', () => {
    it('should use affiliateUrl when available (highest priority)', () => {
      const url = getApplicationUrl(mockCardWithUrls as any);
      
      expect(url).toContain('affiliate.example.com');
      expect(url).toContain('utm_source=rewardly');
    });

    it('should use applicationUrl when no affiliateUrl', () => {
      const cardWithAppUrl = { ...mockCard, applicationUrl: 'https://example.com/apply/specific' };
      const url = getApplicationUrl(cardWithAppUrl as any);
      
      expect(url).toContain('example.com/apply/specific');
      expect(url).toContain('utm_source=rewardly');
    });

    it('should use issuer URL when no card-specific URLs', () => {
      const url = getApplicationUrl(mockCard);
      
      expect(url).toContain('td.com');
      expect(url).toContain('utm_source=rewardly');
    });

    it('should fall back to Google search for unknown issuers', () => {
      const url = getApplicationUrl(mockUnknownIssuerCard);
      
      expect(url).toContain('google.com/search');
      expect(url).toContain(encodeURIComponent(mockUnknownIssuerCard.name));
    });

    it('should always include UTM parameters (except Google fallback)', () => {
      const url = getApplicationUrl(mockCard);
      
      expect(url).toContain('utm_source=rewardly');
      expect(url).toContain('utm_medium=app');
      expect(url).toContain('utm_campaign=card_apply');
      expect(url).toContain(`utm_content=${mockCard.id}`);
    });
  });
});

// ============================================================================
// Click Tracking Tests
// ============================================================================

describe('AffiliateService - Click Tracking', () => {
  describe('trackAffiliateClick', () => {
    it('should insert click record into Supabase', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = jest.fn().mockReturnValue({ insert: mockInsert });
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      
      await trackAffiliateClick(mockCard, 'CardBenefits', 'pro');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('affiliate_clicks');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          card_id: mockCard.id,
          card_name: mockCard.name,
          issuer: mockCard.issuer,
          user_id: 'user-1',
          source_screen: 'CardBenefits',
          user_tier: 'pro',
        })
      );
    });

    it('should handle null user gracefully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = jest.fn().mockReturnValue({ insert: mockInsert });
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
      });
      
      await trackAffiliateClick(mockCard, 'Home', 'free');
      
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
        })
      );
    });

    it('should not throw on Supabase error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Network error')),
      });
      
      // Should not throw
      await expect(trackAffiliateClick(mockCard, 'Home', 'free')).resolves.not.toThrow();
    });
  });

  describe('handleApplyNow', () => {
    it('should open the URL in external browser', async () => {
      await handleApplyNow(mockCard, 'CardBenefits', 'pro');
      
      expect(mockLinking.openURL).toHaveBeenCalled();
      const calledUrl = (mockLinking.openURL as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('td.com');
    });

    it('should track the click', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = jest.fn().mockReturnValue({ insert: mockInsert });
      
      await handleApplyNow(mockCard, 'Comparison', 'max');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('affiliate_clicks');
    });

    it('should handle Linking failure gracefully', async () => {
      mockLinking.openURL = jest.fn().mockRejectedValue(new Error('Cannot open URL'));
      
      // Should not throw
      await expect(handleApplyNow(mockCard, 'Home', 'free')).resolves.not.toThrow();
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('AffiliateService - Edge Cases', () => {
  it('should handle empty card ID in UTM params', () => {
    const params = generateUTMParams('');
    expect(params.utm_content).toBe('');
  });

  it('should handle card with no issuer match and no URLs', () => {
    const url = getApplicationUrl(mockUnknownIssuerCard);
    expect(url).toBeTruthy(); // Falls back to Google search
  });

  it('should handle all major Canadian issuers', () => {
    const issuers = ['TD', 'RBC', 'Scotiabank', 'CIBC', 'BMO', 'Amex', 'Capital One'];
    
    for (const issuer of issuers) {
      const card: Card = { ...mockCard, issuer };
      const url = getApplicationUrl(card);
      expect(url).toContain('utm_source=rewardly');
      expect(url).not.toContain('google.com'); // Should use issuer URL
    }
  });
});
