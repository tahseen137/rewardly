/**
 * FeatureGate - Central feature flag system
 * Controls access to features based on subscription tier
 */

import { SubscriptionTier, getCurrentTierSync, canAccessSync, hasExceededLimit, incrementUsage, showPaywall } from './SubscriptionService';

// ============================================================================
// Types
// ============================================================================

export type Feature =
  | 'ai_chat'
  | 'travel_planner'
  | 'location_recommendations'
  | 'expert_consultation'
  | 'family_sharing'
  | 'unlimited_recommendations'
  | 'unlimited_ai'
  | 'benefits_tracking'
  | 'spending_analytics'
  | 'point_valuations'
  | 'export_reports'
  | 'concierge_service';

export interface FeatureConfig {
  id: Feature;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  hasUsageLimit: boolean;
  limitType?: 'daily' | 'monthly';
}

export interface FeatureCheckResult {
  enabled: boolean;
  reason?: 'tier_required' | 'limit_exceeded' | 'not_available';
  requiredTier?: SubscriptionTier;
  showPaywall: boolean;
}

// ============================================================================
// Feature Configuration
// ============================================================================

export const FEATURE_CONFIGS: Record<Feature, FeatureConfig> = {
  ai_chat: {
    id: 'ai_chat',
    name: 'AI Chat',
    description: 'Chat with Sage, your AI rewards assistant',
    requiredTier: 'free', // Available to all, but limited
    hasUsageLimit: true,
    limitType: 'monthly',
  },
  travel_planner: {
    id: 'travel_planner',
    name: 'Travel Planner',
    description: 'Plan trips and optimize point redemptions',
    requiredTier: 'pro',
    hasUsageLimit: false,
  },
  location_recommendations: {
    id: 'location_recommendations',
    name: 'Location-Based Recommendations',
    description: 'Get card suggestions based on your location',
    requiredTier: 'plus',
    hasUsageLimit: false,
  },
  expert_consultation: {
    id: 'expert_consultation',
    name: 'Expert Consultations',
    description: 'Book 1-on-1 calls with rewards experts',
    requiredTier: 'elite',
    hasUsageLimit: true,
    limitType: 'monthly',
  },
  family_sharing: {
    id: 'family_sharing',
    name: 'Family Sharing',
    description: 'Share your subscription with up to 5 family members',
    requiredTier: 'elite',
    hasUsageLimit: false,
  },
  unlimited_recommendations: {
    id: 'unlimited_recommendations',
    name: 'Unlimited Recommendations',
    description: 'Get unlimited card recommendations',
    requiredTier: 'plus',
    hasUsageLimit: false,
  },
  unlimited_ai: {
    id: 'unlimited_ai',
    name: 'Unlimited AI Questions',
    description: 'Ask unlimited questions to Sage',
    requiredTier: 'plus',
    hasUsageLimit: false,
  },
  benefits_tracking: {
    id: 'benefits_tracking',
    name: 'Benefits Tracking',
    description: 'Track your card benefits and credits',
    requiredTier: 'pro',
    hasUsageLimit: false,
  },
  spending_analytics: {
    id: 'spending_analytics',
    name: 'Spending Analytics',
    description: 'Analyze your spending patterns',
    requiredTier: 'pro',
    hasUsageLimit: false,
  },
  point_valuations: {
    id: 'point_valuations',
    name: 'Point Valuations',
    description: 'See real-time point and mile valuations',
    requiredTier: 'plus',
    hasUsageLimit: false,
  },
  export_reports: {
    id: 'export_reports',
    name: 'Export Reports',
    description: 'Export your rewards data and reports',
    requiredTier: 'pro',
    hasUsageLimit: false,
  },
  concierge_service: {
    id: 'concierge_service',
    name: 'Concierge Service',
    description: 'Get personalized booking assistance',
    requiredTier: 'elite',
    hasUsageLimit: false,
  },
};

// ============================================================================
// Tier Hierarchy
// ============================================================================

const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  elite: 3,
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a feature is enabled for the given tier
 * Synchronous version using cached subscription state
 */
