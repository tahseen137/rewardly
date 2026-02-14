/**
 * ExploreCardsScreen - Browse and apply for new credit cards
 * 
 * Features:
 * - Search and filter all cards in the database
 * - Filter by Country, Issuer, Reward Type, Annual Fee
 * - View card details with reward rates and signup bonuses
 * - Apply Now button opens application URL
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  CreditCard,
  Gift,
  X,
  Check,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { Card, RewardType, SpendingCategory } from '../types';
import { getAllCards, getCardsByCountry } from '../services/CardDataService';
import { getCountry, Country } from '../services/PreferenceManager';
import { GlassCard, EmptyState } from '../components';

// ============================================================================
// Types
// ============================================================================

interface FilterState {
  country: Country | 'ALL';
  issuer: string | null;
  rewardType: RewardType | null;
  annualFeeRange: 'all' | 'free' | 'low' | 'medium' | 'premium';
  sortBy: 'name' | 'fee' | 'signup_bonus' | 'best_rate';
}

// ============================================================================
// Filter Modal Component
// ============================================================================

interface FilterModalProps {
  visible: boolean;
  filters: FilterState;
  issuers: string[];
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  issuers,
  onClose,
  onApply,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  if (!visible) return null;

  const feeRanges = [
    { key: 'all', label: 'Any Fee' },
    { key: 'free', label: 'No Annual Fee' },
    { key: 'low', label: 'Under $100' },
    { key: 'medium', label: '$100-$300' },
    { key: 'premium', label: '$300+' },
  ];

  const rewardTypes = [
    { key: null, label: 'All Types' },
    { key: RewardType.CASHBACK, label: 'Cash Back' },
    { key: RewardType.POINTS, label: 'Points' },
    { key: RewardType.AIRLINE_MILES, label: 'Airline Miles' },
    { key: RewardType.HOTEL_POINTS, label: 'Hotel Points' },
  ];

  const sortOptions = [
    { key: 'name', label: 'Name (A-Z)' },
    { key: 'fee', label: 'Annual Fee (Low to High)' },
    { key: 'signup_bonus', label: 'Sign-up Bonus (High to Low)' },
    { key: 'best_rate', label: 'Best Reward Rate' },
  ];

  return (
    <View style={filterStyles.overlay}>
      <View style={filterStyles.modal}>
        <View style={filterStyles.header}>
          <Text style={filterStyles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={filterStyles.closeBtn}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={filterStyles.content} showsVerticalScrollIndicator={false}>
          {/* Country Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Country</Text>
            <View style={filterStyles.chipRow}>
              {(['ALL', 'CA', 'US'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    filterStyles.chip,
                    localFilters.country === c && filterStyles.chipActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, country: c })}
                >
                  <Text
                    style={[
                      filterStyles.chipText,
                      localFilters.country === c && filterStyles.chipTextActive,
                    ]}
                  >
                    {c === 'ALL' ? 'All' : c === 'CA' ? '🇨🇦 Canada' : '🇺🇸 USA'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Issuer Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Issuer</Text>
            <View style={filterStyles.chipRow}>
              <TouchableOpacity
                style={[
                  filterStyles.chip,
                  !localFilters.issuer && filterStyles.chipActive,
                ]}
                onPress={() => setLocalFilters({ ...localFilters, issuer: null })}
              >
                <Text
                  style={[
                    filterStyles.chipText,
                    !localFilters.issuer && filterStyles.chipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {issuers.slice(0, 10).map((issuer) => (
                <TouchableOpacity
                  key={issuer}
                  style={[
                    filterStyles.chip,
                    localFilters.issuer === issuer && filterStyles.chipActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, issuer })}
                >
                  <Text
                    style={[
                      filterStyles.chipText,
                      localFilters.issuer === issuer && filterStyles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {issuer}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reward Type Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Reward Type</Text>
            <View style={filterStyles.chipRow}>
              {rewardTypes.map((rt) => (
                <TouchableOpacity
                  key={rt.key ?? 'all'}
                  style={[
                    filterStyles.chip,
                    localFilters.rewardType === rt.key && filterStyles.chipActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, rewardType: rt.key })}
                >
                  <Text
                    style={[
                      filterStyles.chipText,
                      localFilters.rewardType === rt.key && filterStyles.chipTextActive,
                    ]}
                  >
                    {rt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Annual Fee Range */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Annual Fee</Text>
            <View style={filterStyles.chipRow}>
              {feeRanges.map((fr) => (
                <TouchableOpacity
                  key={fr.key}
                  style={[
                    filterStyles.chip,
                    localFilters.annualFeeRange === fr.key && filterStyles.chipActive,
                  ]}
                  onPress={() =>
                    setLocalFilters({ ...localFilters, annualFeeRange: fr.key as any })
                  }
                >
                  <Text
                    style={[
                      filterStyles.chipText,
                      localFilters.annualFeeRange === fr.key && filterStyles.chipTextActive,
                    ]}
                  >
                    {fr.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Sort By</Text>
            <View style={filterStyles.chipRow}>
              {sortOptions.map((so) => (
                <TouchableOpacity
                  key={so.key}
                  style={[
                    filterStyles.chip,
                    localFilters.sortBy === so.key && filterStyles.chipActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, sortBy: so.key as any })}
                >
                  <Text
                    style={[
                      filterStyles.chipText,
                      localFilters.sortBy === so.key && filterStyles.chipTextActive,
                    ]}
                  >
                    {so.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={filterStyles.footer}>
          <TouchableOpacity
            style={filterStyles.resetBtn}
            onPress={() =>
              setLocalFilters({
                country: getCountry(),
                issuer: null,
                rewardType: null,
                annualFeeRange: 'all',
                sortBy: 'name',
              })
            }
          >
            <Text style={filterStyles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={filterStyles.applyBtn}
            onPress={() => onApply(localFilters)}
          >
            <Text style={filterStyles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const filterStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 450,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  chipText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  resetBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  applyBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background.primary,
  },
});

// ============================================================================
// Card Item Component
// ============================================================================

interface CardItemProps {
  card: Card;
  onApply: (card: Card) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onApply }) => {
  // Get best category rate
  const bestCategoryReward = useMemo(() => {
    if (!card.categoryRewards || card.categoryRewards.length === 0) return null;
    return card.categoryRewards.reduce((best, curr) => {
      return curr.rewardRate.value > (best?.rewardRate.value || 0) ? curr : best;
    }, card.categoryRewards[0]);
  }, [card]);

  const formatRewardRate = (value: number, unit: string): string => {
    return unit === 'percent' ? `${value}%` : `${value}x`;
  };

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.cardIcon}>
          <CreditCard size={24} color={colors.primary.main} />
        </View>
        <View style={cardStyles.cardInfo}>
          <Text style={cardStyles.cardName} numberOfLines={2}>
            {card.name}
          </Text>
          <Text style={cardStyles.issuer}>{card.issuer}</Text>
        </View>
      </View>

      <View style={cardStyles.details}>
        {/* Annual Fee */}
        <View style={cardStyles.detailRow}>
          <Text style={cardStyles.detailLabel}>Annual Fee</Text>
          <Text style={cardStyles.detailValue}>
            {card.annualFee > 0 ? `$${card.annualFee}` : 'No fee'}
          </Text>
        </View>

        {/* Best Rate */}
        <View style={cardStyles.detailRow}>
          <Text style={cardStyles.detailLabel}>Base Rate</Text>
          <Text style={cardStyles.detailValue}>
            {formatRewardRate(card.baseRewardRate.value, card.baseRewardRate.unit)}
          </Text>
        </View>

        {/* Best Category Bonus */}
        {bestCategoryReward && (
          <View style={cardStyles.detailRow}>
            <Text style={cardStyles.detailLabel}>Best Bonus</Text>
            <Text style={[cardStyles.detailValue, cardStyles.bonusValue]}>
              {formatRewardRate(
                bestCategoryReward.rewardRate.value,
                bestCategoryReward.rewardRate.unit
              )}{' '}
              on {bestCategoryReward.category}
            </Text>
          </View>
        )}

        {/* Sign-up Bonus */}
        {card.signupBonus && (
          <View style={cardStyles.signupBonus}>
            <Gift size={14} color={colors.success.main} />
            <Text style={cardStyles.signupText}>
              {card.signupBonus.amount.toLocaleString()}{' '}
              {card.signupBonus.currency === RewardType.CASHBACK ? 'cash back' : 'points'} after $
              {card.signupBonus.spendRequirement} in {card.signupBonus.timeframeDays} days
            </Text>
          </View>
        )}
      </View>

      {/* Apply Button */}
      <TouchableOpacity style={cardStyles.applyBtn} onPress={() => onApply(card)}>
        {card.applicationUrl ? (
          <>
            <Text style={cardStyles.applyBtnText}>Apply Now</Text>
            <ExternalLink size={16} color={colors.background.primary} />
          </>
        ) : (
          <Text style={cardStyles.applyBtnText}>Coming Soon</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  issuer: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  bonusValue: {
    color: colors.success.main,
  },
  signupBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.main + '15',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    gap: 8,
  },
  signupText: {
    flex: 1,
    fontSize: 12,
    color: colors.success.main,
    fontWeight: '500',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background.primary,
  },
});

// ============================================================================
// Main Screen Component
// ============================================================================

export default function ExploreCardsScreen() {
  const navigation = useNavigation();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    country: getCountry(),
    issuer: null,
    rewardType: null,
    annualFeeRange: 'all',
    sortBy: 'name',
  });

  // Load cards
  const loadCards = useCallback(async () => {
    try {
      let loadedCards: Card[];
      if (filters.country === 'ALL') {
        // Load both countries
        const [usCards, caCards] = await Promise.all([
          getCardsByCountry('US'),
          getCardsByCountry('CA'),
        ]);
        loadedCards = [...usCards, ...caCards];
      } else {
        loadedCards = await getCardsByCountry(filters.country);
      }
      setCards(loadedCards);
    } catch (error) {
      console.error('Failed to load cards:', error);
      Alert.alert('Error', 'Failed to load cards. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.country]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Get unique issuers
  const issuers = useMemo(() => {
    const uniqueIssuers = [...new Set(cards.map((c) => c.issuer))];
    return uniqueIssuers.sort();
  }, [cards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (card) =>
          card.name.toLowerCase().includes(query) ||
          card.issuer.toLowerCase().includes(query) ||
          card.rewardProgram.toLowerCase().includes(query)
      );
    }

    // Issuer filter
    if (filters.issuer) {
      result = result.filter((card) => card.issuer === filters.issuer);
    }

    // Reward type filter
    if (filters.rewardType !== null) {
      result = result.filter((card) => card.baseRewardRate.type === filters.rewardType);
    }

    // Annual fee filter
    switch (filters.annualFeeRange) {
      case 'free':
        result = result.filter((card) => card.annualFee === 0);
        break;
      case 'low':
        result = result.filter((card) => card.annualFee > 0 && card.annualFee < 100);
        break;
      case 'medium':
        result = result.filter((card) => card.annualFee >= 100 && card.annualFee < 300);
        break;
      case 'premium':
        result = result.filter((card) => card.annualFee >= 300);
        break;
    }

    // Sort
    switch (filters.sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'fee':
        result.sort((a, b) => a.annualFee - b.annualFee);
        break;
      case 'signup_bonus':
        result.sort((a, b) => {
          const aBonus = a.signupBonus?.amount || 0;
          const bBonus = b.signupBonus?.amount || 0;
          return bBonus - aBonus;
        });
        break;
      case 'best_rate':
        result.sort((a, b) => {
          const aRate = Math.max(
            a.baseRewardRate.value,
            ...(a.categoryRewards?.map((cr) => cr.rewardRate.value) || [])
          );
          const bRate = Math.max(
            b.baseRewardRate.value,
            ...(b.categoryRewards?.map((cr) => cr.rewardRate.value) || [])
          );
          return bRate - aRate;
        });
        break;
    }

    return result;
  }, [cards, searchQuery, filters]);

  // Handle apply button
  const handleApply = useCallback((card: Card) => {
    if (card.applicationUrl) {
      Linking.openURL(card.applicationUrl).catch((err) => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open application link.');
      });
    } else {
      Alert.alert(
        'Coming Soon',
        `Application link for ${card.name} is not yet available. Check back later!`
      );
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCards();
  }, [loadCards]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.issuer) count++;
    if (filters.rewardType !== null) count++;
    if (filters.annualFeeRange !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Explore Cards</Text>
          <Text style={styles.subtitle}>
            {filteredCards.length} cards available
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={18} color={activeFilterCount > 0 ? colors.primary.main : colors.text.secondary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Card List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      ) : filteredCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔍"
            title="No Cards Found"
            description={
              searchQuery
                ? `No cards match "${searchQuery}". Try a different search.`
                : 'No cards match your filters. Try adjusting them.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CardItem card={item} onApply={handleApply} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
              colors={[colors.primary.main]}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        issuers={issuers}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 8,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterBtnActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.bg20,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
});
