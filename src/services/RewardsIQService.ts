/**
 * RewardsIQService - Core analytics for Rewards IQ Score & Missed Rewards
 * The brain behind the emotional impact features
 */

import { Card, SpendingCategory, RewardType } from '../types';
import {
  Transaction,
  MissedReward,
  MissedRewardsAnalysis,
  CategoryMissedRewards,
  RewardsIQScore,
  SpendingProfile,
  PortfolioOptimization,
  CardSetup,
  CategoryOptimization,
  ShareableStats,
} from '../types/rewards-iq';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getCards } from './CardPortfolioManager';
import { generateMockTransactions, getDefaultSpendingProfile, CATEGORY_INFO } from './MockTransactionData';
import { isAutoPilotEnabled } from './AutoPilotService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Constants
// ============================================================================

const REWARDS_IQ_KEY = 'rewards_iq_history';
const SPENDING_PROFILE_KEY = 'user_spending_profile';

// Weight factors for Rewards IQ calculation
const WEIGHTS = {
  OPTIMAL_CARD_USAGE: 0.6,
  PORTFOLIO_OPTIMIZATION: 0.25,
  AUTOPILOT: 0.15,
};

// ============================================================================
// Reward Calculation Helpers
// ============================================================================

/**
 * Get reward rate for a card in a specific category
 * Returns CAD per dollar spent
 */
function getRewardRate(card: Card, category: SpendingCategory): number {
  // Check for category-specific reward
  const categoryReward = card.categoryRewards.find(cr => cr.category === category);
  
  let multiplier: number;
  let rewardType: RewardType;
  
  if (categoryReward) {
    multiplier = categoryReward.rewardRate.value;
    rewardType = categoryReward.rewardRate.type;
  } else {
    multiplier = card.baseRewardRate.value;
    rewardType = card.baseRewardRate.type;
  }
  
  // Convert to CAD value
  if (rewardType === RewardType.CASHBACK) {
    // Cashback is already a percentage
    return multiplier / 100;
  } else {
    // Points/miles: use point valuation
    const pointValue = card.pointValuation || 1; // cents per point
    return (multiplier * pointValue) / 100; // Convert to dollars
  }
}

/**
 * Calculate reward in CAD for a transaction with a specific card
 */
