/**
 * MerchantPatternService Tests
 * ~30 tests covering pattern matching, categorization, and user mappings
 */

import {
  normalizeMerchantDescription,
  extractMerchantName,
  categorizeTransaction,
  categorizeTransactions,
  getCategoryStats,
  addUserMapping,
  removeUserMapping,
  learnFromCorrection,
  getUserMappingsSync,
  resetMerchantPatternCache,
  EXTENDED_MERCHANT_PATTERNS,
} from '../MerchantPatternService';
import { SpendingCategory, ParsedTransaction, SupportedBank } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('MerchantPatternService', () => {
  beforeEach(() => {
    resetMerchantPatternCache();
  });

  // ============================================================================
  // normalizeMerchantDescription Tests
  // ============================================================================

  describe('normalizeMerchantDescription', () => {
    it('should convert to uppercase', () => {
      expect(normalizeMerchantDescription('starbucks')).toBe('STARBUCKS');
    });

    it('should remove special characters', () => {
      expect(normalizeMerchantDescription('TIM*HORTONS#123')).toBe('TIM HORTONS 123');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeMerchantDescription('LOBLAWS    STORE   PLAZA')).toBe('LOBLAWS STORE PLAZA');
    });

    it('should remove long number sequences (card numbers)', () => {
      expect(normalizeMerchantDescription('METRO 12345678')).toBe('METRO');
    });

    it('should trim whitespace', () => {
      expect(normalizeMerchantDescription('  COSTCO  ')).toBe('COSTCO');
    });
  });

  // ============================================================================
  // extractMerchantName Tests
  // ============================================================================

  describe('extractMerchantName', () => {
    it('should remove province codes', () => {
      expect(extractMerchantName('LOBLAWS TORONTO ON')).toBe('Loblaws Toronto');
    });

    it('should remove country suffix', () => {
      expect(extractMerchantName('STARBUCKS CANADA')).toBe('Starbucks');
    });

    it('should remove store numbers', () => {
      expect(extractMerchantName('WALMART #1234')).toBe('Walmart');
    });

    it('should remove long numbers', () => {
      expect(extractMerchantName('METRO 12345678')).toBe('Metro');
    });

    it('should remove asterisks', () => {
      expect(extractMerchantName('TIM HORTONS***')).toBe('Tim Hortons');
    });

    it('should title case the result', () => {
      expect(extractMerchantName('SHOPPERS DRUG MART')).toBe('Shoppers Drug Mart');
    });
  });

  // ============================================================================
  // categorizeTransaction Tests - Groceries
  // ============================================================================

  describe('categorizeTransaction - Groceries', () => {
    it('should categorize Loblaws as GROCERIES', () => {
      const result = categorizeTransaction('LOBLAWS #1234 TORONTO ON');
      expect(result.category).toBe(SpendingCategory.GROCERIES);
      expect(result.merchantName).toBe('Loblaws');
      expect(result.confidence).toBe('high');
    });

    it('should categorize Metro as GROCERIES', () => {
      const result = categorizeTransaction('METRO PLUS OTTAWA ON');
      expect(result.category).toBe(SpendingCategory.GROCERIES);
      expect(result.merchantName).toBe('Metro');
    });

    it('should categorize Walmart Supercentre as GROCERIES', () => {
      const result = categorizeTransaction('WALMART SUP #1234');
      expect(result.category).toBe(SpendingCategory.GROCERIES);
      expect(result.merchantName).toBe('Walmart');
    });

    it('should categorize Costco Wholesale as GROCERIES', () => {
      const result = categorizeTransaction('COSTCO WHO #123');
      expect(result.category).toBe(SpendingCategory.GROCERIES);
      expect(result.merchantName).toBe('Costco');
    });

    it('should categorize generic grocery stores with medium confidence', () => {
      const result = categorizeTransaction('LOCAL SUPERMARKET');
      expect(result.category).toBe(SpendingCategory.GROCERIES);
      expect(result.confidence).toBe('medium');
    });
  });

  // ============================================================================
  // categorizeTransaction Tests - Dining
  // ============================================================================

  describe('categorizeTransaction - Dining', () => {
    it('should categorize Starbucks as DINING', () => {
      const result = categorizeTransaction('STARBUCKS #12345');
      expect(result.category).toBe(SpendingCategory.DINING);
      expect(result.merchantName).toBe('Starbucks');
      expect(result.confidence).toBe('high');
    });

    it('should categorize Tim Hortons as DINING', () => {
      const result = categorizeTransaction('TIM HORTONS #1234');
      expect(result.category).toBe(SpendingCategory.DINING);
      expect(result.merchantName).toBe('Tim Hortons');
    });

    it('should categorize McDonald\'s as DINING', () => {
      const result = categorizeTransaction('MCDONALDS #12345');
      expect(result.category).toBe(SpendingCategory.DINING);
      expect(result.merchantName).toBe("McDonald's");
    });

    it('should categorize SkipTheDishes as DINING', () => {
      const result = categorizeTransaction('SKIPTHEDISHES.COM');
      expect(result.category).toBe(SpendingCategory.DINING);
      expect(result.merchantName).toBe('SkipTheDishes');
    });

    it('should categorize generic restaurants with medium confidence', () => {
      const result = categorizeTransaction('ITALIAN RESTAURANT TORONTO');
      expect(result.category).toBe(SpendingCategory.DINING);
      expect(result.confidence).toBe('medium');
    });
  });

  // ============================================================================
  // categorizeTransaction Tests - Gas
  // ============================================================================

  describe('categorizeTransaction - Gas', () => {
    it('should categorize Esso as GAS', () => {
      const result = categorizeTransaction('ESSO #1234');
      expect(result.category).toBe(SpendingCategory.GAS);
      expect(result.merchantName).toBe('Esso');
    });

    it('should categorize Shell as GAS', () => {
      const result = categorizeTransaction('SHELL CANADA');
      expect(result.category).toBe(SpendingCategory.GAS);
      expect(result.merchantName).toBe('Shell');
    });

    it('should categorize Petro-Canada as GAS', () => {
      const result = categorizeTransaction('PETRO CANADA #123');
      expect(result.category).toBe(SpendingCategory.GAS);
      expect(result.merchantName).toBe('Petro-Canada');
    });

    it('should not categorize Shell Fish restaurant as GAS', () => {
      const result = categorizeTransaction('SHELL FISH BAR & GRILL');
      expect(result.category).not.toBe(SpendingCategory.GAS);
    });
  });

  // ============================================================================
  // categorizeTransaction Tests - Other Categories
  // ============================================================================

  describe('categorizeTransaction - Other Categories', () => {
    it('should categorize Amazon as ONLINE_SHOPPING', () => {
      const result = categorizeTransaction('AMAZON.CA');
      expect(result.category).toBe(SpendingCategory.ONLINE_SHOPPING);
    });

    it('should categorize Shoppers Drug Mart as DRUGSTORES', () => {
      const result = categorizeTransaction('SHOPPERS DRUG MART #1234');
      expect(result.category).toBe(SpendingCategory.DRUGSTORES);
    });

    it('should categorize Netflix as ENTERTAINMENT', () => {
      const result = categorizeTransaction('NETFLIX.COM');
      expect(result.category).toBe(SpendingCategory.ENTERTAINMENT);
    });

    it('should categorize Home Depot as HOME_IMPROVEMENT', () => {
      const result = categorizeTransaction('THE HOME DEPOT #1234');
      expect(result.category).toBe(SpendingCategory.HOME_IMPROVEMENT);
    });

    it('should categorize Air Canada as TRAVEL', () => {
      const result = categorizeTransaction('AIR CANADA #AC123');
      expect(result.category).toBe(SpendingCategory.TRAVEL);
    });

    it('should categorize unknown merchants as OTHER', () => {
      const result = categorizeTransaction('RANDOM STORE 123');
      expect(result.category).toBe(SpendingCategory.OTHER);
      expect(result.confidence).toBe('low');
    });
  });

  // ============================================================================
  // User Mappings Tests
  // ============================================================================

  describe('User Mappings', () => {
    it('should prioritize user mappings over built-in patterns', async () => {
      await addUserMapping('starbucks', SpendingCategory.ENTERTAINMENT, 'Starbucks', 'user123');
      
      const result = categorizeTransaction('STARBUCKS #12345', getUserMappingsSync());
      expect(result.category).toBe(SpendingCategory.ENTERTAINMENT);
      expect(result.confidence).toBe('high');
    });

    it('should add user mappings to cache', async () => {
      const mapping = await addUserMapping('test.*store', SpendingCategory.GROCERIES, 'Test Store', 'user123');
      
      expect(getUserMappingsSync()).toContainEqual(mapping);
    });

    it('should remove user mappings', async () => {
      const mapping = await addUserMapping('test.*store', SpendingCategory.GROCERIES, 'Test Store', 'user123');
      await removeUserMapping(mapping.id);
      
      expect(getUserMappingsSync()).not.toContainEqual(mapping);
    });

    it('should learn from corrections', async () => {
      await learnFromCorrection('LOCAL BAKERY SHOP', SpendingCategory.DINING, 'Local Bakery', 'user123');
      
      const mappings = getUserMappingsSync();
      expect(mappings.length).toBeGreaterThan(0);
    });

    it('should reject invalid regex patterns', async () => {
      await expect(
        addUserMapping('[invalid(regex', SpendingCategory.GROCERIES, 'Test', 'user123')
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // Batch Operations Tests
  // ============================================================================

  describe('categorizeTransactions', () => {
    it('should categorize multiple transactions', () => {
      const descriptions = [
        'LOBLAWS #1234',
        'STARBUCKS #567',
        'ESSO #890',
      ];
      
      const results = categorizeTransactions(descriptions);
      
      expect(results[0].category).toBe(SpendingCategory.GROCERIES);
      expect(results[1].category).toBe(SpendingCategory.DINING);
      expect(results[2].category).toBe(SpendingCategory.GAS);
    });
  });

  // ============================================================================
  // Category Stats Tests
  // ============================================================================

  describe('getCategoryStats', () => {
    const mockTransactions: ParsedTransaction[] = [
      {
        id: '1',
        date: new Date('2024-01-15'),
        description: 'LOBLAWS',
        normalizedMerchant: 'Loblaws',
        amount: 100,
        isCredit: false,
        category: SpendingCategory.GROCERIES,
        categoryConfidence: 'high',
        userCorrected: false,
        sourceBank: 'td' as SupportedBank,
      },
      {
        id: '2',
        date: new Date('2024-01-16'),
        description: 'STARBUCKS',
        normalizedMerchant: 'Starbucks',
        amount: 5,
        isCredit: false,
        category: SpendingCategory.DINING,
        categoryConfidence: 'high',
        userCorrected: false,
        sourceBank: 'td' as SupportedBank,
      },
      {
        id: '3',
        date: new Date('2024-01-17'),
        description: 'LOBLAWS',
        normalizedMerchant: 'Loblaws',
        amount: 80,
        isCredit: false,
        category: SpendingCategory.GROCERIES,
        categoryConfidence: 'high',
        userCorrected: false,
        sourceBank: 'td' as SupportedBank,
      },
      {
        id: '4',
        date: new Date('2024-01-18'),
        description: 'PAYMENT',
        normalizedMerchant: 'Payment',
        amount: 500,
        isCredit: true,
        category: SpendingCategory.OTHER,
        categoryConfidence: 'high',
        userCorrected: false,
        sourceBank: 'td' as SupportedBank,
      },
    ];

    it('should calculate category totals', () => {
      const stats = getCategoryStats(mockTransactions);
      
      expect(stats[SpendingCategory.GROCERIES].totalAmount).toBe(180);
      expect(stats[SpendingCategory.GROCERIES].count).toBe(2);
      expect(stats[SpendingCategory.DINING].totalAmount).toBe(5);
      expect(stats[SpendingCategory.DINING].count).toBe(1);
    });

    it('should exclude credits from stats', () => {
      const stats = getCategoryStats(mockTransactions);
      
      // Payment is a credit, should not be counted
      expect(stats[SpendingCategory.OTHER].totalAmount).toBe(0);
      expect(stats[SpendingCategory.OTHER].count).toBe(0);
    });
  });

  // ============================================================================
  // Extended Patterns Coverage
  // ============================================================================

  describe('Extended Patterns Coverage', () => {
    it('should have 100+ merchant patterns', () => {
      expect(EXTENDED_MERCHANT_PATTERNS.length).toBeGreaterThanOrEqual(100);
    });

    it('should cover all spending categories', () => {
      const categoriesCovered = new Set(
        EXTENDED_MERCHANT_PATTERNS.map(p => p.category)
      );
      
      expect(categoriesCovered.has(SpendingCategory.GROCERIES)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.DINING)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.GAS)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.TRAVEL)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.ONLINE_SHOPPING)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.ENTERTAINMENT)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.DRUGSTORES)).toBe(true);
      expect(categoriesCovered.has(SpendingCategory.HOME_IMPROVEMENT)).toBe(true);
    });

    it('should have varying confidence levels', () => {
      const highConfidence = EXTENDED_MERCHANT_PATTERNS.filter(p => p.confidence === 'high');
      const mediumConfidence = EXTENDED_MERCHANT_PATTERNS.filter(p => p.confidence === 'medium');
      
      expect(highConfidence.length).toBeGreaterThan(0);
      expect(mediumConfidence.length).toBeGreaterThan(0);
    });
  });
});
