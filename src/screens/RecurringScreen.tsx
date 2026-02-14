/**
 * RecurringScreen - Recurring charges optimizer
 * Tier: Pro+
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Repeat, LockedFeature } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { getRecurringCharges, getRecurringSummary } from '../services/RecurringService';
import { canAccessFeatureSync } from '../services/SubscriptionService';
import { RecurringCharge, RecurringSummary } from '../types';

export default function RecurringScreen() {
  const [charges, setCharges] = useState<RecurringCharge[]>([]);
  const [summary, setSummary] = useState<RecurringSummary | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const access = canAccessFeatureSync('insights'); // Pro+ feature
    setHasAccess(access);
    if (access) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      const chargesData = await getRecurringCharges();
      setCharges(chargesData);
      setSummary(getRecurringSummary(chargesData));
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (charges.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyState}>
          <Repeat size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Recurring Charges</Text>
          <Text style={styles.emptyDescription}>
            Add your subscriptions to see which cards earn the most
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Monthly Optimization</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Monthly Charges</Text>
              <Text style={styles.summaryValue}>${summary.totalMonthlyCharges.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Rewards</Text>
              <Text style={styles.summaryValue}>${summary.totalCurrentRewards.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Potential Rewards</Text>
              <Text style={styles.summaryValue}>${summary.totalOptimalRewards.toFixed(2)}</Text>
            </View>
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Monthly Savings</Text>
              <Text style={styles.savingsValue}>${summary.totalMonthlySavings.toFixed(2)}</Text>
            </View>
          </View>
        )}
        {charges.map(charge => (
          <View key={charge.id} style={styles.chargeCard}>
            <View style={styles.chargeHeader}>
              <Text style={styles.chargeName}>{charge.name}</Text>
              <Text style={styles.chargeAmount}>${charge.amount.toFixed(2)}/mo</Text>
            </View>
            {charge.monthlySavings > 0 && (
              <Text style={styles.chargeSavings}>
                Switch card to save ${charge.monthlySavings.toFixed(2)}/mo
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (!hasAccess) {
    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.lockedText}>This feature requires Pro subscription</Text>
      </View>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    margin: 20,
  },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: colors.text.primary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.text.secondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray800,
  },
  savingsLabel: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  savingsValue: { fontSize: 16, fontWeight: '700', color: colors.primary.main },
  chargeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  chargeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chargeName: { fontSize: 16, fontWeight: '600', color: colors.text.primary, flex: 1 },
  chargeAmount: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  chargeSavings: { fontSize: 14, color: colors.primary.main, marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
  lockedText: { fontSize: 16, color: colors.text.secondary, textAlign: 'center', padding: 40 },
});
