/**
 * RedemptionOptionsModal - Shows all redemption options for a card's reward program
 *
 * Displays different ways to redeem points/miles with their values,
 * helping users understand how to maximize their rewards.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Card, RedemptionOption } from '../types';
import { colors, spacing, typography } from '../theme';
import { formatCadValue } from '../utils/amountUtils';

// ============================================================================
// Types
// ============================================================================

interface RedemptionOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  card: Card;
  amount: number; // Purchase amount in CAD
}

interface CalculatedRedemption extends RedemptionOption {
  pointsEarned: number;
  cadValue: number;
  isOptimal: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const RedemptionOptionsModal: React.FC<RedemptionOptionsModalProps> = ({
  visible,
  onClose,
  card,
  amount,
}) => {
  // Calculate rewards for each redemption option
  const calculateRedemptions = (): CalculatedRedemption[] => {
    if (!card.programDetails?.redemptionOptions) {
      return [];
    }

    // Get base multiplier (simplified - could be enhanced to use category)
    const multiplier = card.baseRewardRate.value;
    const pointsEarned = amount * multiplier;

    const optimalRate = card.programDetails.optimalRateCents || 0;

    return card.programDetails.redemptionOptions
      .map((option) => {
        const cadValue = pointsEarned * (option.cents_per_point / 100);
        return {
          ...option,
          pointsEarned,
          cadValue,
          isOptimal: option.cents_per_point === optimalRate,
        };
      })
      .sort((a, b) => b.cadValue - a.cadValue); // Sort by value descending
  };

  const redemptions = calculateRedemptions();

  if (!card.programDetails) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{card.name}</Text>
              <Text style={styles.subtitle}>{card.programDetails.programName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Purchase Info */}
          <View style={styles.purchaseInfo}>
            <Text style={styles.purchaseLabel}>Purchase Amount:</Text>
            <Text style={styles.purchaseAmount}>{formatCadValue(amount)}</Text>
          </View>

          {/* Redemption Options */}
          <ScrollView style={styles.optionsList}>
            <Text style={styles.sectionTitle}>Redemption Options</Text>
            
            {redemptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No redemption options available for this card.
                </Text>
              </View>
            ) : (
              redemptions.map((redemption, index) => (
                <View key={index} style={styles.optionCard}>
                  {/* Option Header */}
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionType}>{redemption.redemption_type}</Text>
                    {redemption.isOptimal && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                      </View>
                    )}
                  </View>

                  {/* Value Display */}
                  <View style={styles.valueRow}>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>Points Earned</Text>
                      <Text style={styles.valueAmount}>
                        {Math.round(redemption.pointsEarned).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>CAD Value</Text>
                      <Text style={[styles.valueAmount, styles.cadValue]}>
                        {formatCadValue(redemption.cadValue)}
                      </Text>
                    </View>
                  </View>

                  {/* Rate */}
                  <Text style={styles.rateText}>
                    {redemption.cents_per_point.toFixed(2)}¢ per point
                  </Text>

                  {/* Minimum Redemption */}
                  {redemption.minimum_redemption && (
                    <Text style={styles.minimumText}>
                      Minimum: {redemption.minimum_redemption.toLocaleString()} points
                    </Text>
                  )}

                  {/* Notes */}
                  {redemption.notes && (
                    <Text style={styles.notesText}>{redemption.notes}</Text>
                  )}
                </View>
              ))
            )}

            {/* Optimal Method Info */}
            {card.programDetails.optimalMethod && (
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>💡 Pro Tip</Text>
                <Text style={styles.tipText}>
                  Best redemption: {card.programDetails.optimalMethod}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
            <Text style={styles.closeButtonBottomText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  purchaseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
  },
  purchaseLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  purchaseAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  optionsList: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionType: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  bestBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  bestBadgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  valueAmount: {
    ...typography.h4,
    color: colors.text,
  },
  cadValue: {
    color: colors.primary,
  },
  rateText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  minimumText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  tipCard: {
    backgroundColor: colors.info + '20',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  tipTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.body,
    color: colors.text,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeButtonBottom: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonBottomText: {
    ...typography.button,
    color: colors.background,
  },
});
