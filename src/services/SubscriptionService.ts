/**
 * SubscriptionService - Manages subscription tiers and feature access
 * 
 * Tiers: Free, Pro ($5.99/mo), Max ($12.99/mo), Admin (internal)
 * 
 * Features by tier:
 * - Free: 3 cards max, no Sage, no Insights, no AutoPilot
 * - Pro: Unlimited cards, Insights, 10 Sage chats/month
 * - Max: Everything in Pro + unlimited Sage + AutoPilot + Multi-country
 * - Admin: All features unlocked (no subscription required)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'max' | 'lifetime' | 'admin';

export type BillingPeriod = 'monthly' | 'annual';

export type Feature = 
  | 'unlimited_cards'
  | 'insights'
  | 'points_valuator'
  | 'balance_tracking'
  | 'sage_ai'
  | 'smartwallet'
  | 'multi_country'
  | 'export'
  | 'family_sharing';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Feature[];
  featureDescriptions: string[];
  limits: TierLimits;
  highlighted?: boolean;
}

export interface TierLimits {
  cardsInPortfolio: number;
  sageChatsPerMonth: number | null; // null = unlimited
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  isAdmin: boolean;
  billingPeriod: BillingPeriod | null;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface SageUsage {
  month: string; // '2026-02' format
  chatCount: number;
  limit: number | null; // null = unlimited
  remaining: number | null; // null = unlimited
}

// ============================================================================
// Constants
// ============================================================================

const SUBSCRIPTION_STORAGE_KEY = '@rewardly/subscription';
const SAGE_USAGE_STORAGE_KEY = '@rewardly/sage_usage';

// Admin emails (can be expanded via env vars)
const ADMIN_EMAILS = [
  'tahseen137@gmail.com',
  // Add more admin emails here or load from env
];

/**
 * Stripe Price IDs
 * These are live Stripe price IDs for Rewardly subscriptions (CAD)
 * The edge functions also use env vars: STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_MAX_MONTHLY
 */
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1T0kbiAJmUBqj9CQPd8dhYEu',
  pro_annual: '', // Annual pricing not yet created
  max_monthly: 'price_1T0kcdAJmUBqj9CQeRMyl9h6',
  max_annual: '', // Annual pricing not yet created
  lifetime: 'price_1T0lIRAJmUBqj9CQ9CgKkCKk', // One-time $49.99 CAD
} as const;

/**
 * Feature access by tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  free: ['sage_ai'],
  pro: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai'],
  max: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'smartwallet', 'multi_country', 'export', 'family_sharing'],
  lifetime: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'smartwallet', 'multi_country', 'export', 'family_sharing'],
  admin: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'smartwallet', 'multi_country', 'export', 'family_sharing'],
};

/**
 * Card limits per tier
 */
export const CARD_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: Infinity,
  max: Infinity,
  lifetime: Infinity,
  admin: Infinity,
};

/**
 * Sage monthly chat limits (null = unlimited)
 */
export const SAGE_LIMITS: Record<SubscriptionTier, number | null> = {
  free: 3, // Free users get 3 chats/month to try Sage
  pro: 10,
  max: null, // Unlimited
  lifetime: null, // Unlimited — same as Max
  admin: null, // Unlimited
};

/**
 * Subscription tier configurations
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [],
    featureDescriptions: [
      'Best card by category (9 categories)',
      'Store search',
      'Up to 3 cards in wallet',
      'Card details (read-only)',
    ],
    limits: {
      cardsInPortfolio: 3,
      sageChatsPerMonth: 3,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 5.99,
    annualPrice: 49.99,
    features: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai'],
    featureDescriptions: [
      'Everything in Free',
      'Unlimited cards in wallet',
      'Insights dashboard',
      'Points Valuator',
      'Point Balance Tracking',
      'Sage AI (10 chats/month)',
      'No ads',
    ],
    limits: {
      cardsInPortfolio: Infinity,
      sageChatsPerMonth: 10,
    },
    highlighted: true,
  },
  max: {
    id: 'max',
    name: 'Max',
    monthlyPrice: 12.99,
    annualPrice: 99.99,
    features: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'smartwallet', 'multi_country', 'export', 'family_sharing'],
    featureDescriptions: [
      'Everything in Pro',
      'Sage AI (Unlimited)',
      'Smart Wallet',
      'Multi-country (CA + US)',
      'Family sharing (up to 5)',
      'Export reports',
      'Priority support',
    ],
    limits: {
      cardsInPortfolio: Infinity,
      sageChatsPerMonth: null,
    },
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'smartwallet', 'multi_country', 'export', 'family_sharing'],
    featureDescriptions: [
      'Everything in Max — forever',
      'Sage AI (Unlimited)',
      'Smart Wallet',
      'Multi-country (CA + US)',
      'Family sharing (up to 5)',
      'Export reports',
      'Priority support',
      'All future features included',
    ],
    limits: {
      cardsInPortfolio: Infinity,
      sageChatsPerMonth: null,
    },
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'smartwallet', 'multi_country', 'export', 'family_sharing'],
    featureDescriptions: ['All features unlocked', 'Internal use only'],
    limits: {
      cardsInPortfolio: Infinity,
      sageChatsPerMonth: null,
    },
  },
};

// ============================================================================
// State Management
// ============================================================================

let subscriptionCache: SubscriptionState | null = null;
let sageUsageCache: SageUsage | null = null;

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get default subscription state
 */
