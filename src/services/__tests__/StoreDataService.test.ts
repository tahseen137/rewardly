/**
 * Unit Tests for StoreDataService
 * Tests fuzzy matching logic, search functionality, and edge cases
 * Validates: Requirements 2.1 (store identification)
 */

import { getAllStores, findStore, searchStores, getStoreCategory } from '../StoreDataService';
import { SpendingCategory } from '../../types';

describe('StoreDataService', () => {
  describe('getAllStores', () => {
    it('should return all stores from the database', () => {
      const stores = getAllStores();
      expect(stores).toBeDefined();
      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThan(0);
    });

    it('should return stores with required properties', () => {
      const stores = getAllStores();
      stores.forEach((store) => {
        expect(store).toHaveProperty('id');
        expect(store).toHaveProperty('name');
        expect(store).toHaveProperty('category');
        expect(store).toHaveProperty('aliases');
        expect(Array.isArray(store.aliases)).toBe(true);
      });
    });
  });

  describe('findStore - fuzzy matching logic', () => {
    it('should find store by exact name match', () => {
      const store = findStore('Loblaws');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Loblaws');
    });

    it('should find store by case-insensitive match', () => {
      const store = findStore('loblaws');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Loblaws');
    });

    it('should find store by alias', () => {
      const store = findStore('tims');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Tim Hortons');
    });

    it('should find store by partial name match', () => {
      const store = findStore('Tim');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Tim Hortons');
    });

    it('should find store with special characters in query', () => {
      const store = findStore("Tim Horton's");
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Tim Hortons');
    });

    it('should return null for empty query', () => {
      const store = findStore('');
      expect(store).toBeNull();
    });

    it('should return null for whitespace-only query', () => {
      const store = findStore('   ');
      expect(store).toBeNull();
    });

    it('should return null for non-existent store', () => {
      const store = findStore('NonExistentStore12345');
      expect(store).toBeNull();
    });

    it('should handle bilingual store names (Quebec)', () => {
      // Pharmaprix is the Quebec name for Shoppers Drug Mart
      const store = findStore('Pharmaprix');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Shoppers Drug Mart');
    });

    it('should handle store names with ampersand', () => {
      const store = findStore('A&W');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('A&W');
    });

    it('should handle store names with hyphen', () => {
      const store = findStore('Save-On-Foods');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Save-On-Foods');
    });
  });

  describe('searchStores - various query patterns', () => {
    it('should return all stores for empty query', () => {
      const results = searchStores('');
      const allStores = getAllStores();
      expect(results.length).toBe(allStores.length);
    });

    it('should return matching stores for partial query', () => {
      const results = searchStores('Tim');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((s) => s.name === 'Tim Hortons')).toBe(true);
    });

    it('should return stores sorted by relevance', () => {
      const results = searchStores('Loblaws');
      expect(results.length).toBeGreaterThan(0);
      // First result should be exact or closest match
      expect(results[0].name).toBe('Loblaws');
    });

    it('should find stores by alias', () => {
      const results = searchStores('sdm');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((s) => s.name === 'Shoppers Drug Mart')).toBe(true);
    });

    it('should handle case-insensitive search', () => {
      const results = searchStores('COSTCO');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((s) => s.name === 'Costco')).toBe(true);
    });

    it('should handle special characters in search', () => {
      const results = searchStores('T&T');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((s) => s.name === 'T&T Supermarket')).toBe(true);
    });

    it('should return empty array for very specific non-matching query', () => {
      const results = searchStores('xyznonexistent123456789');
      expect(results.length).toBe(0);
    });
  });

  describe('getStoreCategory', () => {
    it('should return correct category for grocery store', () => {
      const category = getStoreCategory('Loblaws');
      expect(category).toBe(SpendingCategory.GROCERIES);
    });

    it('should return correct category for dining', () => {
      const category = getStoreCategory('Tim Hortons');
      expect(category).toBe(SpendingCategory.DINING);
    });

    it('should return correct category for gas station', () => {
      const category = getStoreCategory('Petro-Canada');
      expect(category).toBe(SpendingCategory.GAS);
    });

    it('should return correct category for drugstore', () => {
      const category = getStoreCategory('Shoppers Drug Mart');
      expect(category).toBe(SpendingCategory.DRUGSTORES);
    });

    it('should return correct category for home improvement', () => {
      const category = getStoreCategory('Canadian Tire');
      expect(category).toBe(SpendingCategory.HOME_IMPROVEMENT);
    });

    it('should return correct category for entertainment', () => {
      const category = getStoreCategory('Cineplex');
      expect(category).toBe(SpendingCategory.ENTERTAINMENT);
    });

    it('should return correct category for travel', () => {
      const category = getStoreCategory('Air Canada');
      expect(category).toBe(SpendingCategory.TRAVEL);
    });

    it('should return correct category for online shopping', () => {
      const category = getStoreCategory('Amazon.ca');
      expect(category).toBe(SpendingCategory.ONLINE_SHOPPING);
    });

    it('should return null for non-existent store', () => {
      const category = getStoreCategory('NonExistentStore');
      expect(category).toBeNull();
    });

    it('should return category when using alias', () => {
      const category = getStoreCategory('tims');
      expect(category).toBe(SpendingCategory.DINING);
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters gracefully', () => {
      // Test with accented characters
      const store = findStore('Café');
      // Should not throw, may or may not find a match
      expect(() => findStore('Café')).not.toThrow();
    });

    it('should handle very long query strings', () => {
      const longQuery = 'a'.repeat(1000);
      const store = findStore(longQuery);
      expect(store).toBeNull();
    });

    it('should handle query with only numbers', () => {
      const store = findStore('12345');
      expect(store).toBeNull();
    });

    it('should handle query with mixed alphanumeric', () => {
      // A&W has numbers in some contexts
      const store = findStore('a&w');
      expect(store).not.toBeNull();
    });

    it('should handle multiple spaces in query', () => {
      const store = findStore('Tim    Hortons');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Tim Hortons');
    });

    it('should handle leading/trailing spaces', () => {
      const store = findStore('  Loblaws  ');
      expect(store).not.toBeNull();
      expect(store?.name).toBe('Loblaws');
    });
  });
});
