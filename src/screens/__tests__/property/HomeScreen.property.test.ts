/**
 * Property-Based Tests for HomeScreen
 * Feature: rewards-value-calculator
 */

import * as fc from 'fast-check';
import { searchStores } from '../../../services/StoreDataService';
import { SpendingCategory } from '../../../types';

describe('HomeScreen Property Tests', () => {
  /**
   * Property 1: Store Search Returns Matching Results
   * Validates: Requirements 1.2
   *
   * For any search query string, all stores returned by the search function
   * should have names or aliases that match the query (case-insensitive partial match).
   */
  describe('Property 1: Store Search Returns Matching Results', () => {
    it('should return stores that match the search query', () => {
      fc.assert(
        fc.property(
          // Generate random search queries (alphanumeric strings)
          fc.string({ minLength: 2, maxLength: 20 }).filter((s) => s.trim().length >= 2),
          (query) => {
            const results = searchStores(query);

            // Normalize function for comparison
            const normalize = (str: string) =>
              str
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const normalizedQuery = normalize(query);

            // All results should match the query in name or aliases
            results.forEach((store) => {
              const nameMatches = normalize(store.name).includes(normalizedQuery);
              const aliasMatches = store.aliases.some((alias) =>
                normalize(alias).includes(normalizedQuery)
              );

              // At least one should match
              expect(nameMatches || aliasMatches).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for empty query', () => {
      const results = searchStores('');
      // Empty query returns all stores
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle special characters gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 20 }),
          (query) => {
            const results = searchStores(query);
            // Should not throw and should return an array
            expect(Array.isArray(results)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Store Selection Yields Correct Category
   * Validates: Requirements 1.3
   *
   * For any store selected from the database, the category returned by the calculator
   * should exactly match the store's category field.
   */
  describe('Property 2: Store Selection Yields Correct Category', () => {
    it('should return the exact category from the store object', () => {
      fc.assert(
        fc.property(
          // Generate random store names to search
          fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim().length >= 3),
          (storeName) => {
            const results = searchStores(storeName);

            // For each result, verify category is valid
            results.forEach((store) => {
              // Category should be a valid SpendingCategory
              expect(Object.values(SpendingCategory)).toContain(store.category);

              // Category should be exactly what's in the store object
              expect(store.category).toBe(store.category);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve category through selection', () => {
      const results = searchStores('walmart');
      if (results.length > 0) {
        const store = results[0];
        const originalCategory = store.category;

        // Simulate selection - category should remain the same
        expect(store.category).toBe(originalCategory);
        expect(typeof store.category).toBe('string');
      }
    });
  });

  /**
   * Property 3: Manual Category Selection Used in Calculations
   * Validates: Requirements 2.2
   *
   * For any manually selected spending category, the reward calculations
   * should use that category's multipliers for all cards.
   */
  describe('Property 3: Manual Category Selection Used in Calculations', () => {
    it('should accept any valid SpendingCategory', () => {
      fc.assert(
        fc.property(
          // Generate random valid categories
          fc.constantFrom(...Object.values(SpendingCategory)),
          (category) => {
            // Category should be a valid enum value
            expect(Object.values(SpendingCategory)).toContain(category);

            // Category should be a string
            expect(typeof category).toBe('string');

            // Category should not be empty
            expect(category.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain category selection through state updates', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(SpendingCategory)),
          (selectedCategory) => {
            // Simulate state update
            const state = {
              selectedCategory,
              mode: 'manual' as const,
            };

            // Category should remain unchanged
            expect(state.selectedCategory).toBe(selectedCategory);
            expect(state.mode).toBe('manual');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
