/**
 * HomeScreen - Store search and card recommendations
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Card,
  RankedCard,
  StoreRecommendation,
  RewardType,
  UserPreferences,
  SpendingCategory,
  SignupBonus,
} from '../types';
import { getCards, initializePortfolio } from '../services/CardPortfolioManager';
import {
  getRewardTypePreference,
  isNewCardSuggestionsEnabled,
  initializePreferences,
} from '../services/PreferenceManager';
import { getStoreRecommendation } from '../services/RecommendationEngine';
import { searchStores } from '../services/StoreDataService';

/**
 * Format reward rate for display
 */
function formatRewardRate(value: number, type: RewardType, unit: 'percent' | 'multiplier'): string {
  if (unit === 'percent') {
    return `${value}%`;
  }
  return `${value}x`;
}

/**
 * Get reward type label (uses translation hook in component)
 */
function getRewardTypeLabelKey(type: RewardType): string {
  switch (type) {
    case RewardType.CASHBACK:
      return 'rewardTypes.cashback';
    case RewardType.POINTS:
      return 'rewardTypes.points';
    case RewardType.AIRLINE_MILES:
      return 'rewardTypes.airline_miles';
    case RewardType.HOTEL_POINTS:
      return 'rewardTypes.hotel_points';
    default:
      return type;
  }
}

/**
 * Format category name for display
 */
function formatCategory(category: SpendingCategory): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format signup bonus currency for display
 */
function formatSignupBonusCurrency(currency: RewardType): string {
  switch (currency) {
    case RewardType.CASHBACK:
      return 'cash back';
    case RewardType.POINTS:
      return 'points';
    case RewardType.AIRLINE_MILES:
      return 'miles';
    case RewardType.HOTEL_POINTS:
      return 'hotel points';
    default:
      return currency;
  }
}

/**
 * Card Detail Modal Component
 */
