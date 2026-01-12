/**
 * PreferenceManager - Handles user preferences including reward type selection
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardType } from '../types';

const REWARD_TYPE_STORAGE_KEY = '@rewards_optimizer/reward_type_preference';
const NEW_CARD_SUGGESTIONS_STORAGE_KEY = '@rewards_optimizer/new_card_suggestions_enabled';

/**
 * In-memory cache of preferences for synchronous operations
 */
let rewardTypeCache: RewardType | null = null;
let newCardSuggestionsCache: boolean | null = null;

/**
 * Default values for preferences
 */
const DEFAULT_REWARD_TYPE = RewardType.CASHBACK;
const DEFAULT_NEW_CARD_SUGGESTIONS = true;

/**
 * Initialize the preference manager by loading data from storage
 */
export async function initializePreferences(): Promise<void> {
  try {
    const [storedRewardType, storedNewCardSuggestions] = await Promise.all([
      AsyncStorage.getItem(REWARD_TYPE_STORAGE_KEY),
      AsyncStorage.getItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY),
    ]);

    if (storedRewardType && isValidRewardType(storedRewardType)) {
      rewardTypeCache = storedRewardType as RewardType;
    } else {
      rewardTypeCache = DEFAULT_REWARD_TYPE;
    }

    if (storedNewCardSuggestions !== null) {
      newCardSuggestionsCache = storedNewCardSuggestions === 'true';
    } else {
      newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
    }
  } catch {
    rewardTypeCache = DEFAULT_REWARD_TYPE;
    newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
  }
}

/**
 * Check if a string is a valid RewardType
 */
function isValidRewardType(value: string): boolean {
  return Object.values(RewardType).includes(value as RewardType);
}

/**
 * Set the user's reward type preference
 * @param type - The reward type to set as preference
 */
export async function setRewardTypePreference(type: RewardType): Promise<void> {
  rewardTypeCache = type;
  await AsyncStorage.setItem(REWARD_TYPE_STORAGE_KEY, type);
}

/**
 * Get the user's reward type preference
 * @returns The current reward type preference
 */
export function getRewardTypePreference(): RewardType {
  if (rewardTypeCache === null) {
    return DEFAULT_REWARD_TYPE;
  }
  return rewardTypeCache;
}

/**
 * Set whether new card suggestions are enabled
 * @param enabled - Whether to enable new card suggestions
 */
export async function setNewCardSuggestionsEnabled(enabled: boolean): Promise<void> {
  newCardSuggestionsCache = enabled;
  await AsyncStorage.setItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY, String(enabled));
}

/**
 * Check if new card suggestions are enabled
 * @returns Whether new card suggestions are enabled
 */
export function isNewCardSuggestionsEnabled(): boolean {
  if (newCardSuggestionsCache === null) {
    return DEFAULT_NEW_CARD_SUGGESTIONS;
  }
  return newCardSuggestionsCache;
}

/**
 * Clear all preferences (useful for testing)
 */
export async function clearPreferences(): Promise<void> {
  rewardTypeCache = DEFAULT_REWARD_TYPE;
  newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
  await Promise.all([
    AsyncStorage.removeItem(REWARD_TYPE_STORAGE_KEY),
    AsyncStorage.removeItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY),
  ]);
}

/**
 * Reset the in-memory cache (useful for testing)
 */
export function resetPreferenceCache(): void {
  rewardTypeCache = null;
  newCardSuggestionsCache = null;
}
