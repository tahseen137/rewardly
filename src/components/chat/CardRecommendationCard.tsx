/**
 * CardRecommendationCard - Rich card display for AI recommendations
 * 
 * Displays card details when Sage recommends a specific card,
 * with visual card representation and reward information.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CreditCard, TrendingUp, Info, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { Card, RewardType } from '../../types';
import { handleApplyNow } from '../../services/AffiliateService';
import { getCurrentTierSync } from '../../services/SubscriptionService';
import { getHighestRewardRate, formatBestForCategories } from '../../utils/rewardFormatUtils';

export interface CardRecommendationCardProps {
  /** The recommended card */
  card: Card;
  /** Reason for recommendation */
  reason: string;
  /** Reward rate for the specific use case */
  rewardRate: number;
  /** Spending category this recommendation is for */
  category?: string;
  /** Estimated annual value */
  estimatedValue?: number;
  /** Whether this is a new card suggestion (vs existing portfolio) */
  isNewCardSuggestion?: boolean;
  /** Called when user taps to learn more */
  onLearnMore?: () => void;
  /** Called when user taps to apply (for new cards) */
  onApply?: () => void;
}

/**
 * Get gradient colors based on card issuer
 */
function getCardGradient(issuer: string): [string, string] {
  const issuerLower = issuer.toLowerCase();
  
  if (issuerLower.includes('amex') || issuerLower.includes('american express')) {
    return ['#006FCF', '#00175A'];
  }
  if (issuerLower.includes('chase')) {
    return ['#1A4B8C', '#0D2F5C'];
  }
  if (issuerLower.includes('capital one')) {
    return ['#C41230', '#8B0A1F'];
  }
  if (issuerLower.includes('citi')) {
    return ['#003B70', '#001F3D'];
  }
  if (issuerLower.includes('discover')) {
    return ['#FF6000', '#CC4C00'];
  }
  if (issuerLower.includes('td')) {
    return ['#34A853', '#1E7E34'];
  }
  if (issuerLower.includes('bmo')) {
    return ['#0075BE', '#00456E'];
  }
  if (issuerLower.includes('rbc')) {
    return ['#003168', '#001A38'];
  }
  if (issuerLower.includes('scotiabank')) {
    return ['#EC111A', '#B30D14'];
  }
  if (issuerLower.includes('cibc')) {
    return ['#B30838', '#7A0525'];
  }
  
  // Default gradient
  return [colors.primary.main, colors.primary.dark];
}

/**
 * Format reward type for display
 */
function formatRewardType(type: RewardType): string {
  switch (type) {
    case RewardType.CASHBACK:
      return 'cash back';
    case RewardType.AIRLINE_MILES:
      return 'miles';
    case RewardType.HOTEL_POINTS:
      return 'hotel points';
    default:
      return 'points';
  }
}

export const CardRecommendationCard: React.FC<CardRecommendationCardProps> = ({
  card,
  reason,
  rewardRate,
  category,
  estimatedValue,
  isNewCardSuggestion = false,
  onLearnMore,
  onApply,
}) => {
  const gradientColors = useMemo(() => getCardGradient(card.issuer), [card.issuer]);
  const highestRate = useMemo(() => getHighestRewardRate(card), [card]);
  const bestForText = useMemo(() => formatBestForCategories(card, 3), [card]);
  const rewardTypeText = formatRewardType(card.baseRewardRate.type);
  // Use the provided rewardRate (which may be category-specific), but show the highest if it's higher
  const displayRate = Math.max(rewardRate, highestRate.value);
  const rateUnit = card.baseRewardRate.unit === 'percent' ? '%' : 'x';
  const showUpTo = displayRate > card.baseRewardRate.value && !category;
  
  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      style={styles.container}
    >
      {/* Header label */}
      <View style={styles.header}>
        <View style={styles.recommendBadge}>
          <TrendingUp size={12} color={colors.primary.main} />
          <Text style={styles.recommendText}>
            {isNewCardSuggestion ? 'Suggested Card' : 'Best Card'}
          </Text>
        </View>
        {category && (
          <Text style={styles.categoryText}>for {category}</Text>
        )}
      </View>
      
      {/* Card visual */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardVisual}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.issuerName}>{card.issuer}</Text>
            <CreditCard size={20} color="rgba(255,255,255,0.8)" />
          </View>
          
          <Text style={styles.cardName} numberOfLines={2}>
            {card.name}
          </Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.programName}>{card.rewardProgram}</Text>
          </View>
        </LinearGradient>
      </View>
      
      {/* Best for subtitle */}
      {bestForText && !category ? (
        <View style={styles.bestForContainer}>
          <Text style={styles.bestForText}>{bestForText}</Text>
        </View>
      ) : null}

      {/* Reward info */}
      <View style={styles.rewardInfo}>
        <View style={styles.rewardMain}>
          <Text style={styles.rewardRate}>
            {showUpTo ? 'Up to ' : ''}{displayRate}{rateUnit}
          </Text>
          <Text style={styles.rewardLabel}>{rewardTypeText}</Text>
        </View>
        
        {card.pointValuation && (
          <View style={styles.rewardSecondary}>
            <Text style={styles.valuationText}>
              ~{card.pointValuation}¢ per point
            </Text>
          </View>
        )}
        
        {estimatedValue && (
          <View style={styles.rewardSecondary}>
            <Text style={styles.valuationText}>
              Est. ${estimatedValue.toFixed(0)}/yr value
            </Text>
          </View>
        )}
      </View>
      
      {/* Reason */}
      <View style={styles.reasonContainer}>
        <Info size={14} color={colors.text.tertiary} />
        <Text style={styles.reasonText}>{reason}</Text>
      </View>
      
      {/* Actions */}
      <View style={styles.actions}>
        {onLearnMore && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onLearnMore}
            accessibilityLabel="Learn more about this card"
          >
            <Text style={styles.secondaryButtonText}>Details</Text>
          </TouchableOpacity>
        )}
        
        {isNewCardSuggestion && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (onApply) {
                onApply();
              } else {
                const tier = getCurrentTierSync();
                handleApplyNow(card, 'SageChat', tier);
              }
            }}
            accessibilityLabel="Apply for this card"
          >
            <Text style={styles.primaryButtonText}>Apply Now</Text>
            <ExternalLink size={14} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Affiliate disclosure for new cards */}
      {isNewCardSuggestion && (
        <Text style={styles.disclosure}>
          Rewardly may earn a commission if you apply through our link.
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.bg10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  categoryText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  cardVisual: {
    borderRadius: 12,
    padding: 16,
    aspectRatio: 1.6,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuerName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  programName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestForContainer: {
    marginBottom: 8,
  },
  bestForText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  rewardMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  rewardRate: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary.main,
  },
  rewardLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  rewardSecondary: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  valuationText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.tertiary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  disclosure: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default CardRecommendationCard;
