/**
 * MissedRewardsScreen - The killer feature 💸
 * Shows exactly how much money users are leaving on the table
 * Creates URGENCY through concrete dollar amounts
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { AlertTriangle, TrendingDown, ArrowRight, DollarSign, ChevronRight } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { GradientText } from '../components';
import { MissedRewardsAnalysis, CategoryMissedRewards, MissedReward } from '../types/rewards-iq';
import { analyzeMissedRewards } from '../services/RewardsIQService';
import { CATEGORY_INFO } from '../services/MockTransactionData';
import { SpendingCategory } from '../types';

// ============================================================================
// Animated Counter Component
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: any;
  duration?: number;
}

function AnimatedCounter({ value, prefix = '$', suffix = '', style, duration = 1500 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased * 100) / 100);
      
      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [value, duration]);
  
  return (
    <Text style={style}>
      {prefix}{displayValue.toFixed(2)}{suffix}
    </Text>
  );
}

// ============================================================================
// Category Breakdown Card
// ============================================================================

interface CategoryCardProps {
  category: CategoryMissedRewards;
  index: number;
  onPress: () => void;
}

function CategoryCard({ category, index, onPress }: CategoryCardProps) {
  const info = CATEGORY_INFO[category.category];
  const percentage = category.totalSpend > 0 
    ? (category.totalMissed / category.totalSpend) * 100 
    : 0;
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: info.color + '20' }]}>
            <Text style={styles.categoryEmoji}>{info.icon}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryLabel}>{info.label}</Text>
            <Text style={styles.categoryTransactions}>
              {category.transactionCount} transactions
            </Text>
          </View>
          <View style={styles.categoryAmount}>
            <Text style={styles.missedAmount}>-${category.totalMissed.toFixed(2)}</Text>
            <Text style={styles.missedPercent}>
              {percentage.toFixed(1)}% lost
            </Text>
          </View>
        </View>
        
        {/* Progress bar showing missed vs optimal */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${100 - Math.min(percentage * 2, 100)}%`,
                  backgroundColor: info.color,
                }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Top Missed Transaction Item
// ============================================================================

interface MissedTransactionProps {
  missed: MissedReward;
  index: number;
}

function MissedTransactionItem({ missed, index }: MissedTransactionProps) {
  const info = CATEGORY_INFO[missed.transaction.category];
  const date = new Date(missed.transaction.date).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
  
  return (
    <Animated.View
      entering={FadeInUp.delay(300 + index * 80).duration(300)}
      style={styles.transactionItem}
    >
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionEmoji}>{info.icon}</Text>
        <View>
          <Text style={styles.transactionMerchant} numberOfLines={1}>
            {missed.transaction.merchantName}
          </Text>
          <Text style={styles.transactionDate}>{date}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionMissed}>-${missed.missedCad.toFixed(2)}</Text>
        <Text style={styles.transactionShouldUse}>
          Use {missed.optimalCard.name.split(' ')[0]}
        </Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function MissedRewardsScreen() {
  const [analysis, setAnalysis] = useState<MissedRewardsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const shakeValue = useSharedValue(0);
  
  const loadData = useCallback(async () => {
    try {
      const data = await analyzeMissedRewards();
      setAnalysis(data);
      setError(null);
      
      // Trigger attention-grabbing animation
      shakeValue.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(-1, { duration: 100 }),
        withTiming(0.5, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
    } catch (e) {
      setError('Failed to analyze rewards. Please try again.');
      console.error(e);
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
  
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value * 5 }],
  }));
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Analyzing your rewards...</Text>
      </View>
    );
  }
  
  if (error || !analysis) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
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
      {/* Hero Section - The Big Number */}
      <Animated.View style={[styles.heroSection, shakeStyle]}>
        <LinearGradient
          colors={[colors.error.main + '20', colors.background.primary]}
          style={styles.heroGradient}
        >
          <View style={styles.heroIconContainer}>
            <TrendingDown size={32} color={colors.error.main} />
          </View>
          
          <Text style={styles.heroLabel}>You're leaving money on the table</Text>
          
          <View style={styles.heroAmountContainer}>
            <AnimatedCounter
              value={analysis.totalMissed}
              style={styles.heroAmount}
              duration={2000}
            />
            <Text style={styles.heroPeriod}>this month</Text>
          </View>
          
          {/* Projected yearly */}
          <View style={styles.projectionContainer}>
            <DollarSign size={16} color={colors.warning.main} />
            <Text style={styles.projectionText}>
              That's <Text style={styles.projectionAmount}>${analysis.projectedYearlyMissed.toLocaleString()}</Text> per year!
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Quick Stats */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.statsRow}
      >
        <View style={styles.statBox}>
          <Text style={styles.statValue}>${analysis.totalSpend.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxMiddle]}>
          <Text style={styles.statValue}>${analysis.totalActualRewards.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.primary.main }]}>
            ${analysis.totalOptimalRewards.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Could've Earned</Text>
        </View>
      </Animated.View>
      
      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Where you're missing out</Text>
        <Text style={styles.sectionSubtitle}>
          Tap to see which card to use
        </Text>
        
        {analysis.byCategory.slice(0, 5).map((cat, index) => (
          <CategoryCard
            key={cat.category}
            category={cat}
            index={index}
            onPress={() => {/* Navigate to category detail */}}
          />
        ))}
      </View>
      
      {/* Top Missed Transactions */}
      {analysis.topMissedTransactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biggest misses</Text>
          <Text style={styles.sectionSubtitle}>
            These transactions cost you the most
          </Text>
          
          <View style={styles.transactionsList}>
            {analysis.topMissedTransactions.map((missed, index) => (
              <MissedTransactionItem
                key={missed.transaction.id}
                missed={missed}
                index={index}
              />
            ))}
          </View>
        </View>
      )}
      
      {/* CTA Button */}
      <Animated.View 
        entering={FadeInUp.delay(600).duration(500)}
        style={styles.ctaContainer}
      >
        <TouchableOpacity activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Optimize My Cards</Text>
            <ChevronRight size={24} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.ctaHint}>
          See how to earn ${analysis.projectedYearlyMissed.toFixed(0)} more per year
        </Text>
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
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  
  // Hero Section
  heroSection: {
    marginHorizontal: 16,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  heroAmountContainer: {
    alignItems: 'center',
  },
  heroAmount: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.error.main,
    letterSpacing: -2,
  },
  heroPeriod: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  projectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: colors.warning.main + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  projectionText: {
    fontSize: 14,
    color: colors.warning.main,
  },
  projectionAmount: {
    fontWeight: '700',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border.light,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  
  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 16,
  },
  
  // Category Cards
  categoryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  categoryTransactions: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  missedAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error.main,
  },
  missedPercent: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Transactions List
  transactionsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionMerchant: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    maxWidth: 150,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionMissed: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error.main,
  },
  transactionShouldUse: {
    fontSize: 11,
    color: colors.primary.main,
    marginTop: 2,
  },
  
  // CTA
  ctaContainer: {
    marginHorizontal: 16,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 32,
    gap: 8,
    width: '100%',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background.primary,
  },
  ctaHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 12,
    textAlign: 'center',
  },
});
