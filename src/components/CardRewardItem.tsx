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
import { formatRewardEarned, formatAnnualFee, REWARD_TYPE_ICONS } from '../utils/rewardFormatUtils';
import { formatCadValue } from '../utils/amountUtils';

interface CardRewardItemProps {
  result: RewardCalculationResult;
  isBestValue: boolean;
  onPress?: () => void;
}

export function CardRewardItem({ result, isBestValue, onPress }: CardRewardItemProps) {
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
            text="Best Value"
            variant="success"
            size="small"
            style={styles.bestValueBadge}
          />
        )}
      </View>

      {/* Reward details */}
      <View style={styles.rewardSection}>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardIcon}>{getRewardIconEmoji(rewardIcon)}</Text>
          <View style={styles.rewardDetails}>
            <Text style={[styles.rewardEarned, { color: theme.colors.text.primary }]}>
              {formatRewardEarned(result.pointsEarned, result.rewardCurrency)}
            </Text>
            <Text style={[styles.cadValue, { color: theme.colors.success.main }]}>
              ${formatCadValue(result.cadValue)}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer with annual fee */}
      <View style={styles.footer}>
        <Text style={[styles.annualFee, { color: theme.colors.text.tertiary }]}>
          {formatAnnualFee(result.annualFee)}
        </Text>
        {result.isBaseRate && (
          <Text style={[styles.baseRateNote, { color: theme.colors.text.tertiary }]}>
            Base rate
          </Text>
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
  rewardSection: {
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardEarned: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cadValue: {
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
  },
  annualFee: {
    fontSize: 12,
  },
  baseRateNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default CardRewardItem;
