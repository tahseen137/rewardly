/**
 * PriceComparisonService - Calculates effective prices with reward values
 * Combines price data with card rewards to find the best overall deal
 * 
 * Requirements: 6.1-6.6
 */

import {
  Store,
  SpendingCategory,
  RewardType,
  RankedCard,
  UserCard,
  UserPreferences,
  PricedStoreOption,
  PriceComparisonResult,
  PriceSortOption,
  Result,
  success,
  failure,
  RecommendationError,
} from '../types';
import { searchProduct, Product } from './ProductService';
import { lookupPrices, StorePrice } from './PriceService';
import { rankCardsForCategory, getRewardRateForCategory } from './RecommendationEngine';
import { getCardByIdSync } from './CardDataService';
import { getAllStores } from './StoreDataService';

// ============================================================================
// Reward Value Calculation
// ============================================================================

/**
 * Calculate the reward value in CAD for a purchase
 * 
 * @param price - Purchase price in CAD
 * @param rewardRate - Reward rate (percentage)
 * @param rewardType - Type of reward
 * @returns Reward value in CAD
 */
export function calculateRewardValue(
  price: number,
  rewardRate: number,
  rewardType: RewardType
): number {
  // For cashback, the reward rate is a direct percentage
  // For points/miles, we use an estimated value per point
  const pointValues: Record<RewardType, number> = {
    [RewardType.CASHBACK]: 1, // 1% = $0.01 per dollar
    [RewardType.POINTS]: 0.01, // Estimated 1 cent per point
    [RewardType.AIRLINE_MILES]: 0.018, // Estimated 1.8 cents per mile
    [RewardType.HOTEL_POINTS]: 0.007, // Estimated 0.7 cents per hotel point
  };

  const pointValue = pointValues[rewardType];
  
  // Calculate reward: price * (rate/100) * pointValue
  // For cashback: $100 * 3% * 1 = $3
  // For points: $100 * 5x * 0.01 = $5 (5 points per dollar, 1 cent per point)
  return price * (rewardRate / 100) * pointValue;
}

/**
 * Calculate effective price (price minus reward value)
 * Requirement 6.3, 6.4
 * 
 * @param price - Purchase price in CAD
 * @param rewardValue - Reward value in CAD
 * @returns Effective price in CAD
 */
export function calculateEffectivePrice(price: number, rewardValue: number): number {
  return Math.max(0, price - rewardValue);
}

// ============================================================================
// Price Comparison
// ============================================================================

/**
 * Build a priced store option with all calculated values
 */
function buildPricedStoreOption(
  store: Store,
  storePrice: StorePrice,
  bestCard: RankedCard | null,
  rewardType: RewardType
): PricedStoreOption {
  const price = storePrice.price;
  const priceAvailable = price !== null;
  const rewardRate = bestCard?.rewardRate.value ?? 0;
  
  let rewardValue = 0;
  let effectivePrice: number | null = null;
  
  if (priceAvailable && price !== null) {
    rewardValue = calculateRewardValue(price, rewardRate, rewardType);
    effectivePrice = calculateEffectivePrice(price, rewardValue);
  }
  
  return {
    store,
    bestCard,
    price,
    rewardRate,
    rewardValue,
    effectivePrice,
    priceAvailable,
  };
}

/**
 * Sort priced store options by the specified criteria
 * Requirement 6.5
 */
function sortStoreOptions(
  options: PricedStoreOption[],
  sortBy: PriceSortOption
): PricedStoreOption[] {
  const sorted = [...options];
  
  switch (sortBy) {
    case PriceSortOption.LOWEST_PRICE:
      // Sort by price ascending, unavailable prices at the end
      sorted.sort((a, b) => {
        if (!a.priceAvailable && !b.priceAvailable) return 0;
        if (!a.priceAvailable) return 1;
        if (!b.priceAvailable) return -1;
        return (a.price ?? 0) - (b.price ?? 0);
      });
      break;
      
    case PriceSortOption.HIGHEST_REWARDS:
      // Sort by reward rate descending
      sorted.sort((a, b) => b.rewardRate - a.rewardRate);
      break;
      
    case PriceSortOption.LOWEST_EFFECTIVE_PRICE:
      // Sort by effective price ascending, unavailable at the end
      // Requirement 6.6: Rank by reward rate only when price unavailable
      sorted.sort((a, b) => {
        if (!a.priceAvailable && !b.priceAvailable) {
          // Both unavailable: sort by reward rate descending
          return b.rewardRate - a.rewardRate;
        }
        if (!a.priceAvailable) return 1;
        if (!b.priceAvailable) return -1;
        return (a.effectivePrice ?? 0) - (b.effectivePrice ?? 0);
      });
      break;
  }
  
  return sorted;
}


/**
 * Find the best option for each criteria
 */
