/**
 * SubscriptionService - Manages subscription tiers and feature access
 * Architecture ready for RevenueCat integration
 * Mock implementation defaults to "Plus" for development
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'elite';

export type BillingPeriod = 'monthly' | 'annual';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: TierLimits;
  highlighted?: boolean;
}

export interface TierLimits {
  recommendationsPerDay: number | 'unlimited';
  aiQuestionsPerMonth: number | 'unlimited';
  cardsInPortfolio: number | 'unlimited';
  travelPlans: number | 'unlimited';
  expertConsultationsPerMonth: number;
  familyMembers: number;
}

export interface UsageCount {
  recommendationsToday: number;
  aiQuestionsThisMonth: number;
  travelPlansThisMonth: number;
  lastResetDate: string; // ISO date string
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod | null;
  expiresAt: string | null; // ISO date string
  isTrialActive: boolean;
  trialEndsAt: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const USAGE_STORAGE_KEY = '@rewards_optimizer/usage_count';
const SUBSCRIPTION_STORAGE_KEY = '@rewards_optimizer/subscription';
const DEV_MODE = __DEV__ ?? true;

/**
 * Subscription tier configurations
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '5 recommendations per day',
      '10 AI questions per month',
      '3 cards in portfolio',
      'Basic category matching',
    ],
    limits: {
      recommendationsPerDay: 5,
      aiQuestionsPerMonth: 10,
      cardsInPortfolio: 3,
      travelPlans: 0,
      expertConsultationsPerMonth: 0,
      familyMembers: 0,
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 5.99,
    annualPrice: 59.99, // 2 months free
    features: [
      'Unlimited recommendations',
      'Unlimited AI questions',
      'Unlimited cards',
      'Point valuations',
      'Location-based suggestions',
      'Priority support',
    ],
    limits: {
      recommendationsPerDay: 'unlimited',
      aiQuestionsPerMonth: 'unlimited',
      cardsInPortfolio: 'unlimited',
      travelPlans: 0,
      expertConsultationsPerMonth: 0,
      familyMembers: 0,
    },
    highlighted: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 12.99,
    annualPrice: 119.99, // 2 months free
    features: [
      'Everything in Plus',
      'Travel planner',
      'Benefits tracking',
      'Award search',
      'Spending analytics',
      'Export reports',
    ],
    limits: {
      recommendationsPerDay: 'unlimited',
      aiQuestionsPerMonth: 'unlimited',
      cardsInPortfolio: 'unlimited',
      travelPlans: 'unlimited',
      expertConsultationsPerMonth: 0,
      familyMembers: 0,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 29.99,
    annualPrice: 299.99, // 2 months free
    features: [
      'Everything in Pro',
      '2 expert consultations/month',
      'Family sharing (5 members)',
      'Concierge service',
      'Early access to features',
      'Dedicated support line',
    ],
    limits: {
      recommendationsPerDay: 'unlimited',
      aiQuestionsPerMonth: 'unlimited',
      cardsInPortfolio: 'unlimited',
      travelPlans: 'unlimited',
      expertConsultationsPerMonth: 2,
      familyMembers: 5,
    },
  },
};

// ============================================================================
// State Management
// ============================================================================

let subscriptionCache: SubscriptionState | null = null;
let usageCache: UsageCount | null = null;

/**
 * Get default usage counts
 */
function getDefaultUsage(): UsageCount {
  return {
    recommendationsToday: 0,
    aiQuestionsThisMonth: 0,
    travelPlansThisMonth: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * Get default subscription state
 */
function getDefaultSubscription(): SubscriptionState {
  // In development, default to Plus tier
  if (DEV_MODE) {
    return {
      tier: 'plus',
      billingPeriod: 'monthly',
      expiresAt: null,
      isTrialActive: false,
      trialEndsAt: null,
    };
  }

  return {
    tier: 'free',
    billingPeriod: null,
    expiresAt: null,
    isTrialActive: false,
    trialEndsAt: null,
  };
}

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Load usage counts from storage
 */
async function loadUsage(): Promise<UsageCount> {
  try {
    const stored = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as UsageCount;
      
      // Check if we need to reset daily/monthly counts
      const today = new Date().toISOString().split('T')[0];
      const lastReset = new Date(usage.lastResetDate);
      const now = new Date();
      
      // Reset daily counts if new day
      if (usage.lastResetDate !== today) {
        usage.recommendationsToday = 0;
      }
      
      // Reset monthly counts if new month
      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        usage.aiQuestionsThisMonth = 0;
        usage.travelPlansThisMonth = 0;
      }
      
      usage.lastResetDate = today;
      return usage;
    }
  } catch {
    // Ignore errors
  }
  return getDefaultUsage();
}

