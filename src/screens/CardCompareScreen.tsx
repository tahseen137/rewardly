/**
 * CardCompareScreen - Side-by-side card comparison
 * 
 * Tier: Free (2 cards), Pro+ (3 cards)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Plus, X, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Card } from '../types';
import {
  compareCards,
  getMaxCardsForTier,
  getCategoryDisplayName,
  formatComparisonValue,
} from '../services/CardComparisonService';
import { getCards } from '../services/CardPortfolioManager';
import { getCardByIdSync } from '../services/CardDataService';
import { getCurrentTierSync } from '../services/SubscriptionService';
import { LockedFeature } from '../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CardCompareScreen() {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [maxCards, setMaxCards] = useState(2);

  useEffect(() => {
    const tier = getCurrentTierSync();
    setMaxCards(getMaxCardsForTier(tier));
  }, []);

  const comparison = useMemo(() => {
    if (selectedCardIds.length === 0) return null;
    return compareCards(selectedCardIds);
  }, [selectedCardIds]);

  const portfolioCards = useMemo(() => {
    return getCards().map(uc => getCardByIdSync(uc.cardId)).filter(Boolean) as Card[];
  }, []);

  const handleAddCard = (cardId: string) => {
    if (selectedCardIds.length < maxCards && !selectedCardIds.includes(cardId)) {
      setSelectedCardIds([...selectedCardIds, cardId]);
      setShowCardPicker(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
  };

  const renderCardPicker = () => {
    if (!showCardPicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Card</Text>
            <TouchableOpacity onPress={() => setShowCardPicker(false)}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {portfolioCards
              .filter(card => !selectedCardIds.includes(card.id))
              .map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.pickerItem}
                  onPress={() => handleAddCard(card.id)}
                >
                  <View>
                    <Text style={styles.pickerCardName}>{card.name}</Text>
                    <Text style={styles.pickerCardIssuer}>{card.issuer}</Text>
                  </View>
                  <Plus size={20} color={colors.primary.main} />
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <TrendingUp size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>Compare Your Cards</Text>
      <Text style={styles.emptyDescription}>
        Select up to {maxCards} cards to see how they stack up
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCardPicker(true)}
      >
        <Plus size={20} color={colors.background.primary} />
        <Text style={styles.addButtonText}>Add Card</Text>
      </TouchableOpacity>
    </View>
  );

  const renderComparison = () => {
    if (!comparison || selectedCardIds.length < 2) {
      return renderEmptyState();
    }

    return (
      <ScrollView style={styles.container}>
        {/* Header with selected cards */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comparing {selectedCardIds.length} Cards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardChips}>
            {selectedCardIds.map(cardId => {
              const card = getCardByIdSync(cardId);
              if (!card) return null;
              return (
                <View key={cardId} style={styles.cardChip}>
                  <Text style={styles.cardChipText} numberOfLines={1}>
                    {card.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveCard(cardId)}>
                    <X size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {selectedCardIds.length < maxCards && (
              <TouchableOpacity
                style={styles.addChip}
                onPress={() => setShowCardPicker(true)}
              >
                <Plus size={16} color={colors.primary.main} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Comparison Table */}
        <View style={styles.comparisonTable}>
          {comparison.categoryComparisons.map((catComp, index) => (
            <Animated.View
              key={catComp.category}
              entering={FadeInDown.delay(index * 30).duration(300)}
              style={styles.comparisonRow}
            >
              <View style={styles.categoryCell}>
                <Text style={styles.categoryLabel}>
                  {getCategoryDisplayName(catComp.category)}
                </Text>
              </View>
              <View style={styles.valuesRow}>
                {catComp.values.map(val => {
                  const card = getCardByIdSync(val.cardId);
                  return (
                    <View
                      key={val.cardId}
                      style={[
                        styles.valueCell,
                        val.isWinner && styles.winnerCell,
                      ]}
                    >
                      <Text
                        style={[
                          styles.valueText,
                          val.isWinner && styles.winnerText,
                        ]}
                      >
                        {formatComparisonValue(val.value, catComp.category)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Overall Scores */}
        <View style={styles.scoresSection}>
          <Text style={styles.scoresTitle}>Overall Score</Text>
          {comparison.overallScores
            .sort((a, b) => b.score - a.score)
            .map((score, index) => {
              const card = getCardByIdSync(score.cardId);
              if (!card) return null;
              return (
                <View key={score.cardId} style={styles.scoreRow}>
                  <View style={styles.scoreRank}>
                    <Text style={styles.scoreRankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.scoreCardName}>{card.name}</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { width: `${score.score}%` },
                        index === 0 && styles.scoreBarWinner,
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreValue}>{Math.round(score.score)}</Text>
                </View>
              );
            })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // Show locked feature if free user tries to add 3rd card
  if (selectedCardIds.length >= maxCards && maxCards === 2) {
    return (
      <>
        {renderComparison()}
        {renderCardPicker()}
      </>
    );
  }

  return (
    <>
      {renderComparison()}
      {renderCardPicker()}
    </>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray800,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  cardChips: {
    flexDirection: 'row',
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8,
    maxWidth: SCREEN_WIDTH * 0.4,
  },
  cardChipText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  addChip: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonTable: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  comparisonRow: {
    marginBottom: 12,
  },
  categoryCell: {
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valuesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  valueCell: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray800,
  },
  winnerCell: {
    backgroundColor: colors.primary.main + '15',
    borderColor: colors.primary.main + '40',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  winnerText: {
    color: colors.primary.main,
  },
  scoresSection: {
    padding: 20,
    marginTop: 12,
  },
  scoresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  scoreRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scoreCardName: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  scoreBar: {
    width: 80,
    height: 8,
    backgroundColor: colors.neutral.gray800,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.text.secondary,
  },
  scoreBarWinner: {
    backgroundColor: colors.primary.main,
  },
  scoreValue: {
    width: 32,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background.primary,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_WIDTH,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray800,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray800,
  },
  pickerCardName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  pickerCardIssuer: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
