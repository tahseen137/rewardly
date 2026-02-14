/**
 * SpendingLogScreen - Manual purchase logging
 * Tier: Free (last 10), Pro+ (unlimited)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Receipt, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { getSpendingEntries, getSpendingSummary } from '../services/SpendingLogService';
import { SpendingEntry, SpendingSummary } from '../types';

export default function SpendingLogScreen() {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, summaryData] = await Promise.all([
        getSpendingEntries(),
        getSpendingSummary(),
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  if (entries.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={40} color={colors.primary.main} />
        </View>
        <Text style={styles.emptyTitle}>No Purchases Logged Yet</Text>
        <Text style={styles.emptyDescription}>
          Start tracking your spending to see how much you're earning{'\n'}
          — and what you could be earning — in credit card rewards.
        </Text>
        <View style={styles.emptyTip}>
          <Text style={styles.emptyTipIcon}>💡</Text>
          <Text style={styles.emptyTipText}>
            Tip: Use the calculator on the Home tab to check the best card before each purchase
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>${summary.totalSpend.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rewards Earned</Text>
            <Text style={[styles.summaryValue, { color: colors.primary.main }]}>
              ${summary.totalRewardsEarned.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rewards Missed</Text>
            <Text style={[styles.summaryValue, { color: colors.error.main }]}>
              ${summary.totalRewardsMissed.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
            progressBackgroundColor={colors.background.secondary}
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryStore}>{item.storeName || 'Purchase'}</Text>
                <Text style={styles.entryAmount}>${item.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.entryDate}>
                {new Date(item.transactionDate).toLocaleDateString()}
              </Text>
              <View style={styles.entryRewards}>
                <Text style={styles.entryEarned}>+${item.rewardsEarned.toFixed(2)}</Text>
                {item.rewardsMissed > 0 && (
                  <Text style={styles.entryMissed}>-${item.rewardsMissed.toFixed(2)} missed</Text>
                )}
              </View>
            </View>
          </Animated.View>
        )}
      />
    </View>
  );
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
  entryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  entryStore: { fontSize: 16, fontWeight: '600', color: colors.text.primary, flex: 1 },
  entryAmount: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  entryDate: { fontSize: 12, color: colors.text.tertiary, marginBottom: 8 },
  entryRewards: { flexDirection: 'row', gap: 12 },
  entryEarned: { fontSize: 14, color: colors.primary.main, fontWeight: '500' },
  entryMissed: { fontSize: 14, color: colors.error.main, fontWeight: '500' },
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
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.bg10,
    borderRadius: borderRadius.lg,
    padding: 16,
    gap: 12,
    maxWidth: 340,
  },
  emptyTipIcon: {
    fontSize: 20,
  },
  emptyTipText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary.main,
    lineHeight: 19,
  },
});
