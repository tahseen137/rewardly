/**
 * ProductSearchScreen - Product search and price comparison
 * Requirements: 4.1-4.5, 6.1-6.6
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Card,
  RewardType,
  UserPreferences,
  PriceSortOption,
  PricedStoreOption,
  PriceComparisonResult,
} from '../types';
import { getCards } from '../services/CardPortfolioManager';
import { getRewardTypePreference } from '../services/PreferenceManager';
import { getPriceComparison, resortPriceComparison, formatPrice, formatRewardValue, formatEffectivePrice } from '../services/PriceComparisonService';

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
 * Get reward type label key
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
 * Card Detail Modal Component
 */
function CardDetailModal({
  card,
  visible,
  onClose,
  t,
}: {
  card: Card | null;
  visible: boolean;
  onClose: () => void;
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
          <Text style={styles.modalTitle}>{card.name}</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel={t('common.close')} accessibilityRole="button">
            <Text style={styles.modalClose}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.cardDetailHeader}>
            <Text style={styles.cardDetailIssuer}>{card.issuer}</Text>
            <Text style={styles.cardDetailProgram}>{card.rewardProgram}</Text>
            <Text style={styles.cardDetailAnnualFee}>{formatAnnualFee(card.annualFee)}</Text>
          </View>

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
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Store option item component
 */
function StoreOptionItem({
  option,
  onCardPress,
  t,
}: {
  option: PricedStoreOption;
  onCardPress: (card: Card) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}) {
  return (
    <View style={styles.storeOptionItem}>
      <View style={styles.storeOptionHeader}>
        <Text style={styles.storeName}>{option.store.name}</Text>
        {option.priceAvailable && option.price !== null && (
          <Text style={styles.storePrice}>${formatPrice(option.price)}</Text>
        )}
        {!option.priceAvailable && (
          <Text style={styles.storePriceUnavailable}>{t('productSearch.priceUnavailable')}</Text>
        )}
      </View>

      {option.bestCard && (
        <TouchableOpacity
          style={styles.cardInfo}
          onPress={() => onCardPress(option.bestCard!.card)}
          activeOpacity={0.7}
        >
          <View style={styles.cardInfoLeft}>
            <Text style={styles.cardName}>{option.bestCard.card.name}</Text>
            <Text style={styles.rewardRate}>
              {formatRewardRate(option.bestCard.rewardRate.value, option.bestCard.rewardRate.type, option.bestCard.rewardRate.unit)}{' '}
              {t(getRewardTypeLabelKey(option.bestCard.rewardRate.type))}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

      {option.priceAvailable && (
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('productSearch.rewards')}:</Text>
            <Text style={styles.priceValue}>-${formatRewardValue(option.rewardValue)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelBold}>{t('productSearch.effectivePrice')}:</Text>
            <Text style={styles.priceValueBold}>${formatEffectivePrice(option.effectivePrice)}</Text>
          </View>
        </View>
      )}

      {!option.priceAvailable && option.bestCard && (
        <View style={styles.noPriceInfo}>
          <Text style={styles.noPriceText}>
            {t('productSearch.earnRewards', { rate: `${option.rewardRate}%` })}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ProductSearchScreen() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<PriceComparisonResult | null>(null);
  const [sortBy, setSortBy] = useState<PriceSortOption>(PriceSortOption.LOWEST_EFFECTIVE_PRICE);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    const portfolio = getCards();
    if (portfolio.length === 0) {
      setError(t('productSearch.noCardsError'));
      setResult(null);
      return;
    }

    const preferences: UserPreferences = {
      rewardType: getRewardTypePreference(),
      newCardSuggestionsEnabled: false,
    };

    const searchResult = getPriceComparison(searchQuery, portfolio, preferences, sortBy);

    if (!searchResult.success) {
      setError(t('productSearch.productNotFound', { productName: searchQuery }));
      setResult(null);
      return;
    }

    setResult(searchResult.value);
    setError(null);
  }, [searchQuery, sortBy, t]);

  const handleSortChange = useCallback((newSortBy: PriceSortOption) => {
    setSortBy(newSortBy);
    if (result) {
      const resorted = resortPriceComparison(result, newSortBy);
      setResult(resorted);
    }
  }, [result]);

  const handleCardPress = (card: Card) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('productSearch.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              setResult(null);
              setError(null);
            }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {result && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>{t('productSearch.sortBy')}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === PriceSortOption.LOWEST_EFFECTIVE_PRICE && styles.sortButtonActive]}
              onPress={() => handleSortChange(PriceSortOption.LOWEST_EFFECTIVE_PRICE)}
            >
              <Text style={[styles.sortButtonText, sortBy === PriceSortOption.LOWEST_EFFECTIVE_PRICE && styles.sortButtonTextActive]}>
                {t('productSearch.bestDeal')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === PriceSortOption.LOWEST_PRICE && styles.sortButtonActive]}
              onPress={() => handleSortChange(PriceSortOption.LOWEST_PRICE)}
            >
              <Text style={[styles.sortButtonText, sortBy === PriceSortOption.LOWEST_PRICE && styles.sortButtonTextActive]}>
                {t('productSearch.lowestPrice')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === PriceSortOption.HIGHEST_REWARDS && styles.sortButtonActive]}
              onPress={() => handleSortChange(PriceSortOption.HIGHEST_REWARDS)}
            >
              <Text style={[styles.sortButtonText, sortBy === PriceSortOption.HIGHEST_REWARDS && styles.sortButtonTextActive]}>
                {t('productSearch.highestRewards')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {!result && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>{t('productSearch.title')}</Text>
            <Text style={styles.emptyStateText}>{t('productSearch.description')}</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorState}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{result.productName}</Text>
              <Text style={styles.productCategory}>{result.productCategory.replace('_', ' ')}</Text>
            </View>

            {result.lowestEffectivePrice && (
              <View style={styles.bestDealCard}>
                <Text style={styles.bestDealLabel}>🏆 {t('productSearch.bestDeal')}</Text>
                <Text style={styles.bestDealStore}>{result.lowestEffectivePrice.store.name}</Text>
                {result.lowestEffectivePrice.bestCard && (
                  <Text style={styles.bestDealCard}>{result.lowestEffectivePrice.bestCard.card.name}</Text>
                )}
                {result.lowestEffectivePrice.priceAvailable && (
                  <Text style={styles.bestDealPrice}>
                    ${formatEffectivePrice(result.lowestEffectivePrice.effectivePrice)}
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.sectionLabel}>{t('productSearch.allOptions')}</Text>
            {result.storeOptions.map((option, index) => (
              <StoreOptionItem key={index} option={option} onCardPress={handleCardPress} t={t} />
            ))}
          </>
        )}
      </ScrollView>

      <CardDetailModal card={selectedCard} visible={showCardDetail} onClose={() => setShowCardDetail(false)} t={t} />
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginRight: 8 },
  sortButtons: { flex: 1 },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    marginRight: 8,
  },
  sortButtonActive: { backgroundColor: '#007AFF' },
  sortButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  sortButtonTextActive: { color: '#fff' },
  resultsContainer: { flex: 1 },
  resultsContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 8 },
  emptyStateText: { fontSize: 15, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  errorState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 16, color: '#FF3B30', textAlign: 'center', paddingHorizontal: 20 },
  productHeader: { marginBottom: 16 },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  productCategory: { fontSize: 14, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' },
  bestDealCard: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bestDealLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  bestDealStore: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  bestDealCardName: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  bestDealPrice: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 12 },
  storeOptionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  storeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeName: { fontSize: 18, fontWeight: '600', color: '#000', flex: 1 },
  storePrice: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  storePriceUnavailable: { fontSize: 14, color: '#8E8E93', fontStyle: 'italic' },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginBottom: 8,
  },
  cardInfoLeft: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '500', color: '#000' },
  rewardRate: { fontSize: 13, color: '#007AFF', marginTop: 2 },
  chevron: { fontSize: 20, color: '#C7C7CC', fontWeight: '300' },
  priceBreakdown: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: { fontSize: 14, color: '#666' },
  priceValue: { fontSize: 14, color: '#34C759', fontWeight: '500' },
  priceLabelBold: { fontSize: 15, fontWeight: '600', color: '#000' },
  priceValueBold: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
  noPriceInfo: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
  },
  noPriceText: { fontSize: 14, color: '#8B7355', textAlign: 'center' },
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
  cardDetailIssuer: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  cardDetailProgram: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  cardDetailAnnualFee: { fontSize: 14, color: '#34C759', marginTop: 8, fontWeight: '600' },
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
});
