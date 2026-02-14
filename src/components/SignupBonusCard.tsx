/**
 * SignupBonusCard - Display component for Signup Bonus ROI analysis
 * Shows on Card Detail screen with timeline visualization
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Calendar } from 'lucide-react-native';
import { SignupBonusROI } from '../types';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

interface SignupBonusCardProps {
  result: SignupBonusROI;
}

export function SignupBonusCard({ result }: SignupBonusCardProps) {
  const {
    bonusValueCAD,
    minimumSpend,
    timeframeDays,
    monthlySpendNeeded,
    userMonthlySpend,
    canHitMinimum,
    monthsToHit,
    timeline,
    firstYearValue,
    ongoingAnnualValue,
    verdict,
    verdictReason,
  } = result;

  const verdictColor = {
    excellent: colors.success.main,
    good: colors.success.main,
    marginal: colors.warning.main,
    not_worth_it: colors.error.main,
  }[verdict];

  const VerdictIcon = {
    excellent: CheckCircle,
    good: TrendingUp,
    marginal: AlertCircle,
    not_worth_it: TrendingDown,
  }[verdict];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Signup Bonus Analysis</Text>
        <View style={[styles.verdictBadge, { backgroundColor: verdictColor + '20', borderColor: verdictColor }]}>
          <VerdictIcon size={16} color={verdictColor} />
          <Text style={[styles.verdictText, { color: verdictColor }]}>
            {verdict.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.bonusInfo}>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>Bonus Value</Text>
          <Text style={styles.bonusValue}>${bonusValueCAD.toFixed(0)}</Text>
        </View>
        <View style={styles.bonusRequirement}>
          <Text style={styles.requirementText}>
            Spend ${minimumSpend.toLocaleString()} in {timeframeDays} days
          </Text>
        </View>
      </View>

      <View style={styles.spendComparison}>
        <View style={styles.spendRow}>
          <Text style={styles.spendLabel}>Monthly Spend Needed</Text>
          <Text style={styles.spendValue}>${monthlySpendNeeded.toFixed(0)}</Text>
        </View>
        <View style={styles.spendRow}>
          <Text style={styles.spendLabel}>Your Monthly Spend</Text>
          <Text style={[
            styles.spendValue,
            canHitMinimum ? styles.positive : styles.negative
          ]}>
            ${userMonthlySpend.toFixed(0)}
          </Text>
        </View>
      </View>

      {canHitMinimum && timeline.length > 0 && (
        <View style={styles.timeline}>
          <View style={styles.timelineHeader}>
            <Calendar size={16} color={colors.text.secondary} />
            <Text style={styles.timelineTitle}>
              You'll hit the minimum in {monthsToHit} month{monthsToHit !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.timelineBar}>
            {timeline.map((entry, index) => (
              <View
                key={index}
                style={[
                  styles.timelineSegment,
                  {
                    flex: 1,
                    backgroundColor: entry.hitTarget
                      ? colors.success.main
                      : colors.border.light,
                  },
                ]}
              >
                <Text style={styles.timelineMonth}>{entry.month}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.values}>
        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Year 1 Total Value</Text>
          <Text style={[
            styles.valueAmount,
            firstYearValue >= 0 ? styles.positive : styles.negative
          ]}>
            {firstYearValue >= 0 ? '+' : ''}${firstYearValue.toFixed(0)}
          </Text>
          <Text style={styles.valueSubtext}>Bonus + Rewards - Fee</Text>
        </View>
        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Year 2+ Value</Text>
          <Text style={[
            styles.valueAmount,
            ongoingAnnualValue >= 0 ? styles.positive : styles.negative
          ]}>
            {ongoingAnnualValue >= 0 ? '+' : ''}${ongoingAnnualValue.toFixed(0)}
          </Text>
          <Text style={styles.valueSubtext}>Rewards - Fee</Text>
        </View>
      </View>

      <View style={styles.verdict}>
        <Text style={styles.verdictReason}>{verdictReason}</Text>
      </View>
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
  bonusInfo: {
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bonusLabel: {
    fontSize: 14,
    color: colors.primary.dark,
    fontWeight: '600',
  },
  bonusValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main,
  },
  bonusRequirement: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.primary.main + '30',
  },
  requirementText: {
    fontSize: 13,
    color: colors.primary.dark,
  },
  spendComparison: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: 16,
    gap: 12,
  },
  spendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spendLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  spendValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  positive: {
    color: colors.success.main,
  },
  negative: {
    color: colors.error.main,
  },
  timeline: {
    gap: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    gap: 2,
  },
  timelineSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  values: {
    flexDirection: 'row',
    gap: 12,
  },
  valueCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  valueAmount: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  valueSubtext: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
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
});

export default SignupBonusCard;
