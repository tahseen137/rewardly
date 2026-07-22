/**
 * Property Tests for PreferenceManager
 * Feature: rewards-optimizer
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setNewCardSuggestionsEnabled,
  isNewCardSuggestionsEnabled,
  clearPreferences,
  resetPreferenceCache,
  initializePreferences,
} from '../../PreferenceManager';

describe('Property 11: Preference Persistence Round-Trip', () => {
  /**
   * Feature: rewards-optimizer, Property 11: Preference Persistence Round-Trip
   * Validates: Requirements 5.1
   *
   * For any valid preference setting, setting it and then retrieving it
   * should return the same value.
   */

  beforeEach(async () => {
    // Clear mock storage and reset cache before each test
    (AsyncStorage as unknown as { __clearMockStorage: () => void }).__clearMockStorage();
    resetPreferenceCache();
    await initializePreferences();
  });

  it('should return the same boolean after setting and getting new card suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), async (enabled) => {
        // Clear preferences for each iteration
        await clearPreferences();

        // Set the new card suggestions preference
        await setNewCardSuggestionsEnabled(enabled);

        // Get the new card suggestions preference
        const retrieved = isNewCardSuggestionsEnabled();

        // Should match exactly
        expect(retrieved).toBe(enabled);
      }),
      { numRuns: 100 }
    );
  });

  it('should persist new card suggestions preference across cache resets', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), async (enabled) => {
        // Clear preferences for each iteration
        await clearPreferences();

        // Set the new card suggestions preference
        await setNewCardSuggestionsEnabled(enabled);

        // Reset the cache (simulating app restart)
        resetPreferenceCache();

        // Re-initialize from storage
        await initializePreferences();

        // Get the new card suggestions preference
        const retrieved = isNewCardSuggestionsEnabled();

        // Should still match
        expect(retrieved).toBe(enabled);
      }),
      { numRuns: 100 }
    );
  });
});
