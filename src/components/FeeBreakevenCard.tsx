/**
 * FeeBreakevenCard - Display component for Fee Breakeven analysis
 * Shows on Card Detail screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react-native';
import { FeeBreakevenResult } from '../types';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

interface FeeBreakevenCardProps {
  result: FeeBreakevenResult;
}

export function FeeBreakevenCard({ result }: FeeBreakevenCardProps) {
  const {
    annualFee,
    annualRewardsEarned,
    netValue,
    verdict,
    verdictReason,
    categoryBreakdown,
    noFeeComparison,
    multiplierOverFee,
  } = result;

  const verdictColor = {
    easily_worth_it: colors.success.main,
    worth_it: colors.success.main,
    borderline: colors.warning.main,
    not_worth_it: colors.error.main,
  }[verdict];

  const VerdictIcon = {
    easily_worth_it: CheckCircle,
    worth_it: TrendingUp,
    borderline: Minus,
    not_worth_it: TrendingDown,
  }[verdict];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Annual Fee Analysis</Text>
        <View style={[styles.verdictBadge, { backgroundColor: verdictColor + '20', borderColor: verdictColor }]}>
          <VerdictIcon size={16} color={verdictColor} />
          <Text style={[styles.verdictText, { color: verdictColor }]}>
            {verdict.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Annual Fee</Text>
          <Text style={styles.summaryValue}>-${annualFee.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Rewards Earned</Text>
          <Text style={[styles.summaryValue, styles.positive]}>+${annualRewardsEarned.toFixed(0)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryLabelTotal}>Net Value</Text>
          <Text style={[styles.summaryValueTotal, netValue >= 0 ? styles.positive : styles.negative]}>
            {netValue >= 0 ? '+' : ''}${netValue.toFixed(0)}
          </Text>
        </View>
      </View>

      <View style={styles.verdict}>
        <Text style={styles.verdictReason}>{verdictReason}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rewards Multiplier</Text>
          <Text style={styles.statValue}>{multiplierOverFee.toFixed(2)}×</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Top Category</Text>
          <Text style={styles.statValue}>
            {categoryBreakdown[0]?.category.replace(/_/g, ' ') || 'N/A'}
          </Text>
        </View>
      </View>

      {categoryBreakdown.length > 0 && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Category Breakdown</Text>
          {categoryBreakdown.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={styles.breakdownCategory}>
                {item.category.replace(/_/g, ' ')}
              </Text>
              <View style={styles.breakdownRight}>
                <Text style={styles.breakdownRewards}>
                  ${item.annualRewards.toFixed(0)}
                </Text>
                <Text style={styles.breakdownPercent}>
                  {item.percentOfFeeRecovered.toFixed(0)}% of fee
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {noFeeComparison && (
        <View style={styles.comparison}>
          <Text style={styles.comparisonTitle}>vs. Best No-Fee Card</Text>
          <Text style={styles.comparisonCard}>{noFeeComparison.bestNoFeeCard.name}</Text>
          <Text style={styles.comparisonVerdict}>{noFeeComparison.verdict}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  verdictText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summary: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: '700',
  },
  positive: {
    color: colors.success.main,
  },
  negative: {
    color: colors.error.main,
  },
  verdict: {
    padding: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  verdictReason: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  breakdown: {
    gap: 8,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownCategory: {
    fontSize: 14,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownRewards: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary.main,
  },
  breakdownPercent: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  comparison: {
    padding: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonCard: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  comparisonVerdict: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default FeeBreakevenCard;
