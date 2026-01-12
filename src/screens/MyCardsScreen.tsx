/**
 * MyCardsScreen - Display and manage user's card portfolio
 * Requirements: 1.1, 1.2, 1.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';

import { Card, UserCard, RewardType } from '../types';
import {
  getCards,
  addCard,
  removeCard,
  initializePortfolio,
} from '../services/CardPortfolioManager';
import { getAllCards, getCardById, searchCards } from '../services/CardDataService';

/**
 * Format reward rate for display
 */
function formatRewardRate(value: number, type: RewardType, unit: 'percent' | 'multiplier'): string {
  if (unit === 'percent') {
    return `${value}% ${type === RewardType.CASHBACK ? 'cash back' : type.replace('_', ' ')}`;
  }
  return `${value}x ${type.replace('_', ' ')}`;
}

/**
 * Card item component for the portfolio list
 */
function CardItem({
  userCard,
  onRemove,
}: {
  userCard: UserCard;
  onRemove: (cardId: string) => void;
}) {
  const card = getCardById(userCard.cardId);

  if (!card) {
    return null;
  }

  return (
    <View style={styles.cardItem}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardIssuer}>{card.issuer}</Text>
        <Text style={styles.cardReward}>
          Base: {formatRewardRate(
            card.baseRewardRate.value,
            card.baseRewardRate.type,
            card.baseRewardRate.unit
          )}
        </Text>
        {card.categoryRewards.length > 0 && (
          <Text style={styles.cardCategories}>
            Bonus categories: {card.categoryRewards.map((cr) => cr.category).join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(card.id)}
        accessibilityLabel={`Remove ${card.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Card picker item for the add card modal
 */
function CardPickerItem({
  card,
  isOwned,
  onSelect,
}: {
  card: Card;
  isOwned: boolean;
  onSelect: (cardId: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pickerItem, isOwned && styles.pickerItemDisabled]}
      onPress={() => !isOwned && onSelect(card.id)}
      disabled={isOwned}
      accessibilityLabel={`${card.name} by ${card.issuer}${isOwned ? ', already in portfolio' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.pickerItemInfo}>
        <Text style={[styles.pickerItemName, isOwned && styles.pickerItemTextDisabled]}>
          {card.name}
        </Text>
        <Text style={[styles.pickerItemIssuer, isOwned && styles.pickerItemTextDisabled]}>
          {card.issuer}
        </Text>
        <Text style={[styles.pickerItemReward, isOwned && styles.pickerItemTextDisabled]}>
          {formatRewardRate(
            card.baseRewardRate.value,
            card.baseRewardRate.type,
            card.baseRewardRate.unit
          )}
        </Text>
      </View>
      {isOwned && <Text style={styles.ownedBadge}>Owned</Text>}
    </TouchableOpacity>
  );
}

export default function MyCardsScreen() {
  const [portfolio, setPortfolio] = useState<UserCard[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadPortfolio = useCallback(async () => {
    await initializePortfolio();
    setPortfolio(getCards());
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  }, [loadPortfolio]);

  const handleAddCard = async (cardId: string) => {
    const result = await addCard(cardId);
    if (result.success) {
      setPortfolio(getCards());
      setIsModalVisible(false);
      setSearchQuery('');
    } else {
      if (result.error.type === 'DUPLICATE_CARD') {
        Alert.alert('Duplicate Card', `${result.error.cardName} is already in your portfolio.`);
      } else {
        Alert.alert('Error', 'Failed to add card. Please try again.');
      }
    }
  };

  const handleRemoveCard = (cardId: string) => {
    const card = getCardById(cardId);
    Alert.alert(
      'Remove Card',
      `Are you sure you want to remove ${card?.name || 'this card'} from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeCard(cardId);
            if (result.success) {
              setPortfolio(getCards());
            } else {
              Alert.alert('Error', 'Failed to remove card. Please try again.');
            }
          },
        },
      ]
    );
  };

  const ownedCardIds = new Set(portfolio.map((uc) => uc.cardId));
  const availableCards = searchQuery ? searchCards(searchQuery) : getAllCards();

  return (
    <View style={styles.container}>
      {portfolio.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💳</Text>
          <Text style={styles.emptyStateTitle}>No Cards Yet</Text>
          <Text style={styles.emptyStateText}>
            Add your credit cards to get personalized reward recommendations.
          </Text>
          <TouchableOpacity
            style={styles.addButtonLarge}
            onPress={() => setIsModalVisible(true)}
            accessibilityLabel="Add your first card"
            accessibilityRole="button"
          >
            <Text style={styles.addButtonLargeText}>Add Your First Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={portfolio}
            keyExtractor={(item) => item.cardId}
            renderItem={({ item }) => (
              <CardItem userCard={item} onRemove={handleRemoveCard} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setIsModalVisible(true)}
            accessibilityLabel="Add a card"
            accessibilityRole="button"
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity
              onPress={() => {
                setIsModalVisible(false);
                setSearchQuery('');
              }}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search cards"
          />

          <FlatList
            data={availableCards}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CardPickerItem
                card={item}
                isOwned={ownedCardIds.has(item.id)}
                onSelect={handleAddCard}
              />
            )}
            contentContainerStyle={styles.pickerListContent}
          />
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardIssuer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardReward: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  cardCategories: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButtonLarge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonLargeText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pickerListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pickerItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemDisabled: {
    opacity: 0.6,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  pickerItemIssuer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pickerItemReward: {
    fontSize: 13,
    color: '#007AFF',
  },
  pickerItemTextDisabled: {
    color: '#8E8E93',
  },
  ownedBadge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    marginLeft: 8,
  },
});
