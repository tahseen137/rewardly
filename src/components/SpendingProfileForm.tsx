/**
 * SpendingProfileForm - Interactive form for entering monthly spending by category
 * Used by Wallet Optimizer, Signup Bonus ROI, and Fee Breakeven calculators
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calculator, TrendingUp, FileText } from 'lucide-react-native';
import { SpendingProfileInput, SpendingCategory } from '../types';
import { getFromSpendingLog, getDefaultSpendingProfile, calculateTotalMonthlySpend } from '../services/SpendingProfileService';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

interface SpendingProfileFormProps {
  initialValues?: SpendingProfileInput;
  onChange: (profile: SpendingProfileInput) => void;
  showAutoFill?: boolean;
}

interface CategoryConfig {
  key: keyof SpendingProfileInput;
  label: string;
  icon: string;
  category?: SpendingCategory;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'groceries', label: 'Groceries', icon: '🛒', category: SpendingCategory.GROCERIES },
  { key: 'dining', label: 'Dining & Restaurants', icon: '🍽️', category: SpendingCategory.DINING },
  { key: 'gas', label: 'Gas & Fuel', icon: '⛽', category: SpendingCategory.GAS },
  { key: 'travel', label: 'Travel', icon: '✈️', category: SpendingCategory.TRAVEL },
  { key: 'onlineShopping', label: 'Online Shopping', icon: '📦', category: SpendingCategory.ONLINE_SHOPPING },
  { key: 'entertainment', label: 'Entertainment', icon: '🎬', category: SpendingCategory.ENTERTAINMENT },
  { key: 'drugstores', label: 'Drugstores & Pharmacy', icon: '💊', category: SpendingCategory.DRUGSTORES },
  { key: 'homeImprovement', label: 'Home Improvement', icon: '🔨', category: SpendingCategory.HOME_IMPROVEMENT },
  { key: 'transit', label: 'Public Transit', icon: '🚇' },
  { key: 'other', label: 'Other Spending', icon: '🛍️', category: SpendingCategory.OTHER },
];

export function SpendingProfileForm({
  initialValues,
  onChange,
  showAutoFill = true,
}: SpendingProfileFormProps) {
  const [values, setValues] = useState<SpendingProfileInput>(
    initialValues || getDefaultSpendingProfile()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const handleChange = (key: keyof SpendingProfileInput, rawValue: string) => {
    // Parse and validate
    const numValue = parseFloat(rawValue) || 0;
    const validValue = Math.max(0, Math.min(99999, numValue)); // Cap at $99,999/month

    const updated = {
      ...values,
      [key]: validValue,
    };

    setValues(updated);
    onChange(updated);
  };

  const handleAutoFill = async () => {
    setLoading(true);
    try {
      const fromLog = await getFromSpendingLog();
      if (fromLog) {
        setValues(fromLog);
        onChange(fromLog);
      }
    } catch (error) {
      console.error('Failed to auto-fill from spending log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaults = () => {
    const defaults = getDefaultSpendingProfile();
    setValues(defaults);
    onChange(defaults);
  };

  const totalMonthly = calculateTotalMonthlySpend(values);
  const totalAnnual = totalMonthly * 12;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Spending by Category</Text>
        <Text style={styles.subtitle}>
          Enter your average monthly spending in each category
        </Text>
      </View>

      {showAutoFill && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAutoFill}
            disabled={loading}
          >
            <TrendingUp size={16} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>
              {loading ? 'Loading...' : 'Auto-fill from Spending Log'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleUseDefaults}
          >
            <FileText size={16} color={colors.text.secondary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Use Canadian Averages
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputsContainer}>
        {CATEGORIES.map((config) => (
          <View key={config.key} style={styles.inputRow}>
            <View style={styles.labelContainer}>
              <Text style={styles.icon}>{config.icon}</Text>
              <Text style={styles.label}>{config.label}</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                value={values[config.key].toString()}
                onChangeText={(text) => handleChange(config.key, text)}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
              />
              <Text style={styles.perMonth}>/mo</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Monthly Spending</Text>
          <Text style={styles.summaryValue}>${totalMonthly.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelSecondary}>Total Annual Spending</Text>
          <Text style={styles.summaryValueSecondary}>${totalAnnual.toFixed(0)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: colors.border.medium,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  actionButtonTextSecondary: {
    color: colors.text.secondary,
  },
  inputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
    padding: 0,
    minWidth: 40,
  },
  perMonth: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  summary: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
  },
  summaryLabelSecondary: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  summaryValueSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default SpendingProfileForm;