/**
 * Save usage counts to storage
 */
async function saveUsage(usage: UsageCount): Promise<void> {
  try {
    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore errors
  }
}

/**
 * Load subscription state from storage
 */
async function loadSubscription(): Promise<SubscriptionState> {
  try {
    const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SubscriptionState;
    }
  } catch {
    // Ignore errors
  }
  return getDefaultSubscription();
}

/**
 * Save subscription state to storage
 */
async function saveSubscription(subscription: SubscriptionState): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize the subscription service
 */
export async function initializeSubscription(): Promise<void> {
  subscriptionCache = await loadSubscription();
  usageCache = await loadUsage();
}

/**
 * Get the current subscription tier
 */
export async function getCurrentTier(): Promise<SubscriptionTier> {
  if (!subscriptionCache) {
    subscriptionCache = await loadSubscription();
  }
  
  // Check if subscription has expired
  if (subscriptionCache.expiresAt) {
    const expiresAt = new Date(subscriptionCache.expiresAt);
    if (expiresAt < new Date()) {
      subscriptionCache.tier = 'free';
      subscriptionCache.billingPeriod = null;
      subscriptionCache.expiresAt = null;
      await saveSubscription(subscriptionCache);
    }
  }
  
  return subscriptionCache.tier;
}

/**
 * Get the current subscription tier synchronously (uses cache)
 */
export function getCurrentTierSync(): SubscriptionTier {
  return subscriptionCache?.tier ?? (DEV_MODE ? 'plus' : 'free');
}

/**
 * Get full subscription state
 */
export async function getSubscriptionState(): Promise<SubscriptionState> {
  if (!subscriptionCache) {
    subscriptionCache = await loadSubscription();
  }
  return subscriptionCache;
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier];
}

/**
 * Get all tier configurations
 */
export function getAllTierConfigs(): TierConfig[] {
  return Object.values(SUBSCRIPTION_TIERS);
}

/**
 * Check if user can access a feature based on current tier
 */
export async function canAccess(feature: string): Promise<boolean> {
  const tier = await getCurrentTier();
  const tierIndex = ['free', 'plus', 'pro', 'elite'].indexOf(tier);
  
  // Feature access rules
  const featureRequirements: Record<string, number> = {
    'ai_chat': 0, // Available to all, but limited
    'unlimited_recommendations': 1, // Plus+
    'unlimited_ai': 1, // Plus+
    'point_valuations': 1, // Plus+
    'location_recommendations': 1, // Plus+
    'travel_planner': 2, // Pro+
    'benefits_tracking': 2, // Pro+
    'spending_analytics': 2, // Pro+
    'expert_consultation': 3, // Elite only
    'family_sharing': 3, // Elite only
    'concierge_service': 3, // Elite only
  };
  
  const requiredTierIndex = featureRequirements[feature] ?? 0;
  return tierIndex >= requiredTierIndex;
}

/**
 * Check if user can access a feature synchronously (uses cache)
 */
export function canAccessSync(feature: string): boolean {
  const tier = getCurrentTierSync();
  const tierIndex = ['free', 'plus', 'pro', 'elite'].indexOf(tier);
  
  const featureRequirements: Record<string, number> = {
    'ai_chat': 0,
    'unlimited_recommendations': 1,
    'unlimited_ai': 1,
    'point_valuations': 1,
    'location_recommendations': 1,
    'travel_planner': 2,
    'benefits_tracking': 2,
    'spending_analytics': 2,
    'expert_consultation': 3,
    'family_sharing': 3,
    'concierge_service': 3,
  };
  
  const requiredTierIndex = featureRequirements[feature] ?? 0;
  return tierIndex >= requiredTierIndex;
}

/**
 * Get usage count for a specific feature
 */
export async function getUsageCount(feature: 'recommendations' | 'ai_questions' | 'travel_plans'): Promise<number> {
  if (!usageCache) {
    usageCache = await loadUsage();
  }
  
  switch (feature) {
    case 'recommendations':
      return usageCache.recommendationsToday;
    case 'ai_questions':
      return usageCache.aiQuestionsThisMonth;
    case 'travel_plans':
      return usageCache.travelPlansThisMonth;
    default:
      return 0;
  }
}

