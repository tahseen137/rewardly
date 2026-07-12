/**
 * MerchantCache - Caches merchant lookups to reduce API calls
 *
 * Features:
 * - 7-day TTL for cached entries
 * - Stores placeId → category mappings
 * - Persists to AsyncStorage
 * - Automatic cleanup of expired entries
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpendingCategory } from '../../types';
import { GOOGLE_PLACES_CONFIG } from './config';
import { Merchant } from './types';

/**
 * Cached merchant entry
 */
interface CachedMerchant {
  merchant: Merchant;
  cachedAt: number; // Unix timestamp
}

/**
 * Cache structure stored in AsyncStorage
 */
interface MerchantCacheData {
  version: number;
  entries: Record<string, CachedMerchant>; // keyed by placeId
  searchCache: Record<string, string[]>; // query → placeIds
}

const CACHE_KEY = `${GOOGLE_PLACES_CONFIG.cache.keyPrefix}merchant_cache`;
const CACHE_VERSION = 1;

/**
 * In-memory cache for faster access
 */
let memoryCache: MerchantCacheData | null = null;

/**
 * Initialize the cache from AsyncStorage
 */
async function initCache(): Promise<MerchantCacheData> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as MerchantCacheData;
      if (data.version === CACHE_VERSION) {
        memoryCache = data;
        return memoryCache;
      }
    }
  } catch {
    // Ignore parse errors, start fresh
  }

  // Initialize empty cache
  memoryCache = {
    version: CACHE_VERSION,
    entries: {},
    searchCache: {},
  };

  return memoryCache;
}

/**
 * Save cache to AsyncStorage
 */
async function saveCache(): Promise<void> {
  if (!memoryCache) return;

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if a cached entry is still valid (not expired)
 */
function isEntryValid(entry: CachedMerchant): boolean {
  const now = Date.now();
  const age = now - entry.cachedAt;
  return age < GOOGLE_PLACES_CONFIG.cache.ttlMs;
}

/**
 * Get a cached merchant by placeId
 *
 * @param placeId - Google Places ID
 * @returns Cached merchant or null if not found/expired
 */
export async function getCachedMerchant(placeId: string): Promise<Merchant | null> {
  const cache = await initCache();
  const entry = cache.entries[placeId];

  if (entry && isEntryValid(entry)) {
    return entry.merchant;
  }

  // Remove expired entry
  if (entry) {
    delete cache.entries[placeId];
    await saveCache();
  }

  return null;
}

/**
 * Cache a merchant
 *
 * @param merchant - Merchant to cache
 */
export async function cacheMerchant(merchant: Merchant): Promise<void> {
  const cache = await initCache();

  cache.entries[merchant.placeId] = {
    merchant,
    cachedAt: Date.now(),
  };

  // Enforce max entries limit
  const entries = Object.entries(cache.entries);
  if (entries.length > GOOGLE_PLACES_CONFIG.cache.maxEntries) {
    // Remove oldest entries
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toRemove = entries.slice(0, entries.length - GOOGLE_PLACES_CONFIG.cache.maxEntries);
    for (const [key] of toRemove) {
      delete cache.entries[key];
    }
  }

  await saveCache();
}

/**
 * Cache multiple merchants at once
 *
 * @param merchants - Array of merchants to cache
 */
export async function cacheMerchants(merchants: Merchant[]): Promise<void> {
  const cache = await initCache();
  const now = Date.now();

  for (const merchant of merchants) {
    cache.entries[merchant.placeId] = {
      merchant,
      cachedAt: now,
    };
  }

  // Enforce max entries limit
  const entries = Object.entries(cache.entries);
  if (entries.length > GOOGLE_PLACES_CONFIG.cache.maxEntries) {
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toRemove = entries.slice(0, entries.length - GOOGLE_PLACES_CONFIG.cache.maxEntries);
    for (const [key] of toRemove) {
      delete cache.entries[key];
    }
  }

  await saveCache();
}

/**
 * Get cached search results for a query
 *
 * @param query - Search query
 * @returns Array of cached merchants or null if not cached
 */
export async function getCachedSearchResults(query: string): Promise<Merchant[] | null> {
  const cache = await initCache();
  const normalizedQuery = query.toLowerCase().trim();
  const placeIds = cache.searchCache[normalizedQuery];

  if (!placeIds || placeIds.length === 0) {
    return null;
  }

  // Get all cached merchants for these placeIds
  const merchants: Merchant[] = [];
  let allValid = true;

  for (const placeId of placeIds) {
    const entry = cache.entries[placeId];
    if (entry && isEntryValid(entry)) {
      merchants.push(entry.merchant);
    } else {
      allValid = false;
      break;
    }
  }

  // If any entry is invalid, invalidate the search cache
  if (!allValid) {
    delete cache.searchCache[normalizedQuery];
    await saveCache();
    return null;
  }

  return merchants;
}

/**
 * Cache search results for a query
 *
 * @param query - Search query
 * @param merchants - Array of merchants from search results
 */
export async function cacheSearchResults(query: string, merchants: Merchant[]): Promise<void> {
  const cache = await initCache();
  const normalizedQuery = query.toLowerCase().trim();

  // Cache individual merchants
  await cacheMerchants(merchants);

  // Cache the search query → placeIds mapping
  cache.searchCache[normalizedQuery] = merchants.map((m) => m.placeId);

  await saveCache();
}

/**
 * Get the category for a placeId from cache
 *
 * @param placeId - Google Places ID
 * @returns SpendingCategory or null if not cached
 */
export async function getCachedCategory(placeId: string): Promise<SpendingCategory | null> {
  const merchant = await getCachedMerchant(placeId);
  return merchant?.category ?? null;
}

/**
 * Clear all expired entries from the cache
 */
export async function cleanupExpiredEntries(): Promise<number> {
  const cache = await initCache();
  let removedCount = 0;

  // Clean up expired merchant entries
  for (const [placeId, entry] of Object.entries(cache.entries)) {
    if (!isEntryValid(entry)) {
      delete cache.entries[placeId];
      removedCount++;
    }
  }

  // Clean up search cache entries that reference removed merchants
  for (const [query, placeIds] of Object.entries(cache.searchCache)) {
    const validPlaceIds = placeIds.filter((id) => cache.entries[id]);
    if (validPlaceIds.length === 0) {
      delete cache.searchCache[query];
    } else if (validPlaceIds.length !== placeIds.length) {
      cache.searchCache[query] = validPlaceIds;
    }
  }

  if (removedCount > 0) {
    await saveCache();
  }

  return removedCount;
}

/**
 * Clear the entire cache
 */
export async function clearCache(): Promise<void> {
  memoryCache = {
    version: CACHE_VERSION,
    entries: {},
    searchCache: {},
  };

  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  searchQueries: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  const cache = await initCache();
  const entries = Object.values(cache.entries);

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      searchQueries: Object.keys(cache.searchCache).length,
      oldestEntry: null,
      newestEntry: null,
    };
  }

  const timestamps = entries.map((e) => e.cachedAt);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);

  return {
    totalEntries: entries.length,
    searchQueries: Object.keys(cache.searchCache).length,
    oldestEntry: new Date(oldest),
    newestEntry: new Date(newest),
  };
}
