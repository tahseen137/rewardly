/**
 * RewardsDisplay - Display list of reward calculation results
 * Requirements: 5.1, 5.6
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CardRewardItem } from './CardRewardItem';
import { RedemptionOptionsModal } from './RedemptionOptionsModal';
import { EmptyState } from './EmptyState';
import { useTheme } from '../theme';
import { RewardCalculationResult } from '../services/RewardsCalculatorService';
import { Card, SpendingCategory } from '../types';

interface RewardsDisplayProps {
  results: RewardCalculationResult[];
  bestCard: RewardCalculationResult | null;
  isLoading: boolean;
  isEmpty: boolean;
  amount: number;
  cards: Card[];
  /** The spending category being displayed (for rate badge) */
  category?: SpendingCategory;
  onCardPress?: (result: RewardCalculationResult) => void;
  /** When true, results are top cards from DB (not user's portfolio) */
  isDiscovery?: boolean;
}

export function RewardsDisplay({
  results,
  bestCard,
  isLoading,
  isEmpty,
  amount,
  cards,
  category,
  onCardPress,
  isDiscovery = false,
}: RewardsDisplayProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleViewOptions = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setSelectedCard(card);
      setModalVisible(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          {t('home.calculating')}
        </Text>
      </View>
    );
  }

  // Empty portfolio state
  if (isEmpty) {
    return (
      <EmptyState
        icon="💳"
        title={t('home.noCardsTitle')}
        description={t('home.noCardsMessage')}
        actionLabel={t('tabs.myCards')}
        onAction={() => {
          // Navigation will be handled by parent component
        }}
      />
    );
  }

  // No results state (shouldn't happen if not empty, but handle it)
  if (results.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title={t('home.noResultsTitle')}
        description={t('home.noResultsMessage')}
      />
    );
  }

  // Results display
  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>
        {t('home.rewardsComparison')}
      </Text>
      <Text style={[styles.subheader, { color: theme.colors.text.secondary }]}>
        {isDiscovery
          ? t('home.topCardsCount', { count: results.length }) || `Top ${results.length} cards`
          : t('home.cardsInPortfolio', { count: results.length })}
      </Text>

      {/* Use plain View + map instead of FlatList to avoid nested scroll issues on web */}
      <View style={styles.listContent}>
        {results.map((item) => {
          const card = cards.find((c) => c.id === item.cardId);
          return (
            <CardRewardItem
              key={item.cardId}
              result={item}
              isBestValue={bestCard?.cardId === item.cardId}
              card={card}
              category={category}
              onPress={onCardPress ? () => onCardPress(item) : undefined}
              onViewOptions={() => handleViewOptions(item.cardId)}
            />
          );
        })}
      </View>

      {/* Redemption Options Modal */}
      {selectedCard && (
        <RedemptionOptionsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          card={selectedCard}
          amount={amount}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default RewardsDisplay;
