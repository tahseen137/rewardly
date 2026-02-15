/**
 * MyCardsScreen - Display and manage user's card portfolio
 * Redesigned to match web with lucide icons and modern card styling
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
  ScrollView,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plus, Search, Trash2, ChevronRight, X, Wallet, TrendingUp, Edit3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Theme } from '../theme';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Card, UserCard, RewardType } from '../types';
import {
  getCards,
  addCard,
  removeCard,
  initializePortfolio,
  updatePointBalance,
} from '../services/CardPortfolioManager';
import { getAllCards, searchCards, getCardByIdSync } from '../services/CardDataService';
import { getCurrentTierSync, getCardLimitSync } from '../services/SubscriptionService';
import { CountryChangeEmitter } from '../services/CountryChangeEmitter';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatUpToRate, formatBestForCategories } from '../utils/rewardFormatUtils';

function formatRewardRate(value: number, type: RewardType, unit: 'percent' | 'multiplier'): string {
  if (unit === 'percent') {
    return `${value}% ${type === RewardType.CASHBACK ? 'cash back' : type.replace('_', ' ')}`;
  }
  return `${value}x ${type.replace('_', ' ')}`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Portfolio Summary Component
function PortfolioSummary({ portfolio }: { portfolio: UserCard[] }) {
  const totalPoints = portfolio.reduce((sum, uc) => sum + (uc.pointBalance || 0), 0);
  
  // Calculate estimated value (rough estimate using 1.5 cents average)
  const estimatedValue = totalPoints * 0.015;
  
  const cardsWithBalance = portfolio.filter(uc => uc.pointBalance && uc.pointBalance > 0).length;
  
  if (totalPoints === 0) return null;
  
  return (
    <View style={summaryStyles.container}>
      <LinearGradient
        colors={[colors.primary.main + '20', colors.accent.main + '15']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={summaryStyles.gradient}
      >
        <View style={summaryStyles.content}>
          <View style={summaryStyles.iconContainer}>
            <Wallet size={24} color={colors.primary.main} />
          </View>
          <View style={summaryStyles.stats}>
            <Text style={summaryStyles.pointsValue}>{formatNumber(totalPoints)}</Text>
            <Text style={summaryStyles.pointsLabel}>Total Points</Text>
          </View>
          <View style={summaryStyles.divider} />
          <View style={summaryStyles.stats}>
            <View style={summaryStyles.valueRow}>
              <TrendingUp size={14} color={colors.primary.main} />
              <Text style={summaryStyles.estimatedValue}>{formatCurrency(estimatedValue)}</Text>
            </View>
            <Text style={summaryStyles.valueLabel}>Est. Value</Text>
          </View>
        </View>
        <Text style={summaryStyles.footer}>
          {cardsWithBalance} card{cardsWithBalance !== 1 ? 's' : ''} with tracked balances
        </Text>
      </LinearGradient>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stats: {
    flex: 1,
  },
  pointsValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.light,
    marginHorizontal: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estimatedValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
  },
  valueLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  footer: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 12,
    textAlign: 'center',
  },
});

function CardItem({
  userCard,
  onRemove,
  onViewDetails,
  onUpdateBalance,
}: {
  userCard: UserCard;
  onRemove: (cardId: string) => void;
  onViewDetails: (card: Card) => void;
  onUpdateBalance: (cardId: string, currentBalance?: number) => void;
}) {
  const card = getCardByIdSync(userCard.cardId);

  // Show placeholder for cards not in current country's cache
  // This can happen if user switches country but has cards from another country
  if (!card) {
    return (
      <View style={styles.cardItemContainer}>
        <View style={styles.cardItem}>
          <View style={[styles.issuerBadge, { backgroundColor: colors.background.tertiary }]}>
            <Text style={styles.issuerText}>??</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>Card not available</Text>
            <Text style={styles.cardMeta}>This card may be from another country</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onRemove(userCard.cardId)}
            accessibilityLabel="Remove card"
            accessibilityRole="button"
          >
            <Trash2 size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatAnnualFee = (fee?: number) => {
    if (fee === undefined || fee === 0) return 'No annual fee';
    return `$${fee}/year`;
  };

  // Web-compatible card item without gesture handler
  // Gesture handler has issues on web with Modal, so we use a simpler implementation
  const cardContent = (
    <View style={styles.cardItem}>
      {/* Issuer Badge with Gradient */}
      <LinearGradient
        colors={[colors.primary.main + '4D', colors.accent.main + '4D']} // 30% opacity (~4D in hex)
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.issuerBadge}
      >
        <Text style={styles.issuerText}>
          {card.issuer.slice(0, 2).toUpperCase()}
        </Text>
      </LinearGradient>

      {/* Card Info - Tappable */}
      <TouchableOpacity
        style={styles.cardInfo}
        onPress={() => onViewDetails(card)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardMeta}>
          {card.issuer} • {formatAnnualFee(card.annualFee)}
        </Text>
        {/* Point Balance Display */}
        {userCard.pointBalance !== undefined && userCard.pointBalance > 0 ? (
          <View style={styles.balanceRow}>
            <Wallet size={12} color={colors.primary.main} />
            <Text style={styles.balanceText}>
              {formatNumber(userCard.pointBalance)} pts
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Balance Edit Button */}
      <TouchableOpacity
        style={styles.balanceEditButton}
        onPress={() => onUpdateBalance(card.id, userCard.pointBalance)}
        accessibilityLabel={`Edit balance for ${card.name}`}
        accessibilityRole="button"
      >
        <Edit3 size={16} color={colors.text.tertiary} />
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onRemove(card.id)}
        accessibilityLabel={`Remove ${card.name}`}
        accessibilityRole="button"
      >
        <Trash2 size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Chevron */}
      <ChevronRight size={18} color={colors.text.tertiary} />
    </View>
  );

  // On native, wrap with gesture handler for swipe-to-delete
  // On web, skip gesture handler to avoid React hook errors
  if (Platform.OS === 'web') {
    return (
      <View style={styles.cardItemContainer}>
        {cardContent}
      </View>
    );
  }

  // Native implementation with gesture handler
  return <CardItemWithGesture userCard={userCard} onRemove={onRemove} onViewDetails={onViewDetails} onUpdateBalance={onUpdateBalance} card={card} />;
}

