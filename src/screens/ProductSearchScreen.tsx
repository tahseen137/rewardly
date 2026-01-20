/**
 * ProductSearchScreen - Product search and price comparison
 * Requirements: 4.1-4.5, 6.1-6.6
 */

import React, { useState, useCallback, useMemo } from 'react';
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
import { useTheme, Theme } from '../theme';
import { CardDetailModal, RewardBadge, BottomSheet } from '../components';

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
import {
  getPriceComparison,
  resortPriceComparison,
  formatPrice,
  formatRewardValue,
  formatEffectivePrice,
} from '../services/PriceComparisonService';

function formatRewardRate(value: number, unit: 'percent' | 'multiplier'): string {
  return unit === 'percent' ? `${value}%` : `${value}x`;
}

function getRewardTypeLabelKey(type: RewardType): string {
  const keys: Record<RewardType, string> = {
    [RewardType.CASHBACK]: 'rewardTypes.cashback',
    [RewardType.POINTS]: 'rewardTypes.points',
    [RewardType.AIRLINE_MILES]: 'rewardTypes.airline_miles',
    [RewardType.HOTEL_POINTS]: 'rewardTypes.hotel_points',
  };
  return keys[type] || type;
}

function StoreOptionItem({
  option,
  onCardPress,
  t,
  theme,
}: {
  option: PricedStoreOption;
  onCardPress: (card: Card) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

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
              {formatRewardRate(option.bestCard.rewardRate.value, option.bestCard.rewardRate.unit)}{' '}
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
            <Text style={styles.priceValueBold}>
              ${formatEffectivePrice(option.effectivePrice)}
            </Text>
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const handleSortChange = useCallback(
    (newSortBy: PriceSortOption) => {
      setSortBy(newSortBy);
      if (result) setResult(resortPriceComparison(result, newSortBy));
    },
    [result]
  );

  const handleCardPress = (card: Card) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('productSearch.searchPlaceholder')}
          placeholderTextColor={theme.colors.text.tertiary}
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
            {[
              { key: PriceSortOption.LOWEST_EFFECTIVE_PRICE, label: 'productSearch.bestDeal' },
              { key: PriceSortOption.LOWEST_PRICE, label: 'productSearch.lowestPrice' },
              { key: PriceSortOption.HIGHEST_REWARDS, label: 'productSearch.highestRewards' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortButton, sortBy === opt.key && styles.sortButtonActive]}
                onPress={() => handleSortChange(opt.key)}
              >
                <Text
                  style={[styles.sortButtonText, sortBy === opt.key && styles.sortButtonTextActive]}
                >
                  {t(opt.label)}
                </Text>
              </TouchableOpacity>
            ))}
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
                <Text style={styles.bestDealLabel}>{t('productSearch.bestDeal')}</Text>
                <Text style={styles.bestDealStore}>{result.lowestEffectivePrice.store.name}</Text>
                {result.lowestEffectivePrice.bestCard && (
                  <Text style={styles.bestDealCardName}>
                    {result.lowestEffectivePrice.bestCard.card.name}
                  </Text>
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
              <StoreOptionItem
                key={index}
                option={option}
                onCardPress={handleCardPress}
                t={t}
                theme={theme}
              />
            ))}
          </>
        )}
      </ScrollView>

      <CardDetailModal
        card={selectedCard}
        visible={showCardDetail}
        onClose={() => setShowCardDetail(false)}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      margin: theme.spacing.screenPadding,
      marginBottom: 0,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      ...theme.shadows.xs,
    },
    searchInput: {
      flex: 1,
      paddingVertical: theme.spacing.inputPadding,
      ...theme.textStyles.body,
      color: theme.colors.text.primary,
    },
    clearButton: { padding: theme.spacing.sm },
    clearButtonText: { fontSize: 16, color: theme.colors.text.tertiary },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingVertical: theme.spacing.md,
    },
    sortLabel: {
      ...theme.textStyles.label,
      color: theme.colors.text.secondary,
      marginRight: theme.spacing.sm,
    },
    sortButtons: { flex: 1 },
    sortButton: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.neutral.gray200,
      marginRight: theme.spacing.sm,
    },
    sortButtonActive: { backgroundColor: theme.colors.primary.main },
    sortButtonText: {
      ...theme.textStyles.bodySmall,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    sortButtonTextActive: { color: theme.colors.primary.contrast },
    resultsContainer: { flex: 1 },
    resultsContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyStateIcon: { fontSize: 48, marginBottom: theme.spacing.lg },
    emptyStateTitle: {
      ...theme.textStyles.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    emptyStateText: {
      ...theme.textStyles.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    errorState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    errorIcon: { fontSize: 40, marginBottom: theme.spacing.md },
    errorText: {
      ...theme.textStyles.body,
      color: theme.colors.error.main,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    productHeader: { marginBottom: theme.spacing.lg },
    productName: { ...theme.textStyles.h1, color: theme.colors.text.primary },
    productCategory: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
      textTransform: 'capitalize',
    },
    bestDealCard: {
      backgroundColor: theme.colors.success.main,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.lg,
    },
    bestDealLabel: {
      ...theme.textStyles.label,
      color: theme.colors.success.contrast,
      marginBottom: theme.spacing.sm,
    },
    bestDealStore: {
      ...theme.textStyles.h3,
      color: theme.colors.success.contrast,
      marginBottom: theme.spacing.xs,
    },
    bestDealCardName: {
      ...theme.textStyles.bodySmall,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: theme.spacing.sm,
    },
    bestDealPrice: { fontSize: 32, fontWeight: '700', color: theme.colors.success.contrast },
    sectionLabel: {
      ...theme.textStyles.label,
      color: theme.colors.text.tertiary,
      letterSpacing: 0.5,
      marginBottom: theme.spacing.md,
    },
    storeOptionItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
    },
    storeOptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    storeName: { ...theme.textStyles.h4, color: theme.colors.text.primary, flex: 1 },
    storePrice: { ...theme.textStyles.h4, color: theme.colors.primary.main },
    storePriceUnavailable: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.text.tertiary,
      fontStyle: 'italic',
    },
    cardInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
      marginBottom: theme.spacing.sm,
    },
    cardInfoLeft: { flex: 1 },
    cardName: { ...theme.textStyles.body, fontWeight: '500', color: theme.colors.text.primary },
    rewardRate: { ...theme.textStyles.caption, color: theme.colors.primary.main, marginTop: 2 },
    chevron: { fontSize: 20, color: theme.colors.text.disabled, fontWeight: '300' },
    priceBreakdown: {
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.md,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    priceLabel: { ...theme.textStyles.bodySmall, color: theme.colors.text.secondary },
    priceValue: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.success.main,
      fontWeight: '500',
    },
    priceLabelBold: {
      ...theme.textStyles.body,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    priceValueBold: {
      ...theme.textStyles.body,
      fontWeight: '700',
      color: theme.colors.primary.main,
    },
    noPriceInfo: {
      backgroundColor: theme.colors.warning.background,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.md,
    },
    noPriceText: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.warning.dark,
      textAlign: 'center',
    },
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
    modalContent: { flex: 1 },
    cardDetailHeader: {
      backgroundColor: theme.colors.primary.main,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    cardDetailIssuer: {
      ...theme.textStyles.body,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: theme.spacing.xs,
    },
    cardDetailProgram: { ...theme.textStyles.bodySmall, color: 'rgba(255,255,255,0.7)' },
    cardDetailAnnualFee: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.success.light,
      marginTop: theme.spacing.sm,
      fontWeight: '600',
    },
    detailSection: {
      backgroundColor: theme.colors.background.secondary,
      marginHorizontal: theme.spacing.screenPadding,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    detailSectionTitle: {
      ...theme.textStyles.label,
      color: theme.colors.text.tertiary,
      letterSpacing: 0.5,
      padding: theme.spacing.screenPadding,
      paddingBottom: theme.spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
    detailLabel: { ...theme.textStyles.body, color: theme.colors.text.primary },
    detailValue: { ...theme.textStyles.body, color: theme.colors.text.tertiary },
  });
