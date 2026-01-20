/**
 * HomeScreen - Store search and card recommendations
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SearchInput, EmptyState, CardDetailModal, RewardBadge, CardVisual } from '../components';
import { useTheme, Theme } from '../theme';

import {
  Card,
  RankedCard,
  StoreRecommendation,
  RewardType,
  UserPreferences,
  SpendingCategory,
} from '../types';
import { getCards, initializePortfolio } from '../services/CardPortfolioManager';
import {
  getRewardTypePreference,
  isNewCardSuggestionsEnabled,
  initializePreferences,
} from '../services/PreferenceManager';
import { getStoreRecommendation } from '../services/RecommendationEngine';
import { searchStores } from '../services/StoreDataService';
import { getAutocompleteSuggestions, isGooglePlacesConfigured } from '../services/google-places';

// Helper functions
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

function formatCategory(category: SpendingCategory): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSignupBonusCurrency(currency: RewardType): string {
  const labels: Record<RewardType, string> = {
    [RewardType.CASHBACK]: 'cash back',
    [RewardType.POINTS]: 'points',
    [RewardType.AIRLINE_MILES]: 'miles',
    [RewardType.HOTEL_POINTS]: 'hotel points',
  };
  return labels[currency] || currency;
}


// Best Card Section
function BestCardSection({
  rankedCard,
  onPress,
  t,
  theme,
}: {
  rankedCard: RankedCard;
  onPress: () => void;
  t: (key: string) => string;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.bestCardSection}>
      <Text style={styles.sectionLabel}>{t('home.bestCardToUse')}</Text>
      <View style={styles.bestCardContainer}>
        <CardVisual
          name={rankedCard.card.name}
          issuer={rankedCard.card.issuer}
          size="large"
          onPress={onPress}
        />
        <View style={styles.bestCardBadgeContainer}>
          <RewardBadge
            type={rankedCard.rewardRate.type}
            value={rankedCard.rewardRate.value}
            unit={rankedCard.rewardRate.unit}
            size="large"
          />
        </View>
      </View>
    </View>
  );
}

// Cards By Type Section
function CardsByTypeSection({
  rankedCards,
  onCardPress,
  t,
  theme,
}: {
  rankedCards: RankedCard[];
  onCardPress: (rc: RankedCard) => void;
  t: (key: string) => string;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (rankedCards.length <= 1) return null;

  const cashBackCards = rankedCards.filter((rc) => rc.rewardRate.type === RewardType.CASHBACK);
  const pointsCards = rankedCards.filter(
    (rc) => rc.rewardRate.type !== RewardType.CASHBACK
  );

  const rankCards = (cards: RankedCard[]) =>
    cards
      .sort((a, b) => b.rewardRate.value - a.rewardRate.value)
      .map((rc, index) => ({ ...rc, sectionRank: index + 1 }));

  const rankedCashBack = rankCards(cashBackCards);
  const rankedPoints = rankCards(pointsCards);

  const renderCardItem = (rc: RankedCard & { sectionRank: number }, index: number) => (
    <Animated.View key={rc.card.id} entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity
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
            {formatRewardRate(rc.rewardRate.value, rc.rewardRate.unit)}
          </Text>
          <Text style={styles.rankedCardRewardType}>{t(getRewardTypeLabelKey(rc.rewardRate.type))}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <>
      {rankedCashBack.length > 0 && (
        <View style={styles.allCardsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{t('home.cashBackCards')}</Text>
          </View>
          {rankedCashBack.map((rc, index) => renderCardItem(rc, index))}
        </View>
      )}
      {rankedPoints.length > 0 && (
        <View style={styles.allCardsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{t('home.pointsMilesCards')}</Text>
          </View>
          {rankedPoints.map((rc, index) => renderCardItem(rc, index))}
        </View>
      )}
    </>
  );
}

// Suggested Cards Section
function SuggestedCardsSection({
  cards,
  onCardPress,
  t,
  theme,
}: {
  cards: Card[];
  onCardPress: (card: Card) => void;
  t: (key: string) => string;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (cards.length === 0) return null;

  return (
    <View style={styles.suggestedSection}>
      <Text style={styles.sectionLabel}>{t('home.cardsThatCouldEarnMore')}</Text>
      <Text style={styles.suggestedSubtitle}>{t('home.considerTheseCards')}</Text>
      {cards.slice(0, 3).map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.suggestedCardItem}
          onPress={() => onCardPress(card)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestedCardInfo}>
            <Text style={styles.suggestedCardName}>{card.name}</Text>
            <Text style={styles.suggestedCardIssuer}>{card.issuer}</Text>
            {card.signupBonus && (
              <Text style={styles.suggestedCardBonus}>
                {card.signupBonus.currency === RewardType.CASHBACK ? '$' : ''}
                {card.signupBonus.amount.toLocaleString()}
                {card.signupBonus.currency !== RewardType.CASHBACK
                  ? ` ${formatSignupBonusCurrency(card.signupBonus.currency)}`
                  : ''}{' '}
                bonus
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

// Store Suggestion Item
function StoreSuggestionItem({
  name,
  category,
  onSelect,
  theme,
}: {
  name: string;
  category: string;
  onSelect: () => void;
  theme: Theme;
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);

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

// Main HomeScreen Component
export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [recommendation, setRecommendation] = useState<StoreRecommendation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasCards, setHasCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedRewardRate, setSelectedRewardRate] = useState<
    { value: number; type: RewardType; unit: 'percent' | 'multiplier' } | undefined
  >();
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [googlePlacesEnabled, setGooglePlacesEnabled] = useState(false);
  const [googleSuggestions, setGoogleSuggestions] = useState<
    Array<{ placeId: string; mainText: string; secondaryText: string }>
  >([]);

  const loadData = useCallback(async () => {
    await Promise.all([initializePortfolio(), initializePreferences()]);
    setHasCards(getCards().length > 0);
    setGooglePlacesEnabled(isGooglePlacesConfigured());
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

    setRecommendation(getStoreRecommendation(storeName, portfolio, preferences));
  }, []);

  const handleCardPress = (
    card: Card,
    rewardRate?: { value: number; type: RewardType; unit: 'percent' | 'multiplier' }
  ) => {
    setSelectedCard(card);
    setSelectedRewardRate(rewardRate);
    setShowCardDetail(true);
  };

  const fetchGoogleSuggestions = useCallback(
    async (query: string) => {
      if (!googlePlacesEnabled || query.length < 2) {
        setGoogleSuggestions([]);
        return;
      }
      const result = await getAutocompleteSuggestions(query);
      setGoogleSuggestions(result.success ? result.value : []);
    },
    [googlePlacesEnabled]
  );

  const storeSuggestions = searchQuery.length >= 2 ? searchStores(searchQuery).slice(0, 5) : [];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SearchInput
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          setShowSuggestions(text.length >= 2);
          if (!text.trim()) {
            setRecommendation(null);
            setGoogleSuggestions([]);
          } else if (googlePlacesEnabled) {
            fetchGoogleSuggestions(text);
          }
        }}
        onClear={() => {
          setRecommendation(null);
          setShowSuggestions(false);
          setGoogleSuggestions([]);
        }}
        onSubmit={() => handleSearch(searchQuery)}
        placeholder={t('home.searchPlaceholder')}
        containerStyle={styles.searchContainer}
      />

      {showSuggestions && (storeSuggestions.length > 0 || googleSuggestions.length > 0) && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={[
              ...storeSuggestions,
              ...googleSuggestions.map((gs) => ({
                id: gs.placeId,
                name: gs.mainText,
                category: gs.secondaryText,
              })),
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StoreSuggestionItem
                name={item.name}
                category={item.category}
                onSelect={() => handleSearch(item.name)}
                theme={theme}
              />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
      >
        {!hasCards && searchQuery.length > 0 && (
          <EmptyState icon="cards" title={t('home.noCardsTitle')} description={t('home.noCardsText')} />
        )}

        {hasCards && !recommendation && !showSuggestions && (
          <EmptyState icon="search" title={t('home.findBestCardTitle')} description={t('home.findBestCardText')} />
        )}

        {recommendation && (
          <>
            <View style={styles.storeHeader}>
              <Text style={styles.storeName}>{recommendation.store.name}</Text>
              <Text style={styles.storeCategory}>
                {t('home.category')}: {recommendation.store.category.replace('_', ' ')}
              </Text>
            </View>

            {recommendation.bestCard ? (
              <>
                <BestCardSection
                  rankedCard={recommendation.bestCard}
                  onPress={() => handleCardPress(recommendation.bestCard!.card, recommendation.bestCard!.rewardRate)}
                  t={t}
                  theme={theme}
                />
                <CardsByTypeSection
                  rankedCards={recommendation.allCards}
                  onCardPress={(rc) => handleCardPress(rc.card, rc.rewardRate)}
                  t={t}
                  theme={theme}
                />
                <SuggestedCardsSection
                  cards={recommendation.suggestedNewCards}
                  onCardPress={(card) => handleCardPress(card)}
                  t={t}
                  theme={theme}
                />
              </>
            ) : (
              <View style={styles.noCardsMessage}>
                <Text style={styles.noCardsText}>{t('home.noCardsForCategory')}</Text>
              </View>
            )}

            {recommendation.suggestedNewCards.length === 0 &&
              recommendation.bestCard &&
              isNewCardSuggestionsEnabled() && (
                <View style={styles.optimalMessage}>
                  <Text style={styles.optimalIcon}>✓</Text>
                  <Text style={styles.optimalText}>{t('home.youHaveBestCard')}</Text>
                </View>
              )}
          </>
        )}

        {hasCards && searchQuery.length > 0 && !recommendation && !showSuggestions && (
          <EmptyState
            icon="notFound"
            title={t('home.storeNotFoundTitle')}
            description={t('home.storeNotFoundText', { storeName: searchQuery })}
            compact
          />
        )}
      </ScrollView>

      <CardDetailModal
        card={selectedCard}
        visible={showCardDetail}
        onClose={() => setShowCardDetail(false)}
        currentRewardRate={selectedRewardRate}
      />
    </KeyboardAvoidingView>
  );
}

// Main styles
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    searchContainer: { margin: theme.spacing.screenPadding, marginBottom: 0 },
    suggestionsContainer: {
      backgroundColor: theme.colors.background.secondary,
      marginHorizontal: theme.spacing.screenPadding,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.xs,
      maxHeight: 200,
      ...theme.shadows.sm,
    },
    suggestionItem: {
      padding: theme.spacing.inputPadding,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    suggestionName: { ...theme.textStyles.body, fontWeight: '500', color: theme.colors.text.primary },
    suggestionCategory: {
      ...theme.textStyles.caption,
      color: theme.colors.text.tertiary,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    resultsContainer: { flex: 1 },
    resultsContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
    storeHeader: { marginBottom: theme.spacing.lg },
    storeName: { ...theme.textStyles.h1, color: theme.colors.text.primary },
    storeCategory: {
      ...theme.textStyles.bodySmall,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
      textTransform: 'capitalize',
    },
    sectionLabel: {
      ...theme.textStyles.label,
      color: theme.colors.text.tertiary,
      letterSpacing: 0.5,
      marginBottom: theme.spacing.sm,
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
    bestCardSection: { marginBottom: theme.spacing.xl },
    bestCardContainer: { alignItems: 'center' },
    bestCardBadgeContainer: { marginTop: theme.spacing.md },
    allCardsSection: { marginBottom: theme.spacing.xl },
    rankedCardItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.inputPadding,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.xs,
    },
    rankBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.neutral.gray200,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    rankText: { ...theme.textStyles.caption, fontWeight: '600', color: theme.colors.text.secondary },
    rankedCardInfo: { flex: 1 },
    rankedCardName: { ...theme.textStyles.body, fontWeight: '500', color: theme.colors.text.primary },
    rankedCardIssuer: { ...theme.textStyles.caption, color: theme.colors.text.tertiary },
    rankedCardReward: { alignItems: 'flex-end', marginRight: theme.spacing.sm },
    rankedCardRewardValue: { ...theme.textStyles.body, fontWeight: '600', color: theme.colors.primary.main },
    rankedCardRewardType: { ...theme.textStyles.caption, color: theme.colors.text.tertiary },
    chevron: { fontSize: 20, color: theme.colors.text.disabled, fontWeight: '300' },
    suggestedSection: { marginBottom: theme.spacing.xl },
    suggestedSubtitle: { ...theme.textStyles.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.md },
    suggestedCardItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.inputPadding,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.success.main,
      borderStyle: 'dashed',
    },
    suggestedCardInfo: { flex: 1 },
    suggestedCardName: { ...theme.textStyles.body, fontWeight: '500', color: theme.colors.text.primary },
    suggestedCardIssuer: { ...theme.textStyles.caption, color: theme.colors.text.tertiary },
    suggestedCardBonus: {
      ...theme.textStyles.caption,
      color: theme.colors.warning.dark,
      marginTop: 2,
      fontWeight: '500',
    },
    suggestedBadge: {
      backgroundColor: theme.colors.success.main,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      marginRight: theme.spacing.sm,
    },
    suggestedBadgeText: { color: theme.colors.success.contrast, fontSize: 12, fontWeight: '600' },
    noCardsMessage: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    noCardsText: { ...theme.textStyles.body, color: theme.colors.text.secondary, textAlign: 'center' },
    optimalMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.success.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.inputPadding,
      marginTop: theme.spacing.sm,
    },
    optimalIcon: { fontSize: 18, color: theme.colors.success.main, marginRight: theme.spacing.sm },
    optimalText: { ...theme.textStyles.body, color: theme.colors.success.dark, fontWeight: '500' },
  });

