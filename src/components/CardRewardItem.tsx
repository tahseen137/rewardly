/**
 * CardRewardItem - Display individual card reward calculation result
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { useTheme } from '../theme';
import { RewardCalculationResult } from '../services/RewardsCalculatorService';
import { formatRewardEarned, formatAnnualFee, REWARD_TYPE_ICONS, formatCategoryName } from '../utils/rewardFormatUtils';
import { Card as CardType, SpendingCategory } from '../types';

interface CardRewardItemProps {
  result: RewardCalculationResult;
  isBestValue: boolean;
  onPress?: () => void;
  onViewOptions?: () => void;
  card?: CardType;
  /** The spending category being calculated (for display) */
  category?: SpendingCategory;
}

export function CardRewardItem({ result, isBestValue, onPress, onViewOptions, card, category }: CardRewardItemProps) {
  const theme = useTheme();

  const rewardIcon = REWARD_TYPE_ICONS[result.rewardCurrency];

  const getRewardIconEmoji = (icon: string): string => {
    const iconMap: Record<string, string> = {
      cash: '💵',
      star: '⭐',
      plane: '✈️',
      hotel: '🏨',
    };
    return iconMap[icon] || '⭐';
  };

  // Format reward display based on card type
  const formatRewardDisplay = (): string => {
    if (result.isCashback) {
      return `$${result.cadValue.toFixed(2)}`;
    }
    // For points/miles, show points and CAD value
    return `${Math.round(result.pointsEarned)} pts = $${result.cadValue.toFixed(2)}`;
  };

  const CardContent = (
    <View style={styles.container}>
      {/* Header with card name and best value badge */}
      <View style={styles.header}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: theme.colors.text.primary }]}>
            {result.cardName}
          </Text>
          <Text style={[styles.issuer, { color: theme.colors.text.secondary }]}>
            {result.issuer}
          </Text>
        </View>
        {isBestValue && (
          <Badge
            label="Best Value"
            variant="success"
            size="small"
            style={styles.bestValueBadge}
          />
        )}
      </View>

      {/* Price breakdown: Original → Reward → Effective */}
      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: theme.colors.text.secondary }]}>
            Original:
          </Text>
          <Text style={[styles.priceValue, { color: theme.colors.text.primary }]}>
            ${result.originalPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.rewardLabelRow}>
            <Text style={styles.rewardIcon}>{getRewardIconEmoji(rewardIcon)}</Text>
            <Text style={[styles.priceLabel, { color: theme.colors.text.secondary }]}>
              {result.isCashback ? 'Cashback:' : 'Reward:'}
            </Text>
          </View>
          <Text style={[styles.rewardValue, { color: theme.colors.success.main }]}>
            {formatRewardDisplay()}
          </Text>
        </View>
        <View style={[styles.priceRow, styles.effectiveRow]}>
          <Text style={[styles.effectiveLabel, { color: theme.colors.text.primary }]}>
            Effective:
          </Text>
          <Text style={[styles.effectiveValue, { color: theme.colors.primary.main }]}>
            ${result.effectivePrice.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Rate badge — shows which rate is being used */}
      <View style={styles.rateBadgeRow}>
        {result.isBaseRate ? (
          <View style={[styles.rateBadge, styles.rateBadgeBase]}>
            <Text style={[styles.rateBadgeText, { color: theme.colors.text.tertiary }]}>
              {result.multiplierUsed}{result.isCashback ? '%' : 'x'} Base Rate
            </Text>
          </View>
        ) : (
          <View style={[styles.rateBadge, styles.rateBadgeBonus]}>
            <Text style={[styles.rateBadgeText, { color: theme.colors.success.main }]}>
              ✨ {result.multiplierUsed}{result.isCashback ? '%' : 'x'}{category ? ` ${formatCategoryName(category)}` : ''} Bonus
            </Text>
          </View>
        )}
      </View>

      {/* Footer with annual fee */}
      <View style={styles.footer}>
        <Text style={[styles.annualFee, { color: theme.colors.text.tertiary }]}>
          {formatAnnualFee(result.annualFee)}
        </Text>
        {card?.programDetails && onViewOptions && (
          <TouchableOpacity onPress={onViewOptions} style={styles.viewOptionsButton}>
            <Text style={[styles.viewOptionsText, { color: theme.colors.primary.main }]}>
              View Options
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={`${result.cardName} - ${formatRewardEarned(
          result.pointsEarned,
          result.rewardCurrency
        )}`}
        accessibilityRole="button"
      >
        <Card variant="outlined" padding="medium" style={styles.card}>
          {CardContent}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <Card variant="outlined" padding="medium" style={styles.card}>
      {CardContent}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  issuer: {
    fontSize: 14,
  },
  bestValueBadge: {
    marginLeft: 8,
  },
  priceBreakdown: {
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rewardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  effectiveRow: {
    marginBottom: 0,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 6,
  },
  effectiveLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  effectiveValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    flexWrap: 'wrap',
    gap: 8,
  },
  annualFee: {
    fontSize: 12,
  },
  baseRateNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  viewOptionsButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewOptionsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateBadgeBonus: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  rateBadgeBase: {
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CardRewardItem;
