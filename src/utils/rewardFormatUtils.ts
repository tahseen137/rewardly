/**
 * Reward formatting utilities for display purposes
 * Requirements: 5.2, 6.1, 6.2
 */

import { RewardType } from '../types';

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
