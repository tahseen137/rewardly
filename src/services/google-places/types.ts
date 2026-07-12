/**
 * Types for Google Places API integration
 */

import { SpendingCategory } from '../../types';

/**
 * Merchant information from Google Places
 */
export interface Merchant {
  placeId: string;
  name: string;
  nameFr?: string;
  category: SpendingCategory;
  googleTypes: string[];
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Merchant lookup errors
 */
export type MerchantError =
  | { type: 'MERCHANT_NOT_FOUND'; query: string }
  | { type: 'API_ERROR'; message: string }
  | { type: 'RATE_LIMITED' }
  | { type: 'NOT_CONFIGURED' };

/**
 * Google Places API Text Search Response
 */
export interface GooglePlacesTextSearchResponse {
  results: GooglePlaceResult[];
  status: GooglePlacesStatus;
  error_message?: string;
  next_page_token?: string;
}

/**
 * Google Places API Nearby Search Response
 */
export interface GooglePlacesNearbySearchResponse {
  results: GooglePlaceResult[];
  status: GooglePlacesStatus;
  error_message?: string;
  next_page_token?: string;
}

/**
 * Google Places API Autocomplete Response
 */
export interface GooglePlacesAutocompleteResponse {
  predictions: GooglePlacePrediction[];
  status: GooglePlacesStatus;
  error_message?: string;
}

/**
 * Individual place result from Google Places API
 */
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  types: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

/**
 * Autocomplete prediction from Google Places API
 */
export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
  matched_substrings: Array<{
    length: number;
    offset: number;
  }>;
}

/**
 * Google Places API status codes
 */
export type GooglePlacesStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR';

/**
 * Autocomplete suggestion for UI
 */
export interface AutocompleteSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}
