/**
 * ReferralService — Phase 1 (MVP)
 *
 * Handles:
 *  - Referral code generation & retrieval
 *  - URL parameter tracking (persist across sign-up flow)
 *  - Associating a referral with a new user on sign-up
 *  - Fetching referral stats for the dashboard
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const PENDING_REFERRAL_KEY = 'pending_referral_code';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/I/1 confusion
const CODE_LENGTH = 6;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  usage_count: number;
  max_uses: number | null;
}

export interface ReferralSignup {
  id: string;
  referral_code_id: string;
  referrer_user_id: string;
  referee_user_id: string;
  referrer_reward: string | null;
  referee_reward: string | null;
  signed_up_at: string;
  reward_claimed_at: string | null;
  status: 'pending' | 'claimed' | 'expired';
}

export interface ReferralStats {
  totalSignups: number;
  pendingSignups: number;
  claimedSignups: number;
  referralCode: string | null;
  referralLink: string | null;
}

// ─── Reward Tiers ────────────────────────────────────────────────────────────

const REFERRER_REWARDS: { threshold: number; reward: string }[] = [
  { threshold: 25, reward: 'Lifetime Pro' },
  { threshold: 10, reward: '3 months Pro' },
  { threshold: 5, reward: '1 month Pro' },
  { threshold: 1, reward: 'Advocate badge' },
];

const REFEREE_REWARD = 'Welcome bonus';
const REFERRAL_BASE_URL = 'https://rewardly.ca';

// ─── Code Generation ─────────────────────────────────────────────────────────

/**
 * Generates a random 6-character code from a safe alphabet.
 * Uses crypto.getRandomValues when available, falls back to Math.random.
 */
function generateRandomSuffix(): string {
  const result: string[] = [];

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(CODE_LENGTH);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < CODE_LENGTH; i++) {
      result.push(ALPHABET[bytes[i] % ALPHABET.length]);
    }
  } else {
    for (let i = 0; i < CODE_LENGTH; i++) {
      result.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
    }
  }

  return result.join('');
}

function buildCode(): string {
  return `REWARD-${generateRandomSuffix()}`;
}

// ─── Core Service ────────────────────────────────────────────────────────────

export class ReferralService {
  /**
   * Fetch the user's existing referral code, or create one if none exists.
   * Retries on unique-key collision (rare but possible).
   */
  static async getOrCreateReferralCode(userId: string): Promise<ReferralCode | null> {
    if (!supabase) {
      console.warn('[ReferralService] Supabase not configured');
      return null;
    }

    // 1. Check if the user already has a code
    const { data: existing, error: fetchError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError) {
      console.error('[ReferralService] Error fetching referral code:', fetchError);
      return null;
    }

    if (existing) return existing as ReferralCode;

    // 2. Create a new code (retry on collision up to 3 times)
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = buildCode();

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({ user_id: userId, code })
        .select()
        .single();

      if (!error) return data as ReferralCode;

      if (error.code !== '23505') {
        // Not a unique violation — bail out
        console.error('[ReferralService] Error creating referral code:', error);
        return null;
      }
      // Unique violation → retry with a different suffix
    }

