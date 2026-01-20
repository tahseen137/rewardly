/**
 * CardDetailModal - Modal component for displaying detailed card information
 */

import React, { useMemo } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../theme';
import { Button } from './Button';
import { Card, RewardType } from '../types';

interface CardDetailModalProps {
  /** The card to display details for */
  card: Card | null;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional: Current reward rate at selected store */
  currentRewardRate?: {
    value: number;
    type: RewardType;
    unit: 'percent' | 'multiplier';
  };
  /** Optional: Action button (e.g., "Add to Portfolio") */
  actionButton?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  };
}

export function CardDetailModal({
  card,
  visible,
  onClose,
  currentRewardRate,
  actionButton,
}: CardDetailModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!card) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('cardDetail.title')}</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.doneButton}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardIssuer}>{card.issuer}</Text>
            <Text style={styles.cardProgram}>{card.rewardProgram}</Text>
            <View style={styles.feeContainer}>
              <Text style={styles.feeLabel}>{t('cardDetail.annualFee')}</Text>
              <Text style={styles.feeValue}>
                {card.annualFee === 0 ? t('cardDetail.noFee') : `$${card.annualFee}/yr`}
              </Text>
            </View>
          </View>

          {/* Current Store Rate (if provided) */}
          {currentRewardRate && (
            <View style={styles.highlightSection}>
              <Text style={styles.highlightLabel}>{t('cardDetail.rewardAtThisStore')}</Text>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightValue}>
                  {currentRewardRate.unit === 'percent'
                    ? `${currentRewardRate.value}%`
                    : `${currentRewardRate.value}x`}
                </Text>
                <Text style={styles.highlightType}>
                  {t(`rewardTypes.${currentRewardRate.type.toLowerCase()}`)}
                </Text>
              </View>
            </View>
          )}

          {/* Base Reward */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('cardDetail.baseReward')}</Text>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardCategory}>{t('cardDetail.allPurchases')}</Text>
              <Text style={styles.rewardValue}>
                {card.baseRewardRate.unit === 'percent'
                  ? `${card.baseRewardRate.value}%`
                  : `${card.baseRewardRate.value}x`}
              </Text>
            </View>
          </View>

          {/* Category Rewards */}
          {card.categoryRewards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('cardDetail.bonusCategories')}</Text>
              {card.categoryRewards.map((cr, index) => (
                <View key={index} style={styles.rewardRow}>
                  <Text style={styles.rewardCategory}>
                    {cr.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={[styles.rewardValue, styles.rewardValueHighlight]}>
                    {cr.rewardRate.unit === 'percent'
                      ? `${cr.rewardRate.value}%`
                      : `${cr.rewardRate.value}x`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Signup Bonus */}
          {card.signupBonus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('cardDetail.signupBonus')}</Text>
              <View style={styles.bonusBox}>
                <Text style={styles.bonusAmount}>
                  {card.signupBonus.currency === 'cashback' ? '$' : ''}
                  {card.signupBonus.amount.toLocaleString()}
                  {card.signupBonus.currency !== 'cashback' ? ` ${card.signupBonus.currency}` : ''}
                </Text>
                <Text style={styles.bonusRequirement}>
                  {t('cardDetail.signupBonusDetails', {
                    spendRequirement: `$${card.signupBonus.spendRequirement.toLocaleString()}`,
                    timeframeDays: card.signupBonus.timeframeDays,
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Spacer for action button */}
          {actionButton && <View style={{ height: 80 }} />}
        </ScrollView>

        {/* Fixed Action Button */}
        {actionButton && (
          <View style={styles.actionContainer}>
            <Button
              title={actionButton.label}
              onPress={actionButton.onPress}
              variant={actionButton.variant || 'primary'}
              fullWidth
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
      backgroundColor: theme.colors.background.secondary,
    },
    headerTitle: {
      ...theme.textStyles.h3,
      color: theme.colors.text.primary,
    },
    doneButton: {
      ...theme.textStyles.button,
      color: theme.colors.primary.main,
    },
    content: {
      flex: 1,
      padding: theme.spacing.screenPadding,
    },
    cardHeader: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    cardName: {
      ...theme.textStyles.h2,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    cardIssuer: {
      ...theme.textStyles.body,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    cardProgram: {
      ...theme.textStyles.label,
      color: theme.colors.primary.main,
      marginBottom: theme.spacing.md,
    },
    feeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    feeLabel: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.text.tertiary,
    },
    feeValue: {
      ...theme.textStyles.label,
      color: theme.colors.text.primary,
    },
    highlightSection: {
      backgroundColor: theme.colors.primary.main + '10', // 10% opacity
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    highlightLabel: {
      ...theme.textStyles.label,
      color: theme.colors.primary.main,
      marginBottom: theme.spacing.sm,
    },
    highlightBox: {
      alignItems: 'center',
    },
    highlightValue: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.primary.main,
    },
    highlightType: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.primary.dark,
      marginTop: theme.spacing.xs,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      ...theme.textStyles.h4,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    rewardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    rewardCategory: {
      ...theme.textStyles.body,
      color: theme.colors.text.primary,
      flex: 1,
    },
    rewardValue: {
      ...theme.textStyles.label,
      color: theme.colors.text.secondary,
    },
    rewardValueHighlight: {
      color: theme.colors.success.main,
      fontWeight: '600',
    },
    bonusBox: {
      backgroundColor: theme.colors.success.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    bonusAmount: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.success.dark,
      marginBottom: theme.spacing.sm,
    },
    bonusRequirement: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.success.dark,
      textAlign: 'center',
    },
    actionContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.screenPadding,
      paddingBottom: theme.spacing.xl,
      backgroundColor: theme.colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
  });

export default CardDetailModal;
