/**
 * Google Places API Module
 *
 * Provides merchant lookup and category identification for Canadian stores.
 */

// Configuration
export { GOOGLE_PLACES_CONFIG, isGooglePlacesConfigured, getPlacesApiUrl } from './config';

// Types
export type {
  Merchant,
  MerchantError,
  AutocompleteSuggestion,
  GooglePlacesTextSearchResponse,
  GooglePlacesNearbySearchResponse,
  GooglePlacesAutocompleteResponse,
  GooglePlaceResult,
  GooglePlacePrediction,
  GooglePlacesStatus,
} from './types';

// Category Mapping
export {
  googleTypeToCategory,
  canadianStoreOverrides,
  getCategoryFromGoogleTypes,
} from './categoryMapping';

// Merchant Service
export {
  searchMerchant,
  getNearbyMerchants,
  getAutocompleteSuggestions,
  getMerchantCategory,
} from './MerchantService';

// Merchant Cache
export {
  getCachedMerchant,
  cacheMerchant,
  cacheMerchants,
  getCachedSearchResults,
  cacheSearchResults,
  getCachedCategory,
  cleanupExpiredEntries,
  clearCache,
  getCacheStats,
} from './MerchantCache';