function getDefaultSubscription(): SubscriptionState {
  return {
    tier: 'free',
    isAdmin: false,
    billingPeriod: null,
    expiresAt: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
}

/**
 * Get default sage usage
 */
function getDefaultSageUsage(): SageUsage {
  return {
    month: getCurrentMonth(),
    chatCount: 0,
    limit: SAGE_LIMITS.free,
    remaining: SAGE_LIMITS.free, // Fix: was 0, should be full limit for new users
  };
}

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Load subscription state from storage/Supabase
 */
async function loadSubscription(): Promise<SubscriptionState> {
  try {
    // Try to load from Supabase first if configured
    if (isSupabaseConfigured() && supabase) {
      const user = await getCurrentUser();
      if (user && !user.isAnonymous) {
        // Check if user is admin
        const isAdmin = ADMIN_EMAILS.some(
          email => email.toLowerCase() === user.email?.toLowerCase()
        );
        
        if (isAdmin) {
          return {
            tier: 'admin',
            isAdmin: true,
            billingPeriod: null,
            expiresAt: null,
            cancelAtPeriodEnd: false,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          };
        }
        
        // Fetch profile with tier
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier, is_admin, stripe_customer_id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          // Fetch active subscription details
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing', 'lifetime'])
            .single();
          
          const profileData = profile as any;
          const subscriptionData = subscription as any;
          const resolvedTier = (profileData.is_admin ? 'admin' : profileData.tier || 'free') as SubscriptionTier;
          const isLifetime = resolvedTier === 'lifetime' || subscriptionData?.status === 'lifetime';
          
          return {
            tier: resolvedTier,
            isAdmin: profileData.is_admin || false,
            billingPeriod: isLifetime ? null : (subscriptionData?.current_period_end 
              ? (new Date(subscriptionData.current_period_end).getTime() - new Date(subscriptionData.current_period_start).getTime() > 45 * 24 * 60 * 60 * 1000 ? 'annual' : 'monthly')
              : null),
            expiresAt: isLifetime ? null : (subscriptionData?.current_period_end || null),
            cancelAtPeriodEnd: isLifetime ? false : (subscriptionData?.cancel_at_period_end || false),
            stripeCustomerId: profileData.stripe_customer_id || null,
            stripeSubscriptionId: subscriptionData?.stripe_subscription_id || null,
          };
        }
      }
    }
    
    // Fall back to local storage
    const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SubscriptionState;
    }
  } catch (error) {
    console.error('Error loading subscription:', error);
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

/**
 * Load Sage usage from storage/Supabase
 */
async function loadSageUsage(): Promise<SageUsage> {
  const currentMonth = getCurrentMonth();
  
  try {
    // Try to load from Supabase first if configured
    if (isSupabaseConfigured() && supabase) {
      const user = await getCurrentUser();
      if (user && !user.isAnonymous) {
        const { data: usage } = await supabase
          .from('sage_usage')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .single();
        
        if (usage) {
          const usageData = usage as any;
          const tier = subscriptionCache?.tier || 'free';
          const limit = SAGE_LIMITS[tier];
          return {
            month: currentMonth,
            chatCount: usageData.chat_count,
            limit,
            remaining: limit === null ? null : Math.max(0, limit - usageData.chat_count),
          };
        }
      }
    }
    
    // Fall back to local storage
    const stored = await AsyncStorage.getItem(SAGE_USAGE_STORAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as SageUsage;
      // Reset if new month
      if (usage.month !== currentMonth) {
        return getDefaultSageUsage();
      }
      return usage;
    }
  } catch (error) {
    console.error('Error loading sage usage:', error);
  }
  
  return getDefaultSageUsage();
}

/**
 * Save Sage usage to storage
 */
async function saveSageUsage(usage: SageUsage): Promise<void> {
  try {
    await AsyncStorage.setItem(SAGE_USAGE_STORAGE_KEY, JSON.stringify(usage));
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
  sageUsageCache = await loadSageUsage();
  
  // Update sage usage limits based on current tier
  if (sageUsageCache && subscriptionCache) {
    const limit = SAGE_LIMITS[subscriptionCache.tier];
    sageUsageCache.limit = limit;
    sageUsageCache.remaining = limit === null ? null : Math.max(0, limit - sageUsageCache.chatCount);
  }
}

/**
 * Get the current subscription tier
 */
export async function getCurrentTier(): Promise<SubscriptionTier> {
  if (!subscriptionCache) {
    subscriptionCache = await loadSubscription();
  }
  return subscriptionCache.tier;
}

/**
 * Get the current subscription tier synchronously (uses cache)
 */
export function getCurrentTierSync(): SubscriptionTier {
  return subscriptionCache?.tier ?? 'free';
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  if (!subscriptionCache) {
    subscriptionCache = await loadSubscription();
  }
  return subscriptionCache.isAdmin;
}

/**
 * Check if current user is admin (sync)
 */
export function isAdminSync(): boolean {
  return subscriptionCache?.isAdmin ?? false;
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
 * Get all tier configurations (excluding admin)
 */
export function getAllTierConfigs(): TierConfig[] {
  return [SUBSCRIPTION_TIERS.free, SUBSCRIPTION_TIERS.pro, SUBSCRIPTION_TIERS.max, SUBSCRIPTION_TIERS.lifetime];
}

/**
 * Check if user can access a feature based on current tier
 */
export async function canAccessFeature(feature: Feature): Promise<boolean> {
  const tier = await getCurrentTier();
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Check if user can access a feature synchronously
 */
export function canAccessFeatureSync(feature: Feature): boolean {
  const tier = getCurrentTierSync();
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Get the card limit for current tier
 */
export async function getCardLimit(): Promise<number> {
  const tier = await getCurrentTier();
  return CARD_LIMITS[tier];
}

/**
 * Get the card limit synchronously
 */
export function getCardLimitSync(): number {
  const tier = getCurrentTierSync();
  return CARD_LIMITS[tier];
}

/**
 * Check if user can add more cards
 */
export async function canAddCard(currentCardCount: number): Promise<boolean> {
  const limit = await getCardLimit();
  return currentCardCount < limit;
}

/**
 * Check if user can add more cards (sync)
 */
export function canAddCardSync(currentCardCount: number): boolean {
  const limit = getCardLimitSync();
  return currentCardCount < limit;
}

/**
 * Get Sage usage for current month
 */
export async function getSageUsage(): Promise<SageUsage> {
  if (!sageUsageCache || sageUsageCache.month !== getCurrentMonth()) {
    sageUsageCache = await loadSageUsage();
  }
  return sageUsageCache;
}

/**
 * Check if user can use Sage AI
 */
export async function canUseSage(): Promise<{allowed: boolean; remaining: number | null; reason?: string}> {
  const tier = await getCurrentTier();
  
  // Free users get limited access (3 chats/month)
  // Falls through to the Pro limit check below
  
  // Max, Lifetime, and Admin have unlimited access
  if (tier === 'max' || tier === 'lifetime' || tier === 'admin') {
    return { allowed: true, remaining: null };
  }
  
  // Pro users have limited access
  const usage = await getSageUsage();
  const limit = SAGE_LIMITS[tier];
  
  if (limit !== null && usage.chatCount >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      reason: 'Monthly Sage limit reached. Upgrade to Max for unlimited access.' 
    };
  }
  
  return { 
    allowed: true, 
    remaining: limit === null ? null : limit - usage.chatCount 
  };
}

/**
 * Increment Sage usage after a chat
 * Returns updated usage info
 */
export async function incrementSageUsage(): Promise<SageUsage> {
  if (!sageUsageCache || sageUsageCache.month !== getCurrentMonth()) {
    sageUsageCache = await loadSageUsage();
  }
  
  const tier = await getCurrentTier();
  const limit = SAGE_LIMITS[tier];
  
  sageUsageCache.chatCount++;
  sageUsageCache.limit = limit;
  sageUsageCache.remaining = limit === null ? null : Math.max(0, limit - sageUsageCache.chatCount);
  
  await saveSageUsage(sageUsageCache);
  
  // Also update in Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    if (user && !user.isAnonymous) {
      const currentMonth = getCurrentMonth();
      
      // Upsert sage usage
      await supabase
        .from('sage_usage')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          chat_count: sageUsageCache.chatCount,
        } as any, {
          onConflict: 'user_id,month',
        });
    }
  }
  
  return sageUsageCache;
}