function calculateRewardCad(amount: number, card: Card, category: SpendingCategory): number {
  const rate = getRewardRate(card, category);
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Find the best card for a category from available cards
 */
function findBestCard(category: SpendingCategory, cards: Card[]): Card | null {
  if (cards.length === 0) return null;
  
  let bestCard = cards[0];
  let bestRate = getRewardRate(cards[0], category);
  
  for (const card of cards) {
    const rate = getRewardRate(card, category);
    if (rate > bestRate) {
      bestRate = rate;
      bestCard = card;
    }
  }
  
  return bestCard;
}

// ============================================================================
// Missed Rewards Analysis
// ============================================================================

/**
 * Analyze missed rewards from transactions
 */
export async function analyzeMissedRewards(
  transactions?: Transaction[],
  portfolioCardIds?: string[]
): Promise<MissedRewardsAnalysis> {
  const allCards = getAllCardsSync();
  const portfolio = portfolioCardIds || getCards().map(c => c.cardId);
  const portfolioCards = portfolio.map(id => allCards.find(c => c.id === id)).filter((c): c is Card => c !== null);
  
  // Generate mock transactions if not provided
  const txns = transactions || generateMockTransactions(portfolio, 30, 25);
  
  const missedRewards: MissedReward[] = [];
  const categoryTotals = new Map<SpendingCategory, { spend: number; missed: number; count: number }>();
  
  let totalSpend = 0;
  let totalActualRewards = 0;
  let totalOptimalRewards = 0;
  
  for (const txn of txns) {
    const usedCard = allCards.find(c => c.id === txn.cardUsed);
    const optimalCard = findBestCard(txn.category, portfolioCards);
    
    if (!usedCard || !optimalCard) continue;
    
    const actualRewards = calculateRewardCad(txn.amount, usedCard, txn.category);
    const optimalRewards = calculateRewardCad(txn.amount, optimalCard, txn.category);
    const missed = Math.max(0, optimalRewards - actualRewards);
    
    totalSpend += txn.amount;
    totalActualRewards += actualRewards;
    totalOptimalRewards += optimalRewards;
    
    // Update transaction with actual rewards
    txn.rewardsEarned = actualRewards;
    
    // Track category totals
    const existing = categoryTotals.get(txn.category) || { spend: 0, missed: 0, count: 0 };
    categoryTotals.set(txn.category, {
      spend: existing.spend + txn.amount,
      missed: existing.missed + missed,
      count: existing.count + 1,
    });
    
    if (missed > 0) {
      missedRewards.push({
        transaction: txn,
        optimalCard,
        actualRewardsCad: actualRewards,
        optimalRewardsCad: optimalRewards,
        missedCad: missed,
        percentageLost: (missed / optimalRewards) * 100,
      });
    }
  }
  
  // Build category breakdown
  const byCategory: CategoryMissedRewards[] = [];
  for (const [category, data] of categoryTotals) {
    byCategory.push({
      category,
      totalSpend: Math.round(data.spend * 100) / 100,
      totalMissed: Math.round(data.missed * 100) / 100,
      transactionCount: data.count,
      averageMissedPerTransaction: data.count > 0 ? Math.round((data.missed / data.count) * 100) / 100 : 0,
    });
  }
  
  // Sort categories by missed amount
  byCategory.sort((a, b) => b.totalMissed - a.totalMissed);
  
  // Sort missed rewards by amount and take top 5
  missedRewards.sort((a, b) => b.missedCad - a.missedCad);
  const topMissed = missedRewards.slice(0, 5);
  
  const totalMissed = Math.round((totalOptimalRewards - totalActualRewards) * 100) / 100;
  const missedPercentage = totalOptimalRewards > 0 
    ? Math.round((totalMissed / totalOptimalRewards) * 10000) / 100 
    : 0;
  
  // Project to yearly (assuming 30 day data)
  const projectedYearlyMissed = Math.round(totalMissed * 12 * 100) / 100;
  
  return {
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(),
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalActualRewards: Math.round(totalActualRewards * 100) / 100,
    totalOptimalRewards: Math.round(totalOptimalRewards * 100) / 100,
    totalMissed,
    missedPercentage,
    byCategory,
    topMissedTransactions: topMissed,
    projectedYearlyMissed,
  };
}

// ============================================================================
// Rewards IQ Score
// ============================================================================

/**
 * Calculate the Rewards IQ Score
 */
export async function calculateRewardsIQ(): Promise<RewardsIQScore> {
  const allCards = getAllCardsSync();
  const portfolio = getCards();
  const portfolioCards = portfolio.map(c => allCards.find(card => card.id === c.cardId)).filter((c): c is Card => c !== null);
  
  // 1. Calculate optimal card usage score (based on missed rewards analysis)
  const analysis = await analyzeMissedRewards();
  const optimalUsagePercent = analysis.totalOptimalRewards > 0
    ? (analysis.totalActualRewards / analysis.totalOptimalRewards) * 100
    : 100;
  const optimalCardUsageScore = Math.min(100, Math.round(optimalUsagePercent));
  
  // 2. Calculate portfolio optimization score
  const spendingProfile = await getSpendingProfile();
  const portfolioScore = await calculatePortfolioScore(portfolioCards, spendingProfile);
  const portfolioOptimizationScore = Math.round(portfolioScore);
  
  // 3. AutoPilot score (simple: enabled = 100, disabled = 0)
  const autoPilotEnabled = await isAutoPilotEnabled();
  const autoPilotScore = autoPilotEnabled ? 100 : 0;
  
  // Calculate overall score with weights
  const overallScore = Math.round(
    optimalCardUsageScore * WEIGHTS.OPTIMAL_CARD_USAGE +
    portfolioOptimizationScore * WEIGHTS.PORTFOLIO_OPTIMIZATION +
    autoPilotScore * WEIGHTS.AUTOPILOT
  );
  
  // Calculate percentile (mock - would be from backend in production)
  const percentile = calculatePercentile(overallScore);
  
  // Get previous score for trend
  const previousScore = await getPreviousScore();
  const trend = previousScore === null 
    ? 'stable' 
    : overallScore > previousScore 
      ? 'up' 
      : overallScore < previousScore 
        ? 'down' 
        : 'stable';
  const trendAmount = previousScore !== null ? overallScore - previousScore : 0;
  
  // Save current score for future trend calculation
  await saveCurrentScore(overallScore);
  
  return {
    overallScore,
    optimalCardUsageScore,
    portfolioOptimizationScore,
    autoPilotScore,
    percentile,
    previousScore: previousScore ?? undefined,
    trend,
    trendAmount,
  };
}

/**
 * Calculate portfolio optimization score
 * Compares current portfolio to optimal setup
 */
async function calculatePortfolioScore(
  currentCards: Card[],
  spending: Map<SpendingCategory, number>
): Promise<number> {
  const allCards = getAllCardsSync();
  
  if (currentCards.length === 0) return 0;
  
  let currentTotal = 0;
  let optimalTotal = 0;
  
  for (const [category, amount] of spending) {
    const currentBest = findBestCard(category, currentCards);
    const overallBest = findBestCard(category, allCards);
    
    if (currentBest) {
      currentTotal += calculateRewardCad(amount * 12, currentBest, category);
    }
    if (overallBest) {
      optimalTotal += calculateRewardCad(amount * 12, overallBest, category);
    }
  }
  
  return optimalTotal > 0 ? (currentTotal / optimalTotal) * 100 : 100;
}

/**
 * Calculate percentile ranking (mock implementation)
 */
function calculatePercentile(score: number): number {
  // Bell curve approximation
  // Score 50 = 50th percentile
  // Score 75 = 80th percentile
  // Score 90+ = 95th+ percentile
  if (score >= 90) return 95 + Math.floor((score - 90) / 2);
  if (score >= 75) return 75 + Math.floor((score - 75) / 3);
  if (score >= 50) return 50 + Math.floor((score - 50) / 1.25);
  return Math.max(5, Math.floor(score));
}

// ============================================================================
// Portfolio Optimizer
// ============================================================================

/**
 * Generate portfolio optimization recommendations
 */
export async function getPortfolioOptimization(): Promise<PortfolioOptimization> {
  const allCards = getAllCardsSync();
  const portfolio = getCards();
  const currentCards = portfolio.map(c => allCards.find(card => card.id === c.cardId)).filter((c): c is Card => c !== null);
  const spending = await getSpendingProfile();
  
  // Calculate current setup rewards
  const currentSetup = calculateSetupRewards(currentCards, spending);
  
  // Find optimal card set (max 3 cards for simplicity)
  const optimalCards = findOptimalCardSet(allCards, spending, 3);
  const recommendedSetup = calculateSetupRewards(optimalCards, spending);
  
  // Determine cards to add/remove
  const currentIds = new Set(currentCards.map(c => c.id));
  const recommendedIds = new Set(optimalCards.map(c => c.id));
  
  const cardsToAdd = optimalCards.filter(c => !currentIds.has(c.id));
  const cardsToRemove = currentCards.filter(c => !recommendedIds.has(c.id));
  
  // Build detailed breakdown
  const breakdown: CategoryOptimization[] = [];
  for (const [category, monthlySpend] of spending) {
    const currentBest = findBestCard(category, currentCards);
    const recommendedBest = findBestCard(category, optimalCards);
    
    const currentMonthly = currentBest ? calculateRewardCad(monthlySpend, currentBest, category) : 0;
    const recommendedMonthly = recommendedBest ? calculateRewardCad(monthlySpend, recommendedBest, category) : 0;
    
    breakdown.push({
      category,
      monthlySpend,
      currentCard: currentBest,
      currentMonthlyRewards: Math.round(currentMonthly * 100) / 100,
      recommendedCard: recommendedBest || allCards[0],
      recommendedMonthlyRewards: Math.round(recommendedMonthly * 100) / 100,
      monthlyGain: Math.round((recommendedMonthly - currentMonthly) * 100) / 100,
      annualGain: Math.round((recommendedMonthly - currentMonthly) * 12 * 100) / 100,
    });
  }
  
  // Sort by annual gain
  breakdown.sort((a, b) => b.annualGain - a.annualGain);
  
  const annualGain = Math.round((recommendedSetup.annualRewards - currentSetup.annualRewards) * 100) / 100;
  const gainPercentage = currentSetup.annualRewards > 0
    ? Math.round((annualGain / currentSetup.annualRewards) * 10000) / 100
    : 0;
  
  return {
    currentSetup,
    recommendedSetup,
    annualGain,
    gainPercentage,
    cardsToAdd,
    cardsToRemove,
    breakdown,
  };
}

/**
 * Calculate total annual rewards for a card setup
 */
function calculateSetupRewards(
  cards: Card[],
  spending: Map<SpendingCategory, number>
): CardSetup {
  const byCategory = new Map<SpendingCategory, { card: Card; rewards: number }>();
  let totalAnnual = 0;
  
  for (const [category, monthlySpend] of spending) {
    const bestCard = findBestCard(category, cards);
    if (bestCard) {
      const annualRewards = calculateRewardCad(monthlySpend * 12, bestCard, category);
      byCategory.set(category, { card: bestCard, rewards: Math.round(annualRewards * 100) / 100 });
      totalAnnual += annualRewards;
    }
  }
  
  return {
    cards,
    annualRewards: Math.round(totalAnnual * 100) / 100,
    byCategory,
  };
}

/**
 * Find optimal card combination using greedy algorithm
 */
function findOptimalCardSet(
  allCards: Card[],
  spending: Map<SpendingCategory, number>,
  maxCards: number
): Card[] {
  const categories = Array.from(spending.keys());
  
  // Score each card by total value across all categories
  const cardScores: { card: Card; score: number }[] = allCards.map(card => {
    let score = 0;
    for (const [category, monthlySpend] of spending) {
      score += calculateRewardCad(monthlySpend * 12, card, category);
    }
    // Penalize annual fee slightly
    score -= (card.annualFee || 0) * 0.5;
    return { card, score };
  });
  
  // Sort by score and take top cards
  cardScores.sort((a, b) => b.score - a.score);
  
  // Use greedy selection: pick cards that maximize coverage
  const selected: Card[] = [];
  const coveredCategories = new Set<SpendingCategory>();
  
  for (const { card } of cardScores) {
    if (selected.length >= maxCards) break;
    
    // Check if this card adds value
    let addsValue = false;
    for (const category of categories) {
      if (!coveredCategories.has(category)) {
        const rate = getRewardRate(card, category);
        if (rate >= 0.02) { // At least 2% return
          addsValue = true;
          break;
        }
      }
    }
    
    if (addsValue || selected.length === 0) {
      selected.push(card);
      // Mark categories where this card is competitive
      for (const category of categories) {
        const rate = getRewardRate(card, category);
        if (rate >= 0.03) {
          coveredCategories.add(category);
        }
      }
    }
  }
  
  return selected;
}

// ============================================================================
// Spending Profile Management
// ============================================================================

/**
 * Get user's spending profile (from storage or default)
 */
export async function getSpendingProfile(): Promise<Map<SpendingCategory, number>> {
  try {
    const saved = await AsyncStorage.getItem(SPENDING_PROFILE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const profile = new Map<SpendingCategory, number>();
      for (const [key, value] of Object.entries(data)) {
        profile.set(key as SpendingCategory, value as number);
      }
      return profile;
    }
  } catch (e) {
    console.warn('Failed to load spending profile:', e);
  }
  return getDefaultSpendingProfile();
}

/**
 * Save user's spending profile
 */
export async function saveSpendingProfile(profile: Map<SpendingCategory, number>): Promise<void> {
  const data: Record<string, number> = {};
  for (const [key, value] of profile) {
    data[key] = value;
  }
  await AsyncStorage.setItem(SPENDING_PROFILE_KEY, JSON.stringify(data));
}

// ============================================================================
// Score History
// ============================================================================

async function getPreviousScore(): Promise<number | null> {
  try {
    const saved = await AsyncStorage.getItem(REWARDS_IQ_KEY);
    if (saved) {
      const history = JSON.parse(saved);
      if (history.length > 0) {
        return history[history.length - 1].score;
      }
    }
  } catch (e) {
    console.warn('Failed to get previous score:', e);
  }
  return null;
}

async function saveCurrentScore(score: number): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(REWARDS_IQ_KEY);
    const history = saved ? JSON.parse(saved) : [];
    history.push({ score, timestamp: Date.now() });
    // Keep last 30 entries
    while (history.length > 30) history.shift();
    await AsyncStorage.setItem(REWARDS_IQ_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save score:', e);
  }
}

// ============================================================================
// Social Sharing
// ============================================================================

/**
 * Generate shareable stats
 */
export async function getShareableStats(): Promise<ShareableStats> {
  const score = await calculateRewardsIQ();
  const optimization = await getPortfolioOptimization();
  const spending = await getSpendingProfile();
  
  // Find top spending category
  let topCategory = SpendingCategory.OTHER;
  let maxSpend = 0;
  for (const [category, amount] of spending) {
    if (amount > maxSpend) {
      maxSpend = amount;
      topCategory = category;
    }
  }
  
  const shareText = `My Rewards IQ is ${score.overallScore}! 🎯\n` +
    `I'm in the top ${100 - score.percentile}% of users.\n` +
    `I'm optimizing $${optimization.recommendedSetup.annualRewards.toLocaleString()}/year in rewards.\n\n` +
    `Get your Rewards IQ →`;
  
  return {
    rewardsIQ: score.overallScore,
    percentile: score.percentile,
    annualOptimization: optimization.recommendedSetup.annualRewards,
    topCategory,
    shareText,
    shareUrl: 'https://rewardly.app', // TODO: Deep link
  };
}