/**
 * Get remaining usage for a feature (returns -1 for unlimited)
 */
export async function getRemainingUsage(feature: 'recommendations' | 'ai_questions'): Promise<number> {
  const tier = await getCurrentTier();
  const limits = SUBSCRIPTION_TIERS[tier].limits;
  const usage = await getUsageCount(feature);
  
  if (feature === 'recommendations') {
    if (limits.recommendationsPerDay === 'unlimited') return -1;
    return Math.max(0, limits.recommendationsPerDay - usage);
  }
  
  if (feature === 'ai_questions') {
    if (limits.aiQuestionsPerMonth === 'unlimited') return -1;
    return Math.max(0, limits.aiQuestionsPerMonth - usage);
  }
  
  return -1;
}

/**
 * Increment usage count for a feature
 */
export async function incrementUsage(feature: 'recommendations' | 'ai_questions' | 'travel_plans'): Promise<void> {
  if (!usageCache) {
    usageCache = await loadUsage();
  }
  
  switch (feature) {
    case 'recommendations':
      usageCache.recommendationsToday++;
      break;
    case 'ai_questions':
      usageCache.aiQuestionsThisMonth++;
      break;
    case 'travel_plans':
      usageCache.travelPlansThisMonth++;
      break;
  }
  
  await saveUsage(usageCache);
}

/**
 * Check if user has exceeded their usage limit
 */
export async function hasExceededLimit(feature: 'recommendations' | 'ai_questions'): Promise<boolean> {
  const remaining = await getRemainingUsage(feature);
  return remaining === 0;
}

/**
 * Show paywall (placeholder - will integrate with RevenueCat)
 * Returns true if user subscribed, false if dismissed
 */
export async function showPaywall(): Promise<boolean> {
  // This is a placeholder for RevenueCat integration
  // In development mode, we'll just log and return false
  if (DEV_MODE) {
    console.log('[SubscriptionService] Paywall would be shown here');
    return false;
  }
  
  // TODO: Integrate with RevenueCat
  // const offerings = await Purchases.getOfferings();
  // return Purchases.presentPaywall(offerings.current);
  
  return false;
}

/**
 * Start a free trial
 */
export async function startTrial(tier: SubscriptionTier = 'pro'): Promise<boolean> {
  if (!subscriptionCache) {
    subscriptionCache = await loadSubscription();
  }
  
  // Check if already on a paid tier or trial
  if (subscriptionCache.tier !== 'free' || subscriptionCache.isTrialActive) {
    return false;
  }
  
  // Set trial for 7 days
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  
  subscriptionCache = {
    tier,
    billingPeriod: null,
    expiresAt: trialEnd.toISOString(),
    isTrialActive: true,
    trialEndsAt: trialEnd.toISOString(),
  };
  
  await saveSubscription(subscriptionCache);
  return true;
}

/**
 * Set subscription tier (for testing/development)
 */
export async function setTier(tier: SubscriptionTier, billingPeriod?: BillingPeriod): Promise<void> {
  subscriptionCache = {
    tier,
    billingPeriod: billingPeriod ?? (tier === 'free' ? null : 'monthly'),
    expiresAt: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isTrialActive: false,
    trialEndsAt: null,
  };
  
  await saveSubscription(subscriptionCache);
}

/**
 * Reset usage counts (for testing)
 */
export async function resetUsage(): Promise<void> {
  usageCache = getDefaultUsage();
  await saveUsage(usageCache);
}

/**
 * Get price display string
 */
export function getPriceDisplay(tier: SubscriptionTier, period: BillingPeriod): string {
  const config = SUBSCRIPTION_TIERS[tier];
  if (tier === 'free') return 'Free';
  
  if (period === 'annual') {
    const monthlyEquivalent = config.annualPrice / 12;
    return `$${monthlyEquivalent.toFixed(2)}/mo`;
  }
  
  return `$${config.monthlyPrice.toFixed(2)}/mo`;
}

/**
 * Calculate savings for annual billing
 */
export function getAnnualSavings(tier: SubscriptionTier): number {
  const config = SUBSCRIPTION_TIERS[tier];
  const monthlyTotal = config.monthlyPrice * 12;
  return monthlyTotal - config.annualPrice;
}
