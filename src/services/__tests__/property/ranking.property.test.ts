/**
 * Property Tests for RecommendationEngine - Card Ranking
 * Feature: rewards-optimizer
 */

import * as fc from 'fast-check';
import { getAllCardsSync, initializeMemoryCacheSync } from '../../CardDataService';
import { rankCardsForCategory, getRewardRateForCategory } from '../../RecommendationEngine';
import { SpendingCategory, RewardType, Card } from '../../../types';

// Initialize memory cache with bundled cards for testing
initializeMemoryCacheSync();

// Get all cards and categories for testing
const allCards = getAllCardsSync();
const allCategories = Object.values(SpendingCategory);
const allRewardTypes = Object.values(RewardType);

// Arbitraries
const categoryArbitrary = fc.constantFrom(...allCategories);
const rewardTypeArbitrary = fc.constantFrom(...allRewardTypes);
const cardArbitrary = fc.constantFrom(...allCards);
const nonEmptyCardsArbitrary = fc.array(cardArbitrary, { minLength: 1, maxLength: 10 });

describe('Property 5: Card Ranking by Reward Rate', () => {
  /**
   * Feature: rewards-optimizer, Property 5: Card Ranking by Reward Rate
   * Validates: Requirements 2.2
   *
   * For any non-empty card portfolio and spending category, the ranked card list
   * should be sorted in descending order by reward rate for that category.
   */

  it('should return cards sorted in descending order by reward rate', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (cards, category, rewardType) => {
          const ranked = rankCardsForCategory(category, cards, rewardType);

          // Should have same number of cards
          expect(ranked.length).toBe(cards.length);

          // Check descending order by reward rate value
          for (let i = 0; i < ranked.length - 1; i++) {
            const currentRate = ranked[i].rewardRate.value;
            const nextRate = ranked[i + 1].rewardRate.value;
            expect(currentRate).toBeGreaterThanOrEqual(nextRate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should assign sequential ranks starting from 1', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (cards, category, rewardType) => {
          const ranked = rankCardsForCategory(category, cards, rewardType);

          // Check ranks are sequential starting from 1
          for (let i = 0; i < ranked.length; i++) {
            expect(ranked[i].rank).toBe(i + 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all input cards in output', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (cards, category, rewardType) => {
          const ranked = rankCardsForCategory(category, cards, rewardType);

          // All input cards should be in output
          const rankedIds = new Set(ranked.map((rc) => rc.card.id));
          for (const card of cards) {
            expect(rankedIds.has(card.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return correct reward rate for each card', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (cards, category, rewardType) => {
          const ranked = rankCardsForCategory(category, cards, rewardType);

          // Each ranked card should have the correct reward rate for the category
          for (const rankedCard of ranked) {
            const expectedRate = getRewardRateForCategory(rankedCard.card, category);
            expect(rankedCard.rewardRate.value).toBe(expectedRate.value);
            expect(rankedCard.rewardRate.type).toBe(expectedRate.type);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for empty input', () => {
    fc.assert(
      fc.property(categoryArbitrary, rewardTypeArbitrary, (category, rewardType) => {
        const ranked = rankCardsForCategory(category, [], rewardType);
        expect(ranked).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Reward Type Filtering', () => {
  /**
   * Feature: rewards-optimizer, Property 6: Reward Type Filtering
   * Validates: Requirements 2.4, 2.5
   *
   * For any card portfolio containing cards with different reward types and a user
   * preference for a specific reward type, cards matching the preferred type should
   * rank higher than cards with different reward types when their rates are equivalent.
   */

  it('should prefer matching reward type when rates are equal', () => {
    fc.assert(
      fc.property(categoryArbitrary, rewardTypeArbitrary, (category, preferredType) => {
        // Find cards with the same reward rate but different types for this category
        const cardsWithRates = allCards.map((card) => ({
          card,
          rate: getRewardRateForCategory(card, category),
        }));

        // Group cards by rate value
        const rateGroups = new Map<number, typeof cardsWithRates>();
        for (const item of cardsWithRates) {
          const key = item.rate.value;
          if (!rateGroups.has(key)) {
            rateGroups.set(key, []);
          }
          rateGroups.get(key)!.push(item);
        }

        // Find a group with mixed reward types
        for (const [, group] of rateGroups) {
          const hasPreferred = group.some((item) => item.rate.type === preferredType);
          const hasOther = group.some((item) => item.rate.type !== preferredType);

          if (hasPreferred && hasOther && group.length >= 2) {
            // Test with this group
            const cards = group.map((item) => item.card);
            const ranked = rankCardsForCategory(category, cards, preferredType);

            // Find the boundary where preferred type cards end
            let lastPreferredIndex = -1;
            let firstNonPreferredIndex = ranked.length;

            for (let i = 0; i < ranked.length; i++) {
              if (ranked[i].rewardRate.type === preferredType) {
                lastPreferredIndex = i;
              } else if (firstNonPreferredIndex === ranked.length) {
                firstNonPreferredIndex = i;
              }
            }

            // All preferred type cards should come before non-preferred when rates are equal
            if (lastPreferredIndex !== -1 && firstNonPreferredIndex !== ranked.length) {
              expect(lastPreferredIndex).toBeLessThan(firstNonPreferredIndex);
            }
            return; // Found a valid test case
          }
        }
        // If no mixed group found, test passes trivially
      }),
      { numRuns: 100 }
    );
  });

  it('should still prioritize higher rates over matching type', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (cards, category, preferredType) => {
          const ranked = rankCardsForCategory(category, cards, preferredType);

          // Higher rate should always come before lower rate regardless of type
          for (let i = 0; i < ranked.length - 1; i++) {
            const currentRate = ranked[i].rewardRate.value;
            const nextRate = ranked[i + 1].rewardRate.value;

            // If current rate is strictly greater, it should be ranked higher
            if (currentRate > nextRate) {
              expect(ranked[i].rank).toBeLessThan(ranked[i + 1].rank);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Base Rate Fallback', () => {
  /**
   * Feature: rewards-optimizer, Property 7: Base Rate Fallback
   * Validates: Requirements 2.6
   *
   * For any card portfolio where no cards have bonus rewards for a given spending
   * category, the recommended card should be the one with the highest base reward rate.
   */

  // Find cards that have no bonus for a specific category
  function getCardsWithoutCategoryBonus(cards: Card[], category: SpendingCategory): Card[] {
    return cards.filter((card) => !card.categoryRewards.some((cr) => cr.category === category));
  }

  it('should use base rate when no category bonus exists', () => {
    fc.assert(
      fc.property(categoryArbitrary, rewardTypeArbitrary, (category, rewardType) => {
        // Get cards without bonus for this category
        const cardsWithoutBonus = getCardsWithoutCategoryBonus(allCards, category);

        if (cardsWithoutBonus.length === 0) {
          return; // Skip if all cards have bonus for this category
        }

        const ranked = rankCardsForCategory(category, cardsWithoutBonus, rewardType);

        // All cards should use their base rate
        for (const rankedCard of ranked) {
          expect(rankedCard.rewardRate.value).toBe(rankedCard.card.baseRewardRate.value);
          expect(rankedCard.rewardRate.type).toBe(rankedCard.card.baseRewardRate.type);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should rank by base rate when no category bonuses exist', () => {
    fc.assert(
      fc.property(categoryArbitrary, rewardTypeArbitrary, (category, rewardType) => {
        // Get cards without bonus for this category
        const cardsWithoutBonus = getCardsWithoutCategoryBonus(allCards, category);

        if (cardsWithoutBonus.length < 2) {
          return; // Need at least 2 cards to test ranking
        }

        const ranked = rankCardsForCategory(category, cardsWithoutBonus, rewardType);

        // Best card should have highest base rate
        const bestCard = ranked[0];
        const maxBaseRate = Math.max(...cardsWithoutBonus.map((c) => c.baseRewardRate.value));

        expect(bestCard.rewardRate.value).toBe(maxBaseRate);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify when card uses base rate vs category bonus', () => {
    fc.assert(
      fc.property(cardArbitrary, categoryArbitrary, (card, category) => {
        const rate = getRewardRateForCategory(card, category);
        const hasBonus = card.categoryRewards.some((cr) => cr.category === category);

        if (hasBonus) {
          // Should use category bonus rate
          const categoryReward = card.categoryRewards.find((cr) => cr.category === category);
          expect(rate.value).toBe(categoryReward!.rewardRate.value);
        } else {
          // Should use base rate
          expect(rate.value).toBe(card.baseRewardRate.value);
        }
      }),
      { numRuns: 100 }
    );
  });
});
