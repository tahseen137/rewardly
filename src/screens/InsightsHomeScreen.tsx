/**
 * InsightsHomeScreen - Dashboard for all analytics features
 * The "holy shit" screen that shows users their full rewards picture
 * 
 * Note: Requires Pro+ subscription (free users see paywall)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  TrendingDown,
  TrendingUp,
  Target,
  CreditCard,
  ChevronRight,
  Sparkles,
  BarChart3,
  Zap,
  PieChart,
  Clock,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { RewardsIQScore, MissedRewardsAnalysis, PortfolioOptimization } from '../types/rewards-iq';
import {
  calculateRewardsIQ,
  analyzeMissedRewards,
  getPortfolioOptimization,
} from '../services/RewardsIQService';
import { getAllCards } from '../services/CardDataService';
import { CATEGORY_INFO } from '../services/MockTransactionData';
import { InsightsStackParamList } from '../navigation/AppNavigator';
import { canAccessFeatureSync, getCurrentTierSync, refreshSubscription, SubscriptionTier } from '../services/SubscriptionService';
import { LockedFeature } from '../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<InsightsStackParamList>;

// ============================================================================
// Quick Stat Card Component
// ============================================================================

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  onPress: () => void;
  delay: number;
}

function QuickStatCard({ icon, label, value, subtext, color, onPress, delay }: QuickStatProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity
        style={[styles.quickStatCard, { borderColor: color + '30' }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.quickStatIcon, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
        <View style={styles.quickStatContent}>
          <Text style={[styles.quickStatValue, { color }]}>{value}</Text>
          <Text style={styles.quickStatLabel}>{label}</Text>
          {subtext && <Text style={styles.quickStatSubtext}>{subtext}</Text>}
        </View>
        <ChevronRight size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function InsightsHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  const [rewardsIQ, setRewardsIQ] = useState<RewardsIQScore | null>(null);
  const [missedRewards, setMissedRewards] = useState<MissedRewardsAnalysis | null>(null);
  const [optimization, setOptimization] = useState<PortfolioOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  
  const scoreScale = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  
  // Check subscription access on focus
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
      // Ensure cards are loaded first before calculating insights
      await getAllCards();
      
      const [iq, missed, opt] = await Promise.all([
        calculateRewardsIQ(),
        analyzeMissedRewards(),
        getPortfolioOptimization(),
      ]);
      
      setRewardsIQ(iq);
      setMissedRewards(missed);
      setOptimization(opt);
      
      // Animate score appearance
      scoreScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      
      // Subtle pulse
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );
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
  
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    opacity: scoreScale.value,
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.primary.main;
    if (score >= 60) return colors.warning.main;
    return colors.error.main;
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={styles.loadingPulse}>
          <BarChart3 size={32} color={colors.primary.main} />
        </Animated.View>
        <Text style={styles.loadingText}>Analyzing your rewards...</Text>
      </View>
    );
  }
  
  // Show paywall for free users
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
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Rewards Insights</Text>
        <Text style={styles.headerSubtitle}>
          See the full picture of your optimization potential
        </Text>
      </Animated.View>
      
      {/* Hero: Rewards IQ Score */}
      {rewardsIQ && (
        <Animated.View style={[pulseStyle]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RewardsIQ')}
          >
            <Animated.View 
              entering={FadeInDown.delay(100).duration(500)}
              style={scoreStyle}
            >
              <LinearGradient
                colors={[colors.background.secondary, colors.background.tertiary]}
                style={styles.heroCard}
              >
                {/* Score Circle */}
                <View style={styles.heroScoreSection}>
                  <View style={[
                    styles.scoreCircle,
                    { borderColor: getScoreColor(rewardsIQ.overallScore) }
                  ]}>
                    <LinearGradient
                      colors={[
                        getScoreColor(rewardsIQ.overallScore),
                        getScoreColor(rewardsIQ.overallScore) + 'CC'
                      ]}
                      style={styles.scoreGradient}
                    >
                      <Text style={styles.scoreNumber}>{rewardsIQ.overallScore}</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.heroInfo}>
                    <View style={styles.heroTitleRow}>
                      <Target size={18} color={colors.primary.main} />
                      <Text style={styles.heroTitle}>Rewards IQ</Text>
                    </View>
                    <Text style={styles.heroPercentile}>
                      Top {100 - rewardsIQ.percentile}% of users
                    </Text>
                    {rewardsIQ.trend !== 'stable' && (
                      <View style={styles.trendRow}>
                        {rewardsIQ.trend === 'up' ? (
                          <TrendingUp size={14} color={colors.primary.main} />
                        ) : (
                          <TrendingDown size={14} color={colors.error.main} />
                        )}
                        <Text style={[
                          styles.trendText,
                          { color: rewardsIQ.trend === 'up' ? colors.primary.main : colors.error.main }
                        ]}>
                          {rewardsIQ.trend === 'up' ? '+' : ''}{rewardsIQ.trendAmount} from last time
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <ChevronRight size={24} color={colors.text.tertiary} />
                </View>
                
                {/* Component Scores */}
                <View style={styles.componentScores}>
                  <View style={styles.componentItem}>
                    <Text style={styles.componentValue}>{rewardsIQ.optimalCardUsageScore}</Text>
                    <Text style={styles.componentLabel}>Card Usage</Text>
                  </View>
                  <View style={styles.componentDivider} />
                  <View style={styles.componentItem}>
                    <Text style={styles.componentValue}>{rewardsIQ.portfolioOptimizationScore}</Text>
                    <Text style={styles.componentLabel}>Portfolio</Text>
                  </View>
                  <View style={styles.componentDivider} />
                  <View style={styles.componentItem}>
                    <Text style={[
                      styles.componentValue,
                      rewardsIQ.autoPilotScore === 0 && styles.componentValueOff
                    ]}>
                      {rewardsIQ.autoPilotScore > 0 ? rewardsIQ.autoPilotScore : 'Off'}
                    </Text>
                    <Text style={styles.componentLabel}>Smart Wallet</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Quick Stats Grid */}
      <View style={styles.quickStatsSection}>
        <Text style={styles.sectionTitle}>Your Numbers</Text>
        
        {/* Missed Rewards - The Hook */}
        {missedRewards && missedRewards.totalMissed > 0 && (
          <QuickStatCard
            icon={<TrendingDown size={24} color={colors.error.main} />}
            label="Left on the table this month"
            value={`-$${missedRewards.totalMissed.toFixed(2)}`}
            subtext={`$${missedRewards.projectedYearlyMissed.toLocaleString()}/year`}
            color={colors.error.main}
            onPress={() => navigation.navigate('MissedRewards')}
            delay={200}
          />
        )}
        
        {/* Portfolio Optimization */}
        {optimization && optimization.annualGain > 0 && (
          <QuickStatCard
            icon={<Sparkles size={24} color={colors.primary.main} />}
            label="Potential annual gain"
            value={`+$${optimization.annualGain.toFixed(0)}`}
            subtext="Optimize your cards →"
            color={colors.primary.main}
            onPress={() => navigation.navigate('PortfolioOptimizer')}
            delay={300}
          />
        )}
        
        {/* Current Portfolio Value */}
        {optimization && (
          <QuickStatCard
            icon={<CreditCard size={24} color={colors.accent.main} />}
            label="Current annual rewards"
            value={`$${optimization.currentSetup.annualRewards.toLocaleString()}`}
            subtext={`${optimization.currentSetup.cards.length} cards`}
            color={colors.accent.main}
            onPress={() => navigation.navigate('PortfolioOptimizer')}
            delay={400}
          />
        )}
      </View>
      
      {/* Top Categories Section */}
      {missedRewards && missedRewards.byCategory.length > 0 && (
        <Animated.View 
          entering={FadeInUp.delay(500).duration(400)}
          style={styles.categoriesSection}
        >
          <Text style={styles.sectionTitle}>Where You're Missing Out</Text>
          
          <View style={styles.categoriesList}>
            {missedRewards.byCategory.slice(0, 4).map((cat, index) => {
              const info = CATEGORY_INFO[cat.category];
              return (
                <TouchableOpacity
                  key={cat.category}
                  style={styles.categoryItem}
                  onPress={() => navigation.navigate('MissedRewards')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: info.color + '20' }]}>
                    <Text style={styles.categoryEmoji}>{info.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{info.label}</Text>
                    <Text style={styles.categorySpend}>
                      ${cat.totalSpend.toFixed(0)} spent
                    </Text>
                  </View>
                  <Text style={styles.categoryMissed}>
                    -${cat.totalMissed.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('MissedRewards')}
          >
            <Text style={styles.seeAllText}>See Full Analysis</Text>
            <ChevronRight size={18} color={colors.primary.main} />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Action Cards */}
      <Animated.View 
        entering={FadeInUp.delay(600).duration(400)}
        style={styles.actionsSection}
      >
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsList}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RewardsIQ')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.accent.main + '20', colors.accent.main + '05']}
              style={styles.actionGradient}
            >
              <Target size={24} color={colors.accent.main} />
              <Text style={styles.actionTitle}>Improve Score</Text>
              <Text style={styles.actionDesc}>Get tips to boost your Rewards IQ</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PortfolioOptimizer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary.main + '20', colors.primary.main + '05']}
              style={styles.actionGradient}
            >
              <Zap size={24} color={colors.primary.main} />
              <Text style={styles.actionTitle}>Optimize Cards</Text>
              <Text style={styles.actionDesc}>Find the best card combination</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.actionCardFull}
          onPress={() => navigation.navigate('SpendingInsights')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.info.main + '15', colors.info.main + '05']}
            style={styles.actionGradientFull}
          >
            <PieChart size={24} color={colors.info.main} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Spending Insights</Text>
              <Text style={styles.actionDesc}>Visual breakdown of your spending patterns</Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCardFull}
          onPress={() => navigation.navigate('CardTracker')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.warning.main + '15', colors.warning.main + '05']}
            style={styles.actionGradientFull}
          >
            <Clock size={24} color={colors.warning.main} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Card Tracker</Text>
              <Text style={styles.actionDesc}>Track signup bonuses & spending requirements</Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Bottom padding */}
      <View style={{ height: 100 }} />
    </ScrollView>
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
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
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
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  // Hero Card
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  heroScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scoreGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.background.primary,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  heroPercentile: {
    fontSize: 14,
    color: colors.warning.main,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 13,
  },
  componentScores: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary + '50',
    borderRadius: borderRadius.lg,
    padding: 12,
  },
  componentItem: {
    flex: 1,
    alignItems: 'center',
  },
  componentDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  componentValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  componentValueOff: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  componentLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  
  // Quick Stats
  quickStatsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  quickStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  quickStatSubtext: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  
  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesList: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  categorySpend: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  categoryMissed: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error.main,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
  },
  
  // Actions
  actionsSection: {
    marginBottom: 24,
  },
  actionsList: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  actionCardFull: {
    marginTop: 12,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionGradientFull: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
});
