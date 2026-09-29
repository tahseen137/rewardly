/**
 * SubscriptionService - Rewardly is now completely free.
 * All features are available to all users at no cost.
 * This file is kept as a stub so existing imports continue to compile.
 */

// ============================================================================
// Types (kept for TypeScript compatibility)
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

export interface TierLimits {
  cardsInPortfolio: number;
  sageChatsPerMonth: number | null;
}

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
  month: string;
  chatCount: number;
  limit: number | null;
  remaining: number | null;
}

// ============================================================================
// Constants (kept for TypeScript compatibility — Rewardly is free)
// ============================================================================

export const STRIPE_PRICE_IDS = {
  pro_monthly: '',
  pro_annual: '',
  max_monthly: '',
  max_annual: '',
  lifetime: '',
} as const;

const ALL_FEATURES: Feature[] = [
  'unlimited_cards',
  'insights',
  'points_valuator',
  'balance_tracking',
  'sage_ai',
  'smartwallet',
  'multi_country',
  'export',
  'family_sharing',
];

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ALL_FEATURES,
    featureDescriptions: ['All features included — free forever'],
    limits: { cardsInPortfolio: Infinity, sageChatsPerMonth: null },
  },
  pro: {
    id: 'pro',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ALL_FEATURES,
    featureDescriptions: ['All features included — free forever'],
    limits: { cardsInPortfolio: Infinity, sageChatsPerMonth: null },
  },
  max: {
    id: 'max',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ALL_FEATURES,
    featureDescriptions: ['All features included — free forever'],
    limits: { cardsInPortfolio: Infinity, sageChatsPerMonth: null },
  },
  lifetime: {
    id: 'lifetime',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ALL_FEATURES,
    featureDescriptions: ['All features included — free forever'],
    limits: { cardsInPortfolio: Infinity, sageChatsPerMonth: null },
  },
  admin: {
    id: 'admin',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ALL_FEATURES,
    featureDescriptions: ['All features included — free forever'],
    limits: { cardsInPortfolio: Infinity, sageChatsPerMonth: null },
  },
};

export const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  free: ALL_FEATURES,
  pro: ALL_FEATURES,
  max: ALL_FEATURES,
  lifetime: ALL_FEATURES,
  admin: ALL_FEATURES,
};

export const CARD_LIMITS: Record<SubscriptionTier, number> = {
  free: Infinity,
  pro: Infinity,
  max: Infinity,
  lifetime: Infinity,
  admin: Infinity,
};

export const SAGE_LIMITS: Record<SubscriptionTier, number | null> = {
  free: null,
  pro: null,
  max: null,
  lifetime: null,
  admin: null,
};

// ============================================================================
// Free state singleton
// ============================================================================

const FREE_STATE: SubscriptionState = {
  tier: 'free',
  isAdmin: false,
  billingPeriod: null,
  expiresAt: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

const UNLIMITED_SAGE: SageUsage = {
  month: '',
  chatCount: 0,
  limit: null,
  remaining: null,
};

// ============================================================================
// Public API — all free, all unlocked
// ============================================================================

export function getCurrentTierSync(): SubscriptionTier {
  return 'free';
}

export async function getCurrentTier(): Promise<SubscriptionTier> {
  return 'free';
}

export function isAdminSync(): boolean {
  return false;
}

export async function isAdmin(): Promise<boolean> {
  return false;
}

export async function initializeSubscription(): Promise<void> {}

export async function refreshSubscription(): Promise<SubscriptionState> {
  return FREE_STATE;
}

export async function getSubscriptionState(): Promise<SubscriptionState> {
  return FREE_STATE;
}

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier] ?? SUBSCRIPTION_TIERS.free;
}

export function getAllTierConfigs(): TierConfig[] {
  return [SUBSCRIPTION_TIERS.free];
}

export async function canAccessFeature(_feature: Feature): Promise<boolean> {
  return true;
}

export function canAccessFeatureSync(_feature: Feature): boolean {
  return true;
}

export async function getCardLimit(): Promise<number> {
  return Infinity;
}

export function getCardLimitSync(): number {
  return Infinity;
}

export async function canAddCard(_currentCardCount: number): Promise<boolean> {
  return true;
}

export function canAddCardSync(_currentCardCount: number): boolean {
  return true;
}

export async function getSageUsage(): Promise<SageUsage> {
  return UNLIMITED_SAGE;
}

export async function canUseSage(): Promise<{
  allowed: boolean;
  remaining: number | null;
  reason?: string;
}> {
  return { allowed: true, remaining: null };
}

export async function incrementSageUsage(): Promise<SageUsage> {
  return UNLIMITED_SAGE;
}

export function getRequiredTierForFeature(_feature: Feature): SubscriptionTier {
  return 'free';
}

export function getFeatureUnlockTier(_feature: Feature): SubscriptionTier {
  return 'free';
}

export async function setTier(_tier: SubscriptionTier, _billingPeriod?: BillingPeriod): Promise<void> {}

export async function resetToFreeTier(): Promise<void> {}

export function getPriceDisplay(_tier: SubscriptionTier, _period: BillingPeriod): string {
  return 'Free';
}

export function getAnnualSavings(_tier: SubscriptionTier): number {
  return 0;
}

export async function createCheckoutSession(
  _tier: 'pro' | 'max' | 'lifetime',
  _interval: 'month' | 'year'
): Promise<{ error: string }> {
  return { error: 'Rewardly is free — no subscription required' };
}

export async function getLifetimeSpotsRemaining(): Promise<number | null> {
  return null;
}

export async function openCustomerPortal(): Promise<{ error: string }> {
  return { error: 'Rewardly is free — no subscription required' };
}

export function subscribeToSubscriptionChanges(
  _userId: string,
  _callback: (tier: SubscriptionTier) => void
): () => void {
  return () => {};
}

export function isAdminEmail(_email: string | null | undefined): boolean {
  return false;
}

export function getAdminEmails(): string[] {
  return [];
}
