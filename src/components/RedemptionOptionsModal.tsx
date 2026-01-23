/**
 * RedemptionOptionsModal - Shows all redemption options for a card's reward program
 *
 * Displays different ways to redeem points/miles with their values,
 * helping users understand how to maximize their rewards.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Card, RedemptionOption } from '../types';
import { useTheme, Theme } from '../theme';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  
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

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.text.secondary,
  },
  purchaseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: 12,
  },
  purchaseLabel: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
  purchaseAmount: {
    ...theme.textStyles.h3,
    color: theme.colors.primary.main,
  },
  optionsList: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  optionCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  optionType: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    flex: 1,
  },
  bestBadge: {
    backgroundColor: theme.colors.success.main,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
  },
  bestBadgeText: {
    ...theme.textStyles.caption,
    color: theme.colors.background.primary,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  valueAmount: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
  },
  cadValue: {
    color: theme.colors.primary.main,
  },
  rateText: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  minimumText: {
    ...theme.textStyles.caption,
    color: theme.colors.warning.main,
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  tipCard: {
    backgroundColor: theme.colors.info.main + '20',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.info.main,
  },
  tipTitle: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  tipText: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  closeButtonBottom: {
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonBottomText: {
    ...theme.textStyles.button,
    color: theme.colors.primary.contrast,
  },
});
