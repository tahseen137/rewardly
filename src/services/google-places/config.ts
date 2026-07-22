/**
 * Google Places API Configuration
 *
 * Setup Instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable the following APIs:
 *    - Places API
 *    - Places API (New)
 * 4. Go to APIs & Services > Credentials
 * 5. Create an API key
 * 6. Restrict the API key:
 *    - Application restrictions: Add your app's bundle ID (iOS) and package name (Android)
 *    - API restrictions: Restrict to Places API only
 * 7. Copy the API key to your .env file as EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
 *
 * Cost Information:
 * - Free tier: $200 USD/month credit (~6,000 searches/month)
 * - Text Search: $32 per 1,000 requests
 * - Autocomplete: $2.83 per 1,000 requests
 * - Nearby Search: $32 per 1,000 requests
 */

export const GOOGLE_PLACES_CONFIG = {
  // API Key from environment
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '',

  // Base URLs for Google Places API
  baseUrl: 'https://maps.googleapis.com/maps/api/place',

  // API Endpoints
  endpoints: {
    textSearch: '/textsearch/json',
    nearbySearch: '/nearbysearch/json',
    autocomplete: '/autocomplete/json',
    details: '/details/json',
  },

  // Default search parameters for Canadian market
  defaults: {
    // Restrict to Canada
    region: 'ca',
    // Default language (can be overridden by user preference)
    language: 'en',
    // Search radius in meters (50km default for nearby search)
    radius: 50000,
  },

  // Rate limiting configuration
  rateLimiting: {
    // Maximum requests per second
    maxRequestsPerSecond: 10,
    // Retry delay in milliseconds
    retryDelayMs: 1000,
    // Maximum retries
    maxRetries: 3,
  },

  // Cache configuration
  cache: {
    // Cache TTL in milliseconds (7 days)
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    // Maximum cached entries
    maxEntries: 1000,
    // Cache key prefix
    keyPrefix: 'google_places_',
  },
} as const;

/**
 * Check if Google Places API is configured
 */
export function isGooglePlacesConfigured(): boolean {
  return Boolean(
    GOOGLE_PLACES_CONFIG.apiKey && GOOGLE_PLACES_CONFIG.apiKey !== 'your-google-places-api-key-here'
  );
}

/**
 * Get the full URL for a Google Places API endpoint
 */
export function getPlacesApiUrl(endpoint: keyof typeof GOOGLE_PLACES_CONFIG.endpoints): string {
  return `${GOOGLE_PLACES_CONFIG.baseUrl}${GOOGLE_PLACES_CONFIG.endpoints[endpoint]}`;
}
