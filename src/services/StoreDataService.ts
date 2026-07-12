/**
 * StoreDataService - Manages store information and category mapping
 * Supports fuzzy matching on store names and aliases
 */

import { Store, SpendingCategory } from '../types';
import storesData from '../data/stores.json';

/**
 * Get all stores from the database
 */
export function getAllStores(): Store[] {
  return storesData.stores as Store[];
}

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
 * Uses a simple approach: checks if one contains the other or starts with it
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

/**
 * Find the best matching store for a given name
 * Checks store name and all aliases
 */
export function findStore(name: string): Store | null {
  if (!name || name.trim() === '') {
    return null;
  }

  const stores = getAllStores();
  let bestMatch: Store | null = null;
  let bestScore = 0;
  const threshold = 0.5;

  for (const store of stores) {
    // Check main name
    const nameScore = calculateSimilarity(name, store.name);
    if (nameScore > bestScore) {
      bestScore = nameScore;
      bestMatch = store;
    }

    // Check aliases
    for (const alias of store.aliases) {
      const aliasScore = calculateSimilarity(name, alias);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestMatch = store;
      }
    }
  }

  return bestScore >= threshold ? bestMatch : null;
}

/**
 * Search stores by name or alias
 * Returns all stores that match the query above a threshold
 */
export function searchStores(query: string): Store[] {
  if (!query || query.trim() === '') {
    return getAllStores();
  }

  const stores = getAllStores();
  const threshold = 0.3;
  const results: Array<{ store: Store; score: number }> = [];

  for (const store of stores) {
    let maxScore = calculateSimilarity(query, store.name);

    for (const alias of store.aliases) {
      const aliasScore = calculateSimilarity(query, alias);
      if (aliasScore > maxScore) {
        maxScore = aliasScore;
      }
    }

    if (maxScore >= threshold) {
      results.push({ store, score: maxScore });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.store);
}

/**
 * Get the spending category for a store by name
 */
export function getStoreCategory(storeName: string): SpendingCategory | null {
  const store = findStore(storeName);
  return store?.category ?? null;
}
