/**
 * RecurringScreen - Recurring charges optimizer
 * Tier: Pro+
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Repeat, Calendar } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const renderContent = () => {
    if (charges.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Calendar size={40} color={colors.primary.main} />
          </View>
          <Text style={styles.emptyTitle}>No Recurring Charges</Text>
          <Text style={styles.emptyDescription}>
            Add your monthly subscriptions and bills to discover which{'\n'}
            credit card earns you the most rewards on autopay.
          </Text>
          <View style={styles.emptyExamples}>
            <Text style={styles.emptyExamplesTitle}>Common recurring charges:</Text>
            <Text style={styles.emptyExampleItem}>📺 Netflix, Spotify, Disney+</Text>
            <Text style={styles.emptyExampleItem}>☁️ iCloud, Google One</Text>
            <Text style={styles.emptyExampleItem}>🏋️ Gym memberships</Text>
            <Text style={styles.emptyExampleItem}>📱 Phone & internet bills</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
            progressBackgroundColor={colors.background.secondary}
          />
        }
      >
        {summary && (
          <Animated.View entering={FadeInDown.duration(400)}>
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
          </Animated.View>
        )}
        {charges.map((charge, index) => (
          <Animated.View key={charge.id} entering={FadeInDown.delay(index * 60).duration(300)}>
            <View style={styles.chargeCard}>
              <View style={styles.chargeHeader}>
                <Text style={styles.chargeName}>{charge.name}</Text>
                <Text style={styles.chargeAmount}>${charge.amount.toFixed(2)}/mo</Text>
              </View>
              {charge.monthlySavings > 0 && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.chargeSavings}>
                    💰 Switch card to save ${charge.monthlySavings.toFixed(2)}/mo
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  if (!hasAccess) {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.emptyIconCircle}>
          <Repeat size={40} color={colors.text.tertiary} />
        </View>
        <Text style={styles.lockedTitle}>Pro Feature</Text>
        <Text style={styles.lockedText}>
          Upgrade to Pro to optimize your recurring charges and save more on autopay.
        </Text>
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
    borderWidth: 1,
    borderColor: colors.border.light,
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
    borderTopColor: colors.border.light,
  },
  savingsLabel: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  savingsValue: { fontSize: 16, fontWeight: '700', color: colors.primary.main },
  chargeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chargeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chargeName: { fontSize: 16, fontWeight: '600', color: colors.text.primary, flex: 1 },
  chargeAmount: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  savingsBadge: {
    marginTop: 8,
    backgroundColor: colors.primary.bg10,
    borderRadius: borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  chargeSavings: { fontSize: 13, color: colors.primary.main, fontWeight: '500' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background.primary,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary.bg10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyExamples: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 8,
    width: '100%',
    maxWidth: 320,
  },
  emptyExamplesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  emptyExampleItem: {
    fontSize: 14,
    color: colors.text.primary,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background.primary,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
