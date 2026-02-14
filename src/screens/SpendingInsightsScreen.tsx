/**
 * SpendingInsightsScreen - Visual spending breakdown with insights 📊
 * Shows pie charts, trends, and AI-powered recommendations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  PieChart,
  BarChart2,
  Calendar,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { SpendingCategory } from '../types';
import { MissedRewardsAnalysis } from '../types/rewards-iq';
import { getSpendingProfile, analyzeMissedRewards } from '../services/RewardsIQService';
import { CATEGORY_INFO } from '../services/MockTransactionData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIE_SIZE = SCREEN_WIDTH - 80;
const PIE_RADIUS = PIE_SIZE / 2 - 20;

// ============================================================================
// Animated Pie Chart Component
// ============================================================================

interface PieSlice {
  category: SpendingCategory;
  amount: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

interface PieChartProps {
  slices: PieSlice[];
  totalSpending: number;
  onSlicePress?: (slice: PieSlice) => void;
}

function AnimatedPieChart({ slices, totalSpending, onSlicePress }: PieChartProps) {
  const animationProgress = useSharedValue(0);
  
  useEffect(() => {
    animationProgress.value = withDelay(
      300,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  }, []);
  
  const centerX = PIE_SIZE / 2;
  const centerY = PIE_SIZE / 2;
  
  // Create SVG paths for each slice
  const createSlicePath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };
  
  return (
    <View style={styles.pieContainer}>
      <Svg width={PIE_SIZE} height={PIE_SIZE}>
        {slices.map((slice, index) => (
          <Path
            key={slice.category}
            d={createSlicePath(slice.startAngle, slice.endAngle, PIE_RADIUS)}
            fill={slice.color}
            opacity={0.9}
          />
        ))}
        
        {/* Center hole for donut effect */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={PIE_RADIUS * 0.5}
          fill={colors.background.primary}
        />
      </Svg>
      
      {/* Center text */}
      <View style={styles.pieCenter}>
        <Text style={styles.pieTotalLabel}>Total Monthly</Text>
        <Text style={styles.pieTotalValue}>
          ${totalSpending.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// Category Legend Item
// ============================================================================

interface LegendItemProps {
  slice: PieSlice;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}

function LegendItem({ slice, index, isSelected, onPress }: LegendItemProps) {
  const info = CATEGORY_INFO[slice.category];
  
  return (
    <Animated.View entering={FadeInDown.delay(500 + index * 80).duration(300)}>
      <TouchableOpacity
        style={[styles.legendItem, isSelected && styles.legendItemSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
        <View style={styles.legendInfo}>
          <Text style={styles.legendIcon}>{info.icon}</Text>
          <View style={styles.legendText}>
            <Text style={styles.legendLabel}>{info.label}</Text>
            <Text style={styles.legendAmount}>${slice.amount.toLocaleString()}/mo</Text>
          </View>
        </View>
        <Text style={styles.legendPercentage}>{slice.percentage.toFixed(0)}%</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Insight Card Component
// ============================================================================

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  color: string;
  onPress?: () => void;
  delay: number;
}

function InsightCard({ icon, title, description, action, color, onPress, delay }: InsightCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)}>
      <TouchableOpacity
        style={[styles.insightCard, { borderLeftColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.insightIcon, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{title}</Text>
          <Text style={styles.insightDescription}>{description}</Text>
          {action && (
            <View style={styles.insightAction}>
              <Text style={[styles.insightActionText, { color }]}>{action}</Text>
              <ChevronRight size={16} color={color} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Trend Card Component
// ============================================================================

interface TrendCardProps {
  category: SpendingCategory;
  currentAmount: number;
  previousAmount: number;
  index: number;
}

function TrendCard({ category, currentAmount, previousAmount, index }: TrendCardProps) {
  const info = CATEGORY_INFO[category];
  const change = currentAmount - previousAmount;
  const changePercent = previousAmount > 0 
    ? Math.round((change / previousAmount) * 100) 
    : 0;
  const isUp = change > 0;
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(800 + index * 100).duration(300)}
      style={styles.trendCard}
    >
      <View style={[styles.trendIcon, { backgroundColor: info.color + '20' }]}>
        <Text style={styles.trendEmoji}>{info.icon}</Text>
      </View>
      <View style={styles.trendInfo}>
        <Text style={styles.trendLabel}>{info.label}</Text>
        <Text style={styles.trendAmount}>${currentAmount.toLocaleString()}</Text>
      </View>
      <View style={[
        styles.trendBadge,
        { backgroundColor: isUp ? colors.error.main + '15' : colors.primary.main + '15' }
      ]}>
        {isUp ? (
          <TrendingUp size={14} color={colors.error.main} />
        ) : (
          <TrendingDown size={14} color={colors.primary.main} />
        )}
        <Text style={[
          styles.trendChange,
          { color: isUp ? colors.error.main : colors.primary.main }
        ]}>
          {changePercent > 0 ? '+' : ''}{changePercent}%
        </Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function SpendingInsightsScreen() {
  const navigation = useNavigation();
  const [spending, setSpending] = useState<Map<SpendingCategory, number>>(new Map());
  const [missedRewards, setMissedRewards] = useState<MissedRewardsAnalysis | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SpendingCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadData = useCallback(async () => {
    try {
      const [spendingData, missedData] = await Promise.all([
        getSpendingProfile(),
        analyzeMissedRewards(),
      ]);
      setSpending(spendingData);
      setMissedRewards(missedData);
    } catch (e) {
      console.error('Failed to load spending data:', e);
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
  
  // Calculate pie chart data
  const { slices, totalSpending } = useMemo(() => {
    const entries = Array.from(spending.entries()).filter(([_, amount]) => amount > 0);
    const total = entries.reduce((sum, [_, amount]) => sum + amount, 0);
    
    let currentAngle = 0;
    const sliceData: PieSlice[] = entries.map(([category, amount]) => {
      const percentage = (amount / total) * 100;
      const angle = (percentage / 100) * 360;
      const slice: PieSlice = {
        category,
        amount,
        percentage,
        color: CATEGORY_INFO[category].color,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      };
      currentAngle += angle;
      return slice;
    });
    
    // Sort by amount descending
    sliceData.sort((a, b) => b.amount - a.amount);
    
    return { slices: sliceData, totalSpending: total };
  }, [spending]);
  
  // Generate insights
  const insights = useMemo(() => {
    const result: Array<{
      icon: React.ReactNode;
      title: string;
      description: string;
      action?: string;
      color: string;
    }> = [];
    
    if (slices.length > 0) {
      const topCategory = slices[0];
      const info = CATEGORY_INFO[topCategory.category];
      result.push({
        icon: <Lightbulb size={20} color={colors.warning.main} />,
        title: `${info.label} is your top category`,
        description: `You spend ${topCategory.percentage.toFixed(0)}% of your budget on ${info.label.toLowerCase()}. Make sure you're using the best card for this!`,
        action: 'Find best card',
        color: colors.warning.main,
      });
    }
    
    if (missedRewards && missedRewards.totalMissed > 5) {
      result.push({
        icon: <TrendingUp size={20} color={colors.primary.main} />,
        title: 'Optimization opportunity',
        description: `You could save $${missedRewards.projectedYearlyMissed.toFixed(0)} per year by using optimal cards.`,
        action: 'See details',
        color: colors.primary.main,
      });
    }
    
    return result;
  }, [slices, missedRewards]);
  
  // Generate mock trend data (showing 10% variance from current)
  const trends = useMemo(() => {
    return slices.slice(0, 4).map(slice => ({
      category: slice.category,
      currentAmount: slice.amount,
      previousAmount: Math.round(slice.amount * (0.9 + Math.random() * 0.2)), // ±10%
    }));
  }, [slices]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <PieChart size={48} color={colors.primary.main} />
        <Text style={styles.loadingText}>Analyzing spending...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button Header */}
      <View style={styles.backHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={colors.text.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
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
          <Text style={styles.headerTitle}>Spending Insights</Text>
          <Text style={styles.headerSubtitle}>
            Understand your spending patterns
          </Text>
        </Animated.View>
      
      {/* Pie Chart */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <AnimatedPieChart
          slices={slices}
          totalSpending={totalSpending}
          onSlicePress={(slice) => setSelectedCategory(slice.category)}
        />
      </Animated.View>
      
      {/* Legend */}
      <View style={styles.legendSection}>
        {slices.map((slice, index) => (
          <LegendItem
            key={slice.category}
            slice={slice}
            index={index}
            isSelected={selectedCategory === slice.category}
            onPress={() => setSelectedCategory(
              selectedCategory === slice.category ? null : slice.category
            )}
          />
        ))}
      </View>
      
      {/* Insights */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={18} color={colors.warning.main} />
            <Text style={styles.sectionTitle}>Smart Insights</Text>
          </View>
          
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              icon={insight.icon}
              title={insight.title}
              description={insight.description}
              action={insight.action}
              color={insight.color}
              delay={600 + index * 100}
            />
          ))}
        </View>
      )}
      
      {/* Monthly Trends */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BarChart2 size={18} color={colors.accent.main} />
          <Text style={styles.sectionTitle}>Monthly Trends</Text>
        </View>
        
        <View style={styles.trendsGrid}>
          {trends.map((trend, index) => (
            <TrendCard
              key={trend.category}
              category={trend.category}
              currentAmount={trend.currentAmount}
              previousAmount={trend.previousAmount}
              index={index}
            />
          ))}
        </View>
      </View>
      
        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
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
  backHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
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
  
  // Pie Chart
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  pieTotalLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  pieTotalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  
  // Legend
  legendSection: {
    gap: 8,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  legendItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendIcon: {
    fontSize: 20,
  },
  legendText: {},
  legendLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  legendAmount: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  legendPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  // Insight Card
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 3,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  insightActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Trends
  trendsGrid: {
    gap: 8,
  },
  trendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trendIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trendEmoji: {
    fontSize: 20,
  },
  trendInfo: {
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  trendAmount: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  trendChange: {
    fontSize: 13,
    fontWeight: '600',
  },
});