function findBestOptions(options: PricedStoreOption[]): {
  lowestPrice: PricedStoreOption | null;
  highestRewards: PricedStoreOption | null;
  lowestEffectivePrice: PricedStoreOption | null;
} {
  const withPrices = options.filter((o) => o.priceAvailable);
  
  const lowestPrice = withPrices.length > 0
    ? withPrices.reduce((min, o) => (o.price ?? Infinity) < (min.price ?? Infinity) ? o : min)
    : null;
    
  const highestRewards = options.length > 0
    ? options.reduce((max, o) => o.rewardRate > max.rewardRate ? o : max)
    : null;
    
  const lowestEffectivePrice = withPrices.length > 0
    ? withPrices.reduce((min, o) => 
        (o.effectivePrice ?? Infinity) < (min.effectivePrice ?? Infinity) ? o : min)
    : null;
    
  return { lowestPrice, highestRewards, lowestEffectivePrice };
}

/**
 * Get price comparison for a product across all stores that sell it
 * Requirements: 6.1-6.6
 * 
 * @param productName - Name of the product to search for
 * @param portfolio - User's card portfolio
 * @param preferences - User's preferences
 * @param sortBy - How to sort the results (default: lowest effective price)
 * @returns Result with PriceComparisonResult or error
 */
export function getPriceComparison(
  productName: string,
  portfolio: UserCard[],
  preferences: UserPreferences,
  sortBy: PriceSortOption = PriceSortOption.LOWEST_EFFECTIVE_PRICE
): Result<PriceComparisonResult, RecommendationError> {
  // Search for the product
  const productResult = searchProduct(productName);
  
  if (!productResult.success) {
    return failure({ type: 'PRODUCT_NOT_FOUND', productName });
  }
  
  const { product, stores } = productResult.value;
  
  if (stores.length === 0) {
    return failure({ type: 'PRODUCT_NOT_FOUND', productName });
  }
  
  // Get user's cards
  const userCards = portfolio
    .map((uc) => getCardByIdSync(uc.cardId))
    .filter((c): c is NonNullable<typeof c> => c !== null);
  
  // Get store IDs
  const storeIds = stores.map((s) => s.id);
  
  // Lookup prices for all stores
  const priceLookup = lookupPrices(product.id, storeIds);
  const priceMap = new Map(priceLookup.prices.map((p) => [p.storeId, p]));
  
  // Build priced store options
  const storeOptions: PricedStoreOption[] = stores.map((store) => {
    // Rank cards for this store's category
    const rankedCards = rankCardsForCategory(
      store.category,
      userCards,
      preferences.rewardType
    );
    const bestCard = rankedCards.length > 0 ? rankedCards[0] : null;
    
    // Get price for this store
    const storePrice = priceMap.get(store.id) ?? {
      storeId: store.id,
      price: null,
      currency: 'CAD',
      lastUpdated: null,
    };
    
    return buildPricedStoreOption(store, storePrice, bestCard, preferences.rewardType);
  });
  
  // Sort options
  const sortedOptions = sortStoreOptions(storeOptions, sortBy);
  
  // Find best options
  const bestOptions = findBestOptions(storeOptions);
  
  return success({
    productName: product.name,
    productId: product.id,
    productCategory: product.category,
    storeOptions: sortedOptions,
    sortedBy: sortBy,
    ...bestOptions,
  });
}


/**
 * Get price comparison with a different sort order
 * Requirement 6.5: Allow sorting by different criteria
 * 
 * @param result - Existing price comparison result
 * @param sortBy - New sort order
 * @returns New PriceComparisonResult with updated sort order
 */
export function resortPriceComparison(
  result: PriceComparisonResult,
  sortBy: PriceSortOption
): PriceComparisonResult {
  const sortedOptions = sortStoreOptions(result.storeOptions, sortBy);
  
  return {
    ...result,
    storeOptions: sortedOptions,
    sortedBy: sortBy,
  };
}

/**
 * Format price for display
 * 
 * @param price - Price in CAD
 * @returns Formatted price string
 */
export function formatPrice(price: number | null): string {
  if (price === null) {
    return 'Price unavailable';
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Format reward value for display
 * 
 * @param rewardValue - Reward value in CAD
 * @returns Formatted reward string
 */
export function formatRewardValue(rewardValue: number): string {
  if (rewardValue === 0) {
    return '$0.00';
  }
  return `$${rewardValue.toFixed(2)}`;
}

/**
 * Format effective price for display
 * Requirement 6.4: Show effective price for comparison
 * 
 * @param effectivePrice - Effective price in CAD
 * @returns Formatted effective price string
 */
export function formatEffectivePrice(effectivePrice: number | null): string {
  if (effectivePrice === null) {
    return 'N/A';
  }
  return `$${effectivePrice.toFixed(2)}`;
}

/**
 * Get a summary of the best deal
 * 
 * @param result - Price comparison result
 * @returns Summary string describing the best deal
 */
export function getBestDealSummary(result: PriceComparisonResult): string {
  const best = result.lowestEffectivePrice;
  
  if (!best) {
    return 'No price data available for comparison.';
  }
  
  const storeName = best.store.name;
  const cardName = best.bestCard?.card.name ?? 'any card';
  const effectivePrice = formatEffectivePrice(best.effectivePrice);
  const savings = best.rewardValue > 0 
    ? ` (save ${formatRewardValue(best.rewardValue)} in rewards)`
    : '';
  
  return `Best deal: ${storeName} with ${cardName} for ${effectivePrice}${savings}`;
}
