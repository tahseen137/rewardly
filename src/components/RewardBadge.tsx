/**
 * RewardBadge - Badge component for displaying reward rates
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../theme';
import { RewardType } from '../types';

interface RewardBadgeProps {
  /** Reward type determines color */
  type: RewardType;
  /** Reward value to display */
  value: number;
  /** Unit type */
  unit: 'percent' | 'multiplier';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show as rank badge (1st, 2nd, etc.) */
  rank?: number;
}

const SIZES = {
  small: { badge: 24, text: 11, padding: 6 },
  medium: { badge: 32, text: 14, padding: 8 },
  large: { badge: 44, text: 18, padding: 12 },
};

export function RewardBadge({ type, value, unit, size = 'medium', rank }: RewardBadgeProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = SIZES[size];

  const backgroundColor =
    {
      [RewardType.CASHBACK]: theme.colors.rewards.cashback,
      [RewardType.POINTS]: theme.colors.rewards.points,
      [RewardType.AIRLINE_MILES]: theme.colors.rewards.miles,
      [RewardType.HOTEL_POINTS]: theme.colors.rewards.hotel,
    }[type] || theme.colors.primary.main;

  const formattedValue = unit === 'percent' ? `${value}%` : `${value}x`;

  if (rank !== undefined) {
    return (
      <View style={[styles.rankBadge, { backgroundColor }]}>
        <Text style={[styles.rankText, { fontSize: sizeConfig.text }]}>#{rank}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: sizeConfig.padding,
          paddingVertical: sizeConfig.padding / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: sizeConfig.text }]}>{formattedValue}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    badge: {
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    rankBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default RewardBadge;
