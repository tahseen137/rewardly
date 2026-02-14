/**
 * BestCardRecommendationService - Smart card recommendation engine for AutoPilot
 * 
 * Provides intelligent card recommendations based on:
 * - Merchant category matching
 * - User's card portfolio
 * - Reward rate comparison
 * - Estimated savings calculation
 */

import { Card, SpendingCategory, RewardType } from '../types';
import { getCards, getCardFromPortfolio } from './CardPortfolioManager';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getApplicableMultiplier, pointsToCad } from './RewardsCalculatorService';

// ============================================================================
// Types
// ============================================================================

export interface CardRecommendation {
  card: Card;
  rewardRate: number;          // The reward rate for this merchant category
  rewardType: RewardType;
  estimatedValue: number;      // Estimated value for a typical purchase ($50)
  isOptimal: boolean;          // True if this is the best card for this category
  reason: string;              // Human-readable explanation
}

export interface MerchantRecommendation {
  merchantName: string;
  merchantCategory: SpendingCategory;
  bestCard: CardRecommendation | null;
  alternativeCards: CardRecommendation[];
  savingsVsWorstCard: number;  // How much saved compared to worst portfolio card
}

// Merchant to category mapping
export const MERCHANT_CATEGORY_MAP: Record<string, SpendingCategory> = {
  // Groceries
  'costco': SpendingCategory.GROCERIES,
  'loblaws': SpendingCategory.GROCERIES,
  'no frills': SpendingCategory.GROCERIES,
  'superstore': SpendingCategory.GROCERIES,
  'walmart': SpendingCategory.GROCERIES,
  'metro': SpendingCategory.GROCERIES,
  'food basics': SpendingCategory.GROCERIES,
  'sobeys': SpendingCategory.GROCERIES,
  'freshco': SpendingCategory.GROCERIES,
  'whole foods': SpendingCategory.GROCERIES,
  't&t': SpendingCategory.GROCERIES,
  'farm boy': SpendingCategory.GROCERIES,
  
  // Dining
  'starbucks': SpendingCategory.DINING,
  'tim hortons': SpendingCategory.DINING,
  'tims': SpendingCategory.DINING,
  'mcdonald\'s': SpendingCategory.DINING,
  'mcdonalds': SpendingCategory.DINING,
  'subway': SpendingCategory.DINING,
  'a&w': SpendingCategory.DINING,
  'popeyes': SpendingCategory.DINING,
  'wendy\'s': SpendingCategory.DINING,
  'wendys': SpendingCategory.DINING,
  'chipotle': SpendingCategory.DINING,
  
  // Gas
  'esso': SpendingCategory.GAS,
  'shell': SpendingCategory.GAS,
  'petro-canada': SpendingCategory.GAS,
  'petrocan': SpendingCategory.GAS,
  'canadian tire gas': SpendingCategory.GAS,
  'mobil': SpendingCategory.GAS,
  'husky': SpendingCategory.GAS,
  'costco gas': SpendingCategory.GAS,
  
  // Drugstores
  'shoppers drug mart': SpendingCategory.DRUGSTORES,
  'shoppers': SpendingCategory.DRUGSTORES,
  'rexall': SpendingCategory.DRUGSTORES,
  'pharmasave': SpendingCategory.DRUGSTORES,
  
  // Home Improvement
  'canadian tire': SpendingCategory.HOME_IMPROVEMENT,
  'home depot': SpendingCategory.HOME_IMPROVEMENT,
  'lowe\'s': SpendingCategory.HOME_IMPROVEMENT,
  'lowes': SpendingCategory.HOME_IMPROVEMENT,
  'home hardware': SpendingCategory.HOME_IMPROVEMENT,
  'rona': SpendingCategory.HOME_IMPROVEMENT,
  
  // Entertainment
  'cineplex': SpendingCategory.ENTERTAINMENT,
  'amazon': SpendingCategory.ONLINE_SHOPPING,
  'best buy': SpendingCategory.ENTERTAINMENT,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the category for a merchant name
 */
export function getCategoryForMerchant(merchantName: string): SpendingCategory {
  const normalized = merchantName.toLowerCase().trim();
  
  // Direct match
  if (MERCHANT_CATEGORY_MAP[normalized]) {
    return MERCHANT_CATEGORY_MAP[normalized];
  }
  
  // Partial match
  for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }
  
  // Default to OTHER if no match
  return SpendingCategory.OTHER;
}

/**
 * Generate a human-readable reason for the recommendation
 */
function generateReason(card: Card, category: SpendingCategory, rewardRate: number): string {
  const categoryNames: Record<SpendingCategory, string> = {
    [SpendingCategory.GROCERIES]: 'groceries',
    [SpendingCategory.DINING]: 'dining',
    [SpendingCategory.GAS]: 'gas',
    [SpendingCategory.TRAVEL]: 'travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'online shopping',
    [SpendingCategory.ENTERTAINMENT]: 'entertainment',
    [SpendingCategory.DRUGSTORES]: 'drugstores',
    [SpendingCategory.HOME_IMPROVEMENT]: 'home improvement',
    [SpendingCategory.OTHER]: 'this purchase',
  };
  
  const categoryName = categoryNames[category] || 'this purchase';
  const isCashback = card.baseRewardRate.type === RewardType.CASHBACK;
  
  if (isCashback) {
    return `Earns ${rewardRate}% cash back on ${categoryName}`;
  } else {
    return `Earns ${rewardRate}x ${card.rewardProgram} points on ${categoryName}`;
  }
}

