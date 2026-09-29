/**
 * FeatureGate - All features are free and unlocked.
 * Rewardly is now a completely free service.
 */

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
  requiredTier: 'free';
  hasUsageLimit: boolean;
  limitType?: 'daily' | 'monthly';
}

export interface FeatureCheckResult {
  enabled: boolean;
  reason?: never;
  requiredTier?: never;
  showPaywall: false;
}

// ============================================================================
// Feature Configuration (all free)
// ============================================================================

export const FEATURE_CONFIGS: Record<Feature, FeatureConfig> = {
  ai_chat: { id: 'ai_chat', name: 'AI Chat', description: 'Chat with Sage, your AI rewards assistant', requiredTier: 'free', hasUsageLimit: false },
  travel_planner: { id: 'travel_planner', name: 'Travel Planner', description: 'Plan trips and optimize point redemptions', requiredTier: 'free', hasUsageLimit: false },
  location_recommendations: { id: 'location_recommendations', name: 'Location-Based Recommendations', description: 'Get card suggestions based on your location', requiredTier: 'free', hasUsageLimit: false },
  expert_consultation: { id: 'expert_consultation', name: 'Expert Consultations', description: 'Book 1-on-1 calls with rewards experts', requiredTier: 'free', hasUsageLimit: false },
  family_sharing: { id: 'family_sharing', name: 'Family Sharing', description: 'Share your account with family members', requiredTier: 'free', hasUsageLimit: false },
  unlimited_recommendations: { id: 'unlimited_recommendations', name: 'Unlimited Recommendations', description: 'Get unlimited card recommendations', requiredTier: 'free', hasUsageLimit: false },
  unlimited_ai: { id: 'unlimited_ai', name: 'Unlimited AI Questions', description: 'Ask unlimited questions to Sage', requiredTier: 'free', hasUsageLimit: false },
  benefits_tracking: { id: 'benefits_tracking', name: 'Benefits Tracking', description: 'Track your card benefits and credits', requiredTier: 'free', hasUsageLimit: false },
  spending_analytics: { id: 'spending_analytics', name: 'Spending Analytics', description: 'Analyze your spending patterns', requiredTier: 'free', hasUsageLimit: false },
  point_valuations: { id: 'point_valuations', name: 'Point Valuations', description: 'See real-time point and mile valuations', requiredTier: 'free', hasUsageLimit: false },
  export_reports: { id: 'export_reports', name: 'Export Reports', description: 'Export your rewards data and reports', requiredTier: 'free', hasUsageLimit: false },
  concierge_service: { id: 'concierge_service', name: 'Concierge Service', description: 'Get personalized booking assistance', requiredTier: 'free', hasUsageLimit: false },
};

// ============================================================================
// Public API — everything is always enabled
// ============================================================================

export function isFeatureEnabled(_feature: Feature): boolean {
  return true;
}

export async function checkFeatureAccess(_feature: Feature): Promise<FeatureCheckResult> {
  return { enabled: true, showPaywall: false };
}

export async function trackFeatureUsage(_feature: Feature): Promise<void> {}

export function getFeatureConfig(feature: Feature): FeatureConfig {
  return FEATURE_CONFIGS[feature];
}

export function getFeaturesForTier(_tier: string): Feature[] {
  return Object.keys(FEATURE_CONFIGS) as Feature[];
}

export function getNewFeaturesForTier(_currentTier: string, _targetTier: string): Feature[] {
  return [];
}

export async function withFeatureGate<T>(
  _feature: Feature,
  action: () => Promise<T>
): Promise<T | null> {
  return action();
}

export function createFeatureGuard(_feature: Feature): {
  check: () => Promise<FeatureCheckResult>;
  isEnabled: () => boolean;
} {
  return {
    check: async () => ({ enabled: true, showPaywall: false }),
    isEnabled: () => true,
  };
}

export function getUpgradeMessage(_feature: Feature): string {
  return '';
}

export function checkMultipleFeatures(features: Feature[]): Record<Feature, boolean> {
  return features.reduce(
    (acc, f) => ({ ...acc, [f]: true }),
    {} as Record<Feature, boolean>
  );
}
