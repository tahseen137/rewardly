/**
 * SUBTrackerScreen - Sign-Up Bonus tracker
 * Tier: Free (hook feature)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Target, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { getActiveSUBs, calculateProgress } from '../services/SUBTrackingService';
import { SUBProgress } from '../types';

export default function SUBTrackerScreen() {
  const [subs, setSubs] = useState<SUBProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSUBs();
  }, []);

  const loadSUBs = async () => {
    try {
      const active = await getActiveSUBs();
      const progress = active.map(calculateProgress);
      setSubs(progress);
    } finally {
      setIsLoading(false);
    }
  };

  if (subs.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <Target size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No Bonuses Being Tracked</Text>
        <Text style={styles.emptyDescription}>
          Add a sign-up bonus to track your progress
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign-Up Bonus Tracker</Text>
      </View>
      {subs.map((progress, index) => (
        <View key={progress.sub.id} style={styles.subCard}>
          <Text style={styles.subCardName}>Tracking Bonus</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.percentComplete}%` }]} />
          </View>
          <Text style={styles.progressText}>
            ${progress.sub.currentAmount} / ${progress.sub.targetAmount}
          </Text>
          <Text style={styles.daysText}>
            {progress.daysRemaining} days remaining
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary },
  subCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  subCardName: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral.gray800,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary.main },
  progressText: { fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  daysText: { fontSize: 12, color: colors.text.tertiary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
});
