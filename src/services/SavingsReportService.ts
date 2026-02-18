/**
 * SavingsReportService - F10: Monthly Savings Report
 * Generates monthly reports showing rewards earned vs missed
 */

import { supabase } from './supabase/client';
import { SpendingCategory } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CategoryBreakdown {
  category: SpendingCategory;
  spend: number;
  earned: number;
  missed: number;
}

export interface SavingsReport {
  id: string;
  userId: string;
  reportMonth: Date; // First day of month
  totalSpend: number;
  totalRewardsEarned: number;
  totalRewardsMissed: number;
  bestCard: string | null;
  bestCardEarnings: number;
  worstCard: string | null;
  worstCardEarnings: number;
  categoryBreakdown: CategoryBreakdown[];
  optimizationScore: number; // 0-100
  generatedAt: Date;
}

// ============================================================================
// Private Helpers
// ============================================================================

/** Map a raw Supabase row to a typed SavingsReport */
function rowToReport(row: Record<string, unknown>): SavingsReport {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    reportMonth: new Date(row.report_month as string),
    totalSpend: parseFloat(row.total_spend as string),
    totalRewardsEarned: parseFloat(row.total_rewards_earned as string),
    totalRewardsMissed: parseFloat(row.total_rewards_missed as string),
    bestCard: row.best_card as string | null,
    bestCardEarnings: parseFloat((row.best_card_earnings as string) || '0'),
    worstCard: row.worst_card as string | null,
    worstCardEarnings: parseFloat((row.worst_card_earnings as string) || '0'),
    categoryBreakdown: row.category_breakdown as CategoryBreakdown[],
    optimizationScore: row.optimization_score as number,
    generatedAt: new Date(row.generated_at as string),
  };
}

interface SpendingEntry {
  amount: string;
  rewards_earned?: string;
  rewards_missed?: string;
  card_used: string;
  category: SpendingCategory;
}

interface AggregatedSpending {
  totalSpend: number;
  totalEarned: number;
  totalMissed: number;
  cardEarnings: Record<string, number>;
  categoryData: Record<string, CategoryBreakdown>;
}

/** Aggregate raw spending log entries into summary totals */
function aggregateSpendingEntries(entries: SpendingEntry[]): AggregatedSpending {
  let totalSpend = 0;
  let totalEarned = 0;
  let totalMissed = 0;
  const cardEarnings: Record<string, number> = {};
  const categoryData: Record<string, CategoryBreakdown> = {};

  for (const entry of entries) {
    const amount = parseFloat(entry.amount);
    const earned = parseFloat(entry.rewards_earned || '0');
    const missed = parseFloat(entry.rewards_missed || '0');

    totalSpend += amount;
    totalEarned += earned;
    totalMissed += missed;

    // Track per card
    cardEarnings[entry.card_used] = (cardEarnings[entry.card_used] || 0) + earned;

    // Track per category
    const cat = entry.category;
    if (!categoryData[cat]) {
      categoryData[cat] = { category: cat, spend: 0, earned: 0, missed: 0 };
    }
    categoryData[cat].spend += amount;
    categoryData[cat].earned += earned;
    categoryData[cat].missed += missed;
  }

  return { totalSpend, totalEarned, totalMissed, cardEarnings, categoryData };
}

interface BestWorstCards {
  bestCard: string | null;
  bestCardEarnings: number;
  worstCard: string | null;
  worstCardEarnings: number;
}

/** Identify the best and worst-earning cards from per-card totals */
function findBestAndWorstCards(cardEarnings: Record<string, number>): BestWorstCards {
  let bestCard: string | null = null;
  let bestCardEarnings = 0;
  let worstCard: string | null = null;
  let worstCardEarnings = Infinity;

  for (const [card, earnings] of Object.entries(cardEarnings)) {
    if (earnings > bestCardEarnings) {
      bestCard = card;
      bestCardEarnings = earnings;
    }
    if (earnings < worstCardEarnings) {
      worstCard = card;
      worstCardEarnings = earnings;
    }
  }

  return {
    bestCard,
    bestCardEarnings,
    worstCard,
    // Normalize Infinity (no cards found) to 0
    worstCardEarnings: worstCardEarnings === Infinity ? 0 : worstCardEarnings,
  };
}

