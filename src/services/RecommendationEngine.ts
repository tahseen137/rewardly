/**
 * RecommendationEngine - Core logic that calculates optimal card choices
 * Provides card ranking, new card suggestions, and store recommendations
 */

import {
  Card,
  SpendingCategory,
  RewardType,
  RewardRate,
  RankedCard,
  StoreRecommendation,
  ProductRecommendation,
  StoreCardCombination,
  UserPreferences,
  UserCard,
  Result,
  success,
  failure,
  RecommendationError,
  Store,
} from '../types';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { findStore } from './StoreDataService';
import { searchProduct, ProductSearchResult } from './ProductService';

/**
 * Get the reward rate for a card in a specific category
 * Falls back to base rate if no category bonus exists
 */
export function getRewardRateForCategory(card: Card, category: SpendingCategory): RewardRate {
  const categoryReward = card.categoryRewards.find((cr) => cr.category === category);
  return categoryReward?.rewardRate ?? card.baseRewardRate;
}

/**
 * Compare two reward rates for sorting
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
function compareRewardRates(a: RewardRate, b: RewardRate): number {
  return b.value - a.value;
}

/**
 * Check if a reward rate matches the preferred reward type
 */
function matchesPreferredType(rate: RewardRate, preferredType: RewardType): boolean {
  return rate.type === preferredType;
}

/**
 * Rank cards for a specific spending category
 * Sorts by reward rate descending, with preference for matching reward type
 * 
 * @param category - The spending category to rank for
 * @param cards - Array of cards to rank
 * @param rewardType - User's preferred reward type
 * @returns Array of RankedCard sorted by reward rate (best first)
 */
export function rankCardsForCategory(
  category: SpendingCategory,
  cards: Card[],
  rewardType: RewardType
): RankedCard[] {
  if (cards.length === 0) {
    return [];
  }

  // Calculate reward rate for each card
  const cardsWithRates = cards.map((card) => ({
    card,
    rewardRate: getRewardRateForCategory(card, category),
  }));

  // Sort by:
  // 1. Preferred reward type first (when rates are equal)
  // 2. Reward rate value descending
  cardsWithRates.sort((a, b) => {
    const rateComparison = compareRewardRates(a.rewardRate, b.rewardRate);
    
    // If rates are equal, prefer matching reward type
    if (rateComparison === 0) {
      const aMatches = matchesPreferredType(a.rewardRate, rewardType);
      const bMatches = matchesPreferredType(b.rewardRate, rewardType);
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    }
    
    return rateComparison;
  });

  // Assign ranks
  return cardsWithRates.map((item, index) => ({
    card: item.card,
    rewardRate: item.rewardRate,
    rank: index + 1,
  }));
}


/**
 * Find cards from the database that offer better rewards than the user's best card
 * 
 * @param category - The spending category to compare
 * @param userBestCard - The user's best card for this category (or null if no cards)
 * @param rewardType - User's preferred reward type
 * @param userCardIds - Set of card IDs the user already owns
 * @returns Array of cards that offer better rewards than the user's best
 */
export function findBetterCards(
  category: SpendingCategory,
  userBestCard: Card | null,
  rewardType: RewardType,
  userCardIds: Set<string>
): Card[] {
  const allCards = getAllCardsSync();
  
  // Filter out cards the user already owns
  const availableCards = allCards.filter((card) => !userCardIds.has(card.id));
  
  if (availableCards.length === 0) {
    return [];
  }

  // If user has no cards, return all available cards sorted by reward rate
  if (userBestCard === null) {
    const ranked = rankCardsForCategory(category, availableCards, rewardType);
    return ranked.map((rc) => rc.card);
  }

  const userBestRate = getRewardRateForCategory(userBestCard, category);

  // Find cards with strictly better reward rate
  const betterCards = availableCards.filter((card) => {
    const cardRate = getRewardRateForCategory(card, category);
    return cardRate.value > userBestRate.value;
  });

  // Sort by reward rate descending
  const ranked = rankCardsForCategory(category, betterCards, rewardType);
  return ranked.map((rc) => rc.card);
}

