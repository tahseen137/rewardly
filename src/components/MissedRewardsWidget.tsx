/**
 * MissedRewardsWidget - Attention-grabbing "money left on table" display
 * Creates urgency and drives engagement
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TrendingDown, AlertCircle, ChevronRight } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { MissedRewardsAnalysis } from '../types/rewards-iq';
import { analyzeMissedRewards } from '../services/RewardsIQService';
import { CATEGORY_INFO } from '../services/MockTransactionData';

interface MissedRewardsWidgetProps {
  onPress?: () => void;
}

export default function MissedRewardsWidget({ onPress }: MissedRewardsWidgetProps) {
  const [analysis, setAnalysis] = useState<MissedRewardsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const shakeValue = useSharedValue(0);
  const countValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (analysis) {
      // Animate the count up
      const duration = 1500;
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(analysis.totalMissed * eased * 100) / 100);
        
        if (progress >= 1) {
          clearInterval(interval);
          // Attention shake
          shakeValue.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(-1, { duration: 100 }),
            withTiming(0.5, { duration: 100 }),
            withTiming(0, { duration: 100 })
          );
        }
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [analysis]);
  
  const loadData = async () => {
    try {
      const data = await analyzeMissedRewards();
      setAnalysis(data);
    } catch (e) {
      console.error('Failed to load missed rewards:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value * 3 }],
  }));
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.error.main} />
      </View>
    );
  }
  
  if (!analysis || analysis.totalMissed === 0) {
    // Show positive message if no missed rewards
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient
            colors={[colors.primary.main + '15', colors.primary.main + '05']}
            style={styles.container}
          >
            <View style={styles.iconSuccess}>
              <Text style={styles.successEmoji}>🎉</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.successTitle}>You're crushing it!</Text>
              <Text style={styles.successText}>
                You're using the optimal card for most purchases
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }
  
  // Get top 3 missed categories
  const topCategories = analysis.byCategory
    .filter(c => c.totalMissed > 0)
    .slice(0, 3);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.containerAnimated, shakeStyle]}>
        <LinearGradient
          colors={[colors.error.main + '15', colors.background.secondary]}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <TrendingDown size={20} color={colors.error.main} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerLabel}>Money left on the table</Text>
              <Text style={styles.missedAmount}>-${displayValue.toFixed(2)}</Text>
            </View>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>This Month</Text>
            </View>
          </View>
          
          {/* Category breakdown */}
          <View style={styles.categoriesRow}>
            {topCategories.map((cat) => {
              const info = CATEGORY_INFO[cat.category];
              return (
                <View key={cat.category} style={styles.categoryChip}>
                  <Text style={styles.categoryEmoji}>{info.icon}</Text>
                  <Text style={styles.categoryMissed}>
                    ${cat.totalMissed.toFixed(0)}
                  </Text>
                </View>
              );
            })}
          </View>
          
          {/* Projected yearly */}
          <View style={styles.projectionRow}>
            <AlertCircle size={14} color={colors.warning.main} />
            <Text style={styles.projectionText}>
              That's <Text style={styles.projectionAmount}>
                ${analysis.projectedYearlyMissed.toLocaleString()}
              </Text>/year
            </Text>
          </View>
          
          {/* CTA */}
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>See what you're missing</Text>
            <ChevronRight size={18} color={colors.error.main} />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    height: 120,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerAnimated: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  container: {
    borderRadius: borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error.main + '30',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  missedAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error.main,
  },
  periodBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  periodText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  
  // Categories
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryMissed: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error.main,
  },
  
  // Projection
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    marginBottom: 12,
    gap: 6,
  },
  projectionText: {
    fontSize: 13,
    color: colors.warning.main,
  },
  projectionAmount: {
    fontWeight: '700',
  },
  
  // CTA
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error.main,
  },
  
  // Success state
  iconSuccess: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary.main,
    marginBottom: 2,
  },
  successText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
