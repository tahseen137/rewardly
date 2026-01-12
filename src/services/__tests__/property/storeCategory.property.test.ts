/**
 * Property Test: Store Category Identification
 * Feature: rewards-optimizer, Property 4: Store Category Identification
 * Validates: Requirements 2.1
 *
 * For any known store in the database, querying its category should return
 * a valid SpendingCategory that is consistent across multiple queries.
 */

import * as fc from 'fast-check';
import { getAllStores, getStoreCategory, findStore } from '../../StoreDataService';
import { SpendingCategory } from '../../../types';

describe('Property 4: Store Category Identification', () => {
  const allStores = getAllStores();
  const validCategories = Object.values(SpendingCategory);

  // Arbitrary for selecting a random store from the database
  const storeArbitrary = fc.constantFrom(...allStores);

  it('should return a valid SpendingCategory for any known store', () => {
    fc.assert(
      fc.property(storeArbitrary, (store) => {
        const category = getStoreCategory(store.name);

        // Category should not be null for known stores
        expect(category).not.toBeNull();

        // Category should be a valid SpendingCategory
        expect(validCategories).toContain(category);
      }),
      { numRuns: 100 }
    );
  });

  it('should return consistent category across multiple queries for the same store', () => {
    fc.assert(
      fc.property(storeArbitrary, (store) => {
        // Query the same store multiple times
        const category1 = getStoreCategory(store.name);
        const category2 = getStoreCategory(store.name);
        const category3 = getStoreCategory(store.name);

        // All queries should return the same category
        expect(category1).toBe(category2);
        expect(category2).toBe(category3);
      }),
      { numRuns: 100 }
    );
  });

  it('should return the correct category matching the store definition', () => {
    fc.assert(
      fc.property(storeArbitrary, (store) => {
        const category = getStoreCategory(store.name);

        // The returned category should match the store's defined category
        expect(category).toBe(store.category);
      }),
      { numRuns: 100 }
    );
  });

  it('should find store and return correct category when using aliases', () => {
    // Filter stores that have aliases
    const storesWithAliases = allStores.filter((s) => s.aliases.length > 0);

    if (storesWithAliases.length === 0) {
      // Skip if no stores have aliases
      return;
    }

    const storeWithAliasArbitrary = fc.constantFrom(...storesWithAliases);

    fc.assert(
      fc.property(storeWithAliasArbitrary, (store) => {
        // Pick a random alias
        const alias = store.aliases[Math.floor(Math.random() * store.aliases.length)];
        const foundStore = findStore(alias);

        // Should find the store via alias
        expect(foundStore).not.toBeNull();

        // The found store's category should match
        expect(foundStore?.category).toBe(store.category);
      }),
      { numRuns: 100 }
    );
  });
});
