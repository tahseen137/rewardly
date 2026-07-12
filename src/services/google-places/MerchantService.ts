/**
 * MerchantService - Handles merchant lookup via Google Places API
 *
 * Provides:
 * - Text search for merchants
 * - Nearby merchant search
 * - Autocomplete suggestions for store search
 * - Category mapping for Canadian stores
 * - Caching to reduce API calls
 */

import { SpendingCategory, Result, success, failure } from '../../types';
import { GOOGLE_PLACES_CONFIG, isGooglePlacesConfigured, getPlacesApiUrl } from './config';
import { getCategoryFromGoogleTypes } from './categoryMapping';
import {
  getCachedSearchResults,
  cacheSearchResults,
  getCachedMerchant,
  cacheMerchants,
} from './MerchantCache';
import {
  Merchant,
  MerchantError,
  GooglePlacesTextSearchResponse,
  GooglePlacesNearbySearchResponse,
  GooglePlacesAutocompleteResponse,
  GooglePlaceResult,
  AutocompleteSuggestion,
} from './types';

/**
 * Search for merchants by name using Google Places Text Search API
 * Results are cached for 7 days to reduce API calls.
 *
 * @param query - Search query (e.g., "Loblaws Toronto")
 * @param language - Language for results ('en' or 'fr')
 * @param useCache - Whether to use cached results (default: true)
 * @returns Result with array of merchants or error
 */
export async function searchMerchant(
  query: string,
  language: 'en' | 'fr' = 'en',
  useCache: boolean = true
): Promise<Result<Merchant[], MerchantError>> {
  if (!isGooglePlacesConfigured()) {
    return failure({ type: 'NOT_CONFIGURED' });
  }

  if (!query || query.trim() === '') {
    return failure({ type: 'MERCHANT_NOT_FOUND', query: '' });
  }

  // Check cache first
  if (useCache) {
    const cached = await getCachedSearchResults(query);
    if (cached) {
      return success(cached);
    }
  }

  try {
    const url = new URL(getPlacesApiUrl('textSearch'));
    url.searchParams.set('query', query);
    url.searchParams.set('key', GOOGLE_PLACES_CONFIG.apiKey);
    url.searchParams.set('region', GOOGLE_PLACES_CONFIG.defaults.region);
    url.searchParams.set('language', language);

    const response = await fetch(url.toString());
    const data: GooglePlacesTextSearchResponse = await response.json();

    if (data.status === 'OVER_QUERY_LIMIT') {
      return failure({ type: 'RATE_LIMITED' });
    }

    if (data.status === 'REQUEST_DENIED') {
      return failure({ type: 'API_ERROR', message: data.error_message || 'Request denied' });
    }

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      return failure({ type: 'MERCHANT_NOT_FOUND', query });
    }

    if (data.status !== 'OK') {
      return failure({ type: 'API_ERROR', message: data.error_message || `Unknown status: ${data.status}` });
    }

    const merchants = data.results.map((place) => mapPlaceToMerchant(place));

    // Cache the results
    await cacheSearchResults(query, merchants);

    return success(merchants);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failure({ type: 'API_ERROR', message });
  }
}

/**
 * Search for nearby merchants using Google Places Nearby Search API
 * Results are cached for 7 days to reduce API calls.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param category - Optional spending category to filter by
 * @param language - Language for results ('en' or 'fr')
 * @param useCache - Whether to use cached results (default: true)
 * @returns Result with array of merchants or error
 */