/**
 * Get tier required for a feature
 */
export function getRequiredTierForFeature(feature: Feature): SubscriptionTier {
  if (TIER_FEATURES.pro.includes(feature)) {
    if (TIER_FEATURES.max.includes(feature) && !TIER_FEATURES.pro.includes(feature)) {
      return 'max';
    }
    return 'pro';
  }
  if (TIER_FEATURES.max.includes(feature)) {
    return 'max';
  }
  return 'free';
}

/**
 * Check which tier unlocks a specific feature
 */
export function getFeatureUnlockTier(feature: Feature): SubscriptionTier {
  // Smart Wallet and multi-country require Max
  if (feature === 'smartwallet' || feature === 'multi_country' || feature === 'export' || feature === 'family_sharing') {
    return 'max';
  }
  // All other premium features require Pro
  if (TIER_FEATURES.pro.includes(feature)) {
    return 'pro';
  }
  return 'free';
}

/**
 * Set subscription tier (for testing/development or after webhook processing)
 */
export async function setTier(
  tier: SubscriptionTier, 
  billingPeriod?: BillingPeriod,
  options?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    expiresAt?: string;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<void> {
  const isAdminTier = tier === 'admin';
  const isLifetimeTier = tier === 'lifetime';
  
  subscriptionCache = {
    tier,
    isAdmin: isAdminTier,
    billingPeriod: billingPeriod ?? (tier === 'free' || isLifetimeTier ? null : 'monthly'),
    expiresAt: options?.expiresAt ?? (tier === 'free' || isLifetimeTier ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    cancelAtPeriodEnd: options?.cancelAtPeriodEnd ?? false,
    stripeCustomerId: options?.stripeCustomerId ?? null,
    stripeSubscriptionId: options?.stripeSubscriptionId ?? null,
  };
  
  await saveSubscription(subscriptionCache);
  
  // Update sage usage limits
  if (sageUsageCache) {
    const limit = SAGE_LIMITS[tier];
    sageUsageCache.limit = limit;
    sageUsageCache.remaining = limit === null ? null : Math.max(0, limit - sageUsageCache.chatCount);
  }
}

/**
 * Reset subscription to free tier
 */
export async function resetToFreeTier(): Promise<void> {
  await setTier('free');
}

/**
 * Get price display string
 */
export function getPriceDisplay(tier: SubscriptionTier, period: BillingPeriod): string {
  const config = SUBSCRIPTION_TIERS[tier];
  if (tier === 'free' || tier === 'admin') return 'Free';
  if (tier === 'lifetime') return '$49.99';
  
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

/**
 * Refresh subscription state from server
 */
export async function refreshSubscription(): Promise<SubscriptionState> {
  subscriptionCache = await loadSubscription();
  sageUsageCache = await loadSageUsage();
  return subscriptionCache;
}

/**
 * Create a Stripe Checkout session for subscription purchase
 */
export async function createCheckoutSession(
  tier: 'pro' | 'max' | 'lifetime',
  interval: 'month' | 'year'
): Promise<{ url: string } | { error: string }> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase not configured' };
    }

    const user = await getCurrentUser();
    if (!user || user.isAnonymous) {
      return { error: 'Not authenticated' };
    }

    // Call edge function to create Stripe Checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { tier, interval },
    });

    if (error) {
      console.error('Checkout error:', error);
      return { error: error.message || 'Failed to create checkout session' };
    }

    if (!data || !data.url) {
      return { error: 'Invalid response from checkout service' };
    }

    return { url: data.url };
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Open Stripe Customer Portal for subscription management
 */
