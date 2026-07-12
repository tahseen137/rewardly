/**
 * Property Tests for PreferenceManager
 * Feature: rewards-optimizer
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setRewardTypePreference,
  getRewardTypePreference,
  setNewCardSuggestionsEnabled,
  isNewCardSuggestionsEnabled,
  clearPreferences,
  resetPreferenceCache,
  initializePreferences,
} from '../../PreferenceManager';
import { RewardType } from '../../../types';

// Arbitrary for selecting a random valid RewardType
const rewardTypeArbitrary = fc.constantFrom(
  RewardType.CASHBACK,
  RewardType.POINTS,
  RewardType.AIRLINE_MILES,
  RewardType.HOTEL_POINTS
);

describe('Property 11: Preference Persistence Round-Trip', () => {
  /**
   * Feature: rewards-optimizer, Property 11: Preference Persistence Round-Trip
   * Validates: Requirements 5.1
   *
   * For any valid reward type preference, setting the preference and then
   * retrieving it should return the same reward type.
   */

  beforeEach(async () => {
    // Clear mock storage and reset cache before each test
    (AsyncStorage as unknown as { __clearMockStorage: () => void }).__clearMockStorage();
    resetPreferenceCache();
    await initializePreferences();
  });

  it('should return the same reward type after setting and getting', async () => {
    await fc.assert(
      fc.asyncProperty(rewardTypeArbitrary, async (rewardType) => {
        // Clear preferences for each iteration
        await clearPreferences();

        // Set the reward type preference
        await setRewardTypePreference(rewardType);

        // Get the reward type preference
        const retrieved = getRewardTypePreference();

        // Should match exactly
        expect(retrieved).toBe(rewardType);
      }),
      { numRuns: 100 }
    );
  });

  it('should persist reward type preference across cache resets', async () => {
    await fc.assert(
      fc.asyncProperty(rewardTypeArbitrary, async (rewardType) => {
        // Clear preferences for each iteration
        await clearPreferences();

        // Set the reward type preference
        await setRewardTypePreference(rewardType);

        // Reset the cache (simulating app restart)
        resetPreferenceCache();

        // Re-initialize from storage
        await initializePreferences();

        // Get the reward type preference
        const retrieved = getRewardTypePreference();

        // Should still match
        expect(retrieved).toBe(rewardType);
      }),
      { numRuns: 100 }
    );
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
