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

// ============================================================================
// Recommendation Card Component
// ============================================================================

interface RecommendationCardProps {
  recommendation: CardRecommendation;
  showAffiliateLink: boolean;
}

function RecommendationCard({ recommendation, showAffiliateLink }: RecommendationCardProps) {
  const { card, reason, estimatedAnnualRewards, signupBonus, affiliateUrl } = recommendation;

  const handleApply = useCallback(() => {
    if (affiliateUrl) {
      Linking.openURL(affiliateUrl);
    } else {
      // Open generic card page
      Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(card.name)}`);
    }
  }, [affiliateUrl, card.name]);

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <View style={styles.recommendationInfo}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardIssuer}>{card.issuer}</Text>
        </View>
      </View>

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<RecommendationAnalysis | null>(null);

  const hasAccess = canAccessFeatureSync('benefits_tracking'); // Pro+ feature
  const tier = getCurrentTierSync();
  const showAffiliateLinks = tier === 'max';

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
    marginBottom: 12,
  },
  recommendationInfo: {
    marginBottom: 8,
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