// ============================================================================
// Main Recommendation Functions
// ============================================================================

/**
 * Get the best card recommendation for a spending category
 * Uses the user's portfolio cards only
 */
export async function getBestCardForCategory(
  category: SpendingCategory,
  estimatedPurchase: number = 50
): Promise<CardRecommendation | null> {
  try {
    // Get user's cards
    const userCards = await getCards();
    
    if (userCards.length === 0) {
      return null;
    }
    
    // Get full card data for each user card and calculate rewards
    const cardRecommendations: CardRecommendation[] = [];
    
    for (const userCard of userCards) {
      const cardData = getCardByIdSync(userCard.cardId);
      if (!cardData) continue;
      
      // Get the reward rate for this category
      const rewardRate = getApplicableMultiplier(cardData, category);
      
      // Calculate estimated value
      const pointsEarned = estimatedPurchase * rewardRate;
      const estimatedValue = pointsToCad(
        pointsEarned,
        cardData,
        cardData.pointValuation || 100
      );
      
      cardRecommendations.push({
        card: cardData,
        rewardRate,
        rewardType: cardData.baseRewardRate.type,
        estimatedValue,
        isOptimal: false,
        reason: generateReason(cardData, category, rewardRate),
      });
    }
    
    if (cardRecommendations.length === 0) {
      return null;
    }
    
    // Sort by reward rate (highest first)
    cardRecommendations.sort((a, b) => b.rewardRate - a.rewardRate);
    
    // Mark the best one as optimal
    cardRecommendations[0].isOptimal = true;
    
    return cardRecommendations[0];
  } catch (error) {
    console.error('[BestCardService] Error getting best card:', error);
    return null;
  }
}

/**
 * Get recommendations for all cards in portfolio for a category
 */
export async function getAllCardRecommendations(
  category: SpendingCategory,
  estimatedPurchase: number = 50
): Promise<CardRecommendation[]> {
  try {
    const userCards = await getCards();
    
    if (userCards.length === 0) {
      return [];
    }
    
    const recommendations: CardRecommendation[] = [];
    
    for (const userCard of userCards) {
      const cardData = getCardByIdSync(userCard.cardId);
      if (!cardData) continue;
      
      const rewardRate = getApplicableMultiplier(cardData, category);
      const pointsEarned = estimatedPurchase * rewardRate;
      const estimatedValue = pointsToCad(
        pointsEarned,
        cardData,
        cardData.pointValuation || 100
      );
      
      recommendations.push({
        card: cardData,
        rewardRate,
        rewardType: cardData.baseRewardRate.type,
        estimatedValue,
        isOptimal: false,
        reason: generateReason(cardData, category, rewardRate),
      });
    }
    
    // Sort by estimated value (highest first)
    recommendations.sort((a, b) => b.estimatedValue - a.estimatedValue);
    
    // Mark best as optimal
    if (recommendations.length > 0) {
      recommendations[0].isOptimal = true;
    }
    
    return recommendations;
  } catch (error) {
    console.error('[BestCardService] Error getting recommendations:', error);
    return [];
  }
}

/**
 * Get a complete merchant recommendation with best and alternative cards
 */
export async function getMerchantRecommendation(
  merchantName: string,
  estimatedPurchase: number = 50
): Promise<MerchantRecommendation> {
  const category = getCategoryForMerchant(merchantName);
  const allRecommendations = await getAllCardRecommendations(category, estimatedPurchase);
  
  const bestCard = allRecommendations.length > 0 ? allRecommendations[0] : null;
  const alternativeCards = allRecommendations.slice(1);
  
  // Calculate savings vs worst card
  let savingsVsWorstCard = 0;
  if (allRecommendations.length > 1) {
    const worstCard = allRecommendations[allRecommendations.length - 1];
    savingsVsWorstCard = (bestCard?.estimatedValue || 0) - worstCard.estimatedValue;
  }
  
  return {
    merchantName,
    merchantCategory: category,
    bestCard,
    alternativeCards,
    savingsVsWorstCard,
  };
}

/**
 * Format a notification message for AutoPilot
 */
export function formatNotificationMessage(
  merchantName: string,
  recommendation: CardRecommendation,
  alternativeCard?: CardRecommendation
): { title: string; body: string } {
  const title = `🎯 Best Card for ${merchantName}`;
  
  let body = `Use ${recommendation.card.name} for ${recommendation.rewardRate}% back`;
  
  if (alternativeCard && alternativeCard.rewardRate < recommendation.rewardRate) {
    body += ` (vs ${alternativeCard.rewardRate}% on ${alternativeCard.card.name})`;
  }
  
  return { title, body };
}

/**
 * Calculate potential savings for using AutoPilot
 * Based on average monthly spending patterns
 */
export async function calculatePotentialMonthlySavings(
  monthlySpending: Record<SpendingCategory, number>
): Promise<number> {
  let totalSavings = 0;
  
  for (const [category, amount] of Object.entries(monthlySpending)) {
    const cat = category as SpendingCategory;
    const recommendations = await getAllCardRecommendations(cat, amount);
    
    if (recommendations.length > 1) {
      const best = recommendations[0];
      const worst = recommendations[recommendations.length - 1];
      totalSavings += best.estimatedValue - worst.estimatedValue;
    }
  }
  
  return totalSavings;
}
