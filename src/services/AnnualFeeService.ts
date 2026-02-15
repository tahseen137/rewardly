/**
 * AnnualFeeService - F6: Annual Fee Tracker
 * Analyzes card fees vs rewards earned to determine if cards are worth keeping
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';
import { Card, UserCard } from '../types';
import { getCardByIdSync, getAllCardsSync } from './CardDataService';
import { getCards } from './CardPortfolioManager';

// ============================================================================
// Types
// ============================================================================

export interface CardFeeAnalysis {
  cardId: string;
  annualFee: number;
  renewalDate: Date | null;
  daysUntilRenewal: number | null;
  estimatedRewardsEarned: number; // from spending log
  netValue: number; // rewards - fee
  worthKeeping: 'yes' | 'maybe' | 'no';
  worthReason: string;
}

export interface FeeSummary {
  totalAnnualFees: number;
  totalRewardsEarned: number;
  netValue: number;
  cardsWorthKeeping: number;
  cardsToReview: number;
  upcomingRenewals: CardFeeAnalysis[]; // next 30 days
}

// ============================================================================
// Constants
// ============================================================================

const CARD_DATES_KEY = 'annual_fee_card_dates';

// ============================================================================
// Initialization
// ============================================================================

let isInitialized = false;
let cardDatesCache: Record<string, { openDate?: Date; renewalMonth?: number }> = {};

export async function initializeAnnualFee(): Promise<void> {
  if (isInitialized) return;
  
  try {
    // Load card dates from AsyncStorage
    const stored = await AsyncStorage.getItem(CARD_DATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      Object.keys(parsed).forEach(cardId => {
        if (parsed[cardId].openDate) {
          parsed[cardId].openDate = new Date(parsed[cardId].openDate);
        }
      });
      cardDatesCache = parsed;
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize annual fee service:', error);
  }
}

// ============================================================================
// Card Date Management
// ============================================================================

export async function setCardOpenDate(cardId: string, openDate: Date): Promise<void> {
  await initializeAnnualFee();
  
  if (!cardDatesCache[cardId]) {
    cardDatesCache[cardId] = {};
  }
  cardDatesCache[cardId].openDate = openDate;
  
  // Calculate renewal month (same month as open date)
  cardDatesCache[cardId].renewalMonth = openDate.getMonth() + 1; // 1-based
  
  await AsyncStorage.setItem(CARD_DATES_KEY, JSON.stringify(cardDatesCache));
}

export function getCardOpenDate(cardId: string): Date | null {
  return cardDatesCache[cardId]?.openDate || null;
}

export function getCardRenewalDate(cardId: string): Date | null {
  const openDate = getCardOpenDate(cardId);
  if (!openDate) return null;
  
  const today = new Date();
  const renewalYear = today.getFullYear();
  const renewalMonth = openDate.getMonth();
  const renewalDay = openDate.getDate();
  
  let renewal = new Date(renewalYear, renewalMonth, renewalDay);
  
  // If renewal is in the past, add a year
  if (renewal < today) {
    renewal = new Date(renewalYear + 1, renewalMonth, renewalDay);
  }
  
  return renewal;
}

// ============================================================================
// Rewards Estimation
// ============================================================================

/**
 * Estimate annual rewards earned for a card
 * Uses spending log if available, otherwise uses heuristic
 */
async function estimateAnnualRewards(cardId: string): Promise<number> {
  try {
    if (!supabase) return 0;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return 0;
    
    // Try to get actual rewards from spending log
    const { data, error } = await (supabase
      .from('spending_log') as any)
      .select('rewards_earned')
      .eq('user_id', user.data.user.id)
      .eq('card_used', cardId)
      .gte('transaction_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      // Table may not exist yet — fall through to estimation
      console.warn('spending_log not available:', error.message);
    }
    
    if (data && data.length > 0) {
      return (data as any[]).reduce((sum, entry: any) => sum + (parseFloat(entry.rewards_earned) || 0), 0);
    }
    
    // Fallback: estimate based on card type
    const card = getCardByIdSync(cardId);
    if (!card) return 0;
    
    // Rough heuristic: $10,000 annual spend with average reward rate
    const avgRate = card.baseRewardRate.value / 100;
    return 10000 * avgRate;
    
  } catch (error) {
    console.error('Failed to estimate rewards:', error);
    return 0;
  }
}