// Native-only component with gesture handler
function CardItemWithGesture({
  userCard,
  onRemove,
  onViewDetails,
  onUpdateBalance,
  card,
}: {
  userCard: UserCard;
  onRemove: (cardId: string) => void;
  onViewDetails: (card: Card) => void;
  onUpdateBalance: (cardId: string, currentBalance?: number) => void;
  card: Card;
}) {
  const translateX = useSharedValue(0);

  const formatAnnualFee = (fee?: number) => {
    if (fee === undefined || fee === 0) return 'No annual fee';
    return `$${fee}/year`;
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      if (translateX.value < -80) {
        runOnJS(onRemove)(card.id);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.cardItemContainer}>
      <View style={styles.deleteBackground}>
        <Trash2 size={20} color={colors.error.main} />
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardItem, animatedStyle]}>
          {/* Issuer Badge with Gradient */}
          <LinearGradient
            colors={[colors.primary.main + '4D', colors.accent.main + '4D']} // 30% opacity (~4D in hex)
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.issuerBadge}
          >
            <Text style={styles.issuerText}>
              {card.issuer.slice(0, 2).toUpperCase()}
            </Text>
          </LinearGradient>

          {/* Card Info - Tappable */}
          <TouchableOpacity
            style={styles.cardInfo}
            onPress={() => onViewDetails(card)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardMeta}>
              {card.issuer} • {formatAnnualFee(card.annualFee)}
            </Text>
            {/* Point Balance Display */}
            {userCard.pointBalance !== undefined && userCard.pointBalance > 0 ? (
              <View style={styles.balanceRow}>
                <Wallet size={12} color={colors.primary.main} />
                <Text style={styles.balanceText}>
                  {formatNumber(userCard.pointBalance)} pts
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Balance Edit Button */}
          <TouchableOpacity
            style={styles.balanceEditButton}
            onPress={() => onUpdateBalance(card.id, userCard.pointBalance)}
            accessibilityLabel={`Edit balance for ${card.name}`}
            accessibilityRole="button"
          >
            <Edit3 size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onRemove(card.id)}
            accessibilityLabel={`Remove ${card.name}`}
            accessibilityRole="button"
          >
            <Trash2 size={18} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Chevron */}
          <ChevronRight size={18} color={colors.text.tertiary} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function CardPickerItem({
  card,
  isOwned,
  onSelect,
}: {
  card: Card;
  isOwned: boolean;
  onSelect: (cardId: string) => void;
}) {

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
        <Text style={[styles.pickerItemName, isOwned && styles.pickerItemTextDisabled]}>
          {card.name}
        </Text>
        <Text style={[styles.pickerItemIssuer, isOwned && styles.pickerItemTextDisabled]}>
          {card.issuer}
        </Text>
        <Text style={[styles.pickerItemAnnualFee, isOwned && styles.pickerItemTextDisabled]}>
          {formatAnnualFee(card.annualFee)}
        </Text>
        <Text style={[styles.pickerItemReward, isOwned && styles.pickerItemTextDisabled]}>
          {formatUpToRate(card)}
        </Text>
        {(() => {
          const bestFor = formatBestForCategories(card, 3);
          return bestFor ? (
            <Text style={[styles.pickerItemBestFor, isOwned && styles.pickerItemTextDisabled]}>
              {bestFor}
            </Text>
          ) : null;
        })()}
      </View>
      {isOwned && <Text style={styles.ownedBadge}>Owned</Text>}
    </TouchableOpacity>
  );
}

