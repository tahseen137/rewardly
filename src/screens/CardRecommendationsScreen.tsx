/**
 * CardRecommendationsScreen - F8: Card Recommendation Engine  
 * Personalized card suggestions based on spending patterns
 * Tier: Pro+ (basic), Max (with affiliate links)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { TrendingUp, ExternalLink, Sparkles, Target } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { LockedFeature } from '../components';
import { canAccessFeatureSync, getCurrentTierSync } from '../services/SubscriptionService';
import {
  analyzeAndRecommend,
  CardRecommendation,
  RecommendationAnalysis,
} from '../services/CardRecommendationEngine';
import { handleApplyNow, getApplicationUrl } from '../services/AffiliateService';
import { formatUpToRate, formatTopCategoryRates, formatBestForCategories } from '../utils/rewardFormatUtils';

// ============================================================================
// Recommendation Card Component
// ============================================================================

interface RecommendationCardProps {
  recommendation: CardRecommendation;
  showAffiliateLink: boolean;
  onPress?: (cardId: string) => void;
}

function RecommendationCard({ recommendation, showAffiliateLink, onPress }: RecommendationCardProps) {
  const { card, reason, estimatedAnnualRewards, signupBonus, affiliateUrl } = recommendation;
  const upToRate = formatUpToRate(card);
  const categoryRates = formatTopCategoryRates(card, 3);
  const bestFor = formatBestForCategories(card, 3);

  const handleApply = useCallback(() => {
    const tier = getCurrentTierSync();
    handleApplyNow(card, 'CardRecommendations', tier);
  }, [card]);

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.recommendationCard}>
      <TouchableOpacity 
        onPress={() => onPress?.(card.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`View ${card.name} details`}
      >
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardIssuer}>{card.issuer}</Text>
          </View>
          {/* Headline rate badge */}
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>{upToRate}</Text>
          </View>
        </View>

      {/* Category context — shows WHY this card is recommended */}
      {categoryRates ? (
        <View style={styles.categoryContext}>
          <Text style={styles.categoryContextText}>{categoryRates}</Text>
        </View>
      ) : bestFor ? (
        <View style={styles.categoryContext}>
          <Text style={styles.categoryContextText}>{bestFor}</Text>
        </View>
      ) : null}

      <Text style={styles.reason}>{reason}</Text>

      <View style={styles.estimatesRow}>
        <View style={styles.estimate}>
          <TrendingUp size={16} color={colors.success.main} />
          <Text style={styles.estimateLabel}>Est. Annual Rewards</Text>
          <Text style={styles.estimateValue}>${estimatedAnnualRewards.toFixed(0)}/year</Text>
        </View>

        {signupBonus && (
          <View style={styles.estimate}>
            <Sparkles size={16} color={colors.warning.main} />
            <Text style={styles.estimateLabel}>Sign-Up Bonus</Text>
            <Text style={styles.estimateValue}>
              {signupBonus.amount.toLocaleString()} pts
            </Text>
          </View>
        )}
      </View>

      </TouchableOpacity>
      <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
        <Text style={styles.applyButtonText}>
          {showAffiliateLink ? 'Apply Now' : 'Learn More'}
        </Text>
        <ExternalLink size={18} color={colors.background.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function CardRecommendationsScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<RecommendationAnalysis | null>(null);

  const hasAccess = canAccessFeatureSync('benefits_tracking'); // Pro+ feature
  const tier = getCurrentTierSync();
  const showAffiliateLinks = tier === 'max';

  const handleCardPress = useCallback((cardId: string) => {
    navigation.navigate('CardDetail' as never, { cardId } as never);
  }, [navigation]);

  const loadRecommendations = useCallback(async () => {
    try {
      const data = await analyzeAndRecommend();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRecommendations();
  }, [loadRecommendations]);

  if (!hasAccess) {
    return (
      <LockedFeature
        feature="benefits_tracking"
        title="Card Recommendations"
        description="Get personalized card suggestions based on your spending patterns"
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Card Recommendations</Text>
          <Text style={styles.subtitle}>Cards that match your spending</Text>
        </View>

        {analysis && analysis.userTopCategories.length > 0 && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Your Top Categories</Text>
            {analysis.userTopCategories.slice(0, 3).map((cat, index) => (
              <View key={index} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <Text style={styles.categorySpend}>${cat.monthlySpend.toFixed(0)}/mo</Text>
              </View>
            ))}
            
            {analysis.currentGaps.length > 0 && (
              <View style={styles.gapNotice}>
                <Target size={16} color={colors.warning.main} />
                <Text style={styles.gapText}>
                  {analysis.currentGaps.length} categories could be optimized
                </Text>
              </View>
            )}
          </View>
        )}

        {analysis && analysis.recommendations.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            {analysis.recommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.card.id}
                recommendation={rec}
                showAffiliateLink={showAffiliateLinks}
                onPress={handleCardPress}
              />
            ))}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Card details may change. Verify terms before applying.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Need More Data</Text>
            <Text style={styles.emptyStateText}>
              Log some purchases to get personalized recommendations
            </Text>
          </View>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  analysisCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  categorySpend: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  gapNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.md,
  },
  gapText: {
    fontSize: 13,
    color: colors.warning.dark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationInfo: {
    flex: 1,
    marginBottom: 8,
  },
  rateBadge: {
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  rateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.main,
  },
  categoryContext: {
    backgroundColor: colors.success.main + '12',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  categoryContextText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success.main,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardIssuer: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  reason: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  estimatesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  estimate: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  estimateLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'center',
  },
  estimateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  disclaimer: {
    padding: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