export async function openCustomerPortal(): Promise<{ url: string } | { error: string }> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase not configured' };
    }

    const user = await getCurrentUser();
    if (!user || user.isAnonymous) {
      return { error: 'Not authenticated' };
    }

    // Call edge function to create Customer Portal session
    const { data, error } = await supabase.functions.invoke('manage-subscription', {});

    if (error) {
      console.error('Portal error:', error);
      return { error: error.message || 'Failed to open customer portal' };
    }

    if (!data || !data.url) {
      return { error: 'Invalid response from portal service' };
    }

    return { url: data.url };
  } catch (error) {
    console.error('openCustomerPortal error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Subscribe to realtime subscription changes from Supabase
 * Returns unsubscribe function
 */
export function subscribeToSubscriptionChanges(
  userId: string,
  callback: (tier: SubscriptionTier) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured, cannot subscribe to changes');
    return () => {};
  }

  const channel = supabase
    .channel('subscription-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log('Subscription change detected:', payload);
        const newTier = payload.new?.tier || 'free';
        
        // Update cache
        if (subscriptionCache) {
          subscriptionCache = { 
            ...subscriptionCache, 
            tier: newTier as SubscriptionTier 
          };
        }
        
        // Notify callback
        callback(newTier as SubscriptionTier);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase!.removeChannel(channel);
  };
}

/**
 * Check if email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Get admin emails list
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}
