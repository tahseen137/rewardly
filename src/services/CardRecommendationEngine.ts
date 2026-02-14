/**
 * CardRecommendationEngine - F8: Personalized card recommendations
 * Analyzes spending patterns and suggests new cards
 */

import { Card, SpendingCategory, SignupBonus } from '../types';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getCards } from './CardPortfolioManager';
import { supabase } from './supabase/client';
import { SubscriptionTier, getCurrentTierSync } from './SubscriptionService';
import { getApplicationUrl } from './AffiliateService';

// ============================================================================
// Types
// ============================================================================

export interface CardRecommendation {
  card: Card;
  reason: string;
  basedOn: 'spending' | 'gap' | 'upgrade' | 'signup_bonus';
  estimatedAnnualRewards: number;
  categoryMatch: SpendingCategory[]; // Which of user's top categories this covers
  signupBonus?: SignupBonus;
  affiliateUrl?: string; // Max tier only
  priority: number; // 1-5, higher = more relevant
}

export interface RecommendationAnalysis {
  recommendations: CardRecommendation[];
  userTopCategories: { category: SpendingCategory; monthlySpend: number }[];
  currentGaps: SpendingCategory[]; // Categories with suboptimal cards
  totalPotentialGain: number;
}

// ============================================================================
// Spending Analysis
// ============================================================================

export async function getTopSpendingCategories(
  limit: number = 5
): Promise<{ category: SpendingCategory; monthlySpend: number }[]> {
  try {
    if (!supabase) return [];
    const user = await supabase.auth.getUser();
    if (!user.data.user) return [];
    
    // Get spending from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data, error } = await (supabase
      .from('spending_log') as any)
      .select('category, amount')
      .eq('user_id', user.data.user.id)
      .gte('transaction_date', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    
    // Aggregate by category
    const categoryTotals: Record<string, number> = {};
    
    ((data || []) as any[]).forEach((entry: any) => {
      const cat = entry.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(entry.amount);
    });
    
    // Convert to array and sort
    const sorted = Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category: category as SpendingCategory,
        monthlySpend: total,
      }))
      .sort((a, b) => b.monthlySpend - a.monthlySpend)
      .slice(0, limit);
    
    return sorted;
    
  } catch (error) {
    console.error('Failed to get top spending categories:', error);
    
    // Return default if no spending data
    return [
      { category: SpendingCategory.GROCERIES, monthlySpend: 500 },
      { category: SpendingCategory.DINING, monthlySpend: 300 },
      { category: SpendingCategory.GAS, monthlySpend: 200 },
    ];
  }
}

// ============================================================================
// Gap Analysis
// ============================================================================

export function findCategoryGaps(): SpendingCategory[] {
  const userCards = getCards().map(uc => getCardByIdSync(uc.cardId)).filter(Boolean) as Card[];
  const gaps: SpendingCategory[] = [];
  
  const allCategories = Object.values(SpendingCategory);
  
  for (const category of allCategories) {
    // Find best card in portfolio for this category
    let bestRate = 0;
    
    for (const card of userCards) {
      const categoryReward = card.categoryRewards.find(cr => cr.category === category);
      const rate = categoryReward 
        ? categoryReward.rewardRate.value 
        : card.baseRewardRate.value;
      
      if (rate > bestRate) {
        bestRate = rate;
      }
    }
    
    // If best rate is below 2% (or 2x), it's a gap
    if (bestRate < 2) {
      gaps.push(category);
    }
  }
  
  return gaps;
}

// ============================================================================
// Card Ranking
// ============================================================================

function calculateCategoryFit(
  card: Card, 
  topCategories: { category: SpendingCategory; monthlySpend: number }[]
): { matches: SpendingCategory[]; estimatedRewards: number } {
  const matches: SpendingCategory[] = [];
  let totalRewards = 0;
  
  for (const { category, monthlySpend } of topCategories) {
    const categoryReward = card.categoryRewards.find(cr => cr.category === category);
    
    if (categoryReward && categoryReward.rewardRate.value >= 2) {
      matches.push(category);
      
      // Estimate monthly rewards
      const rate = categoryReward.rewardRate.value / 100;
      totalRewards += monthlySpend * rate;
    }
  }
  
  return { matches, estimatedRewards: totalRewards * 12 }; // Annualize
}

export function rankRecommendations(
  cards: Card[], 
  topCategories: { category: SpendingCategory; monthlySpend: number }[],
  gaps: SpendingCategory[]
): CardRecommendation[] {
  const userCardIds = getCards().map(uc => uc.cardId);
  const recommendations: CardRecommendation[] = [];
  
  for (const card of cards) {
    // Skip cards user already has
    if (userCardIds.includes(card.id)) continue;
    
    const { matches, estimatedRewards } = calculateCategoryFit(card, topCategories);
    
    // Determine recommendation reason and priority
    let basedOn: CardRecommendation['basedOn'] = 'spending';
    let priority = 1;
    let reason = '';
    
    if (matches.length >= 2) {
      basedOn = 'spending';
      priority = 5;
      reason = `Earns bonus rewards in ${matches.length} of your top spending categories`;
    } else if (matches.length === 1) {
      basedOn = 'spending';
      priority = 4;
      reason = `Great for ${matches[0]} spending`;
    } else if (gaps.some(gap => card.categoryRewards.some(cr => cr.category === gap && cr.rewardRate.value >= 2))) {
      basedOn = 'gap';
      priority = 3;
      reason = 'Fills a gap in your current card portfolio';
    } else if (card.signupBonus && card.signupBonus.amount >= 50000) {
      basedOn = 'signup_bonus';
      priority = 3;
      reason = 'Excellent sign-up bonus available';
    } else {
      priority = 2;
      reason = 'Solid rewards card for general spending';
    }
    
    recommendations.push({
      card,
      reason,
      basedOn,
      estimatedAnnualRewards: estimatedRewards,
      categoryMatch: matches,
      signupBonus: card.signupBonus,
      priority,
    });
  }
  
  // Sort by priority (descending)
  return recommendations.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// Affiliate URLs
// ============================================================================

export function getAffiliateUrl(cardId: string, tier: SubscriptionTier): string | undefined {
  // Only Max tier gets affiliate links
  if (tier !== 'max') return undefined;
  
  // Resolve the full application URL with UTM tracking
  const card = getCardByIdSync(cardId);
  if (card) {
    return getApplicationUrl(card);
  }
  
  // Fallback for cards not in cache
  return `https://rewardly.app/cards/${cardId}/apply`;
}

// ============================================================================
// Main Analysis
// ============================================================================

export async function analyzeAndRecommend(): Promise<RecommendationAnalysis> {
  const topCategories = await getTopSpendingCategories(5);
  const gaps = findCategoryGaps();
  const allCards = getAllCardsSync();
  
  const recommendations = rankRecommendations(allCards, topCategories, gaps);
  
  // Take top 5 recommendations
  const topRecs = recommendations.slice(0, 5);
  
  // Add affiliate URLs for Max tier
  const tier = getCurrentTierSync();
  topRecs.forEach(rec => {
    rec.affiliateUrl = getAffiliateUrl(rec.card.id, tier);
  });
  
  // Calculate total potential gain
  const totalPotentialGain = topRecs.reduce((sum, rec) => sum + rec.estimatedAnnualRewards, 0);
  
  return {
    recommendations: topRecs,
    userTopCategories: topCategories,
    currentGaps: gaps,
    totalPotentialGain,
  };
}
