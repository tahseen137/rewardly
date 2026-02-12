/**
 * MockTransactionData - Realistic Canadian transaction data for demo
 * Creates compelling "missed rewards" scenarios
 */

import { SpendingCategory } from '../types';
import { Transaction } from '../types/rewards-iq';

// ============================================================================
// Canadian Merchants by Category
// ============================================================================

const CANADIAN_MERCHANTS: Record<SpendingCategory, string[]> = {
  [SpendingCategory.GROCERIES]: [
    'Loblaws', 'Metro', 'Sobeys', 'No Frills', 'Real Canadian Superstore',
    'Whole Foods', 'Costco', 'Walmart Grocery', 'Farm Boy', 'Fortinos',
  ],
  [SpendingCategory.DINING]: [
    'Tim Hortons', 'McDonald\'s', 'Earls', 'The Keg', 'Boston Pizza',
    'Swiss Chalet', 'Montana\'s', 'Moxies', 'Cactus Club', 'Milestone\'s',
  ],
  [SpendingCategory.GAS]: [
    'Petro-Canada', 'Esso', 'Shell', 'Canadian Tire Gas', 'Costco Gas',
    'Pioneer', 'Mobil', 'Husky', 'Ultramar', 'Co-op Gas',
  ],
  [SpendingCategory.TRAVEL]: [
    'Air Canada', 'WestJet', 'Marriott', 'Hilton', 'Airbnb',
    'Expedia', 'Booking.com', 'Porter Airlines', 'VIA Rail', 'Enterprise',
  ],
  [SpendingCategory.ONLINE_SHOPPING]: [
    'Amazon.ca', 'Best Buy', 'Indigo', 'Hudson\'s Bay', 'Simons',
    'Wayfair', 'Apple Store', 'eBay', 'Etsy', 'Shopify Store',
  ],
  [SpendingCategory.ENTERTAINMENT]: [
    'Cineplex', 'Netflix', 'Spotify', 'Ticketmaster', 'Live Nation',
    'Xbox/PlayStation', 'Steam', 'Nintendo', 'Rec Room', 'Dave & Buster\'s',
  ],
  [SpendingCategory.DRUGSTORES]: [
    'Shoppers Drug Mart', 'Rexall', 'London Drugs', 'Pharmasave',
    'Jean Coutu', 'Guardian', 'Loblaw Pharmacy', 'Costco Pharmacy',
  ],
  [SpendingCategory.HOME_IMPROVEMENT]: [
    'Home Depot', 'Home Hardware', 'Lowe\'s', 'RONA', 'Canadian Tire',
    'IKEA', 'Wayfair', 'Structube', 'Leon\'s', 'The Brick',
  ],
  [SpendingCategory.OTHER]: [
    'Amazon.ca', 'Service Station', 'Government of Canada', 'Utilities',
    'Insurance', 'Gym Membership', 'Subscription', 'Professional Services',
  ],
};

// Typical monthly spending by category (Canadian averages)
const MONTHLY_SPENDING_RANGES: Record<SpendingCategory, { min: number; max: number }> = {
  [SpendingCategory.GROCERIES]: { min: 400, max: 800 },
  [SpendingCategory.DINING]: { min: 150, max: 400 },
  [SpendingCategory.GAS]: { min: 100, max: 300 },
  [SpendingCategory.TRAVEL]: { min: 50, max: 300 },
  [SpendingCategory.ONLINE_SHOPPING]: { min: 100, max: 400 },
  [SpendingCategory.ENTERTAINMENT]: { min: 50, max: 200 },
  [SpendingCategory.DRUGSTORES]: { min: 30, max: 150 },
  [SpendingCategory.HOME_IMPROVEMENT]: { min: 50, max: 300 },
  [SpendingCategory.OTHER]: { min: 100, max: 400 },
};

// ============================================================================
// Transaction Generation
// ============================================================================

function getRandomMerchant(category: SpendingCategory): string {
  const merchants = CANADIAN_MERCHANTS[category];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

function getRandomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 12) + 8); // 8am - 8pm
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function getRandomAmount(category: SpendingCategory): number {
  const ranges: Record<SpendingCategory, { min: number; max: number }> = {
    [SpendingCategory.GROCERIES]: { min: 35, max: 180 },
    [SpendingCategory.DINING]: { min: 12, max: 85 },
    [SpendingCategory.GAS]: { min: 40, max: 120 },
    [SpendingCategory.TRAVEL]: { min: 100, max: 800 },
    [SpendingCategory.ONLINE_SHOPPING]: { min: 25, max: 250 },
    [SpendingCategory.ENTERTAINMENT]: { min: 15, max: 80 },
    [SpendingCategory.DRUGSTORES]: { min: 15, max: 75 },
    [SpendingCategory.HOME_IMPROVEMENT]: { min: 30, max: 300 },
    [SpendingCategory.OTHER]: { min: 20, max: 150 },
  };
  const range = ranges[category];
  return Math.round((Math.random() * (range.max - range.min) + range.min) * 100) / 100;
}

