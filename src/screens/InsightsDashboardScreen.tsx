/**
 * InsightsDashboardScreen - F25: Spending Insights Dashboard
 * 
 * Features:
 * - Optimization score gauge (simple View-based, no chart libs)
 * - Category breakdown list
 * - Trend indicators
 * - Smart alert cards
 * - "Money left on table" hero metric
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getTransactions } from '../services/StatementStorageService';
import { getCards } from '../services/CardPortfolioManager';
import { getAllCardsSync } from '../services/CardDataService';
import { generateSpendingInsights } from '../services/InsightsService';
import { SpendingInsights, SpendingCategory } from '../types';

const CATEGORY_LABELS: Record<SpendingCategory, string> = {
  [SpendingCategory.GROCERIES]: 'Groceries',
  [SpendingCategory.DINING]: 'Dining',
  [SpendingCategory.GAS]: 'Gas',
  [SpendingCategory.TRAVEL]: 'Travel',
  [SpendingCategory.ONLINE_SHOPPING]: 'Online',
  [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
  [SpendingCategory.DRUGSTORES]: 'Pharmacy',
  [SpendingCategory.HOME_IMPROVEMENT]: 'Home',
  [SpendingCategory.OTHER]: 'Other',
};

export default function InsightsDashboardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Get transactions
      const transactions = await getTransactions();
      
      if (transactions.length === 0) {
        setError('No transactions found. Upload a statement to see insights.');
        setLoading(false);
        return;
      }
      
      // Get user cards
      const userCards = await getCards();
      const allCards = getAllCardsSync();
      const cardObjects = userCards
        .map(uc => allCards.find(c => c.id === uc.cardId))
        .filter((c): c is NonNullable<typeof c> => c !== null);
      
      // Generate insights
      const result = generateSpendingInsights(transactions, cardObjects);
      
      if (!result.success) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      
      setInsights(result.value);
      setLoading(false);
    } catch (err) {
      setError('Failed to load insights');
      setLoading(false);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderOptimizationGauge = () => {
    if (!insights) return null;
    
    const { score, label, emoji } = insights.optimizationScore;
    const percentage = Math.min(100, Math.max(0, score));
    
    return (
      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeTitle}>Optimization Score</Text>
        
        {/* Simple circular gauge */}
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeCircle}>
            <Text style={styles.gaugeEmoji}>{emoji}</Text>
            <Text style={styles.gaugeScore}>{score}</Text>
            <Text style={styles.gaugeLabel}>{label}</Text>
          </View>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        
        <Text style={styles.improvementText}>
          {insights.optimizationScore.improvementPotential}
        </Text>
      </View>
    );
  };

  const renderMoneyLeftOnTable = () => {
    if (!insights) return null;
    
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Money Left on Table</Text>
        <Text style={styles.heroAmount}>${insights.moneyLeftOnTable.toFixed(2)}</Text>
        <Text style={styles.heroSubtitle}>per year with optimal cards</Text>
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!insights) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        
        {insights.categoryBreakdown.map((cat, index) => (
          <View key={cat.category} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{CATEGORY_LABELS[cat.category]}</Text>
              <Text style={styles.categoryAmount}>${cat.totalSpend.toFixed(2)}</Text>
            </View>
            
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryMeta}>
                {cat.transactionCount} transactions • {cat.percentOfTotal.toFixed(1)}%
              </Text>
            </View>
            
            {cat.optimalCard && (
              <View style={styles.categoryOptimal}>
                <Text style={styles.optimalLabel}>Best card:</Text>
                <Text style={styles.optimalCard}>{cat.optimalCard.name}</Text>
              </View>
            )}
            
            {cat.rewardsGap > 0 && (
              <View style={styles.rewardsGap}>
                <Text style={styles.rewardsGapText}>
                  💰 ${cat.rewardsGap.toFixed(2)} more possible
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderTrends = () => {
    if (!insights || insights.trends.length === 0) return null;
    
    const significantTrends = insights.trends.filter(
      t => t.direction !== 'stable' && Math.abs(t.changePercent) > 0
    );
    
    if (significantTrends.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending Trends</Text>
        
        {significantTrends.map(trend => (
          <View key={trend.category} style={styles.trendCard}>
            <View style={styles.trendHeader}>
              {trend.direction === 'up' ? (
                <TrendingUp size={20} color={colors.error.main} />
              ) : (
                <TrendingDown size={20} color={colors.success.main} />
              )}
              <Text style={styles.trendCategory}>{CATEGORY_LABELS[trend.category]}</Text>
            </View>
            
            <Text style={[
              styles.trendPercent,
              trend.direction === 'up' ? styles.trendUp : styles.trendDown,
            ]}>
              {trend.direction === 'up' ? '+' : ''}
              {trend.changePercent.toFixed(1)}%
            </Text>
            
            <Text style={styles.trendAmount}>
              ${trend.previousMonth.toFixed(0)} → ${trend.currentMonth.toFixed(0)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAlerts = () => {
    if (!insights || insights.alerts.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Alerts</Text>
        
        {insights.alerts.slice(0, 5).map(alert => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              alert.priority === 'high' && styles.alertHigh,
            ]}
          >
            <View style={styles.alertHeader}>
              <AlertCircle
                size={20}
                color={alert.priority === 'high' ? colors.error.main : colors.primary.main}
              />
              <Text style={styles.alertTitle}>{alert.title}</Text>
            </View>
            
            <Text style={styles.alertMessage}>{alert.message}</Text>
            
            {alert.potentialSavings && (
              <Text style={styles.alertSavings}>
                💰 Save ${alert.potentialSavings.toFixed(2)}/year
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderTopMerchants = () => {
    if (!insights || insights.topMerchants.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Merchants</Text>
        
        {insights.topMerchants.slice(0, 5).map((merchant, index) => (
          <View key={merchant.name} style={styles.merchantRow}>
            <View style={styles.merchantRank}>
              <Text style={styles.merchantRankText}>{index + 1}</Text>
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              <Text style={styles.merchantCategory}>
                {merchant.count} transactions • {CATEGORY_LABELS[merchant.category]}
              </Text>
            </View>
            <Text style={styles.merchantAmount}>${merchant.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <AlertCircle size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>No Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => navigation.navigate('StatementUpload' as never)}
          >
            <Text style={styles.uploadButtonText}>Upload Statement</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderMoneyLeftOnTable()}
        {renderOptimizationGauge()}
        {renderAlerts()}
        {renderCategoryBreakdown()}
        {renderTrends()}
        {renderTopMerchants()}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: colors.primary.bg20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary.main,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.primary.dark,
    marginTop: 4,
  },
  gaugeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  gaugeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gaugeCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary.bg20,
    borderWidth: 8,
    borderColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  gaugeScore: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary.main,
  },
  gaugeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.dark,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
  },
  improvementText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  categoryMeta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  categoryOptimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optimalLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  optimalCard: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  rewardsGap: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  rewardsGapText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success.main,
  },
  trendCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trendCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  trendPercent: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendUp: {
    color: colors.error.main,
  },
  trendDown: {
    color: colors.success.main,
  },
  trendAmount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  alertCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  alertHigh: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.main + '10',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  alertSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.main,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  merchantRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  merchantCategory: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  merchantAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
