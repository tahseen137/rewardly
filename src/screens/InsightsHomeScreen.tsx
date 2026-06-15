/**
 * InsightsHomeScreen - Rewards performance dashboard
 * Requires Pro+ subscription (free users see paywall)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Sparkles, BarChart3, Trophy, Upload, ClipboardList } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import Badge from '../components/Badge';
import { RewardsIQScore, MissedRewardsAnalysis, PortfolioOptimization } from '../types/rewards-iq';
import {
  calculateRewardsIQ,
  analyzeMissedRewards,
  getPortfolioOptimization,
} from '../services/RewardsIQService';
import { getAllCards } from '../services/CardDataService';
import { InsightsStackParamList } from '../navigation/AppNavigator';
import {
  canAccessFeatureSync,
  getCurrentTierSync,
  refreshSubscription,
  SubscriptionTier,
} from '../services/SubscriptionService';
import { LockedFeature } from '../components';

type NavigationProp = NativeStackNavigationProp<InsightsStackParamList>;

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Well optimized';
  if (score >= 60) return 'Room to improve';
  return 'Needs attention';
}

export default function InsightsHomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [rewardsIQ, setRewardsIQ] = useState<RewardsIQScore | null>(null);
  const [missedRewards, setMissedRewards] = useState<MissedRewardsAnalysis | null>(null);
  const [optimization, setOptimization] = useState<PortfolioOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [_currentTier, setCurrentTier] = useState<SubscriptionTier>('free');

  useFocusEffect(
    useCallback(() => {
      const checkAccess = async () => {
        await refreshSubscription();
        const tier = getCurrentTierSync();
        setCurrentTier(tier);
        setHasAccess(canAccessFeatureSync('insights'));
      };
      checkAccess();
    }, [])
  );

  const loadData = useCallback(async () => {
    try {
      await getAllCards();
      const [iq, missed, opt] = await Promise.all([
        calculateRewardsIQ(),
        analyzeMissedRewards(),
        getPortfolioOptimization(),
      ]);
      setRewardsIQ(iq);
      setMissedRewards(missed);
      setOptimization(opt);
    } catch (e) {
      console.error('Failed to load insights:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPulse}>
          <BarChart3 size={32} color={colors.primary.main} />
        </View>
        <Text style={styles.loadingText}>Analyzing your rewards...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <LockedFeature
        feature="insights"
        title="Unlock Insights"
        description="See where you're leaving money on the table and optimize your card usage with detailed analytics."
        icon={<BarChart3 size={56} color={colors.primary.main} />}
        variant="inline"
        onSubscribe={() => {
          setHasAccess(canAccessFeatureSync('insights'));
          setCurrentTier(getCurrentTierSync());
        }}
      />
    );
  }

  const score = rewardsIQ?.overallScore ?? 0;
  const scoreLabel = getScoreLabel(score);
  const trendText =
    rewardsIQ && rewardsIQ.trend !== 'stable'
      ? `${rewardsIQ.trend === 'up' ? '+' : '−'}${rewardsIQ.trendAmount} points from last month`
      : 'No change from last month';

  const topMissed = missedRewards?.topMissedTransactions?.slice(0, 3) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary.main}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Your rewards performance this month</Text>
      </View>

      {/* Rewards IQ card */}
      <TouchableOpacity
        style={styles.iqCard}
        onPress={() => navigation.navigate('RewardsIQ')}
        activeOpacity={0.8}
      >
        <Text style={styles.overline}>REWARDS IQ SCORE</Text>

        <View style={styles.iqScoreRow}>
          <View style={styles.iqScoreLeft}>
            <Text style={styles.iqScore}>{score}</Text>
            <Text style={styles.iqScoreMax}> / 100</Text>
          </View>
          <Badge label={scoreLabel} variant="success" size="small" />
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${score}%` as any }]} />
        </View>

        <Text style={styles.iqFooter}>{trendText}</Text>
      </TouchableOpacity>

      {/* Missed rewards */}
      {topMissed.length > 0 && (
        <>
          <Text style={styles.overlineSeparator}>MISSED REWARDS THIS MONTH</Text>

          {topMissed.map((missed, index) => (
            <TouchableOpacity
              key={index}
              style={styles.missedCard}
              onPress={() => navigation.navigate('MissedRewards')}
              activeOpacity={0.8}
            >
              <View style={styles.missedTopRow}>
                <Text style={styles.missedStore} numberOfLines={1}>
                  {missed.transaction.merchantName}
                </Text>
                <Text style={styles.missedAmount}>−${missed.missedCad.toFixed(2)}</Text>
              </View>
              <Text style={styles.missedSub}>
                Use <Text style={styles.missedCardName}>{missed.optimalCard.name}</Text>
                {missed.optimalRewardsCad > 0 && missed.actualRewardsCad >= 0
                  ? ` · Earns $${missed.optimalRewardsCad.toFixed(2)} vs $${missed.actualRewardsCad.toFixed(2)}`
                  : ' · Better rate on this purchase'}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Portfolio optimizer card */}
      {optimization && optimization.annualGain > 0 && (
        <TouchableOpacity
          style={styles.optimizerCard}
          onPress={() => navigation.navigate('PortfolioOptimizer')}
          activeOpacity={0.8}
        >
          <View style={styles.optimizerIconCircle}>
            <Sparkles size={18} color={colors.accent.main} />
          </View>
          <View style={styles.optimizerText}>
            <Text style={styles.optimizerTitle}>Portfolio Optimizer</Text>
            <Text style={styles.optimizerDesc}>
              {optimization.cardsToAdd.length > 0
                ? `Adding ${optimization.cardsToAdd[0].name} could earn you $${optimization.annualGain.toFixed(0)} more/yr`
                : `Earn $${optimization.annualGain.toFixed(0)} more per year`}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      )}

      {/* Spending Insights card */}
      <TouchableOpacity
        style={styles.achievementsCard}
        onPress={() => navigation.navigate('InsightsDashboard')}
        activeOpacity={0.8}
      >
        <View style={[styles.achievementsIconCircle, { backgroundColor: colors.info.background }]}>
          <Upload size={18} color={colors.info.main} />
        </View>
        <View style={styles.optimizerText}>
          <Text style={styles.optimizerTitle}>Spending Insights</Text>
          <Text style={styles.optimizerDesc}>Upload a statement to see your category breakdown</Text>
        </View>
        <ChevronRight size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Achievements card */}
      <TouchableOpacity
        style={styles.achievementsCard}
        onPress={() => navigation.navigate('Achievements')}
        activeOpacity={0.8}
      >
        <View style={styles.achievementsIconCircle}>
          <Trophy size={18} color={colors.warning.main} />
        </View>
        <View style={styles.optimizerText}>
          <Text style={styles.optimizerTitle}>Achievements</Text>
          <Text style={styles.optimizerDesc}>Track badges, streaks, and your rewards rank</Text>
        </View>
        <ChevronRight size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Application Tracker card */}
      <TouchableOpacity
        style={styles.achievementsCard}
        onPress={() => navigation.navigate('ApplicationTracker')}
        activeOpacity={0.8}
      >
        <View style={[styles.achievementsIconCircle, { backgroundColor: colors.success.background }]}>
          <ClipboardList size={18} color={colors.success.main} />
        </View>
        <View style={styles.optimizerText}>
          <Text style={styles.optimizerTitle}>Application Tracker</Text>
          <Text style={styles.optimizerDesc}>Monitor 5/24 limits, cooldowns, and approval strategy</Text>
        </View>
        <ChevronRight size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.bg10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Overline
  overline: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  overlineSeparator: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  // IQ card
  iqCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginBottom: 4,
  },
  iqScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iqScoreLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  iqScore: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary.main,
    fontVariant: ['tabular-nums'],
  },
  iqScoreMax: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  progressBg: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.background.tertiary,
    marginBottom: 10,
  },
  progressFill: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.primary.main,
  },
  iqFooter: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  // Missed reward cards
  missedCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginBottom: 10,
  },
  missedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  missedStore: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  missedAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error.main,
    fontVariant: ['tabular-nums'],
  },
  missedSub: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  missedCardName: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  // Portfolio optimizer card
  optimizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginTop: 16,
  },
  achievementsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginTop: 12,
  },
  achievementsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warning.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optimizerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.bg20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optimizerText: {
    flex: 1,
  },
  optimizerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  optimizerDesc: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
