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
// Report Generation
// ============================================================================

export async function generateMonthlyReport(month: Date): Promise<SavingsReport | null> {
  try {
    if (!supabase) return null;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;
    
    // Normalize to first day of month
    const reportMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    
    // Get spending log for the month
    const startDate = reportMonth;
    const endDate = new Date(reportMonth.getFullYear(), reportMonth.getMonth() + 1, 1);
    
    const { data: spendingData, error: spendingError } = await (supabase
      .from('spending_log') as any)
      .select('*')
      .eq('user_id', user.data.user.id)
      .gte('transaction_date', startDate.toISOString())
      .lt('transaction_date', endDate.toISOString());
    
    if (spendingError) throw spendingError;
    
    if (!spendingData || spendingData.length === 0) {
      return null; // No spending data for this month
    }
    
    // Aggregate data
    let totalSpend = 0;
    let totalEarned = 0;
    let totalMissed = 0;
    
    const cardEarnings: Record<string, number> = {};
    const categoryData: Record<string, CategoryBreakdown> = {};
    
    (spendingData as any[]).forEach((entry: any) => {
      const amount = parseFloat(entry.amount);
      const earned = parseFloat(entry.rewards_earned || '0');
      const missed = parseFloat(entry.rewards_missed || '0');
      
      totalSpend += amount;
      totalEarned += earned;
      totalMissed += missed;
      
      // Track per card
      const card = entry.card_used;
      cardEarnings[card] = (cardEarnings[card] || 0) + earned;
      
      // Track per category
      const category = entry.category;
      if (!categoryData[category]) {
        categoryData[category] = {
          category,
          spend: 0,
          earned: 0,
          missed: 0,
        };
      }
      categoryData[category].spend += amount;
      categoryData[category].earned += earned;
      categoryData[category].missed += missed;
    });
    
    // Find best and worst cards
    const cardEntries = Object.entries(cardEarnings);
    let bestCard: string | null = null;
    let bestCardEarnings = 0;
    let worstCard: string | null = null;
    let worstCardEarnings = Infinity;
    
    cardEntries.forEach(([card, earnings]) => {
      if (earnings > bestCardEarnings) {
        bestCard = card;
        bestCardEarnings = earnings;
      }
      if (earnings < worstCardEarnings) {
        worstCard = card;
        worstCardEarnings = earnings;
      }
    });
    
    // Calculate optimization score (0-100)
    // Score = (earned / (earned + missed)) * 100
    const optimizationScore = totalEarned + totalMissed > 0
      ? Math.round((totalEarned / (totalEarned + totalMissed)) * 100)
      : 100;
    
    // Category breakdown
    const categoryBreakdown = Object.values(categoryData);
    
    // Insert into database
    let { data: reportData, error: reportError } = await (supabase
      .from('savings_reports') as any)
      .insert({
        user_id: user.data.user.id,
        report_month: reportMonth.toISOString(),
        total_spend: totalSpend,
        total_rewards_earned: totalEarned,
        total_rewards_missed: totalMissed,
        best_card: bestCard,
        best_card_earnings: bestCardEarnings,
        worst_card: worstCard,
        worst_card_earnings: worstCardEarnings === Infinity ? 0 : worstCardEarnings,
        category_breakdown: categoryBreakdown,
        optimization_score: optimizationScore,
      })
      .select()
      .single();
    
    if (reportError) {
      // Check if report already exists
      if (reportError.code === '23505') {
        // Unique constraint violation - update existing
        const { data: existingData } = await (supabase
          .from('savings_reports') as any)
          .update({
            total_spend: totalSpend,
            total_rewards_earned: totalEarned,
            total_rewards_missed: totalMissed,
            best_card: bestCard,
            best_card_earnings: bestCardEarnings,
            worst_card: worstCard,
            worst_card_earnings: worstCardEarnings === Infinity ? 0 : worstCardEarnings,
            category_breakdown: categoryBreakdown,
            optimization_score: optimizationScore,
            generated_at: new Date().toISOString(),
          })
          .eq('user_id', user.data.user.id)
          .eq('report_month', reportMonth.toISOString())
          .select()
          .single();
        
        if (!existingData) throw new Error('Failed to update existing report');
        reportData = existingData;
      } else {
        throw reportError;
      }
    }
    
    const rd = reportData as any;
    return {
      id: rd.id,
      userId: rd.user_id,
      reportMonth: new Date(rd.report_month),
      totalSpend: parseFloat(rd.total_spend),
      totalRewardsEarned: parseFloat(rd.total_rewards_earned),
      totalRewardsMissed: parseFloat(rd.total_rewards_missed),
      bestCard: rd.best_card,
      bestCardEarnings: parseFloat(rd.best_card_earnings || '0'),
      worstCard: rd.worst_card,
      worstCardEarnings: parseFloat(rd.worst_card_earnings || '0'),
      categoryBreakdown: rd.category_breakdown,
      optimizationScore: rd.optimization_score,
      generatedAt: new Date(rd.generated_at),
    };
    
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
    
    const d = data as any;
    return {
      id: d.id,
      userId: d.user_id,
      reportMonth: new Date(d.report_month),
      totalSpend: parseFloat(d.total_spend),
      totalRewardsEarned: parseFloat(d.total_rewards_earned),
      totalRewardsMissed: parseFloat(d.total_rewards_missed),
      bestCard: d.best_card,
      bestCardEarnings: parseFloat(d.best_card_earnings || '0'),
      worstCard: d.worst_card,
      worstCardEarnings: parseFloat(d.worst_card_earnings || '0'),
      categoryBreakdown: d.category_breakdown,
      optimizationScore: d.optimization_score,
      generatedAt: new Date(d.generated_at),
    };
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
    
    return ((data || []) as any[]).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      reportMonth: new Date(row.report_month),
      totalSpend: parseFloat(row.total_spend),
      totalRewardsEarned: parseFloat(row.total_rewards_earned),
      totalRewardsMissed: parseFloat(row.total_rewards_missed),
      bestCard: row.best_card,
      bestCardEarnings: parseFloat(row.best_card_earnings || '0'),
      worstCard: row.worst_card,
      worstCardEarnings: parseFloat(row.worst_card_earnings || '0'),
      categoryBreakdown: row.category_breakdown,
      optimizationScore: row.optimization_score,
      generatedAt: new Date(row.generated_at),
    }));
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
    year: 'numeric' 
  });
  
  // Find top category by spend
  const topCategory = report.categoryBreakdown.length > 0
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
