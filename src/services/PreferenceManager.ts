/**
 * PreferenceManager - Handles user preferences including reward type selection
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardType } from '../types';

const REWARD_TYPE_STORAGE_KEY = '@rewards_optimizer/reward_type_preference';
const NEW_CARD_SUGGESTIONS_STORAGE_KEY = '@rewards_optimizer/new_card_suggestions_enabled';
const LANGUAGE_STORAGE_KEY = '@rewards_optimizer/language';

export type Language = 'en' | 'fr';

/**
 * In-memory cache of preferences for synchronous operations
 */
let rewardTypeCache: RewardType | null = null;
let newCardSuggestionsCache: boolean | null = null;
let languageCache: Language | null = null;

/**
 * Default values for preferences
 */
const DEFAULT_REWARD_TYPE = RewardType.CASHBACK;
const DEFAULT_NEW_CARD_SUGGESTIONS = true;
const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Initialize the preference manager by loading data from storage
 */
export async function initializePreferences(): Promise<void> {
  try {
    const [storedRewardType, storedNewCardSuggestions, storedLanguage] = await Promise.all([
      AsyncStorage.getItem(REWARD_TYPE_STORAGE_KEY),
      AsyncStorage.getItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
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

    if (storedLanguage && isValidLanguage(storedLanguage)) {
      languageCache = storedLanguage as Language;
    } else {
      languageCache = DEFAULT_LANGUAGE;
    }
  } catch {
    rewardTypeCache = DEFAULT_REWARD_TYPE;
    newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
    languageCache = DEFAULT_LANGUAGE;
  }
}

/**
 * Check if a string is a valid RewardType
 */
function isValidRewardType(value: string): boolean {
  return Object.values(RewardType).includes(value as RewardType);
}

/**
 * Check if a string is a valid Language
 */
function isValidLanguage(value: string): boolean {
  return value === 'en' || value === 'fr';
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
 * Set the user's language preference
 * @param lang - The language to set ('en' or 'fr')
 */
export async function setLanguage(lang: Language): Promise<void> {
  languageCache = lang;
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

/**
 * Get the user's language preference
 * @returns The current language preference
 */
export function getLanguage(): Language {
  if (languageCache === null) {
    return DEFAULT_LANGUAGE;
  }
  return languageCache;
}

/**
 * Clear all preferences (useful for testing)
 */
export async function clearPreferences(): Promise<void> {
  rewardTypeCache = DEFAULT_REWARD_TYPE;
  newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
  languageCache = DEFAULT_LANGUAGE;
  await Promise.all([
    AsyncStorage.removeItem(REWARD_TYPE_STORAGE_KEY),
    AsyncStorage.removeItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY),
    AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY),
  ]);
}

/**
 * Reset the in-memory cache (useful for testing)
 */
export function resetPreferenceCache(): void {
  rewardTypeCache = null;
  newCardSuggestionsCache = null;
  languageCache = null;
}