export function isFeatureEnabled(feature: Feature, userTier?: SubscriptionTier): boolean {
  const tier = userTier ?? getCurrentTierSync();
  const config = FEATURE_CONFIGS[feature];
  
  if (!config) {
    return false;
  }
  
  const userTierLevel = TIER_HIERARCHY[tier];
  const requiredTierLevel = TIER_HIERARCHY[config.requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}

/**
 * Check if a feature is accessible (includes usage limit check)
 * Returns detailed result with reason
 */
export async function checkFeatureAccess(feature: Feature): Promise<FeatureCheckResult> {
  const tier = getCurrentTierSync();
  const config = FEATURE_CONFIGS[feature];
  
  if (!config) {
    return {
      enabled: false,
      reason: 'not_available',
      showPaywall: false,
    };
  }
  
  // Check tier access
  const userTierLevel = TIER_HIERARCHY[tier];
  const requiredTierLevel = TIER_HIERARCHY[config.requiredTier];
  
  if (userTierLevel < requiredTierLevel) {
    return {
      enabled: false,
      reason: 'tier_required',
      requiredTier: config.requiredTier,
      showPaywall: true,
    };
  }
  
  // Check usage limits for applicable features
  if (config.hasUsageLimit) {
    const limitFeature = mapFeatureToUsageType(feature);
    if (limitFeature) {
      const exceeded = await hasExceededLimit(limitFeature);
      if (exceeded) {
        return {
          enabled: false,
          reason: 'limit_exceeded',
          showPaywall: true,
        };
      }
    }
  }
  
  return {
    enabled: true,
    showPaywall: false,
  };
}

/**
 * Map feature to usage tracking type
 */
function mapFeatureToUsageType(feature: Feature): 'recommendations' | 'ai_questions' | null {
  switch (feature) {
    case 'ai_chat':
      return 'ai_questions';
    case 'unlimited_recommendations':
      return 'recommendations';
    default:
      return null;
  }
}

/**
 * Track usage for a feature
 */
export async function trackFeatureUsage(feature: Feature): Promise<void> {
  const usageType = mapFeatureToUsageType(feature);
  if (usageType) {
    await incrementUsage(usageType);
  }
}

/**
 * Get feature configuration
 */
export function getFeatureConfig(feature: Feature): FeatureConfig {
  return FEATURE_CONFIGS[feature];
}

/**
 * Get all features available for a tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): Feature[] {
  return Object.entries(FEATURE_CONFIGS)
    .filter(([_, config]) => {
      const userTierLevel = TIER_HIERARCHY[tier];
      const requiredTierLevel = TIER_HIERARCHY[config.requiredTier];
      return userTierLevel >= requiredTierLevel;
    })
    .map(([feature]) => feature as Feature);
}

/**
 * Get features that would be unlocked by upgrading to a tier
 */
export function getNewFeaturesForTier(currentTier: SubscriptionTier, targetTier: SubscriptionTier): Feature[] {
  const currentFeatures = new Set(getFeaturesForTier(currentTier));
  const targetFeatures = getFeaturesForTier(targetTier);
  
  return targetFeatures.filter(feature => !currentFeatures.has(feature));
}

/**
 * Higher-order function to gate feature access
 * Shows paywall if feature is not accessible
 */
export async function withFeatureGate<T>(
  feature: Feature,
  action: () => Promise<T>
): Promise<T | null> {
  const access = await checkFeatureAccess(feature);
  
  if (!access.enabled) {
    if (access.showPaywall) {
      const subscribed = await showPaywall();
      if (subscribed) {
        // Retry after subscription
        return action();
      }
    }
    return null;
  }
  
  // Track usage
  await trackFeatureUsage(feature);
  
  return action();
}

/**
 * Create a feature guard hook for React components
 * Returns a function that can be used to check access
 */
export function createFeatureGuard(feature: Feature): {
  check: () => Promise<FeatureCheckResult>;
  isEnabled: () => boolean;
} {
  return {
    check: () => checkFeatureAccess(feature),
    isEnabled: () => isFeatureEnabled(feature),
  };
}

/**
 * Get upgrade prompt message for a feature
 */
export function getUpgradeMessage(feature: Feature): string {
  const config = FEATURE_CONFIGS[feature];
  const tierNames: Record<SubscriptionTier, string> = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro',
    elite: 'Elite',
  };
  
  return `Upgrade to ${tierNames[config.requiredTier]} to unlock ${config.name}`;
}

/**
 * Check multiple features at once
 */
export function checkMultipleFeatures(features: Feature[]): Record<Feature, boolean> {
  const result: Partial<Record<Feature, boolean>> = {};
  
  for (const feature of features) {
    result[feature] = isFeatureEnabled(feature);
  }
  
  return result as Record<Feature, boolean>;
}
