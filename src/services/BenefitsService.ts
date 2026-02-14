/**
 * BenefitsService - Manages card benefits display and filtering
 * 
 * Tier: Pro+ (Free sees first 2 benefits + locked overlay)
 * Benefits are stored in the cards table as JSONB
 */

import { Benefit, BenefitCategory, Card } from '../types';
import { getCardByIdSync } from './CardDataService';
import { getCurrentTierSync, SubscriptionTier } from './SubscriptionService';

// ============================================================================
// Constants
// ============================================================================

const FREE_TIER_BENEFIT_LIMIT = 2;

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get all benefits for a card
 */
export function getBenefitsForCard(cardId: string): Benefit[] {
  const card = getCardByIdSync(cardId);
  if (!card) return [];
  
  // Benefits are stored in the card data (will be loaded from Supabase)
  // For now, return empty array - benefits will be added via migration + data import
  return [];
}

/**
 * Group benefits by category
 */
export function getBenefitsByCategory(benefits: Benefit[]): Record<BenefitCategory, Benefit[]> {
  const grouped: Record<BenefitCategory, Benefit[]> = {
    travel: [],
    purchase: [],
    insurance: [],
    lifestyle: [],
  };

  benefits.forEach(benefit => {
    if (grouped[benefit.category]) {
      grouped[benefit.category].push(benefit);
    }
  });

  return grouped;
}

/**
 * Get visible benefits based on subscription tier
 */
export function getVisibleBenefits(benefits: Benefit[], tier?: SubscriptionTier): Benefit[] {
  const currentTier = tier || getCurrentTierSync();
  
  if (currentTier === 'free') {
    return benefits.slice(0, FREE_TIER_BENEFIT_LIMIT);
  }

  return benefits;
}

/**
 * Check if user can access all benefits
 */
export function canViewAllBenefits(tier?: SubscriptionTier): boolean {
  const currentTier = tier || getCurrentTierSync();
  return currentTier !== 'free';
}

/**
 * Get the number of locked benefits
 */
export function getLockedBenefitsCount(totalBenefits: number, tier?: SubscriptionTier): number {
  const currentTier = tier || getCurrentTierSync();
  
  if (currentTier === 'free' && totalBenefits > FREE_TIER_BENEFIT_LIMIT) {
    return totalBenefits - FREE_TIER_BENEFIT_LIMIT;
  }

  return 0;
}

/**
 * Get benefit category display name
 */
export function getBenefitCategoryName(category: BenefitCategory): string {
  const names: Record<BenefitCategory, string> = {
    travel: 'Travel Benefits',
    purchase: 'Purchase Protection',
    insurance: 'Insurance Coverage',
    lifestyle: 'Lifestyle Perks',
  };

  return names[category];
}

/**
 * Check if a card has benefits data
 */
export function hasBenefitsData(cardId: string): boolean {
  const benefits = getBenefitsForCard(cardId);
  return benefits.length > 0;
}

/**
 * Get benefit icon name (for mapping to icon components)
 */
export function getBenefitCategoryIcon(category: BenefitCategory): string {
  const icons: Record<BenefitCategory, string> = {
    travel: 'plane',
    purchase: 'shield-check',
    insurance: 'umbrella',
    lifestyle: 'star',
  };

  return icons[category];
}

/**
 * Sort benefits by priority (travel > insurance > purchase > lifestyle)
 */
export function sortBenefitsByPriority(benefits: Benefit[]): Benefit[] {
  const priority: Record<BenefitCategory, number> = {
    travel: 1,
    insurance: 2,
    purchase: 3,
    lifestyle: 4,
  };

  return [...benefits].sort((a, b) => {
    const aPriority = priority[a.category] || 999;
    const bPriority = priority[b.category] || 999;
    return aPriority - bPriority;
  });
}