export async function getNearbyMerchants(
  lat: number,
  lng: number,
  category?: SpendingCategory,
  language: 'en' | 'fr' = 'en',
  useCache: boolean = true
): Promise<Result<Merchant[], MerchantError>> {
  if (!isGooglePlacesConfigured()) {
    return failure({ type: 'NOT_CONFIGURED' });
  }

  // Create a cache key for nearby searches
  const cacheKey = `nearby:${lat.toFixed(3)},${lng.toFixed(3)}:${category || 'all'}`;

  // Check cache first
  if (useCache) {
    const cached = await getCachedSearchResults(cacheKey);
    if (cached) {
      return success(cached);
    }
  }

  try {
    const url = new URL(getPlacesApiUrl('nearbySearch'));
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', GOOGLE_PLACES_CONFIG.defaults.radius.toString());
    url.searchParams.set('key', GOOGLE_PLACES_CONFIG.apiKey);
    url.searchParams.set('language', language);

    // Add type filter based on category
    const googleType = categoryToGoogleType(category);
    if (googleType) {
      url.searchParams.set('type', googleType);
    }

    const response = await fetch(url.toString());
    const data: GooglePlacesNearbySearchResponse = await response.json();

    if (data.status === 'OVER_QUERY_LIMIT') {
      return failure({ type: 'RATE_LIMITED' });
    }

    if (data.status === 'REQUEST_DENIED') {
      return failure({ type: 'API_ERROR', message: data.error_message || 'Request denied' });
    }

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      return failure({ type: 'MERCHANT_NOT_FOUND', query: `nearby ${lat},${lng}` });
    }

    if (data.status !== 'OK') {
      return failure({ type: 'API_ERROR', message: data.error_message || `Unknown status: ${data.status}` });
    }

    const merchants = data.results.map((place) => mapPlaceToMerchant(place));

    // Cache the results
    await cacheSearchResults(cacheKey, merchants);

    return success(merchants);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failure({ type: 'API_ERROR', message });
  }
}

/**
 * Get autocomplete suggestions for store search
 *
 * @param input - Partial search input
 * @param language - Language for results ('en' or 'fr')
 * @returns Result with array of suggestions or error
 */
export async function getAutocompleteSuggestions(
  input: string,
  language: 'en' | 'fr' = 'en'
): Promise<Result<AutocompleteSuggestion[], MerchantError>> {
  if (!isGooglePlacesConfigured()) {
    return failure({ type: 'NOT_CONFIGURED' });
  }

  if (!input || input.trim().length < 2) {
    return success([]);
  }

  try {
    const url = new URL(getPlacesApiUrl('autocomplete'));
    url.searchParams.set('input', input);
    url.searchParams.set('key', GOOGLE_PLACES_CONFIG.apiKey);
    url.searchParams.set('components', `country:${GOOGLE_PLACES_CONFIG.defaults.region}`);
    url.searchParams.set('language', language);
    // Focus on establishments (stores, restaurants, etc.)
    url.searchParams.set('types', 'establishment');

    const response = await fetch(url.toString());
    const data: GooglePlacesAutocompleteResponse = await response.json();

    if (data.status === 'OVER_QUERY_LIMIT') {
      return failure({ type: 'RATE_LIMITED' });
    }

    if (data.status === 'REQUEST_DENIED') {
      return failure({ type: 'API_ERROR', message: data.error_message || 'Request denied' });
    }

    if (data.status === 'ZERO_RESULTS' || !data.predictions || data.predictions.length === 0) {
      return success([]);
    }

    if (data.status !== 'OK') {
      return failure({ type: 'API_ERROR', message: data.error_message || `Unknown status: ${data.status}` });
    }

    const suggestions: AutocompleteSuggestion[] = data.predictions.map((prediction) => ({
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
      fullText: prediction.description,
    }));

    return success(suggestions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return failure({ type: 'API_ERROR', message });
  }
}

/**
 * Get the spending category for a merchant
 *
 * @param merchant - Merchant object
 * @returns SpendingCategory
 */
export function getMerchantCategory(merchant: Merchant): SpendingCategory {
  return merchant.category;
}

/**
 * Map a Google Place result to our Merchant type
 */
function mapPlaceToMerchant(place: GooglePlaceResult): Merchant {
  return {
    placeId: place.place_id,
    name: place.name,
    category: getCategoryFromGoogleTypes(place.name, place.types),
    googleTypes: place.types,
    address: place.formatted_address,
    location: place.geometry?.location
      ? {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        }
      : undefined,
  };
}

/**
 * Map SpendingCategory to Google Places type for filtering
 */
function categoryToGoogleType(category?: SpendingCategory): string | null {
  if (!category) return null;

  const mapping: Partial<Record<SpendingCategory, string>> = {
    [SpendingCategory.GROCERIES]: 'grocery_or_supermarket',
    [SpendingCategory.DINING]: 'restaurant',
    [SpendingCategory.GAS]: 'gas_station',
    [SpendingCategory.DRUGSTORES]: 'pharmacy',
    [SpendingCategory.TRAVEL]: 'lodging',
    [SpendingCategory.ENTERTAINMENT]: 'movie_theater',
    [SpendingCategory.HOME_IMPROVEMENT]: 'hardware_store',
  };

  return mapping[category] || null;
}
