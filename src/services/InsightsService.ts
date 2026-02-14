/**
 * InsightsService - F25: Spending Insights Dashboard
 * 
 * Features:
 * - Category breakdown with optimization analysis
 * - Optimization score (0-100)
 * - Spending trends (month-over-month)
 * - Smart alerts
 * - All pure functions
 */

import {
  ParsedTransaction,
  SpendingCategory,
  CategoryBreakdown,
  MerchantSummary,
  OptimizationScore,
  SpendingTrend,
  SmartAlert,
  SmartAlertType,
  SpendingInsights,
  MonthlySummary,
  DateRange,
  Card,
  InsightsError,
  Result,
  success,
  failure,
} from '../types';
import { getApplicableMultiplier, pointsToCad } from './RewardsCalculatorService';

// ============================================================================
// Constants
// ============================================================================

const MIN_TRANSACTIONS_FOR_INSIGHTS = 10;
const TREND_THRESHOLD_PERCENT = 20; // 20% change triggers trend alert
const OPTIMIZATION_THRESHOLDS = {
  MASTER: 90,
  GOOD: 70,
  AVERAGE: 50,
};

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate category breakdown from transactions
 */
export function calculateCategoryBreakdown(
  transactions: ParsedTransaction[],
  userCards: Card[]
): CategoryBreakdown[] {
  // Filter to purchases only (no credits)
  const purchases = transactions.filter(t => !t.isCredit);
  const totalSpend = purchases.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const byCategory = new Map<SpendingCategory, ParsedTransaction[]>();
  
  for (const tx of purchases) {
    const existing = byCategory.get(tx.category) || [];
    existing.push(tx);
    byCategory.set(tx.category, existing);
  }
  
  // Calculate breakdown for each category
  const breakdown: CategoryBreakdown[] = [];
  
  for (const [category, txs] of byCategory) {
    const categorySpend = txs.reduce((sum, t) => sum + t.amount, 0);
    
    // Find top merchants
    const merchantTotals = new Map<string, { amount: number; count: number }>();
    for (const tx of txs) {
      const existing = merchantTotals.get(tx.normalizedMerchant) || { amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count++;
      merchantTotals.set(tx.normalizedMerchant, existing);
    }
    
    const topMerchants: MerchantSummary[] = Array.from(merchantTotals.entries())
      .map(([name, { amount, count }]) => ({ name, amount, count, category }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Find optimal card for this category
    const optimalCard = findOptimalCardForCategory(category, userCards);
    
    // Estimate rewards (we don't know which card was actually used)
    const { rewardsEarned, rewardsPossible } = estimateCategoryRewards(
      categorySpend,
      category,
      userCards,
      optimalCard
    );
    
    breakdown.push({
      category,
      totalSpend: categorySpend,
      transactionCount: txs.length,
      percentOfTotal: totalSpend > 0 ? (categorySpend / totalSpend) * 100 : 0,
      topMerchants,
      currentCard: null, // Unknown from CSV
      optimalCard,
      rewardsEarned,
      rewardsPossible,
      rewardsGap: rewardsPossible - rewardsEarned,
    });
  }
  
  // Sort by spend (highest first)
  return breakdown.sort((a, b) => b.totalSpend - a.totalSpend);
}

/**
 * Find the optimal card for a category from user's portfolio
 */
export function findOptimalCardForCategory(
  category: SpendingCategory,
  userCards: Card[]
): Card | null {
  if (userCards.length === 0) return null;
  
  let bestCard: Card | null = null;
  let bestRewardRate = 0;
  
  for (const card of userCards) {
    const rate = getApplicableMultiplier(card, category);
    if (rate > bestRewardRate) {
      bestRewardRate = rate;
      bestCard = card;
    }
  }
  
  return bestCard;
}

/**
 * Estimate rewards earned and possible for a category
 * Since we don't know which card was used, we estimate conservatively
 */
export function estimateCategoryRewards(
  categorySpend: number,
  category: SpendingCategory,
  userCards: Card[],
  optimalCard: Card | null
): { rewardsEarned: number; rewardsPossible: number } {
  if (userCards.length === 0) {
    return { rewardsEarned: 0, rewardsPossible: 0 };
  }
  
  // Calculate possible with optimal card
  let rewardsPossible = 0;
  if (optimalCard) {
    const optimalRate = getApplicableMultiplier(optimalCard, category);
    const points = categorySpend * optimalRate;
    const valuation = optimalCard.programDetails?.optimalRateCents ?? optimalCard.pointValuation ?? 100;
    rewardsPossible = pointsToCad(points, optimalCard, valuation);
  }
  
  // For earned, assume they used average card (conservative estimate)
  // This is a simplification since we don't know actual card used
  const avgRate = userCards.reduce((sum, card) => {
    return sum + getApplicableMultiplier(card, category);
  }, 0) / userCards.length;
  
  // Use first card's valuation as approximation
  const firstCard = userCards[0];
  const avgPoints = categorySpend * avgRate;
  const avgValuation = firstCard.programDetails?.optimalRateCents ?? firstCard.pointValuation ?? 100;
  const rewardsEarned = pointsToCad(avgPoints, firstCard, avgValuation);
  
  return { rewardsEarned, rewardsPossible };
}

/**
 * Calculate optimization score (0-100)
 */
export function calculateOptimizationScore(
  breakdown: CategoryBreakdown[]
): OptimizationScore {
  const totalEarned = breakdown.reduce((sum, b) => sum + b.rewardsEarned, 0);
  const totalPossible = breakdown.reduce((sum, b) => sum + b.rewardsPossible, 0);
  
  // If no possible rewards (no cards), return 0
  if (totalPossible === 0) {
    return {
      score: 0,
      label: 'Add Cards to Start',
      emoji: '📝',
      actualRewards: 0,
      maxPossibleRewards: 0,
      rewardsGap: 0,
      improvementPotential: 'Add your credit cards to see optimization opportunities',
    };
  }
  
  const score = Math.round((totalEarned / totalPossible) * 100);
  const gap = totalPossible - totalEarned;
  
  let label: string;
  let emoji: string;
  let improvementPotential: string;
  
  if (score >= OPTIMIZATION_THRESHOLDS.MASTER) {
    label = 'Rewards Master';
    emoji = '🏆';
    improvementPotential = `You're maximizing your rewards! Keep up the great work.`;
  } else if (score >= OPTIMIZATION_THRESHOLDS.GOOD) {
    label = 'Good Optimizer';
    emoji = '👍';
    improvementPotential = `Small improvements could earn you $${gap.toFixed(0)} more per year.`;
  } else if (score >= OPTIMIZATION_THRESHOLDS.AVERAGE) {
    label = 'Average User';
    emoji = '📊';
    improvementPotential = `You're leaving $${gap.toFixed(0)} on the table annually. Let's fix that!`;
  } else {
    label = 'Needs Help';
    emoji = '🎯';
    improvementPotential = `Big opportunity: Switch cards to earn $${gap.toFixed(0)} more per year!`;
  }
  
  return {
    score,
    label,
    emoji,
    actualRewards: totalEarned,
    maxPossibleRewards: totalPossible,
    rewardsGap: gap,
    improvementPotential,
  };
}

/**
 * Group transactions by month
 */
export function groupByMonth(
  transactions: ParsedTransaction[]
): MonthlySummary[] {
  const byMonth = new Map<string, MonthlySummary>();
  
  for (const tx of transactions) {
    if (tx.isCredit) continue;
    
    const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
    const monthDate = new Date(tx.date.getFullYear(), tx.date.getMonth(), 1);
    
    let summary = byMonth.get(monthKey);
    if (!summary) {
      summary = {
        month: monthDate,
        totalSpend: 0,
        byCategory: {
          [SpendingCategory.GROCERIES]: 0,
          [SpendingCategory.DINING]: 0,
          [SpendingCategory.GAS]: 0,
          [SpendingCategory.TRAVEL]: 0,
          [SpendingCategory.ONLINE_SHOPPING]: 0,
          [SpendingCategory.ENTERTAINMENT]: 0,
          [SpendingCategory.DRUGSTORES]: 0,
          [SpendingCategory.HOME_IMPROVEMENT]: 0,
          [SpendingCategory.OTHER]: 0,
        },
        transactionCount: 0,
      };
      byMonth.set(monthKey, summary);
    }
    
    summary.totalSpend += tx.amount;
    summary.byCategory[tx.category] += tx.amount;
    summary.transactionCount++;
  }
  
  return Array.from(byMonth.values()).sort(
    (a, b) => a.month.getTime() - b.month.getTime()
  );
}

/**
 * Calculate spending trends (month-over-month)
 */
export function calculateSpendingTrends(
  currentMonth: MonthlySummary,
  previousMonth: MonthlySummary | null
): SpendingTrend[] {
  const trends: SpendingTrend[] = [];
  
  for (const category of Object.values(SpendingCategory)) {
    const currentSpend = currentMonth.byCategory[category];
    const previousSpend = previousMonth?.byCategory[category] || 0;
    
    const changeAmount = currentSpend - previousSpend;
    const changePercent = previousSpend > 0 
      ? (changeAmount / previousSpend) * 100 
      : currentSpend > 0 ? 100 : 0;
    
    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(changePercent) < 10) {
      direction = 'stable';
    } else {
      direction = changePercent > 0 ? 'up' : 'down';
    }
    
    // Generate alert for significant changes
    let alert: SmartAlert | undefined;
    if (Math.abs(changePercent) >= TREND_THRESHOLD_PERCENT && direction !== 'stable') {
      alert = generateTrendAlert(category, changePercent, direction);
    }
    
    trends.push({
      category,
      currentMonth: currentSpend,
      previousMonth: previousSpend,
      changePercent,
      changeAmount,
      direction,
      alert,
    });
  }
  
  return trends;
}

/**
 * Generate a smart alert for a trend
 */
function generateTrendAlert(
  category: SpendingCategory,
  changePercent: number,
  direction: 'up' | 'down'
): SmartAlert {
  const categoryNames: Record<SpendingCategory, string> = {
    [SpendingCategory.GROCERIES]: 'groceries',
    [SpendingCategory.DINING]: 'dining',
    [SpendingCategory.GAS]: 'gas',
    [SpendingCategory.TRAVEL]: 'travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'online shopping',
    [SpendingCategory.ENTERTAINMENT]: 'entertainment',
    [SpendingCategory.DRUGSTORES]: 'pharmacy',
    [SpendingCategory.HOME_IMPROVEMENT]: 'home improvement',
    [SpendingCategory.OTHER]: 'other',
  };
  
  const catName = categoryNames[category];
  const percentStr = Math.abs(changePercent).toFixed(0);
  
  const type: SmartAlertType = direction === 'up' ? 'spending_increase' : 'spending_decrease';
  const priority = Math.abs(changePercent) >= 50 ? 'high' : 'medium';
  
  return {
    id: `trend_${category}_${Date.now()}`,
    type,
    priority,
    title: direction === 'up' 
      ? `${catName} spending up ${percentStr}%`
      : `${catName} spending down ${percentStr}%`,
    message: direction === 'up'
      ? `Your ${catName} spending increased by ${percentStr}% this month.`
      : `Your ${catName} spending decreased by ${percentStr}% this month.`,
    category,
    createdAt: new Date(),
    dismissed: false,
  };
}

/**
 * Generate smart alerts from breakdown and trends
 */
export function generateSmartAlerts(
  breakdown: CategoryBreakdown[],
  trends: SpendingTrend[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  
  // Add trend alerts
  for (const trend of trends) {
    if (trend.alert) {
      alerts.push(trend.alert);
    }
  }
  
  // Card switch opportunities (large reward gaps)
  for (const cat of breakdown) {
    if (cat.rewardsGap > 100 && cat.optimalCard) {
      alerts.push({
        id: `switch_${cat.category}_${Date.now()}`,
        type: 'card_switch',
        priority: 'high',
        title: `Switch to ${cat.optimalCard.name}`,
        message: `Using ${cat.optimalCard.name} for ${cat.category} could earn you $${cat.rewardsGap.toFixed(0)} more per year.`,
        category: cat.category,
        suggestedAction: `Switch to ${cat.optimalCard.name}`,
        potentialSavings: cat.rewardsGap,
        createdAt: new Date(),
        dismissed: false,
      });
    }
  }
  
  // Sort by priority and potential savings
  return alerts.sort((a, b) => {
    const priorityScore = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityScore[a.priority];
    const bPriority = priorityScore[b.priority];
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return (b.potentialSavings || 0) - (a.potentialSavings || 0);
  });
}

/**
 * Calculate total "money left on table"
 */
export function calculateMoneyLeftOnTable(
  breakdown: CategoryBreakdown[]
): number {
  return breakdown.reduce((sum, cat) => sum + cat.rewardsGap, 0);
}

/**
 * Get top merchants across all categories
 */
export function getTopMerchants(
  transactions: ParsedTransaction[],
  limit: number = 10
): MerchantSummary[] {
  const purchases = transactions.filter(t => !t.isCredit);
  
  const merchantTotals = new Map<string, { amount: number; count: number; category: SpendingCategory }>();
  
  for (const tx of purchases) {
    const existing = merchantTotals.get(tx.normalizedMerchant);
    if (existing) {
      existing.amount += tx.amount;
      existing.count++;
    } else {
      merchantTotals.set(tx.normalizedMerchant, {
        amount: tx.amount,
        count: 1,
        category: tx.category,
      });
    }
  }
  
  return Array.from(merchantTotals.entries())
    .map(([name, { amount, count, category }]) => ({ name, amount, count, category }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

// ============================================================================
// Main Insights Function
// ============================================================================

/**
 * Generate complete spending insights from transactions
 */
export function generateSpendingInsights(
  transactions: ParsedTransaction[],
  userCards: Card[]
): Result<SpendingInsights, InsightsError> {
  // Validate minimum transaction count
  if (transactions.length < MIN_TRANSACTIONS_FOR_INSIGHTS) {
    return failure({
      type: 'INSUFFICIENT_DATA',
      transactionCount: transactions.length,
      minimumRequired: MIN_TRANSACTIONS_FOR_INSIGHTS,
      message: `Need at least ${MIN_TRANSACTIONS_FOR_INSIGHTS} transactions for insights`,
    });
  }
  
  // Calculate date range
  const dates = transactions.map(t => t.date.getTime());
  const periodStart = new Date(Math.min(...dates));
  const periodEnd = new Date(Math.max(...dates));
  
  // Calculate total spend
  const totalSpend = transactions
    .filter(t => !t.isCredit)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(transactions, userCards);
  
  // Optimization score
  const optimizationScore = calculateOptimizationScore(categoryBreakdown);
  
  // Monthly summaries for trends
  const monthlyData = groupByMonth(transactions);
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  
  // Spending trends
  const trends = previousMonth 
    ? calculateSpendingTrends(currentMonth, previousMonth)
    : [];
  
  // Smart alerts
  const alerts = generateSmartAlerts(categoryBreakdown, trends);
  
  // Money left on table
  const moneyLeftOnTable = calculateMoneyLeftOnTable(categoryBreakdown);
  
  // Top merchants
  const topMerchants = getTopMerchants(transactions, 10);
  
  return success({
    periodStart,
    periodEnd,
    totalSpend,
    transactionCount: transactions.length,
    categoryBreakdown,
    optimizationScore,
    trends,
    alerts,
    moneyLeftOnTable,
    topMerchants,
  });
}