/**
 * Get a complete store recommendation including best card and suggestions
 * 
 * @param storeName - Name of the store to get recommendations for
 * @param portfolio - User's card portfolio
 * @param preferences - User's preferences
 * @returns StoreRecommendation with best card, all ranked cards, and suggestions
 */
export function getStoreRecommendation(
  storeName: string,
  portfolio: UserCard[],
  preferences: UserPreferences
): StoreRecommendation | null {
  // Find the store
  const store = findStore(storeName);
  if (!store) {
    return null;
  }

  // Get full card objects for user's portfolio
  const userCards: Card[] = [];
  const userCardIds = new Set<string>();
  
  for (const userCard of portfolio) {
    const card = getCardByIdSync(userCard.cardId);
    if (card) {
      userCards.push(card);
      userCardIds.add(card.id);
    }
  }

  // Rank user's cards for this store's category
  const rankedCards = rankCardsForCategory(store.category, userCards, preferences.rewardType);
  
  // Get the best card (first in ranked list)
  const bestCard = rankedCards.length > 0 ? rankedCards[0] : null;

  // Get suggested new cards if enabled
  let suggestedNewCards: Card[] = [];
  if (preferences.newCardSuggestionsEnabled) {
    suggestedNewCards = findBetterCards(
      store.category,
      bestCard?.card ?? null,
      preferences.rewardType,
      userCardIds
    );
  }

  return {
    store,
    bestCard,
    allCards: rankedCards,
    suggestedNewCards,
  };
}


/**
 * Get the best card-store combination for a product
 * 
 * Requirements:
 * - 4.3: Display recommended store, card to use, and expected reward rate
 * - 4.4: Rank by highest absolute reward value when rates are similar
 * - 4.5: Notify user if product not found
 * 
 * @param productName - Name of the product to search for
 * @param portfolio - User's card portfolio
 * @param preferences - User's preferences
 * @returns Result with ProductRecommendation or error if product not found
 */
export function getProductRecommendation(
  productName: string,
  portfolio: UserCard[],
  preferences: UserPreferences
): Result<ProductRecommendation, RecommendationError> {
  // Search for the product
  const productResult = searchProduct(productName);
  
  if (!productResult.success) {
    // Requirement 4.5: Notify user if product not found
    return failure({ type: 'PRODUCT_NOT_FOUND', productName });
  }

  const { product, stores } = productResult.value;

  if (stores.length === 0) {
    return failure({ type: 'PRODUCT_NOT_FOUND', productName });
  }

  // Get full card objects for user's portfolio
  const userCards: Card[] = [];
  for (const userCard of portfolio) {
    const card = getCardByIdSync(userCard.cardId);
    if (card) {
      userCards.push(card);
    }
  }

  // Calculate best card for each store
  // Requirement 4.2: Calculate best card-store combination
  const storeOptions: StoreCardCombination[] = stores.map((store) => {
    const rankedCards = rankCardsForCategory(
      store.category,
      userCards,
      preferences.rewardType
    );
    
    const bestCard = rankedCards.length > 0 ? rankedCards[0] : null;
    const rewardRate = bestCard?.rewardRate.value ?? 0;

    return {
      store,
      bestCard,
      rewardRate,
    };
  });

  // Requirement 4.4: Rank by highest absolute reward value
  storeOptions.sort((a, b) => b.rewardRate - a.rewardRate);

  // Get the best store-card combination
  const bestOption = storeOptions[0];

  return success({
    productName: product.name,
    productCategory: product.category,
    recommendedStore: bestOption.store,
    recommendedCard: bestOption.bestCard,
    allStoreOptions: storeOptions,
  });
}

/**
 * Get product recommendations for multiple stores
 * Useful for comparing options across different retailers
 * 
 * @param productName - Name of the product to search for
 * @param portfolio - User's card portfolio
 * @param preferences - User's preferences
 * @param limit - Maximum number of store options to return
 * @returns Result with array of StoreCardCombination or error
 */
export function getProductStoreOptions(
  productName: string,
  portfolio: UserCard[],
  preferences: UserPreferences,
  limit: number = 5
): Result<StoreCardCombination[], RecommendationError> {
  const result = getProductRecommendation(productName, portfolio, preferences);
  
  if (!result.success) {
    return result;
  }

  return success(result.value.allStoreOptions.slice(0, limit));
}
