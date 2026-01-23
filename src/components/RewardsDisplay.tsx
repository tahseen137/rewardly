/**
 * RewardsDisplay - Display list of reward calculation results
 * Requirements: 5.1, 5.6
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { CardRewardItem } from './CardRewardItem';
import { RedemptionOptionsModal } from './RedemptionOptionsModal';
import { EmptyState } from './EmptyState';
import { useTheme } from '../theme';
import { RewardCalculationResult } from '../services/RewardsCalculatorService';
import { Card } from '../types';

interface RewardsDisplayProps {
  results: RewardCalculationResult[];
  bestCard: RewardCalculationResult | null;
  isLoading: boolean;
  isEmpty: boolean;
  amount: number;
  cards: Card[];
  onCardPress?: (result: RewardCalculationResult) => void;
}

export function RewardsDisplay({
  results,
  bestCard,
  isLoading,
  isEmpty,
  amount,
  cards,
  onCardPress,
}: RewardsDisplayProps) {
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
          Calculating rewards...
        </Text>
      </View>
    );
  }

  // Empty portfolio state
  if (isEmpty) {
    return (
      <EmptyState
        icon="💳"
        title="No Cards in Portfolio"
        message="Add cards to your portfolio to see rewards for this purchase"
        actionText="Go to My Cards"
        onAction={() => {
          // Navigation will be handled by parent component
          console.log('Navigate to My Cards');
        }}
      />
    );
  }

  // No results state (shouldn't happen if not empty, but handle it)
  if (results.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No Results"
        message="Unable to calculate rewards. Please try again."
      />
    );
  }

  // Results display
  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>
        Rewards Comparison
      </Text>
      <Text style={[styles.subheader, { color: theme.colors.text.secondary }]}>
        {results.length} {results.length === 1 ? 'card' : 'cards'} in your portfolio
      </Text>

      <FlatList
        data={results}
        keyExtractor={(item) => item.cardId}
        renderItem={({ item }) => {
          const card = cards.find((c) => c.id === item.cardId);
          return (
            <CardRewardItem
              result={item}
              isBestValue={bestCard?.cardId === item.cardId}
              card={card}
              onPress={onCardPress ? () => onCardPress(item) : undefined}
              onViewOptions={() => handleViewOptions(item.cardId)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
