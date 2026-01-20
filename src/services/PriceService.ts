/**
 * PriceService - Manages product price data and retrieval
 * Supports fetching prices from multiple stores for comparison
 *
 * Requirements: 6.1, 6.2
 */

import { Result, success, failure, RecommendationError } from '../types';
import pricesData from '../data/prices.json';

// ============================================================================
// Types
// ============================================================================

/**
 * Price information for a product at a store
 */
export interface ProductPrice {
  productId: string;
  storeId: string;
  price: number;
  currency: string;
  lastUpdated: string;
}

/**
 * Price lookup result for a product across stores
 */
export interface PriceLookupResult {
  productId: string;
  prices: StorePrice[];
}

/**
 * Price at a specific store
 */
export interface StorePrice {
  storeId: string;
  price: number | null; // null if price unavailable
  currency: string;
  lastUpdated: string | null;
}

// Type assertion for the JSON data structure
interface PricesDataFile {
  prices: ProductPrice[];
}

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get all prices from the database
 */
export function getAllPrices(): ProductPrice[] {
  return (pricesData as PricesDataFile).prices;
}

/**
 * Get price for a specific product at a specific store
 *
 * @param productId - Product ID to look up
 * @param storeId - Store ID to look up
 * @returns ProductPrice or null if not found
 */
export function getPrice(productId: string, storeId: string): ProductPrice | null {
  const prices = getAllPrices();
  return prices.find((p) => p.productId === productId && p.storeId === storeId) ?? null;
}

/**
 * Get all prices for a product across all stores
 * Requirement 6.1: Retrieve prices from multiple stores
 *
 * @param productId - Product ID to look up
 * @param storeIds - Optional array of store IDs to filter by
 * @returns Array of ProductPrice for the product
 */
export function getPricesForProduct(productId: string, storeIds?: string[]): ProductPrice[] {
  const prices = getAllPrices();
  let filtered = prices.filter((p) => p.productId === productId);

  if (storeIds && storeIds.length > 0) {
    filtered = filtered.filter((p) => storeIds.includes(p.storeId));
  }

  return filtered;
}

/**
 * Get prices for a product at specified stores
 * Returns null for stores where price is unavailable
 * Requirement 6.6: Handle unavailable price data
 *
 * @param productId - Product ID to look up
 * @param storeIds - Array of store IDs to get prices for
 * @returns PriceLookupResult with prices (null for unavailable)
 */
export function lookupPrices(productId: string, storeIds: string[]): PriceLookupResult {
  const prices = getPricesForProduct(productId);
  const priceMap = new Map(prices.map((p) => [p.storeId, p]));

  const storePrices: StorePrice[] = storeIds.map((storeId) => {
    const priceData = priceMap.get(storeId);
    if (priceData) {
      return {
        storeId,
        price: priceData.price,
        currency: priceData.currency,
        lastUpdated: priceData.lastUpdated,
      };
    }
    // Requirement 6.6: Price unavailable
    return {
      storeId,
      price: null,
      currency: 'CAD',
      lastUpdated: null,
    };
  });

  return {
    productId,
    prices: storePrices,
  };
}

/**
 * Check if price data is available for a product at a store
 *
 * @param productId - Product ID to check
 * @param storeId - Store ID to check
 * @returns true if price is available
 */
export function isPriceAvailable(productId: string, storeId: string): boolean {
  return getPrice(productId, storeId) !== null;
}

/**
 * Get the lowest price for a product across all stores
 *
 * @param productId - Product ID to look up
 * @returns ProductPrice with lowest price or null if no prices found
 */
export function getLowestPrice(productId: string): ProductPrice | null {
  const prices = getPricesForProduct(productId);
  if (prices.length === 0) return null;

  return prices.reduce((lowest, current) => (current.price < lowest.price ? current : lowest));
}

/**
 * Get the highest price for a product across all stores
 *
 * @param productId - Product ID to look up
 * @returns ProductPrice with highest price or null if no prices found
 */
export function getHighestPrice(productId: string): ProductPrice | null {
  const prices = getPricesForProduct(productId);
  if (prices.length === 0) return null;

  return prices.reduce((highest, current) => (current.price > highest.price ? current : highest));
}