export default function MyCardsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [portfolio, setPortfolio] = useState<UserCard[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  // Navigate to CardDetail when a card is tapped
  const handleViewDetails = useCallback((card: Card) => {
    navigation.navigate('CardDetail' as never, { cardId: card.id } as never);
  }, [navigation]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    // Ensure card cache is populated before loading portfolio
    // This fixes the race condition where portfolio loads before cards are cached
    await getAllCards();
    await initializePortfolio();
    setPortfolio(getCards());
    setIsInitialLoading(false);
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

  // Filter portfolio based on search
  const filteredPortfolio = useMemo(() => {
    if (!portfolioSearchQuery.trim()) return portfolio;
    const query = portfolioSearchQuery.toLowerCase();
    return portfolio.filter((userCard) => {
      const card = getCardByIdSync(userCard.cardId);
      if (!card) return false;
      return (
        card.name.toLowerCase().includes(query) ||
        card.issuer.toLowerCase().includes(query)
      );
    });
  }, [portfolio, portfolioSearchQuery]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Re-load when country changes so card lookups resolve correctly
  useEffect(() => {
    const unsubscribe = CountryChangeEmitter.subscribe(() => {
      loadPortfolio();
    });
    return unsubscribe;
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
      // Handle different error types
      if (result.error.type === 'LIMIT_REACHED') {
        // Show upgrade prompt for card limit reached
        if (Platform.OS === 'web') {
          if (window.confirm(`Card Limit Reached\n\n${result.error.message}\n\nWould you like to upgrade to Pro?`)) {
            setIsModalVisible(false);
            navigation.navigate('Upgrade', { feature: 'unlimited_cards', source: 'my_cards' });
          }
        } else {
          Alert.alert(
            'Card Limit Reached',
            result.error.message,
            [
              { text: 'Maybe Later', style: 'cancel' },
              { 
                text: 'Upgrade to Pro', 
                onPress: () => {
                  setIsModalVisible(false);
                  navigation.navigate('Upgrade', { feature: 'unlimited_cards', source: 'my_cards' });
                }
              },
            ]
          );
        }
      } else if (result.error.type === 'DUPLICATE_CARD') {
        if (Platform.OS === 'web') {
          window.alert(`${result.error.cardName} is already in your portfolio.`);
        } else {
          Alert.alert('Duplicate Card', `${result.error.cardName} is already in your portfolio.`);
        }
      } else if (result.error.type === 'CARD_NOT_FOUND') {
        if (Platform.OS === 'web') {
          window.alert('The selected card could not be found.');
        } else {
          Alert.alert('Card Not Found', 'The selected card could not be found.');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('Failed to add card. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to add card. Please try again.');
        }
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
      Alert.alert(
        'Remove Card',
        `Are you sure you want to remove ${cardName} from your portfolio?`,
        [
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
        ]
      );
    }
  };

  const handleUpdateBalance = useCallback((cardId: string, currentBalance?: number) => {
    const card = getCardByIdSync(cardId);
    const cardName = card?.name || 'this card';

    // Use a simple prompt for balance input
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const input = window.prompt(
        `Enter point balance for ${cardName}:`,
        currentBalance?.toString() || ''
      );
      if (input !== null) {
        const newBalance = input.trim() === '' ? undefined : parseInt(input.replace(/,/g, ''), 10);
        if (newBalance === undefined || (!isNaN(newBalance) && newBalance >= 0)) {
          updatePointBalance(cardId, newBalance).then((result) => {
            if (result.success) {
              setPortfolio(getCards());
            }
          });
        } else {
          alert('Please enter a valid number');
        }
      }
    } else {
      Alert.prompt(
        'Update Balance',
        `Enter point balance for ${cardName}:`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              updatePointBalance(cardId, undefined).then((result) => {
                if (result.success) setPortfolio(getCards());
              });
            },
          },
          {
            text: 'Save',
            onPress: (value?: string) => {
              const newBalance = value?.trim() === '' ? undefined : parseInt(value?.replace(/,/g, '') || '0', 10);
              if (newBalance === undefined || (!isNaN(newBalance) && newBalance >= 0)) {
                updatePointBalance(cardId, newBalance).then((result) => {
                  if (result.success) setPortfolio(getCards());
                });
              }
            },
          },
        ],
        'plain-text',
        currentBalance?.toString() || ''
      );
    }
  }, []);

  const ownedCardIds = new Set(portfolio.map((uc) => uc.cardId));

  // Show loading state while initializing
  if (isInitialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  // Get subscription tier and limits
  const tier = getCurrentTierSync();
  const limit = getCardLimitSync();
  const showLimit = tier === 'free' && limit !== Infinity;
  const atLimit = showLimit && portfolio.length >= limit;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>My Cards</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {showLimit 
                ? `${portfolio.length}/${limit} cards`
                : `${portfolio.length} card${portfolio.length !== 1 ? 's' : ''}`
              }
            </Text>
            {atLimit && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Upgrade', { feature: 'unlimited_cards', source: 'my_cards_header' })}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={styles.upgradeLink}>Upgrade for unlimited</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="Add card"
          accessibilityRole="button"
        >
          <Plus size={16} color={colors.primary.main} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {portfolio.length > 0 && (
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search cards..."
            value={portfolioSearchQuery}
            onChangeText={setPortfolioSearchQuery}
            placeholderTextColor={colors.text.tertiary}
            style={styles.searchInput}
          />
        </View>
      )}

      {/* Content */}
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
        <FlatList
          data={filteredPortfolio}
          keyExtractor={(item) => item.cardId}
          ListHeaderComponent={<PortfolioSummary portfolio={portfolio} />}
          renderItem={({ item }) => (
            <CardItem
              userCard={item}
              onRemove={handleRemoveCard}
              onUpdateBalance={handleUpdateBalance}
              onViewDetails={handleViewDetails}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            portfolioSearchQuery ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No cards match your search</Text>
              </View>
            ) : null
          }
        />
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
            style={styles.modalSearchInput}
            placeholder="Search cards..."
            placeholderTextColor={colors.text.tertiary}
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
                <CardPickerItem
                  card={item}
                  isOwned={ownedCardIds.has(item.id)}
                  onSelect={handleAddCard}
                />
              )}
              contentContainerStyle={styles.pickerListContent}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // bold
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13, // text-sm
    color: colors.text.secondary,
    marginTop: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  upgradeLink: {
    fontSize: 12,
    color: colors.primary.main,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background.primary, // Dark text on bright green
  },
  searchContainer: {
    position: 'relative',
    height: 44,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 32,
    fontSize: 15,
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: 100, // Space for tab bar
  },
  // Card Item styles
  cardItemContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    width: '100%',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md, // 12px
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  issuerBadge: {
    width: 56, // w-14
    height: 40, // h-10
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issuerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  balanceEditButton: {
    padding: 8,
    marginRight: -4,
  },
  deleteButton: {
    padding: 8,
  },
  emptySearch: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  // Empty state styles
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButtonLarge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  addButtonLargeText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary.main,
  },
  modalSearchInput: {
    height: 40,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: 40,
    fontSize: 15,
    color: colors.text.primary,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  pickerListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pickerItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 12,
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
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  pickerItemIssuer: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  pickerItemReward: {
    fontSize: 11,
    color: colors.primary.main,
  },
  pickerItemBestFor: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pickerItemAnnualFee: {
    fontSize: 11,
    color: colors.success.main,
    marginBottom: 2,
  },
  pickerItemTextDisabled: {
    color: colors.text.tertiary,
  },
  ownedBadge: {
    fontSize: 11,
    color: colors.success.main,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
});
