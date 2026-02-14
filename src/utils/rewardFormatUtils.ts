/**
 * Reward formatting utilities for display purposes
 * Requirements: 5.2, 6.1, 6.2
 */

import { Card, RewardType, RewardRate, CategoryReward, SpendingCategory } from '../types';

/**
 * Labels for reward types
 */
export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  [RewardType.CASHBACK]: 'Cash Back',
  [RewardType.POINTS]: 'Points',
  [RewardType.AIRLINE_MILES]: 'Miles',
  [RewardType.HOTEL_POINTS]: 'Hotel Points',
};

/**
 * Icons for reward types
 */
export const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  [RewardType.CASHBACK]: 'cash',
  [RewardType.POINTS]: 'star',
  [RewardType.AIRLINE_MILES]: 'plane',
  [RewardType.HOTEL_POINTS]: 'hotel',
};

/**
 * Format reward earned for display
 * Requirements: 5.2
 *
 * @param amount - The amount of rewards earned
 * @param rewardType - The type of reward
 * @returns Formatted string in the format "[amount] [type]"
 *
 * @example
 * formatRewardEarned(150, RewardType.AIRLINE_MILES) // "150 Miles"
 * formatRewardEarned(25.50, RewardType.CASHBACK) // "25.50 Cash Back"
 */
export function formatRewardEarned(amount: number, rewardType: RewardType): string {
  const label = REWARD_TYPE_LABELS[rewardType];
  
  // Format amount with appropriate decimal places
  // For cashback, show 2 decimal places; for points/miles, show whole numbers
  const formattedAmount = rewardType === RewardType.CASHBACK
    ? amount.toFixed(2)
    : Math.round(amount).toString();
  
  return `${formattedAmount} ${label}`;
}

// ============================================================================
// Card Reward Rate Utilities
// ============================================================================

/**
 * Get the highest category reward rate for a card.
 * Falls back to baseRewardRate if no category rewards exist.
 *
 * @param card - The credit card
 * @returns The highest reward rate (from categories or base)
 *
 * @example
 * getHighestRewardRate(card) // { value: 4, type: "cashback", unit: "percent" }
 */
export function getHighestRewardRate(card: Card): RewardRate {
  if (!card.categoryRewards || card.categoryRewards.length === 0) {
    return card.baseRewardRate;
  }

  let highest = card.baseRewardRate;
  for (const cr of card.categoryRewards) {
    if (cr.rewardRate.value > highest.value) {
      highest = cr.rewardRate;
    }
  }
  return highest;
}

/**
 * Get the top N category rewards for a card, sorted by rate descending.
 *
 * @param card - The credit card
 * @param limit - Max categories to return (default 3)
 * @returns Array of category rewards sorted by rate
 */
export function getTopCategoryRewards(card: Card, limit: number = 3): CategoryReward[] {
  if (!card.categoryRewards || card.categoryRewards.length === 0) {
    return [];
  }

  return [...card.categoryRewards]
    .sort((a, b) => b.rewardRate.value - a.rewardRate.value)
    .slice(0, limit);
}

/**
 * Format a reward rate for display (e.g., "4% cashback" or "5x points")
 *
 * @param rate - The reward rate to format
 * @returns Formatted string
 */
export function formatRewardRate(rate: RewardRate): string {
  const typeLabel = REWARD_TYPE_LABELS[rate.type].toLowerCase();
  if (rate.unit === 'percent') {
    return `${rate.value}% ${typeLabel}`;
  }
  return `${rate.value}x ${typeLabel}`;
}

/**
 * Format the "Up to X%" headline display for a card
 *
 * @param card - The credit card
 * @returns Formatted string like "Up to 4% cash back" or "1% cash back" if no categories
 */
export function formatUpToRate(card: Card): string {
  const highest = getHighestRewardRate(card);
  const hasCategories = card.categoryRewards && card.categoryRewards.length > 0;
  const isHigherThanBase = highest.value > card.baseRewardRate.value;

  const typeLabel = REWARD_TYPE_LABELS[highest.type].toLowerCase();
  const rateStr = highest.unit === 'percent'
    ? `${highest.value}% ${typeLabel}`
    : `${highest.value}x ${typeLabel}`;

  if (hasCategories && isHigherThanBase) {
    return `Up to ${rateStr}`;
  }
  return rateStr;
}

/**
 * Format a category name for display (e.g., "online_shopping" → "Online Shopping")
 */
export function formatCategoryName(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Build a "Best for: Groceries, Gas" subtitle string from a card's top categories
 *
 * @param card - The credit card
 * @param limit - Max categories to include (default 3)
 * @returns String like "Best for: Groceries, Gas, Dining" or empty string if no categories
 */
export function formatBestForCategories(card: Card, limit: number = 3): string {
  const topCategories = getTopCategoryRewards(card, limit);
  if (topCategories.length === 0) return '';

  const names = topCategories.map((cr) => formatCategoryName(cr.category));
  return `Best for: ${names.join(', ')}`;
}

/**
 * Build a compact "4% on Groceries & Gas" string from a card's top categories
 * Groups categories that share the same rate.
 *
 * @param card - The credit card
 * @param limit - Max categories to include (default 3)
 * @returns String like "4% on Groceries & Gas" or empty string if no categories
 */
export function formatTopCategoryRates(card: Card, limit: number = 3): string {
  const topCategories = getTopCategoryRewards(card, limit);
  if (topCategories.length === 0) return '';

  // Group by rate value
  const groups = new Map<number, string[]>();
  for (const cr of topCategories) {
    const key = cr.rewardRate.value;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(formatCategoryName(cr.category));
  }

  // Build string from highest rate group
  const sortedKeys = [...groups.keys()].sort((a, b) => b - a);
  const parts: string[] = [];

  for (const rate of sortedKeys) {
    const categories = groups.get(rate)!;
    const unit = card.baseRewardRate.unit === 'percent' ? '%' : 'x';
    parts.push(`${rate}${unit} on ${categories.join(' & ')}`);
  }

  return parts.join(', ');
}

/**
 * Format annual fee for display
 * Requirements: 6.1
 *
 * @param fee - The annual fee amount (can be undefined or 0)
 * @returns Formatted string showing the fee or "No annual fee"
 *
 * @example
 * formatAnnualFee(120) // "Annual fee: $120"
 * formatAnnualFee(0) // "No annual fee"
 * formatAnnualFee(undefined) // "No annual fee"
 */
export function formatAnnualFee(fee: number | undefined): string {
  if (!fee || fee === 0) {
    return 'No annual fee';
  }
  
  return `Annual fee: $${fee}`;
}
