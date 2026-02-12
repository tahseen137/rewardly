/**
 * PreferenceManager - Handles user preferences
 * Uses AsyncStorage for persistence
 * Extended for country support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const NEW_CARD_SUGGESTIONS_STORAGE_KEY = '@rewards_optimizer/new_card_suggestions_enabled';
const LANGUAGE_STORAGE_KEY = '@rewards_optimizer/language';
const COUNTRY_STORAGE_KEY = '@rewards_optimizer/country';
const ONBOARDING_COMPLETE_KEY = '@rewards_optimizer/onboarding_complete';

export type Language = 'en' | 'fr';
export type Country = 'US' | 'CA';

/**
 * In-memory cache of preferences for synchronous operations
 */
let newCardSuggestionsCache: boolean | null = null;
let languageCache: Language | null = null;
let countryCache: Country | null = null;
let onboardingCompleteCache: boolean | null = null;

/**
 * Default values for preferences
 */
const DEFAULT_NEW_CARD_SUGGESTIONS = true;
const DEFAULT_LANGUAGE: Language = 'en';
const DEFAULT_COUNTRY: Country = 'US';

/**
 * Detect country from device locale
 * Uses device region settings to determine default country
 */
function detectCountryFromLocale(): Country {
  try {
    let locale = 'en-US';
    
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
               'en-US';
    } else if (Platform.OS === 'android') {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en_US';
    } else if (Platform.OS === 'web') {
      locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    }
    
    // Extract country code from locale (e.g., "en-CA" -> "CA", "en_CA" -> "CA")
    const parts = locale.replace('_', '-').split('-');
    const countryCode = parts.length > 1 ? parts[1].toUpperCase() : '';
    
    if (countryCode === 'CA') {
      return 'CA';
    }
    
    return 'US';
  } catch {
    return 'US';
  }
}

/**
 * Initialize the preference manager by loading data from storage
 */
export async function initializePreferences(): Promise<void> {
  try {
    const [storedNewCardSuggestions, storedLanguage, storedCountry, storedOnboarding] = await Promise.all([
      AsyncStorage.getItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
      AsyncStorage.getItem(COUNTRY_STORAGE_KEY),
      AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
    ]);

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

    if (storedCountry && isValidCountry(storedCountry)) {
      countryCache = storedCountry as Country;
    } else {
      // Auto-detect on first launch
      countryCache = detectCountryFromLocale();
      await AsyncStorage.setItem(COUNTRY_STORAGE_KEY, countryCache);
    }

    if (storedOnboarding !== null) {
      onboardingCompleteCache = storedOnboarding === 'true';
    } else {
      onboardingCompleteCache = false;
    }
  } catch {
    newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
    languageCache = DEFAULT_LANGUAGE;
    countryCache = detectCountryFromLocale();
    onboardingCompleteCache = false;
  }
}

/**
 * Check if a string is a valid Language
 */
function isValidLanguage(value: string): boolean {
  return value === 'en' || value === 'fr';
}

/**
 * Check if a string is a valid Country
 */
function isValidCountry(value: string): boolean {
  return value === 'US' || value === 'CA';
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
 * Set the user's country preference
 * @param country - The country to set ('US' or 'CA')
 */
export async function setCountry(country: Country): Promise<void> {
  countryCache = country;
  await AsyncStorage.setItem(COUNTRY_STORAGE_KEY, country);
}

/**
 * Get the user's country preference
 * @returns The current country preference
 */
export function getCountry(): Country {
  if (countryCache === null) {
    return DEFAULT_COUNTRY;
  }
  return countryCache;
}

/**
 * Get country flag emoji
 * @param country - Country code
 * @returns Flag emoji for the country
 */
export function getCountryFlag(country: Country): string {
  return country === 'CA' ? '🇨🇦' : '🇺🇸';
}

/**
 * Get country display name
 * @param country - Country code
 * @returns Display name for the country
 */
export function getCountryName(country: Country): string {
  return country === 'CA' ? 'Canada' : 'United States';
}

/**
 * Set whether onboarding is complete
 * @param complete - Whether onboarding is complete
 */
export async function setOnboardingComplete(complete: boolean): Promise<void> {
  onboardingCompleteCache = complete;
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, String(complete));
}

/**
 * Check if onboarding is complete
 * @returns Whether onboarding has been completed
 */
export function isOnboardingComplete(): boolean {
  if (onboardingCompleteCache === null) {
    return false;
  }
  return onboardingCompleteCache;
}

/**
 * Clear all preferences (useful for testing)
 */
export async function clearPreferences(): Promise<void> {
  newCardSuggestionsCache = DEFAULT_NEW_CARD_SUGGESTIONS;
  languageCache = DEFAULT_LANGUAGE;
  countryCache = DEFAULT_COUNTRY;
  onboardingCompleteCache = false;
  await Promise.all([
    AsyncStorage.removeItem(NEW_CARD_SUGGESTIONS_STORAGE_KEY),
    AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY),
    AsyncStorage.removeItem(COUNTRY_STORAGE_KEY),
    AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY),
  ]);
}

/**
 * Reset the in-memory cache (useful for testing)
 */
export function resetPreferenceCache(): void {
  newCardSuggestionsCache = null;
  languageCache = null;
  countryCache = null;
  onboardingCompleteCache = null;
}

/**
 * Get all user preferences as an object
 * @returns UserPreferences object with all preference values
 */
export async function getPreferences(): Promise<{
  rewardType: 'POINTS' | 'CASHBACK';
  newCardSuggestionsEnabled: boolean;
  language: Language;
  country: Country;
}> {
  // Ensure preferences are initialized
  if (newCardSuggestionsCache === null) {
    await initializePreferences();
  }
  
  return {
    rewardType: 'POINTS', // Default to points, could be made configurable later
    newCardSuggestionsEnabled: isNewCardSuggestionsEnabled(),
    language: getLanguage(),
    country: getCountry(),
  };
}
