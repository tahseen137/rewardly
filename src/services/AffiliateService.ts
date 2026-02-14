/**
 * AffiliateService - Manages affiliate/application URLs and click tracking
 * 
 * Provides issuer-level application URL mapping, UTM parameter generation,
 * and Supabase-backed click analytics for monetization.
 */

import { Linking } from 'react-native';
import { Card } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// ============================================================================
// Issuer Application URL Mapping
// ============================================================================

/**
 * Default application page URLs for major Canadian card issuers.
 * Used as fallback when a card doesn't have a specific applicationUrl.
 */
export const ISSUER_APPLICATION_URLS: Record<string, string> = {
  'TD': 'https://www.td.com/ca/en/personal-banking/products/credit-cards/',
  'RBC': 'https://www.rbcroyalbank.com/credit-cards/',
  'Scotiabank': 'https://www.scotiabank.com/ca/en/personal/credit-cards/',
  'CIBC': 'https://www.cibc.com/en/personal-banking/credit-cards.html',
  'American Express': 'https://www.americanexpress.com/ca/credit-cards/',
  'Amex': 'https://www.americanexpress.com/ca/credit-cards/',
  'BMO': 'https://www.bmo.com/main/personal/credit-cards/',
  'Capital One': 'https://www.capitalone.ca/credit-cards/',
  'MBNA': 'https://www.mbna.ca/credit-cards/',
  'National Bank': 'https://www.nbc.ca/personal/credit-cards.html',
  'Desjardins': 'https://www.desjardins.com/ca/personal/loans-credit/credit-cards/',
  'HSBC': 'https://www.hsbc.ca/credit-cards/',
  'Tangerine': 'https://www.tangerine.ca/en/products/spending/creditcard',
  'PC Financial': 'https://www.pcfinancial.ca/en/credit-cards/',
  'Simplii': 'https://www.simplii.com/en/credit-cards.html',
  'Neo Financial': 'https://www.neofinancial.com/credit',
  'Rogers': 'https://www.rogers.com/plans/credit-cards',
  'Triangle': 'https://www.triangle.com/credit-cards/',
  'Brim': 'https://bfrfinancial.com/credit-cards/',
};

// ============================================================================
// UTM Parameter Generation
// ============================================================================

/**
 * UTM parameters for tracking affiliate conversions.
 */
export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

/**
 * Generate UTM parameters for a card application link.
 */
export function generateUTMParams(cardId: string): UTMParams {
  return {
    utm_source: 'rewardly',
    utm_medium: 'app',
    utm_campaign: 'card_apply',
    utm_content: cardId,
  };
}

/**
 * Append UTM parameters to a URL.
 */
export function appendUTMParams(baseUrl: string, cardId: string): string {
  const params = generateUTMParams(cardId);
  const separator = baseUrl.includes('?') ? '&' : '?';
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${baseUrl}${separator}${queryString}`;
}

// ============================================================================
// URL Resolution
// ============================================================================

/**
 * Get the application URL for a card, resolving in priority order:
 * 1. Card-specific affiliateUrl (if we have an affiliate partnership)
 * 2. Card-specific applicationUrl (direct bank link for this specific card)
 * 3. Issuer-level application page (generic issuer URL)
 * 4. Google search fallback
 * 
 * All URLs are tagged with UTM parameters.
 */
export function getApplicationUrl(card: Card): string {
  // Priority 1: Affiliate URL (if we have a partnership deal)
  const affiliateUrl = (card as any).affiliateUrl;
  if (affiliateUrl) {
    return appendUTMParams(affiliateUrl, card.id);
  }

  // Priority 2: Card-specific application URL
  const applicationUrl = (card as any).applicationUrl;
  if (applicationUrl) {
    return appendUTMParams(applicationUrl, card.id);
  }

  // Priority 3: Issuer-level URL
  const issuerUrl = getIssuerApplicationUrl(card.issuer);
  if (issuerUrl) {
    return appendUTMParams(issuerUrl, card.id);
  }

  // Priority 4: Google search fallback
  return `https://www.google.com/search?q=${encodeURIComponent(card.name + ' apply')}`;
}

