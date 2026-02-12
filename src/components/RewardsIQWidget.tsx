/**
 * RewardsIQWidget - Compact score display for home screen
 * Tappable to navigate to full Rewards IQ screen
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { Trophy, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { RewardsIQScore } from '../types/rewards-iq';
import { calculateRewardsIQ } from '../services/RewardsIQService';

interface RewardsIQWidgetProps {
  onPress?: () => void;
  compact?: boolean;
}

export default function RewardsIQWidget({ onPress, compact = false }: RewardsIQWidgetProps) {
  const [score, setScore] = useState<RewardsIQScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const pulseScale = useSharedValue(1);
  const scoreScale = useSharedValue(0);
  
  useEffect(() => {
    loadScore();
  }, []);
  
  useEffect(() => {
    if (score) {
      scoreScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      
      // Subtle pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [score]);
  
  const loadScore = async () => {
    try {
      const data = await calculateRewardsIQ();
      setScore(data);
    } catch (e) {
      console.error('Failed to load Rewards IQ:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    opacity: scoreScale.value,
  }));
  
  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator size="small" color={colors.primary.main} />
      </View>
    );
  }
  
  if (!score) {
    return null;
  }
  
  const getScoreColor = () => {
    if (score.overallScore >= 80) return colors.primary.main;
    if (score.overallScore >= 60) return colors.warning.main;
    return colors.error.main;
  };
  
  const TrendIcon = score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : null;
  
  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient
            colors={[getScoreColor() + '15', getScoreColor() + '05']}
            style={styles.compactContainer}
          >
            <View style={[styles.compactScoreCircle, { borderColor: getScoreColor() }]}>
              <Text style={[styles.compactScore, { color: getScoreColor() }]}>
                {score.overallScore}
              </Text>
            </View>
            <View style={styles.compactInfo}>
              <Text style={styles.compactLabel}>Rewards IQ</Text>
              <Text style={styles.compactPercentile}>Top {100 - score.percentile}%</Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.container, pulseStyle]}>
        <LinearGradient
          colors={[colors.background.secondary, colors.background.tertiary]}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Trophy size={18} color={colors.warning.main} />
              <Text style={styles.title}>Your Rewards IQ</Text>
            </View>
            <View style={styles.percentileBadge}>
              <Text style={styles.percentileText}>Top {100 - score.percentile}%</Text>
            </View>
          </View>
          
          {/* Score Display */}
          <View style={styles.scoreSection}>
            <Animated.View style={[styles.scoreCircle, scoreStyle]}>
              <LinearGradient
                colors={[getScoreColor(), getScoreColor() + 'CC']}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreNumber}>{score.overallScore}</Text>
              </LinearGradient>
            </Animated.View>
            
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              {TrendIcon && (
                <View style={styles.trendRow}>
                  <TrendIcon
                    size={14}
                    color={score.trend === 'up' ? colors.primary.main : colors.error.main}
                  />
                  <Text style={[
                    styles.trendText,
                    { color: score.trend === 'up' ? colors.primary.main : colors.error.main }
                  ]}>
                    {score.trend === 'up' ? '+' : ''}{score.trendAmount} from last time
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score.optimalCardUsageScore}</Text>
              <Text style={styles.statLabel}>Card Usage</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score.portfolioOptimizationScore}</Text>
              <Text style={styles.statLabel}>Portfolio</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                score.autoPilotScore === 0 && styles.statValueDisabled
              ]}>
                {score.autoPilotScore > 0 ? score.autoPilotScore : 'Off'}
              </Text>
              <Text style={styles.statLabel}>AutoPilot</Text>
            </View>
          </View>
          
          {/* CTA */}
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>See full breakdown</Text>
            <ChevronRight size={18} color={colors.primary.main} />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  gradient: {
    padding: 16,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  percentileBadge: {
    backgroundColor: colors.warning.main + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  percentileText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning.main,
  },
  
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    marginRight: 16,
  },
  scoreGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.background.primary,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.text.secondary,
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
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary + '50',
    borderRadius: borderRadius.lg,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statValueDisabled: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
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
    color: colors.primary.main,
  },
  
  // Compact styles
  containerCompact: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: borderRadius.lg,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  compactScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  compactInfo: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  compactPercentile: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
