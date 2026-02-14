/**
 * SpendingLogScreen - Manual purchase logging
 * Tier: Free (last 10), Pro+ (unlimited)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { getSpendingEntries, getSpendingSummary } from '../services/SpendingLogService';
import { SpendingEntry, SpendingSummary } from '../types';

export default function SpendingLogScreen() {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (entries.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <Receipt size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No Transactions Yet</Text>
        <Text style={styles.emptyDescription}>
          Log your first purchase to start tracking rewards
        </Text>
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
        renderItem={({ item }) => (
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
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
});
