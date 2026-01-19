/**
 * MyCardsScreen - Display and manage user's card portfolio
 * Requirements: 1.1, 1.2, 1.3
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useTheme, Theme } from '../theme';

import { Card, UserCard, RewardType } from '../types';
import {
  getCards,
  addCard,
  removeCard,
  initializePortfolio,
} from '../services/CardPortfolioManager';
import { getAllCards, searchCards, getCardByIdSync } from '../services/CardDataService';

function formatRewardRate(value: number, type: RewardType, unit: 'percent' | 'multiplier'): string {
  if (unit === 'percent') {
    return `${value}% ${type === RewardType.CASHBACK ? 'cash back' : type.replace('_', ' ')}`;
  }
  return `${value}x ${type.replace('_', ' ')}`;
}

function CardItem({
  userCard,
  onRemove,
  theme,
}: {
  userCard: UserCard;
  onRemove: (cardId: string) => void;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const card = getCardByIdSync(userCard.cardId);

  if (!card) return null;

  const formatAnnualFee = (fee?: number) => {
    if (fee === undefined || fee === 0) return 'No annual fee';
    return `$${fee}/year`;
  };

  return (
    <View style={styles.cardItem}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardIssuer}>{card.issuer}</Text>
        <Text style={styles.cardAnnualFee}>{formatAnnualFee(card.annualFee)}</Text>
        <Text style={styles.cardReward}>
          Base: {formatRewardRate(card.baseRewardRate.value, card.baseRewardRate.type, card.baseRewardRate.unit)}
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

function CardPickerItem({
  card,
  isOwned,
  onSelect,
  theme,
}: {
  card: Card;
  isOwned: boolean;
  onSelect: (cardId: string) => void;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  const formatAnnualFee = (fee?: number) => {
    if (fee === undefined || fee === 0) return 'No annual fee';
    return `$${fee}/year`;
  };

  return (
    <TouchableOpacity
      style={[styles.pickerItem, isOwned && styles.pickerItemDisabled]}
      onPress={() => !isOwned && onSelect(card.id)}
      disabled={isOwned}
      accessibilityLabel={`${card.name} by ${card.issuer}${isOwned ? ', already in portfolio' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.pickerItemInfo}>
        <Text style={[styles.pickerItemName, isOwned && styles.pickerItemTextDisabled]}>{card.name}</Text>
        <Text style={[styles.pickerItemIssuer, isOwned && styles.pickerItemTextDisabled]}>{card.issuer}</Text>
        <Text style={[styles.pickerItemAnnualFee, isOwned && styles.pickerItemTextDisabled]}>
          {formatAnnualFee(card.annualFee)}
        </Text>
        <Text style={[styles.pickerItemReward, isOwned && styles.pickerItemTextDisabled]}>
          {formatRewardRate(card.baseRewardRate.value, card.baseRewardRate.type, card.baseRewardRate.unit)}
        </Text>
      </View>
      {isOwned && <Text style={styles.ownedBadge}>Owned</Text>}
    </TouchableOpacity>
  );
}

export default function MyCardsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [portfolio, setPortfolio] = useState<UserCard[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  const loadPortfolio = useCallback(async () => {
    await initializePortfolio();
    setPortfolio(getCards());
  }, []);

  const loadAvailableCards = useCallback(async () => {
    setIsLoadingCards(true);
    try {
      const cards = searchQuery ? await searchCards(searchQuery) : await getAllCards();
      setAvailableCards(cards);
    } catch (error) {
      console.error('Failed to load cards:', error);
      setAvailableCards([]);
    } finally {
      setIsLoadingCards(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    if (isModalVisible) loadAvailableCards();
  }, [isModalVisible, loadAvailableCards]);

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
    const card = getCardByIdSync(cardId);
    const cardName = card?.name || 'this card';

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Are you sure you want to remove ${cardName} from your portfolio?`)) {
        removeCard(cardId).then((result) => {
          if (result.success) setPortfolio(getCards());
          else alert('Failed to remove card. Please try again.');
        });
      }
    } else {
      Alert.alert('Remove Card', `Are you sure you want to remove ${cardName} from your portfolio?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeCard(cardId);
            if (result.success) setPortfolio(getCards());
            else Alert.alert('Error', 'Failed to remove card. Please try again.');
          },
        },
      ]);
    }
  };

  const ownedCardIds = new Set(portfolio.map((uc) => uc.cardId));

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
            renderItem={({ item }) => <CardItem userCard={item} onRemove={handleRemoveCard} theme={theme} />}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search cards"
          />

          {isLoadingCards ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading cards...</Text>
            </View>
          ) : (
            <FlatList
              data={availableCards}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CardPickerItem card={item} isOwned={ownedCardIds.has(item.id)} onSelect={handleAddCard} theme={theme} />
              )}
              contentContainerStyle={styles.pickerListContent}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    listContent: { padding: theme.spacing.screenPadding, paddingBottom: 80 },
    cardItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.xs,
    },
    cardInfo: { flex: 1 },
    cardName: { ...theme.textStyles.h4, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
    cardIssuer: { ...theme.textStyles.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs },
    cardReward: { ...theme.textStyles.bodySmall, color: theme.colors.primary.main, marginBottom: 2 },
    cardAnnualFee: { ...theme.textStyles.caption, color: theme.colors.success.main, marginBottom: theme.spacing.xs },
    cardCategories: { ...theme.textStyles.caption, color: theme.colors.text.tertiary },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.error.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing.md,
    },
    removeButtonText: { color: theme.colors.error.contrast, fontSize: 16, fontWeight: '700' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyStateIcon: { fontSize: 64, marginBottom: theme.spacing.lg },
    emptyStateTitle: { ...theme.textStyles.h2, color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
    emptyStateText: {
      ...theme.textStyles.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    addButtonLarge: {
      backgroundColor: theme.colors.primary.main,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.inputPadding,
      borderRadius: theme.borderRadius.md,
    },
    addButtonLargeText: { ...theme.textStyles.button, color: theme.colors.primary.contrast },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: theme.layout.fabSize,
      height: theme.layout.fabSize,
      borderRadius: theme.layout.fabSize / 2,
      backgroundColor: theme.colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
    },
    fabText: { color: theme.colors.primary.contrast, fontSize: 28, fontWeight: '400', marginTop: -2 },
    modalContainer: { flex: 1, backgroundColor: theme.colors.background.primary },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.screenPadding,
      backgroundColor: theme.colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    modalTitle: { ...theme.textStyles.h4, color: theme.colors.text.primary },
    modalClose: { ...theme.textStyles.button, color: theme.colors.primary.main },
    searchInput: {
      backgroundColor: theme.colors.background.secondary,
      margin: theme.spacing.screenPadding,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      ...theme.textStyles.body,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    pickerListContent: { paddingHorizontal: theme.spacing.screenPadding, paddingBottom: 20 },
    pickerItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.inputPadding,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickerItemDisabled: { opacity: 0.6 },
    pickerItemInfo: { flex: 1 },
    pickerItemName: { ...theme.textStyles.body, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 2 },
    pickerItemIssuer: { ...theme.textStyles.bodySmall, color: theme.colors.text.secondary, marginBottom: 2 },
    pickerItemReward: { ...theme.textStyles.caption, color: theme.colors.primary.main },
    pickerItemAnnualFee: { ...theme.textStyles.caption, color: theme.colors.success.main, marginBottom: 2 },
    pickerItemTextDisabled: { color: theme.colors.text.tertiary },
    ownedBadge: { ...theme.textStyles.caption, color: theme.colors.success.main, fontWeight: '600', marginLeft: theme.spacing.sm },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { ...theme.textStyles.body, color: theme.colors.text.secondary },
  });