function CardDetailModal({
  card,
  visible,
  onClose,
  currentRewardRate,
  t,
}: {
  card: Card | null;
  visible: boolean;
  onClose: () => void;
  currentRewardRate?: { value: number; type: RewardType; unit: 'percent' | 'multiplier' };
  t: (key: string) => string;
}) {
  if (!card) return null;

  const formatAnnualFee = (fee?: number) => {
    if (fee === undefined || fee === 0) return t('cardDetail.noFee');
    return `$${fee}/year`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('cardDetail.title')}</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel={t('common.close')} accessibilityRole="button">
            <Text style={styles.modalClose}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.cardDetailHeader}>
            <Text style={styles.cardDetailName}>{card.name}</Text>
            <Text style={styles.cardDetailIssuer}>{card.issuer}</Text>
            <Text style={styles.cardDetailProgram}>{card.rewardProgram}</Text>
            <Text style={styles.cardDetailAnnualFee}>{formatAnnualFee(card.annualFee)}</Text>
          </View>

          {currentRewardRate && (
            <View style={styles.currentRateSection}>
              <Text style={styles.currentRateLabel}>{t('cardDetail.rewardAtThisStore')}</Text>
              <View style={styles.currentRateBox}>
                <Text style={styles.currentRateValue}>
                  {formatRewardRate(currentRewardRate.value, currentRewardRate.type, currentRewardRate.unit)}
                </Text>
                <Text style={styles.currentRateType}>{t(getRewardTypeLabelKey(currentRewardRate.type))}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>{t('cardDetail.baseReward')}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('cardDetail.allPurchases')}</Text>
              <Text style={styles.detailValue}>
                {formatRewardRate(card.baseRewardRate.value, card.baseRewardRate.type, card.baseRewardRate.unit)}{' '}
                {t(getRewardTypeLabelKey(card.baseRewardRate.type))}
              </Text>
            </View>
          </View>

          {card.categoryRewards.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>{t('cardDetail.bonusCategories')}</Text>
              {card.categoryRewards.map((cr, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{formatCategory(cr.category)}</Text>
                  <Text style={styles.detailValueHighlight}>
                    {formatRewardRate(cr.rewardRate.value, cr.rewardRate.type, cr.rewardRate.unit)}{' '}
                    {t(getRewardTypeLabelKey(cr.rewardRate.type))}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {card.signupBonus && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>{t('cardDetail.signupBonus')}</Text>
              <View style={styles.signupBonusBox}>
                <Text style={styles.signupBonusAmount}>
                  {card.signupBonus.currency === RewardType.CASHBACK ? '$' : ''}
                  {card.signupBonus.amount.toLocaleString()}
                  {card.signupBonus.currency !== RewardType.CASHBACK ? ` ${formatSignupBonusCurrency(card.signupBonus.currency)}` : ''}
                </Text>
                <Text style={styles.signupBonusDetails}>
                  {t('cardDetail.signupBonusDetails', {
                    spendRequirement: `$${card.signupBonus.spendRequirement.toLocaleString()}`,
                    timeframeDays: card.signupBonus.timeframeDays,
                  })}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Best card recommendation component
 */
function BestCardSection({
  rankedCard,
  onPress,
  t,
}: {
  rankedCard: RankedCard;
  onPress: () => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.bestCardSection}>
      <Text style={styles.sectionLabel}>{t('home.bestCardToUse')}</Text>
      <TouchableOpacity style={styles.bestCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.bestCardBadge}>
          <Text style={styles.bestCardBadgeText}>🏆 #1</Text>
        </View>
        <Text style={styles.bestCardName}>{rankedCard.card.name}</Text>
        <Text style={styles.bestCardIssuer}>{rankedCard.card.issuer}</Text>
        <View style={styles.bestCardRewardContainer}>
          <Text style={styles.bestCardRewardValue}>
            {formatRewardRate(rankedCard.rewardRate.value, rankedCard.rewardRate.type, rankedCard.rewardRate.unit)}
          </Text>
          <Text style={styles.bestCardRewardType}>{t(getRewardTypeLabelKey(rankedCard.rewardRate.type))}</Text>
        </View>
        <Text style={styles.tapHint}>{t('home.tapForDetails')}</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Card list by reward type component
 */
function CardsByTypeSection({
  rankedCards,
  onCardPress,
  t,
}: {
  rankedCards: RankedCard[];
  onCardPress: (rc: RankedCard) => void;
  t: (key: string) => string;
}) {
  if (rankedCards.length <= 1) {
    return null;
  }

  // Separate cards by reward type
  const cashBackCards = rankedCards.filter(
    (rc) => rc.rewardRate.type === RewardType.CASHBACK
  );
  const pointsCards = rankedCards.filter(
    (rc) => rc.rewardRate.type === RewardType.POINTS || 
            rc.rewardRate.type === RewardType.AIRLINE_MILES || 
            rc.rewardRate.type === RewardType.HOTEL_POINTS
  );

  // Rank within each section
  const rankCards = (cards: RankedCard[]) => {
    return cards
      .sort((a, b) => b.rewardRate.value - a.rewardRate.value)
      .map((rc, index) => ({ ...rc, sectionRank: index + 1 }));
  };

  const rankedCashBack = rankCards(cashBackCards);
  const rankedPoints = rankCards(pointsCards);

  const renderCardItem = (rc: RankedCard & { sectionRank: number }) => (
    <TouchableOpacity 
      key={rc.card.id} 
      style={styles.rankedCardItem} 
      onPress={() => onCardPress(rc)} 
      activeOpacity={0.7}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rc.sectionRank}</Text>
      </View>
      <View style={styles.rankedCardInfo}>
        <Text style={styles.rankedCardName}>{rc.card.name}</Text>
        <Text style={styles.rankedCardIssuer}>{rc.card.issuer}</Text>
      </View>
      <View style={styles.rankedCardReward}>
        <Text style={styles.rankedCardRewardValue}>
          {formatRewardRate(rc.rewardRate.value, rc.rewardRate.type, rc.rewardRate.unit)}
        </Text>
        <Text style={styles.rankedCardRewardType}>{t(getRewardTypeLabelKey(rc.rewardRate.type))}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {rankedCashBack.length > 0 && (
        <View style={styles.allCardsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>💵</Text>
            <Text style={styles.sectionLabel}>{t('home.cashBackCards')}</Text>
          </View>
          {rankedCashBack.map(renderCardItem)}
        </View>
      )}

      {rankedPoints.length > 0 && (
        <View style={styles.allCardsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>⭐</Text>
            <Text style={styles.sectionLabel}>{t('home.pointsMilesCards')}</Text>
          </View>
          {rankedPoints.map(renderCardItem)}
        </View>
      )}
    </>
  );
}

/**
 * Suggested new cards section
 */
function SuggestedCardsSection({
  cards,
  onCardPress,
  t,
}: {
  cards: Card[];
  onCardPress: (card: Card) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestedSection}>
      <Text style={styles.sectionLabel}>{t('home.cardsThatCouldEarnMore')}</Text>
      <Text style={styles.suggestedSubtitle}>{t('home.considerTheseCards')}</Text>
      {cards.slice(0, 3).map((card) => (
        <TouchableOpacity key={card.id} style={styles.suggestedCardItem} onPress={() => onCardPress(card)} activeOpacity={0.7}>
          <View style={styles.suggestedCardInfo}>
            <Text style={styles.suggestedCardName}>{card.name}</Text>
            <Text style={styles.suggestedCardIssuer}>{card.issuer}</Text>
            {card.signupBonus && (
              <Text style={styles.suggestedCardBonus}>
                🎁 {card.signupBonus.currency === RewardType.CASHBACK ? '$' : ''}
                {card.signupBonus.amount.toLocaleString()}
                {card.signupBonus.currency !== RewardType.CASHBACK ? ` ${formatSignupBonusCurrency(card.signupBonus.currency)}` : ''} bonus
              </Text>
            )}
          </View>
          <View style={styles.suggestedBadge}>
            <Text style={styles.suggestedBadgeText}>{t('home.better')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}


/**
 * Store search suggestion item
 */
function StoreSuggestionItem({
  name,
  category,
  onSelect,
}: {
  name: string;
  category: string;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={onSelect}
      accessibilityLabel={`Select ${name}`}
      accessibilityRole="button"
    >
      <Text style={styles.suggestionName}>{name}</Text>
      <Text style={styles.suggestionCategory}>{category}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendation, setRecommendation] = useState<StoreRecommendation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasCards, setHasCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedRewardRate, setSelectedRewardRate] = useState<{ value: number; type: RewardType; unit: 'percent' | 'multiplier' } | undefined>();
  const [showCardDetail, setShowCardDetail] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([initializePortfolio(), initializePreferences()]);
    const cards = getCards();
    setHasCards(cards.length > 0);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useCallback((storeName: string) => {
    setSearchQuery(storeName);
    setShowSuggestions(false);

    if (!storeName.trim()) {
      setRecommendation(null);
      return;
    }

    const portfolio = getCards();
    if (portfolio.length === 0) {
      setHasCards(false);
      return;
    }

    const preferences: UserPreferences = {
      rewardType: getRewardTypePreference(),
      newCardSuggestionsEnabled: isNewCardSuggestionsEnabled(),
    };

    const result = getStoreRecommendation(storeName, portfolio, preferences);
    setRecommendation(result);
  }, []);

  const handleCardPress = (card: Card, rewardRate?: { value: number; type: RewardType; unit: 'percent' | 'multiplier' }) => {
    setSelectedCard(card);
    setSelectedRewardRate(rewardRate);
    setShowCardDetail(true);
  };

  const storeSuggestions = searchQuery.length >= 2 ? searchStores(searchQuery).slice(0, 5) : [];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.searchPlaceholder')}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setShowSuggestions(text.length >= 2);
            if (!text.trim()) {
              setRecommendation(null);
            }
          }}
          onSubmitEditing={() => handleSearch(searchQuery)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('home.searchPlaceholder')}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              setRecommendation(null);
              setShowSuggestions(false);
            }}
            accessibilityLabel={t('home.clearSearch')}
            accessibilityRole="button"
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && storeSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={storeSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StoreSuggestionItem name={item.name} category={item.category} onSelect={() => handleSearch(item.name)} />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent} keyboardShouldPersistTaps="handled">
        {!hasCards && searchQuery.length > 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💳</Text>
            <Text style={styles.emptyStateTitle}>{t('home.noCardsTitle')}</Text>
            <Text style={styles.emptyStateText}>{t('home.noCardsText')}</Text>
          </View>
        )}

        {hasCards && !recommendation && !showSuggestions && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>{t('home.findBestCardTitle')}</Text>
            <Text style={styles.emptyStateText}>{t('home.findBestCardText')}</Text>
          </View>
        )}

        {recommendation && (
          <>
            <View style={styles.storeHeader}>
              <Text style={styles.storeName}>{recommendation.store.name}</Text>
              <Text style={styles.storeCategory}>{t('home.category')}: {recommendation.store.category.replace('_', ' ')}</Text>
            </View>

            {recommendation.bestCard ? (
              <>
                <BestCardSection
                  rankedCard={recommendation.bestCard}
                  onPress={() => handleCardPress(recommendation.bestCard!.card, recommendation.bestCard!.rewardRate)}
                  t={t}
                />
                <CardsByTypeSection rankedCards={recommendation.allCards} onCardPress={(rc) => handleCardPress(rc.card, rc.rewardRate)} t={t} />
                <SuggestedCardsSection cards={recommendation.suggestedNewCards} onCardPress={(card) => handleCardPress(card)} t={t} />
              </>
            ) : (
              <View style={styles.noCardsMessage}>
                <Text style={styles.noCardsText}>{t('home.noCardsForCategory')}</Text>
              </View>
            )}

            {recommendation.suggestedNewCards.length === 0 && recommendation.bestCard && isNewCardSuggestionsEnabled() && (
              <View style={styles.optimalMessage}>
                <Text style={styles.optimalIcon}>✓</Text>
                <Text style={styles.optimalText}>{t('home.youHaveBestCard')}</Text>
              </View>
            )}
          </>
        )}

        {hasCards && searchQuery.length > 0 && !recommendation && !showSuggestions && (
          <View style={styles.notFoundState}>
            <Text style={styles.notFoundIcon}>🤔</Text>
            <Text style={styles.notFoundTitle}>{t('home.storeNotFoundTitle')}</Text>
            <Text style={styles.notFoundText}>{t('home.storeNotFoundText', { storeName: searchQuery })}</Text>
          </View>
        )}
      </ScrollView>

      <CardDetailModal
        card={selectedCard}
        visible={showCardDetail}
        onClose={() => setShowCardDetail(false)}
        currentRewardRate={selectedRewardRate}
        t={t}
      />
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16 },
  clearButton: { padding: 8 },
  clearButtonText: { fontSize: 16, color: '#8E8E93' },
  suggestionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  suggestionName: { fontSize: 16, fontWeight: '500', color: '#000' },
  suggestionCategory: { fontSize: 13, color: '#8E8E93', marginTop: 2, textTransform: 'capitalize' },
  resultsContainer: { flex: 1 },
  resultsContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 8 },
  emptyStateText: { fontSize: 15, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  notFoundState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  notFoundIcon: { fontSize: 40, marginBottom: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 8 },
  notFoundText: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  storeHeader: { marginBottom: 16 },
  storeName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  storeCategory: { fontSize: 14, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionIcon: { fontSize: 14, marginRight: 6 },
  bestCardSection: { marginBottom: 20 },
  bestCard: { backgroundColor: '#007AFF', borderRadius: 16, padding: 20 },
  bestCardBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  bestCardBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bestCardName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  bestCardIssuer: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  bestCardRewardContainer: { flexDirection: 'row', alignItems: 'baseline' },
  bestCardRewardValue: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginRight: 8 },
  bestCardRewardType: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 12, textAlign: 'center' },
  allCardsSection: { marginBottom: 20 },
  rankedCardItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: '600', color: '#666' },
  rankedCardInfo: { flex: 1 },
  rankedCardName: { fontSize: 15, fontWeight: '500', color: '#000' },
  rankedCardIssuer: { fontSize: 13, color: '#8E8E93' },
  rankedCardReward: { alignItems: 'flex-end', marginRight: 8 },
  rankedCardRewardValue: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  rankedCardRewardType: { fontSize: 11, color: '#8E8E93' },
  chevron: { fontSize: 20, color: '#C7C7CC', fontWeight: '300' },
  suggestedSection: { marginBottom: 20 },
  suggestedSubtitle: { fontSize: 13, color: '#666', marginBottom: 12 },
  suggestedCardItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34C759',
    borderStyle: 'dashed',
  },
  suggestedCardInfo: { flex: 1 },
  suggestedCardName: { fontSize: 15, fontWeight: '500', color: '#000' },
  suggestedCardIssuer: { fontSize: 13, color: '#8E8E93' },
  suggestedCardBonus: { fontSize: 12, color: '#B8860B', marginTop: 2, fontWeight: '500' },
  suggestedBadge: { backgroundColor: '#34C759', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 8 },
  suggestedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  noCardsMessage: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  noCardsText: { fontSize: 15, color: '#666', textAlign: 'center' },
  optimalMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  optimalIcon: { fontSize: 18, color: '#34C759', marginRight: 8 },
  optimalText: { fontSize: 14, color: '#2E7D32', fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalClose: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  modalContent: { flex: 1 },
  cardDetailHeader: { backgroundColor: '#007AFF', padding: 24, alignItems: 'center' },
  cardDetailName: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  cardDetailIssuer: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  cardDetailProgram: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  cardDetailAnnualFee: { fontSize: 14, color: '#34C759', marginTop: 8, fontWeight: '600' },
  currentRateSection: { padding: 16 },
  currentRateLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 8 },
  currentRateBox: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  currentRateValue: { fontSize: 42, fontWeight: 'bold', color: '#fff' },
  currentRateType: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  detailSection: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
    padding: 16,
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  detailLabel: { fontSize: 15, color: '#000' },
  detailValue: { fontSize: 15, color: '#8E8E93' },
  detailValueHighlight: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  signupBonusBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 16,
    margin: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  signupBonusAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8860B',
    marginBottom: 4,
  },
  signupBonusDetails: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
});