    console.error('[ReferralService] Failed to generate a unique referral code after 3 attempts');
    return null;
  }

  /**
   * Returns the full shareable referral link for a given code string.
   */
  static buildReferralLink(code: string): string {
    return `${REFERRAL_BASE_URL}/?ref=${code}`;
  }

  /**
   * Looks up an active referral code by its code string.
   * Used when validating an incoming ?ref= param.
   */
  static async lookupCode(code: string): Promise<ReferralCode | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    return data as ReferralCode;
  }

  // ─── URL Tracking ──────────────────────────────────────────────────────────

  /**
   * Call on app load. Reads ?ref= from the URL (web) or Linking URL (native).
   * Persists the code in AsyncStorage so it survives the sign-up flow.
   * Also fires an analytics click event.
   */
  static async trackReferralFromUrl(rawUrl?: string): Promise<void> {
    try {
      const url = rawUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
      if (!url) return;

      const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const refCode = params.get('ref');
      if (!refCode) return;

      // Persist for later (survives sign-up redirect)
      await AsyncStorage.setItem(PENDING_REFERRAL_KEY, refCode);

      // Fire analytics click
      await ReferralService.recordClick(refCode);
    } catch (err) {
      console.warn('[ReferralService] trackReferralFromUrl error:', err);
    }
  }

  /**
   * Record an analytics click for a referral code.
   */
  static async recordClick(code: string): Promise<void> {
    if (!supabase) return;

    try {
      const refData = await ReferralService.lookupCode(code);
      if (!refData) return;

      await supabase.from('referral_clicks').insert({
        referral_code_id: refData.id,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        converted: false,
      });
    } catch (err) {
      console.warn('[ReferralService] recordClick error:', err);
    }
  }

  // ─── Signup Association ────────────────────────────────────────────────────

  /**
   * Call immediately after a new user signs up.
   * Reads the pending referral from storage and creates a referral_signup record.
   */
  static async completeReferralSignup(newUserId: string): Promise<void> {
    if (!supabase) return;

    try {
      const code = await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
      if (!code) return;

      // Look up the referral code
      const refData = await ReferralService.lookupCode(code);
      if (!refData) {
        await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);
        return;
      }

      // Prevent self-referral
      if (refData.user_id === newUserId) {
        console.warn('[ReferralService] Self-referral detected — ignoring');
        await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);
        return;
      }

      // Determine rewards based on current usage
      const nextCount = (refData.usage_count ?? 0) + 1;
      const referrerReward =
        REFERRER_REWARDS.find((t) => nextCount >= t.threshold)?.reward ?? 'Advocate badge';

      // Insert signup record
      const { error } = await supabase.from('referral_signups').insert({
        referral_code_id: refData.id,
        referrer_user_id: refData.user_id,
        referee_user_id: newUserId,
        referrer_reward: referrerReward,
        referee_reward: REFEREE_REWARD,
        status: 'claimed',
        reward_claimed_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[ReferralService] Error inserting referral signup:', error);
        return;
      }

      // Atomically increment usage count (deactivates code if max_uses reached)
      await supabase.rpc('increment_referral_usage', { code_id: refData.id });

      // Mark click as converted
      if (supabase) {
        await supabase
          .from('referral_clicks')
          .update({ converted: true })
          .eq('referral_code_id', refData.id)
          .eq('converted', false)
          .order('clicked_at', { ascending: false })
          .limit(1);
      }

      // Clean up
      await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);

      console.log(`[ReferralService] Referral completed. Referrer gets: ${referrerReward}`);
    } catch (err) {
      console.error('[ReferralService] completeReferralSignup error:', err);
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  /**
   * Fetch referral stats for the current user (for dashboard display).
   */
  static async getReferralStats(userId: string): Promise<ReferralStats> {
    const empty: ReferralStats = {
      totalSignups: 0,
      pendingSignups: 0,
      claimedSignups: 0,
      referralCode: null,
      referralLink: null,
    };

    if (!supabase) return empty;

    try {
      // Get the user's referral code
      const refCode = await ReferralService.getOrCreateReferralCode(userId);
      if (!refCode) return empty;

      // Get signups
      const { data: signups, error } = await supabase
        .from('referral_signups')
        .select('status')
        .eq('referrer_user_id', userId);

      if (error) {
        console.error('[ReferralService] Error fetching referral stats:', error);
        return {
          ...empty,
          referralCode: refCode.code,
          referralLink: ReferralService.buildReferralLink(refCode.code),
        };
      }

      const list = signups ?? [];
      return {
        totalSignups: list.length,
        pendingSignups: list.filter((s) => s.status === 'pending').length,
        claimedSignups: list.filter((s) => s.status === 'claimed').length,
        referralCode: refCode.code,
        referralLink: ReferralService.buildReferralLink(refCode.code),
      };
    } catch (err) {
      console.error('[ReferralService] getReferralStats error:', err);
      return empty;
    }
  }

  /**
   * Check if the current user signed up via a referral.
   * Returns the referral signup record if found.
   */
  static async getMyReferralSignup(userId: string): Promise<ReferralSignup | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('referral_signups')
      .select('*')
      .eq('referee_user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as ReferralSignup;
  }
}

export default ReferralService;