/**
 * Look up the issuer's application page URL.
 * Performs case-insensitive matching and handles common aliases.
 */
export function getIssuerApplicationUrl(issuer: string): string | null {
  // Direct match
  if (ISSUER_APPLICATION_URLS[issuer]) {
    return ISSUER_APPLICATION_URLS[issuer];
  }

  // Case-insensitive match
  const issuerLower = issuer.toLowerCase();
  for (const [key, url] of Object.entries(ISSUER_APPLICATION_URLS)) {
    if (key.toLowerCase() === issuerLower) {
      return url;
    }
  }

  // Partial match (e.g., "TD Canada Trust" matches "TD")
  for (const [key, url] of Object.entries(ISSUER_APPLICATION_URLS)) {
    if (issuerLower.includes(key.toLowerCase()) || key.toLowerCase().includes(issuerLower)) {
      return url;
    }
  }

  return null;
}

// ============================================================================
// Click Tracking
// ============================================================================

/**
 * Affiliate click record for analytics.
 */
export interface AffiliateClick {
  id?: string;
  card_id: string;
  card_name: string;
  issuer: string;
  user_id: string | null;
  url_opened: string;
  source_screen: string;
  user_tier: string;
  created_at?: string;
}

/**
 * Track an affiliate click in Supabase.
 * Fires and forgets—doesn't block the user experience.
 */
export async function trackAffiliateClick(
  card: Card,
  sourceScreen: string,
  userTier: string,
): Promise<void> {
  try {
    if (!isSupabaseConfigured() || !supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const click: AffiliateClick = {
      card_id: card.id,
      card_name: card.name,
      issuer: card.issuer,
      user_id: user?.id || null,
      url_opened: getApplicationUrl(card),
      source_screen: sourceScreen,
      user_tier: userTier,
    };

    await (supabase.from('affiliate_clicks') as any).insert(click);
  } catch (error) {
    // Silently fail — never block the user
    console.warn('Failed to track affiliate click:', error);
  }
}

// ============================================================================
// Apply Now Action
// ============================================================================

/**
 * Open the card application URL in the device browser and track the click.
 * This is the primary action for all "Apply Now" buttons throughout the app.
 */
export async function handleApplyNow(
  card: Card,
  sourceScreen: string,
  userTier: string = 'free',
): Promise<void> {
  const url = getApplicationUrl(card);

  // Track the click (fire and forget)
  trackAffiliateClick(card, sourceScreen, userTier);

  // Open in external browser
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback: try opening anyway
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error('Failed to open application URL:', error);
  }
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get click analytics for admin/settings display.
 */
export interface ClickAnalytics {
  totalClicks: number;
  clicksByCard: { cardId: string; cardName: string; clicks: number }[];
  clicksByTier: { tier: string; clicks: number }[];
  recentClicks: AffiliateClick[];
}

/**
 * Get affiliate click analytics for the current user.
 */
export async function getMyClickAnalytics(): Promise<ClickAnalytics | null> {
  try {
    if (!isSupabaseConfigured() || !supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: clicks, error } = await (supabase
      .from('affiliate_clicks') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !clicks) return null;

    const typedClicks = clicks as AffiliateClick[];

    // Aggregate by card
    const cardMap = new Map<string, { cardId: string; cardName: string; clicks: number }>();
    const tierMap = new Map<string, number>();

    for (const click of typedClicks) {
      // By card
      const existing = cardMap.get(click.card_id);
      if (existing) {
        existing.clicks++;
      } else {
        cardMap.set(click.card_id, {
          cardId: click.card_id,
          cardName: click.card_name,
          clicks: 1,
        });
      }

      // By tier
      tierMap.set(click.user_tier, (tierMap.get(click.user_tier) || 0) + 1);
    }

    return {
      totalClicks: typedClicks.length,
      clicksByCard: Array.from(cardMap.values()).sort((a, b) => b.clicks - a.clicks),
      clicksByTier: Array.from(tierMap.entries()).map(([tier, clicks]) => ({ tier, clicks })),
      recentClicks: typedClicks.slice(0, 10),
    };
  } catch (error) {
    console.error('Failed to get click analytics:', error);
    return null;
  }
}
