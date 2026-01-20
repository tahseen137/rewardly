/**
 * ProductService - Manages product search and store mapping
 * Supports fuzzy matching on product names and aliases
 *
 * Requirements: 4.1, 4.2
 */

import { Store, SpendingCategory, Result, success, failure, RecommendationError } from '../types';
import { getAllStores } from './StoreDataService';
import productsData from '../data/products.json';

// ============================================================================
// Types
// ============================================================================

/**
 * Product information from the database
 */
export interface Product {
  id: string;
  name: string;
  nameFr?: string;
  category: SpendingCategory;
  stores: string[]; // Store IDs that sell this product
  aliases: string[];
}

/**
 * Product search result with matched stores
 */
export interface ProductSearchResult {
  product: Product;
  stores: Store[];
  matchScore: number;
}

// Type assertion for the JSON data structure
interface ProductsDataFile {
  products: Product[];
}

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get all products from the database
 */
export function getAllProducts(): Product[] {
  return (productsData as ProductsDataFile).products;
}

/**
 * Get a product by its ID
 */
export function getProductById(id: string): Product | null {
  const products = getAllProducts();
  return products.find((p) => p.id === id) ?? null;
}

// ============================================================================
// Fuzzy Matching
// ============================================================================

/**
 * Normalize a string for comparison (lowercase, remove special chars, trim)
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(query: string, target: string): number {
  const normalizedQuery = normalize(query);
  const normalizedTarget = normalize(target);

  // Exact match
  if (normalizedQuery === normalizedTarget) {
    return 1;
  }

  // Target starts with query
  if (normalizedTarget.startsWith(normalizedQuery)) {
    return 0.9;
  }

  // Query starts with target
  if (normalizedQuery.startsWith(normalizedTarget)) {
    return 0.85;
  }

  // Target contains query
  if (normalizedTarget.includes(normalizedQuery)) {
    return 0.7;
  }

  // Query contains target
  if (normalizedQuery.includes(normalizedTarget)) {
    return 0.6;
  }

  // Check word-level matching
  const queryWords = normalizedQuery.split(' ');
  const targetWords = normalizedTarget.split(' ');
  const matchingWords = queryWords.filter((word) =>
    targetWords.some((tw) => tw.includes(word) || word.includes(tw))
  );

  if (matchingWords.length > 0) {
    return 0.5 * (matchingWords.length / Math.max(queryWords.length, targetWords.length));
  }

  return 0;
}

// ============================================================================
// Product Search
// ============================================================================

/**
 * Search for a product by name
 * Returns the best matching product with its available stores
 *
 * Requirements: 4.1 - Identify stores that sell a product
 *
 * @param query - Product name to search for
 * @returns Result with ProductSearchResult or error if not found
 */
export function searchProduct(query: string): Result<ProductSearchResult, RecommendationError> {
  if (!query || query.trim() === '') {
    return failure({ type: 'PRODUCT_NOT_FOUND', productName: query });
  }

  const products = getAllProducts();
  const allStores = getAllStores();

  let bestMatch: Product | null = null;
  let bestScore = 0;
  const threshold = 0.5;

  for (const product of products) {
    // Check main name
    let maxScore = calculateSimilarity(query, product.name);

    // Check French name if available
    if (product.nameFr) {
      const frScore = calculateSimilarity(query, product.nameFr);
      if (frScore > maxScore) {
        maxScore = frScore;
      }
    }

    // Check aliases
    for (const alias of product.aliases) {
      const aliasScore = calculateSimilarity(query, alias);
      if (aliasScore > maxScore) {
        maxScore = aliasScore;
      }
    }

    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestMatch = product;
    }
  }

  if (!bestMatch || bestScore < threshold) {
    return failure({ type: 'PRODUCT_NOT_FOUND', productName: query });
  }

  // Map store IDs to Store objects
  const matchedStores = bestMatch.stores
    .map((storeId) => allStores.find((s) => s.id === storeId))
    .filter((s): s is Store => s !== undefined);

  return success({
    product: bestMatch,
    stores: matchedStores,
    matchScore: bestScore,
  });
}

/**
 * Search for products matching a query
 * Returns all products above the threshold, sorted by match score
 *
 * @param query - Product name to search for
 * @returns Array of ProductSearchResult sorted by match score
 */
export function searchProducts(query: string): ProductSearchResult[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const products = getAllProducts();
  const allStores = getAllStores();
  const threshold = 0.3;
  const results: ProductSearchResult[] = [];

  for (const product of products) {
    // Check main name
    let maxScore = calculateSimilarity(query, product.name);

    // Check French name if available
    if (product.nameFr) {
      const frScore = calculateSimilarity(query, product.nameFr);
      if (frScore > maxScore) {
        maxScore = frScore;
      }
    }

    // Check aliases
    for (const alias of product.aliases) {
      const aliasScore = calculateSimilarity(query, alias);
      if (aliasScore > maxScore) {
        maxScore = aliasScore;
      }
    }

    if (maxScore >= threshold) {
      // Map store IDs to Store objects
      const matchedStores = product.stores
        .map((storeId) => allStores.find((s) => s.id === storeId))
        .filter((s): s is Store => s !== undefined);

      results.push({
        product,
        stores: matchedStores,
        matchScore: maxScore,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results;
}

/**
 * Get stores that sell a specific product
 *
 * Requirements: 4.1, 4.2 - Map products to stores
 *
 * @param productId - Product ID to look up
 * @returns Array of stores that sell the product
 */
export function getStoresForProduct(productId: string): Store[] {
  const product = getProductById(productId);
  if (!product) {
    return [];
  }

  const allStores = getAllStores();
  return product.stores
    .map((storeId) => allStores.find((s) => s.id === storeId))
    .filter((s): s is Store => s !== undefined);
}

/**
 * Get products available at a specific store
 *
 * @param storeId - Store ID to look up
 * @returns Array of products available at the store
 */
export function getProductsForStore(storeId: string): Product[] {
  const products = getAllProducts();
  return products.filter((p) => p.stores.includes(storeId));
}

/**
 * Get products by spending category
 *
 * @param category - Spending category to filter by
 * @returns Array of products in the category
 */
export function getProductsByCategory(category: SpendingCategory): Product[] {
  const products = getAllProducts();
  return products.filter((p) => p.category === category);
}
