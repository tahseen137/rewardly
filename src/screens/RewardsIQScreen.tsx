/**
 * RewardsIQScreen - Gamification & Social Sharing 🎯
 * Shows your Rewards IQ Score with animated gauge
 * Built for viral sharing potential
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { Share2, TrendingUp, TrendingDown, Minus, Zap, Target, Navigation, ChevronRight, Award, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { RewardsIQScore, ShareableStats } from '../types/rewards-iq';
import { calculateRewardsIQ, getShareableStats } from '../services/RewardsIQService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Animated Score Gauge Component
// ============================================================================

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScoreGauge({ score, size = 220 }: ScoreGaugeProps) {
  const progress = useSharedValue(0);
  const displayScore = useSharedValue(0);
  
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    progress.value = withDelay(
      300,
      withTiming(score / 100, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      })
    );
    
    // Animate the display score number
    const interval = setInterval(() => {
      displayScore.value = Math.min(displayScore.value + 1, score);
    }, 20);
    
    setTimeout(() => clearInterval(interval), 2000);
    
    return () => clearInterval(interval);
  }, [score]);
  
  const animatedStrokeStyle = useAnimatedStyle(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return colors.primary.main;
    if (score >= 60) return colors.warning.main;
    return colors.error.main;
  };
  
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= score) {
        clearInterval(interval);
        setDisplayValue(score);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setDisplayValue(current);
      }
    }, 20);
    
    return () => clearInterval(interval);
  }, [score]);
  
  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.gaugeSvg}>
        <Defs>
          <SvgGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary.main} />
            <Stop offset="100%" stopColor={colors.accent.main} />
          </SvgGradient>
        </Defs>
        
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border.light}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          style={animatedStrokeStyle}
        />
      </Svg>
      
      {/* Center Content */}
      <View style={styles.gaugeCenter}>
        <Text style={styles.gaugeScore}>{displayValue}</Text>
        <Text style={styles.gaugeLabel}>Rewards IQ</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Score Component Card
// ============================================================================

interface ScoreComponentProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  weight: string;
  index: number;
}

