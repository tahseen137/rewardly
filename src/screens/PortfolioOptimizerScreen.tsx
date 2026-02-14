/**
 * PortfolioOptimizerScreen - Show exact dollar value of switching cards 📊
 * "Your Current Setup: $840/year vs Recommended: $1,420/year = $580 gain!"
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowRight,
  TrendingUp,
  CreditCard,
  ChevronRight,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  DollarSign,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Card, SpendingCategory } from '../types';
import { PortfolioOptimization, CategoryOptimization } from '../types/rewards-iq';
import { getPortfolioOptimization } from '../services/RewardsIQService';
import { CATEGORY_INFO } from '../services/MockTransactionData';

// ============================================================================
// Animated Money Counter
// ============================================================================

interface MoneyCounterProps {
  value: number;
  style?: any;
  duration?: number;
}

function MoneyCounter({ value, style, duration = 1500 }: MoneyCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      
      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [value, duration]);
  
  return <Text style={style}>${displayValue.toLocaleString()}</Text>;
}

// ============================================================================
// Comparison Card Component
// ============================================================================

interface ComparisonCardProps {
  label: string;
  amount: number;
  isCurrent: boolean;
  cards: Card[];
  delay: number;
}

function ComparisonCard({ label, amount, isCurrent, cards, delay }: ComparisonCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.comparisonCard,
        !isCurrent && styles.comparisonCardRecommended,
      ]}
    >
      {!isCurrent && (
        <View style={styles.recommendedBadge}>
          <Sparkles size={12} color={colors.primary.main} />
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}
      
      <Text style={styles.comparisonLabel}>{label}</Text>
      
      <MoneyCounter
        value={amount}
        style={[
          styles.comparisonAmount,
          !isCurrent && styles.comparisonAmountRecommended,
        ]}
      />
      
      <Text style={styles.comparisonPeriod}>/year</Text>
      
      <View style={styles.cardsList}>
        {cards.slice(0, 3).map((card, index) => (
          <View key={card.id} style={styles.cardChip}>
            <CreditCard size={12} color={colors.text.secondary} />
            <Text style={styles.cardChipText} numberOfLines={1}>
              {card.name.split(' ').slice(0, 2).join(' ')}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Category Optimization Row
// ============================================================================

interface CategoryRowProps {
  opt: CategoryOptimization;
  index: number;
}

function CategoryRow({ opt, index }: CategoryRowProps) {
  const info = CATEGORY_INFO[opt.category];
  const hasGain = opt.annualGain > 0;
  
  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 80).duration(300)}
      style={styles.categoryRow}
    >
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: info.color + '20' }]}>
          <Text style={styles.categoryEmoji}>{info.icon}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryLabel}>{info.label}</Text>
          <Text style={styles.categorySpend}>
            ${opt.monthlySpend.toLocaleString()}/mo
          </Text>
        </View>
      </View>
      
      <View style={styles.categoryRight}>
        <View style={styles.rewardsComparison}>
          <Text style={styles.currentReward}>
            ${opt.currentMonthlyRewards.toFixed(2)}
          </Text>
          <ArrowRight size={12} color={colors.text.tertiary} />
          <Text style={[
            styles.recommendedReward,
            hasGain && styles.gainText,
          ]}>
            ${opt.recommendedMonthlyRewards.toFixed(2)}
          </Text>
        </View>
        {hasGain && (
          <Text style={styles.annualGain}>
            +${opt.annualGain.toFixed(0)}/yr
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Card Change Item
// ============================================================================

interface CardChangeProps {
  card: Card;
  type: 'add' | 'remove';
  index: number;
}

function CardChangeItem({ card, type, index }: CardChangeProps) {
  const isAdd = type === 'add';
  const Icon = isAdd ? PlusCircle : MinusCircle;
  const color = isAdd ? colors.primary.main : colors.error.main;
  
  return (
    <Animated.View
      entering={FadeInUp.delay(500 + index * 100).duration(300)}
      style={styles.cardChange}
    >
      <Icon size={20} color={color} />
      <View style={styles.cardChangeInfo}>
        <Text style={styles.cardChangeName}>{card.name}</Text>
        <Text style={styles.cardChangeIssuer}>{card.issuer}</Text>
      </View>
      {isAdd && (
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function PortfolioOptimizerScreen() {
  const [optimization, setOptimization] = useState<PortfolioOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const gainScale = useSharedValue(1);
  
  const loadData = useCallback(async () => {
    try {
      const data = await getPortfolioOptimization();
      setOptimization(data);
      
      // Pulse animation for the gain
      gainScale.value = withDelay(
        1500,
        withSpring(1.05, { damping: 5 }, () => {
          gainScale.value = withSpring(1);
        })
      );
      
      if (Platform.OS !== 'web' && data.annualGain > 0) {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1500);
      }
    } catch (e) {
      console.error('Failed to load optimization:', e);
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
  
  const gainStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gainScale.value }],
  }));
  
  if (isLoading || !optimization) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Analyzing your portfolio...</Text>
      </View>
    );
  }
  
  const hasGain = optimization.annualGain > 0;
  
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
        <Text style={styles.headerTitle}>Portfolio Optimizer</Text>
        <Text style={styles.headerSubtitle}>
          See how much more you could be earning
        </Text>
      </Animated.View>
      
      {/* Comparison Section */}
      <View style={styles.comparisonSection}>
        <ComparisonCard
          label="Your Current Setup"
          amount={optimization.currentSetup.annualRewards}
          isCurrent={true}
          cards={optimization.currentSetup.cards}
          delay={100}
        />
        
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.arrowContainer}
        >
          <View style={styles.arrowLine} />
          <View style={styles.arrowCircle}>
            <TrendingUp size={20} color={colors.primary.main} />
          </View>
          <View style={styles.arrowLine} />
        </Animated.View>
        
        <ComparisonCard
          label="Recommended Setup"
          amount={optimization.recommendedSetup.annualRewards}
          isCurrent={false}
          cards={optimization.recommendedSetup.cards}
          delay={300}
        />
      </View>
      
      {/* Annual Gain Highlight */}
      {hasGain && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={[gainStyle]}
        >
          <LinearGradient
            colors={[colors.primary.main + '20', colors.primary.main + '05']}
            style={styles.gainCard}
          >
            <View style={styles.gainIcon}>
              <DollarSign size={24} color={colors.primary.main} />
            </View>
            <View style={styles.gainContent}>
              <Text style={styles.gainLabel}>Annual Gain</Text>
              <MoneyCounter
                value={optimization.annualGain}
                style={styles.gainAmount}
                duration={2000}
              />
            </View>
            <View style={styles.gainPercent}>
              <Text style={styles.gainPercentText}>
                +{optimization.gainPercentage.toFixed(0)}%
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
      
      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Category</Text>
        <Text style={styles.sectionSubtitle}>
          Monthly rewards current → recommended
        </Text>
        
        <View style={styles.categoryList}>
          {optimization.breakdown
            .filter(opt => opt.monthlySpend > 0)
            .slice(0, 6)
            .map((opt, index) => (
              <CategoryRow key={opt.category} opt={opt} index={index} />
            ))
          }
        </View>
      </View>
      
      {/* Cards to Add/Remove */}
      {(optimization.cardsToAdd.length > 0 || optimization.cardsToRemove.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Changes</Text>
          
          {optimization.cardsToAdd.length > 0 && (
            <View style={styles.changeSection}>
              <Text style={styles.changeLabel}>Cards to Consider</Text>
              {optimization.cardsToAdd.slice(0, 3).map((card, index) => (
                <CardChangeItem
                  key={card.id}
                  card={card}
                  type="add"
                  index={index}
                />
              ))}
            </View>
          )}
          
          {optimization.cardsToRemove.length > 0 && (
            <View style={styles.changeSection}>
              <Text style={styles.changeLabel}>Less Optimal Cards</Text>
              {optimization.cardsToRemove.slice(0, 2).map((card, index) => (
                <CardChangeItem
                  key={card.id}
                  card={card}
                  type="remove"
                  index={index}
                />
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* CTA */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(400)}
        style={styles.ctaSection}
      >
        <TouchableOpacity activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Start Optimizing</Text>
            <ChevronRight size={24} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.ctaHint}>
          Enable Smart Wallet to always use the best card
        </Text>
      </Animated.View>
      
      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        * Estimates based on your spending profile. Actual rewards may vary.
        Annual fee differences not included in calculations.
      </Text>
      
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
  
  // Comparison
  comparisonSection: {
    marginBottom: 16,
  },
  comparisonCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  comparisonCardRecommended: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.main,
  },
  comparisonLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  comparisonAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  comparisonAmountRecommended: {
    color: colors.primary.main,
  },
  comparisonPeriod: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 12,
  },
  cardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  cardChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    maxWidth: 80,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  
  // Gain Card
  gainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  gainIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gainContent: {
    flex: 1,
  },
  gainLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  gainAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary.main,
    letterSpacing: -1,
  },
  gainPercent: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  gainPercentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background.primary,
  },
  
  // Section
  section: {
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
  
  // Category List
  categoryList: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryInfo: {},
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  categorySpend: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  rewardsComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentReward: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  recommendedReward: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  gainText: {
    color: colors.primary.main,
  },
  annualGain: {
    fontSize: 11,
    color: colors.primary.main,
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Card Changes
  changeSection: {
    marginTop: 12,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  cardChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardChangeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardChangeName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  cardChangeIssuer: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  applyButton: {
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  
  // CTA
  ctaSection: {
    alignItems: 'center',
    marginBottom: 16,
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
  },
  
  // Disclaimer
  disclaimer: {
    fontSize: 11,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 16,
    marginHorizontal: 16,
  },
});
