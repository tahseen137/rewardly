/**
 * SavingsReportScreen - F10: Monthly Savings Report
 * Auto-generated monthly report showing rewards earned vs missed
 * Tier: Pro+
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, TrendingDown, Award, Share2, Calendar } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { LockedFeature } from '../components';
import { canAccessFeatureSync } from '../services/SubscriptionService';
import { getCardByIdSync } from '../services/CardDataService';
import {
  getReport,
  getRecentReports,
  formatReportForSharing,
  SavingsReport,
  CategoryBreakdown,
} from '../services/SavingsReportService';

// ============================================================================
// Category Breakdown Component
// ============================================================================

interface CategoryBreakdownCardProps {
  breakdown: CategoryBreakdown;
  index: number;
}

function CategoryBreakdownCard({ breakdown, index }: CategoryBreakdownCardProps) {
  const missedPercent = breakdown.spend > 0
    ? (breakdown.missed / breakdown.spend) * 100
    : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={styles.categoryCard}
    >
      <Text style={styles.categoryName}>{breakdown.category}</Text>
      
      <View style={styles.categoryStats}>
        <View style={styles.categoryStat}>
          <Text style={styles.categoryStatLabel}>Spent</Text>
          <Text style={styles.categoryStatValue}>${breakdown.spend.toFixed(2)}</Text>
        </View>
        
        <View style={styles.categoryStat}>
          <Text style={styles.categoryStatLabel}>Earned</Text>
          <Text style={[styles.categoryStatValue, { color: colors.success.main }]}>
            ${breakdown.earned.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.categoryStat}>
          <Text style={styles.categoryStatLabel}>Missed</Text>
          <Text style={[styles.categoryStatValue, { color: colors.error.main }]}>
            ${breakdown.missed.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100 - missedPercent, 100)}%` },
          ]}
        />
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

interface Props {
  route?: {
    params?: {
      reportId?: string;
    };
  };
}

export default function SavingsReportScreen({ route }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<SavingsReport | null>(null);
  const [recentReports, setRecentReports] = useState<SavingsReport[]>([]);

  const hasAccess = canAccessFeatureSync('benefits_tracking'); // Pro+ feature

  useEffect(() => {
    loadReport();
  }, [route?.params?.reportId]);

  const loadReport = useCallback(async () => {
    try {
      if (route?.params?.reportId) {
        const data = await getReport(route.params.reportId);
        setReport(data);
      } else {
        // Load most recent reports
        const reports = await getRecentReports(6);
        setRecentReports(reports);
        if (reports.length > 0) {
          setReport(reports[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load savings report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.reportId]);

  const handleShare = useCallback(async () => {
    if (!report) return;

    const shareData = formatReportForSharing(report);
    const message = `📊 My ${shareData.month} Rewards Report\n\n` +
      `✅ Earned: ${shareData.totalEarned}\n` +
      `❌ Missed: ${shareData.totalMissed}\n` +
      `📈 Optimization Score: ${shareData.optimizationScore}%\n\n` +
      `Track your rewards with Rewardly!`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  }, [report]);

  if (!hasAccess) {
    return (
      <LockedFeature
        feature="benefits_tracking"
        title="Monthly Savings Report"
        description="See your monthly rewards earned, missed, and optimization score"
        variant="overlay"
      >
        <View style={styles.container} />
      </LockedFeature>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyStateTitle}>No Report Available</Text>
          <Text style={styles.emptyStateText}>
            Log some purchases to generate your first monthly report
          </Text>
        </View>
      </View>
    );
  }

  const bestCard = report.bestCard ? getCardByIdSync(report.bestCard) : null;
  const worstCard = report.worstCard ? getCardByIdSync(report.worstCard) : null;

  const monthName = report.reportMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{monthName}</Text>
            <Text style={styles.subtitle}>Savings Report</Text>
          </View>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 size={24} color={colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Optimization Score */}
        <LinearGradient
          colors={[colors.primary.main, colors.primary.dark]}
          style={styles.scoreCard}
        >
          <Award size={40} color={colors.background.primary} />
          <Text style={styles.scoreLabel}>Optimization Score</Text>
          <Text style={styles.scoreValue}>{report.optimizationScore}%</Text>
          <Text style={styles.scoreDescription}>
            {report.optimizationScore >= 80 ? 'Excellent!' :
             report.optimizationScore >= 60 ? 'Good!' :
             report.optimizationScore >= 40 ? 'Needs Work' : 'Lots of room to improve'}
          </Text>
        </LinearGradient>

        {/* Summary Stats */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>${report.totalSpend.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.success.light }]}>
            <TrendingUp size={20} color={colors.success.main} />
            <Text style={styles.summaryLabel}>Earned</Text>
            <Text style={[styles.summaryValue, { color: colors.success.main }]}>
              ${report.totalRewardsEarned.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.error.light }]}>
            <TrendingDown size={20} color={colors.error.main} />
            <Text style={styles.summaryLabel}>Missed</Text>
            <Text style={[styles.summaryValue, { color: colors.error.main }]}>
              ${report.totalRewardsMissed.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Best/Worst Cards */}
        <View style={styles.cardsRow}>
          {bestCard && (
            <View style={[styles.cardHighlight, styles.bestCard]}>
              <Text style={styles.cardHighlightLabel}>Best Performer</Text>
              <Text style={styles.cardHighlightName}>{bestCard.name}</Text>
              <Text style={styles.cardHighlightValue}>
                ${report.bestCardEarnings.toFixed(2)} earned
              </Text>
            </View>
          )}

          {worstCard && (
            <View style={[styles.cardHighlight, styles.worstCard]}>
              <Text style={styles.cardHighlightLabel}>Underperformer</Text>
              <Text style={styles.cardHighlightName}>{worstCard.name}</Text>
              <Text style={styles.cardHighlightValue}>
                ${report.worstCardEarnings.toFixed(2)} earned
              </Text>
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {report.categoryBreakdown.map((cat, index) => (
          <CategoryBreakdownCard key={cat.category} breakdown={cat} index={index} />
        ))}

        {/* Recent Reports */}
        {recentReports.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>Past Reports</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recentReportsRow}>
                {recentReports.slice(1).map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.recentReportCard}
                    onPress={() => setReport(r)}
                  >
                    <Text style={styles.recentReportMonth}>
                      {r.reportMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>
                    <Text style={styles.recentReportScore}>{r.optimizationScore}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  shareButton: {
    padding: 8,
  },
  scoreCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.background.primary,
    marginTop: 12,
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.background.primary,
    marginTop: 8,
  },
  scoreDescription: {
    fontSize: 16,
    color: colors.background.primary,
    marginTop: 8,
    opacity: 0.9,
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  cardHighlight: {
    flex: 1,
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  bestCard: {
    backgroundColor: colors.success.light,
  },
  worstCard: {
    backgroundColor: colors.error.light,
  },
  cardHighlightLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  cardHighlightName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardHighlightValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryStat: {
    flex: 1,
    alignItems: 'center',
  },
  categoryStatLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  categoryStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.error.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
  },
  recentReportsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 20,
  },
  recentReportCard: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: borderRadius.lg,
    minWidth: 120,
    alignItems: 'center',
  },
  recentReportMonth: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  recentReportScore: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