function ScoreComponent({ label, score, icon, weight, index }: ScoreComponentProps) {
  const getColor = () => {
    if (score >= 80) return colors.primary.main;
    if (score >= 60) return colors.warning.main;
    return colors.error.main;
  };
  
  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 100).duration(400)}
      style={styles.componentCard}
    >
      <View style={styles.componentLeft}>
        <View style={[styles.componentIcon, { backgroundColor: getColor() + '20' }]}>
          {icon}
        </View>
        <View>
          <Text style={styles.componentLabel}>{label}</Text>
          <Text style={styles.componentWeight}>{weight}</Text>
        </View>
      </View>
      <View style={styles.componentRight}>
        <Text style={[styles.componentScore, { color: getColor() }]}>{score}</Text>
        <View style={styles.componentBar}>
          <View
            style={[
              styles.componentBarFill,
              { width: `${score}%`, backgroundColor: getColor() },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function RewardsIQScreen() {
  const [scoreData, setScoreData] = useState<RewardsIQScore | null>(null);
  const [shareStats, setShareStats] = useState<ShareableStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = useCallback(async () => {
    try {
      const [score, stats] = await Promise.all([
        calculateRewardsIQ(),
        getShareableStats(),
      ]);
      setScoreData(score);
      setShareStats(stats);
    } catch (e) {
      console.error('Failed to load Rewards IQ:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleShare = async () => {
    if (!shareStats) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      await Share.share({
        message: shareStats.shareText,
        url: shareStats.shareUrl,
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };
  
  if (isLoading || !scoreData) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingGauge}>
          <Text style={styles.loadingText}>Calculating...</Text>
        </View>
      </View>
    );
  }
  
  const TrendIcon = scoreData.trend === 'up' 
    ? TrendingUp 
    : scoreData.trend === 'down' 
      ? TrendingDown 
      : Minus;
  
  const trendColor = scoreData.trend === 'up'
    ? colors.primary.main
    : scoreData.trend === 'down'
      ? colors.error.main
      : colors.text.tertiary;
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(500)}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Rewards IQ</Text>
        <Text style={styles.headerSubtitle}>
          See how well you're optimizing your rewards
        </Text>
      </Animated.View>
      
      {/* Score Gauge */}
      <Animated.View 
        entering={FadeInDown.delay(100).duration(600)}
        style={styles.gaugeSection}
      >
        <ScoreGauge score={scoreData.overallScore} />
        
        {/* Percentile Badge */}
        <View style={styles.percentileBadge}>
          <Trophy size={14} color={colors.warning.main} />
          <Text style={styles.percentileText}>
            Top {100 - scoreData.percentile}% of users
          </Text>
        </View>
        
        {/* Trend Indicator */}
        {scoreData.previousScore !== undefined && (
          <View style={styles.trendContainer}>
            <TrendIcon size={16} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {scoreData.trend === 'up' ? '+' : scoreData.trend === 'down' ? '' : ''}
              {scoreData.trendAmount} from last month
            </Text>
          </View>
        )}
      </Animated.View>
      
      {/* Score Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        
        <ScoreComponent
          label="Card Usage"
          score={scoreData.optimalCardUsageScore}
          icon={<Target size={20} color={colors.primary.main} />}
          weight="60% weight"
          index={0}
        />
        
        <ScoreComponent
          label="Portfolio"
          score={scoreData.portfolioOptimizationScore}
          icon={<Award size={20} color={colors.accent.main} />}
          weight="25% weight"
          index={1}
        />
        
        <ScoreComponent
          label="Smart Wallet"
          score={scoreData.autoPilotScore}
          icon={<Navigation size={20} color={colors.info.main} />}
          weight="15% weight"
          index={2}
        />
      </View>
      
      {/* Tips to Improve */}
      <Animated.View 
        entering={FadeInUp.delay(700).duration(400)}
        style={styles.tipsSection}
      >
        <Text style={styles.sectionTitle}>Boost Your Score</Text>
        
        {scoreData.optimalCardUsageScore < 80 && (
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Zap size={20} color={colors.warning.main} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Use the right card more often</Text>
              <Text style={styles.tipText}>
                Check Rewardly before each purchase to maximize rewards
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
          </View>
        )}
        
        {scoreData.portfolioOptimizationScore < 80 && (
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Target size={20} color={colors.accent.main} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Optimize your card portfolio</Text>
              <Text style={styles.tipText}>
                See which cards could earn you more
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
          </View>
        )}
        
        {scoreData.autoPilotScore === 0 && (
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Navigation size={20} color={colors.info.main} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Enable Smart Wallet</Text>
              <Text style={styles.tipText}>
                Get automatic card recommendations when you arrive at stores
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
          </View>
        )}
      </Animated.View>
      
      {/* Share Button */}
      <Animated.View 
        entering={FadeInUp.delay(800).duration(400)}
        style={styles.shareSection}
      >
        <TouchableOpacity onPress={handleShare} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.accent.main, colors.accent.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareButton}
          >
            <Share2 size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share My Score</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.shareHint}>
          Show off your rewards optimization skills 🎯
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
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGauge: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.background.secondary,
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
  },
  
  // Gauge
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeSvg: {
    position: 'absolute',
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugeScore: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -2,
  },
  gaugeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: -4,
  },
  percentileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginTop: 16,
    gap: 6,
  },
  percentileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.main,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 13,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  
  // Score Components
  componentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  componentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  componentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  componentLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  componentWeight: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  componentRight: {
    alignItems: 'flex-end',
    width: 80,
  },
  componentScore: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  componentBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  componentBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Tips
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  
  // Share
  shareSection: {
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 32,
    gap: 10,
    width: SCREEN_WIDTH - 32,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  shareHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 12,
  },
});