/** Build the Supabase payload for inserting/updating a savings report */
function buildReportPayload(
  userId: string,
  reportMonth: Date,
  totalSpend: number,
  totalEarned: number,
  totalMissed: number,
  cards: BestWorstCards,
  categoryBreakdown: CategoryBreakdown[],
  optimizationScore: number,
) {
  return {
    user_id: userId,
    report_month: reportMonth.toISOString(),
    total_spend: totalSpend,
    total_rewards_earned: totalEarned,
    total_rewards_missed: totalMissed,
    best_card: cards.bestCard,
    best_card_earnings: cards.bestCardEarnings,
    worst_card: cards.worstCard,
    worst_card_earnings: cards.worstCardEarnings,
    category_breakdown: categoryBreakdown,
    optimization_score: optimizationScore,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

export async function generateMonthlyReport(month: Date): Promise<SavingsReport | null> {
  try {
    if (!supabase) return null;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;

    const userId = user.data.user.id;

    // Normalize to first day of month
    const reportMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(reportMonth.getFullYear(), reportMonth.getMonth() + 1, 1);

    // Fetch spending log for the month
    const { data: spendingData, error: spendingError } = await (supabase
      .from('spending_log') as any)
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', reportMonth.toISOString())
      .lt('transaction_date', endDate.toISOString());

    if (spendingError) {
      // Table may not exist yet — return null gracefully
      console.warn('spending_log not available:', spendingError.message);
      return null;
    }

    if (!spendingData || spendingData.length === 0) return null;

    // Aggregate spending data
    const { totalSpend, totalEarned, totalMissed, cardEarnings, categoryData } =
      aggregateSpendingEntries(spendingData as SpendingEntry[]);

    // Derived stats
    const cards = findBestAndWorstCards(cardEarnings);
    const optimizationScore =
      totalEarned + totalMissed > 0
        ? Math.round((totalEarned / (totalEarned + totalMissed)) * 100)
        : 100;
    const categoryBreakdown = Object.values(categoryData);
    const payload = buildReportPayload(
      userId, reportMonth, totalSpend, totalEarned, totalMissed,
      cards, categoryBreakdown, optimizationScore,
    );

    // Upsert: try insert, fall back to update on duplicate month
    let { data: reportData, error: reportError } = await (supabase
      .from('savings_reports') as any)
      .insert(payload)
      .select()
      .single();

    if (reportError) {
      if (reportError.code === '23505') {
        // Unique constraint violation — update existing record
        const { data: existingData } = await (supabase
          .from('savings_reports') as any)
          .update({ ...payload, generated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('report_month', reportMonth.toISOString())
          .select()
          .single();

        if (!existingData) throw new Error('Failed to update existing report');
        reportData = existingData;
      } else {
        throw reportError;
      }
    }

    return rowToReport(reportData as Record<string, unknown>);

  } catch (error) {
    console.error('Failed to generate monthly report:', error);
    return null;
  }
}

// ============================================================================
// Report Retrieval
// ============================================================================

export async function getReport(reportId: string): Promise<SavingsReport | null> {
  try {
    if (!supabase) return null;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;

    const { data, error } = await (supabase
      .from('savings_reports') as any)
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.data.user.id)
      .single();

    if (error) throw error;

    return rowToReport(data as Record<string, unknown>);
  } catch (error) {
    console.error('Failed to get report:', error);
    return null;
  }
}

export async function getRecentReports(limit: number = 6): Promise<SavingsReport[]> {
  try {
    if (!supabase) return [];
    const user = await supabase.auth.getUser();
    if (!user.data.user) return [];

    const { data, error } = await (supabase
      .from('savings_reports') as any)
      .select('*')
      .eq('user_id', user.data.user.id)
      .order('report_month', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return ((data || []) as Record<string, unknown>[]).map(rowToReport);
  } catch (error) {
    console.error('Failed to get recent reports:', error);
    return [];
  }
}

// ============================================================================
// Report Sharing
// ============================================================================

export interface ShareableReportData {
  month: string;
  totalEarned: string;
  totalMissed: string;
  optimizationScore: number;
  topCategory: string;
}

export function formatReportForSharing(report: SavingsReport): ShareableReportData {
  const month = report.reportMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Find top category by spend
  const topCategory =
    report.categoryBreakdown.length > 0
      ? report.categoryBreakdown.reduce((max, cat) =>
          cat.spend > max.spend ? cat : max
        ).category
      : 'none';

  return {
    month,
    totalEarned: `$${report.totalRewardsEarned.toFixed(2)}`,
    totalMissed: `$${report.totalRewardsMissed.toFixed(2)}`,
    optimizationScore: report.optimizationScore,
    topCategory,
  };
}
