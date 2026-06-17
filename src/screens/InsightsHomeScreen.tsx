/**
 * InsightsHomeScreen - Rewards performance dashboard
 * Requires Pro+ subscription (free users see paywall)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Sparkles, BarChart3, Trophy, Upload, ClipboardList, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import Badge from '../components/Badge';
import { RewardsIQScore, MissedRewardsAnalysis, PortfolioOptimization } from '../types/rewards-iq';
import {
  calculateRewardsIQ,
  analyzeMissedRewards,
  getPortfolioOptimization,
  getScoreBoostTips,
  ScoreBoostTip,
} from '../services/RewardsIQService';
import { getAchievements, calculateRank } from '../services/AchievementService';
import { hasSpendingProfile } from '../services/SpendingProfileService';
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
  const [boostTips, setBoostTips] = useState<ScoreBoostTip[]>([]);
  const [rankEmoji, setRankEmoji] = useState<string>('🌱');
  const [rankTitle, setRankTitle] = useState<string>('Beginner');
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [_currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [hasProfile, setHasProfile] = useState(true); // assume yes to avoid flicker

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
      const [iq, missed, opt, tips, userAchievements, profileExists] = await Promise.all([
        calculateRewardsIQ(),
        analyzeMissedRewards(),
        getPortfolioOptimization(),
        getScoreBoostTips(),
        getAchievements(),
        hasSpendingProfile(),
      ]);
      setHasProfile(profileExists);
      setRewardsIQ(iq);
      setMissedRewards(missed);
      setOptimization(opt);
      setBoostTips(tips);

      // Rank from real achievement count
      const rank = calculateRank(userAchievements.totalUnlocked);
      setRankEmoji(rank.emoji);
      setRankTitle(rank.title);

      // Score history sparkline
      try {
        const raw = await AsyncStorage.getItem('rewards_iq_history');
        if (raw) {
          const history: { score: number }[] = JSON.parse(raw);
          setScoreHistory(history.slice(-7).map((h) => h.score));
        }
      } catch {
        // ignore
      }
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
      {/* Header with rank badge */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Insights</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>{rankEmoji}</Text>
            <Text style={styles.rankTitle}>{rankTitle}</Text>
          </View>
        </View>
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

        {/* Sparkline */}
        {scoreHistory.length > 1 && (
          <View style={styles.sparklineContainer}>
            {scoreHistory.map((s, i) => {
              const max = Math.max(...scoreHistory, 1);
              const height = Math.max(4, (s / max) * 28);
              const isLast = i === scoreHistory.length - 1;
              return (
                <View
                  key={i}
                  style={[
                    styles.sparklineBar,
                    { height, backgroundColor: isLast ? colors.primary.main : colors.primary.bg10 },
                  ]}
                />
              );
            })}
          </View>
        )}

        <Text style={styles.iqFooter}>{trendText}</Text>
      </TouchableOpacity>

      {/* Boost tips */}
      {boostTips.length > 0 && (
        <>
          <Text style={styles.overlineSeparator}>BOOST YOUR SCORE</Text>
          {boostTips.map((tip) => (
            <TouchableOpacity
              key={tip.id}
              style={styles.tipCard}
              activeOpacity={0.8}
              onPress={() => {
                if (tip.action === 'enable_smart_wallet') navigation.navigate('SmartWallet' as any);
                else if (tip.action === 'set_spending_profile') navigation.navigate('SpendingProfileWizard');
                else if (tip.action === 'view_iq') navigation.navigate('RewardsIQ');
              }}
            >
              <View style={styles.tipIconCircle}>
                <Zap size={14} color={colors.accent.main} />
              </View>
              <View style={styles.optimizerText}>
                <Text style={styles.tipLabel}>{tip.label}</Text>
                <Text style={styles.optimizerDesc}>{tip.description}</Text>
              </View>
              {tip.pointGain > 0 && (
                <View style={styles.tipGainBadge}>
                  <Text style={styles.tipGainText}>+{tip.pointGain}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

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

      {/* Spending Profile setup CTA — only shown when no profile exists */}
      {!hasProfile && (
        <TouchableOpacity
          style={styles.profileCta}
          onPress={() => navigation.navigate('SpendingProfileWizard')}
          activeOpacity={0.8}
        >
          <View style={styles.profileCtaLeft}>
            <Text style={styles.profileCtaIcon}>💸</Text>
            <View style={styles.optimizerText}>
              <View style={styles.profileCtaTitleRow}>
                <Text style={styles.optimizerTitle}>Set Up Spending Profile</Text>
                <View style={styles.profileCtaNew}>
                  <Text style={styles.profileCtaNewText}>SETUP</Text>
                </View>
              </View>
              <Text style={styles.optimizerDesc}>
                Tell us your monthly spend to personalize your score and recommendations
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.primary.main} />
        </TouchableOpacity>
      )}

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankEmoji: {
    fontSize: 14,
  },
  rankTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Sparkline
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 32,
    marginBottom: 8,
    marginTop: 4,
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 2,
  },
  // Boost tips
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.accent.bg20,
    padding: 14,
    marginBottom: 8,
  },
  tipIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.bg20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  tipGainBadge: {
    backgroundColor: colors.primary.bg10,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  tipGainText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main,
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
  // Spending profile CTA
  profileCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.bg10,
    borderRadius: borderRadius.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary.main,
    gap: 12,
  },
  profileCtaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCtaIcon: {
    fontSize: 28,
  },
  profileCtaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileCtaNew: {
    backgroundColor: colors.primary.main,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  profileCtaNewText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