// ============================================================================
// Worth Keeping Analysis
// ============================================================================

export function calculateWorthKeeping(
  fee: number, 
  rewardsEarned: number, 
  benefitsValue: number = 0
): 'yes' | 'maybe' | 'no' {
  const totalValue = rewardsEarned + benefitsValue;
  const netValue = totalValue - fee;
  
  if (netValue > fee * 0.5) return 'yes'; // Value exceeds fee by 50%+
  if (netValue > 0) return 'maybe'; // Positive but close
  return 'no'; // Losing money
}

function getWorthReason(worth: 'yes' | 'maybe' | 'no', netValue: number): string {
  if (worth === 'yes') return 'Rewards exceed fee';
  if (worth === 'maybe') return 'Close to break-even';
  return 'Fee exceeds rewards';
}

// ============================================================================
// Analysis Functions
// ============================================================================

export async function analyzeCardFees(): Promise<CardFeeAnalysis[]> {
  await initializeAnnualFee();
  
  const userCards = getCards();
  const analyses: CardFeeAnalysis[] = [];
  
  for (const userCard of userCards) {
    const card = getCardByIdSync(userCard.cardId);
    if (!card || !card.annualFee || card.annualFee === 0) continue;
    
    const renewalDate = getCardRenewalDate(card.id);
    const daysUntilRenewal = renewalDate 
      ? Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    
    const rewardsEarned = await estimateAnnualRewards(card.id);
    const netValue = rewardsEarned - card.annualFee;
    
    const worth = calculateWorthKeeping(card.annualFee, rewardsEarned);
    
    analyses.push({
      cardId: card.id,
      annualFee: card.annualFee,
      renewalDate,
      daysUntilRenewal,
      estimatedRewardsEarned: rewardsEarned,
      netValue,
      worthKeeping: worth,
      worthReason: getWorthReason(worth, netValue),
    });
  }
  
  return analyses;
}

export async function getFeeSummary(): Promise<FeeSummary> {
  const analyses = await analyzeCardFees();
  
  const totalFees = analyses.reduce((sum, a) => sum + a.annualFee, 0);
  const totalRewards = analyses.reduce((sum, a) => sum + a.estimatedRewardsEarned, 0);
  const netValue = totalRewards - totalFees;
  
  const worthKeeping = analyses.filter(a => a.worthKeeping === 'yes').length;
  const toReview = analyses.filter(a => a.worthKeeping !== 'yes').length;
  
  const upcomingRenewals = analyses
    .filter(a => a.daysUntilRenewal !== null && a.daysUntilRenewal <= 30)
    .sort((a, b) => (a.daysUntilRenewal || 0) - (b.daysUntilRenewal || 0));
  
  return {
    totalAnnualFees: totalFees,
    totalRewardsEarned: totalRewards,
    netValue,
    cardsWorthKeeping: worthKeeping,
    cardsToReview: toReview,
    upcomingRenewals,
  };
}

export function getUpcomingRenewals(days: number = 30): CardFeeAnalysis[] {
  // This would be called after analyzeCardFees
  // Implementation is in getFeeSummary
  return [];
}

// ============================================================================
// Notification Scheduling
// ============================================================================

export async function scheduleRenewalAlert(cardId: string, renewalDate: Date): Promise<void> {
  // This will be handled by NotificationService
  // We'll create the notification 30 days before renewal
  const daysUntil = Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil === 30) {
    // Trigger notification via NotificationService
    const card = getCardByIdSync(cardId);
    if (card) {
      // This would call NotificationService.generateFeeRenewalAlert
      console.log(`Scheduling renewal alert for ${card.name}`);
    }
  }
}