/**
 * Generate mock transactions for the past month
 * These represent realistic Canadian spending patterns
 */
export function generateMockTransactions(
  userCardIds: string[],
  daysBack: number = 30,
  transactionCount: number = 25
): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Weight categories by typical spending frequency
  const categoryWeights: { category: SpendingCategory; weight: number }[] = [
    { category: SpendingCategory.GROCERIES, weight: 6 },
    { category: SpendingCategory.DINING, weight: 5 },
    { category: SpendingCategory.GAS, weight: 3 },
    { category: SpendingCategory.ONLINE_SHOPPING, weight: 4 },
    { category: SpendingCategory.ENTERTAINMENT, weight: 2 },
    { category: SpendingCategory.DRUGSTORES, weight: 2 },
    { category: SpendingCategory.TRAVEL, weight: 1 },
    { category: SpendingCategory.HOME_IMPROVEMENT, weight: 1 },
    { category: SpendingCategory.OTHER, weight: 2 },
  ];
  
  const totalWeight = categoryWeights.reduce((sum, cw) => sum + cw.weight, 0);
  
  for (let i = 0; i < transactionCount; i++) {
    // Select category based on weight
    let random = Math.random() * totalWeight;
    let selectedCategory = SpendingCategory.OTHER;
    
    for (const cw of categoryWeights) {
      random -= cw.weight;
      if (random <= 0) {
        selectedCategory = cw.category;
        break;
      }
    }
    
    // For demo: User often uses wrong card (to show missed rewards)
    // 40% chance of using optimal card, 60% chance of using random card
    const useOptimal = Math.random() < 0.4;
    const cardUsed = userCardIds[Math.floor(Math.random() * userCardIds.length)];
    
    const amount = getRandomAmount(selectedCategory);
    
    transactions.push({
      id: `txn-${Date.now()}-${i}`,
      merchantName: getRandomMerchant(selectedCategory),
      category: selectedCategory,
      amount,
      date: getRandomDate(daysBack),
      cardUsed,
      rewardsEarned: 0, // Will be calculated by analysis service
    });
  }
  
  // Sort by date descending
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Generate a default spending profile for new users
 */
export function getDefaultSpendingProfile(): Map<SpendingCategory, number> {
  const profile = new Map<SpendingCategory, number>();
  
  // Canadian average monthly spending
  profile.set(SpendingCategory.GROCERIES, 600);
  profile.set(SpendingCategory.DINING, 250);
  profile.set(SpendingCategory.GAS, 180);
  profile.set(SpendingCategory.TRAVEL, 150);
  profile.set(SpendingCategory.ONLINE_SHOPPING, 200);
  profile.set(SpendingCategory.ENTERTAINMENT, 100);
  profile.set(SpendingCategory.DRUGSTORES, 75);
  profile.set(SpendingCategory.HOME_IMPROVEMENT, 100);
  profile.set(SpendingCategory.OTHER, 200);
  
  return profile;
}

/**
 * Get category display info
 */
export const CATEGORY_INFO: Record<SpendingCategory, { label: string; icon: string; color: string }> = {
  [SpendingCategory.GROCERIES]: { label: 'Groceries', icon: '🛒', color: '#4CAF50' },
  [SpendingCategory.DINING]: { label: 'Dining', icon: '🍽️', color: '#FF5722' },
  [SpendingCategory.GAS]: { label: 'Gas', icon: '⛽', color: '#FFC107' },
  [SpendingCategory.TRAVEL]: { label: 'Travel', icon: '✈️', color: '#2196F3' },
  [SpendingCategory.ONLINE_SHOPPING]: { label: 'Online Shopping', icon: '📦', color: '#9C27B0' },
  [SpendingCategory.ENTERTAINMENT]: { label: 'Entertainment', icon: '🎬', color: '#E91E63' },
  [SpendingCategory.DRUGSTORES]: { label: 'Pharmacy', icon: '💊', color: '#00BCD4' },
  [SpendingCategory.HOME_IMPROVEMENT]: { label: 'Home & Hardware', icon: '🔨', color: '#795548' },
  [SpendingCategory.OTHER]: { label: 'Other', icon: '📝', color: '#607D8B' },
};
