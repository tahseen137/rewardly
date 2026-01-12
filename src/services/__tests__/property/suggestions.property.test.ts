/**
 * Property Tests for RecommendationEngine - New Card Suggestions
 * Feature: rewards-optimizer
 */

import * as fc from 'fast-check';
import { getAllCards } from '../../CardDataService';
import {
  findBetterCards,
  getRewardRateForCategory,
  getStoreRecommendation,
} from '../../RecommendationEngine';
import { getAllStores } from '../../StoreDataService';
import { SpendingCategory, RewardType, Card, UserCard, UserPreferences } from '../../../types';

// Get all cards, stores, and categories for testing
const allCards = getAllCards();
const allStores = getAllStores();
const allCategories = Object.values(SpendingCategory);
const allRewardTypes = Object.values(RewardType);

// Arbitraries
const categoryArbitrary = fc.constantFrom(...allCategories);
const rewardTypeArbitrary = fc.constantFrom(...allRewardTypes);
const cardArbitrary = fc.constantFrom(...allCards);
const storeArbitrary = fc.constantFrom(...allStores);
const nonEmptyCardsArbitrary = fc.array(cardArbitrary, { minLength: 1, maxLength: 5 });

// Helper to create a UserCard from a Card
function toUserCard(card: Card): UserCard {
  return { cardId: card.id, addedAt: new Date() };
}

describe('Property 8: New Card Suggestions Are Superior', () => {
  /**
   * Feature: rewards-optimizer, Property 8: New Card Suggestions Are Superior
   * Validates: Requirements 3.1
   *
   * For any store and user portfolio, all suggested new cards should have a reward
   * rate strictly greater than the user's best card for that store's category.
   */

  it('should only suggest cards with strictly better reward rates', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (userCards, category, rewardType) => {
          // Get unique cards
          const uniqueCards = [...new Map(userCards.map((c) => [c.id, c])).values()];
          if (uniqueCards.length === 0) return;

          const userCardIds = new Set(uniqueCards.map((c) => c.id));

          // Find user's best card for this category
          let bestUserCard: Card | null = null;
          let bestRate = -Infinity;
          for (const card of uniqueCards) {
            const rate = getRewardRateForCategory(card, category);
            if (rate.value > bestRate) {
              bestRate = rate.value;
              bestUserCard = card;
            }
          }

          // Get suggested cards
          const suggestions = findBetterCards(category, bestUserCard, rewardType, userCardIds);

          // All suggestions should have strictly better rate
          for (const suggestedCard of suggestions) {
            const suggestedRate = getRewardRateForCategory(suggestedCard, category);
            expect(suggestedRate.value).toBeGreaterThan(bestRate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include cards the user already owns', () => {
    fc.assert(
      fc.property(
        nonEmptyCardsArbitrary,
        categoryArbitrary,
        rewardTypeArbitrary,
        (userCards, category, rewardType) => {
          const uniqueCards = [...new Map(userCards.map((c) => [c.id, c])).values()];
          if (uniqueCards.length === 0) return;

          const userCardIds = new Set(uniqueCards.map((c) => c.id));
          const bestUserCard = uniqueCards[0];

          const suggestions = findBetterCards(category, bestUserCard, rewardType, userCardIds);

          // No suggestion should be a card the user owns
          for (const suggestedCard of suggestions) {
            expect(userCardIds.has(suggestedCard.id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 9: No Suggestions When Optimal', () => {
  /**
   * Feature: rewards-optimizer, Property 9: No Suggestions When Optimal
   * Validates: Requirements 3.3
   *
   * For any store where the user's best card has a reward rate equal to or greater
   * than all cards in the database for that category, the suggested new cards list
   * should be empty.
   */

  it('should return empty suggestions when user has optimal card', () => {
    fc.assert(
      fc.property(categoryArbitrary, rewardTypeArbitrary, (category, rewardType) => {
        // Find the best card in the entire database for this category
        let bestCard: Card | null = null;
        let bestRate = -Infinity;

        for (const card of allCards) {
          const rate = getRewardRateForCategory(card, category);
          if (rate.value > bestRate) {
            bestRate = rate.value;
            bestCard = card;
          }
        }

        if (!bestCard) return;

        // User owns the best card
        const userCardIds = new Set([bestCard.id]);

        // Get suggestions
        const suggestions = findBetterCards(category, bestCard, rewardType, userCardIds);

        // Should be empty since user has the best card
        expect(suggestions.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty when user owns all cards with max rate', () => {
    fc.assert(
      fc.property(categoryArbitrary, rewardTypeArbitrary, (category, rewardType) => {
        // Find max rate for this category
        let maxRate = -Infinity;
        for (const card of allCards) {
          const rate = getRewardRateForCategory(card, category);
          if (rate.value > maxRate) {
            maxRate = rate.value;
          }
        }

        // Get all cards with max rate
        const cardsWithMaxRate = allCards.filter((card) => {
          const rate = getRewardRateForCategory(card, category);
          return rate.value === maxRate;
        });

        if (cardsWithMaxRate.length === 0) return;

        // User owns all cards with max rate
        const userCardIds = new Set(cardsWithMaxRate.map((c) => c.id));
        const userBestCard = cardsWithMaxRate[0];

        // Get suggestions
        const suggestions = findBetterCards(category, userBestCard, rewardType, userCardIds);

        // Should be empty - no card can beat the max rate
        expect(suggestions.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});


describe('Property 10: New Card Toggle Control', () => {
  /**
   * Feature: rewards-optimizer, Property 10: New Card Toggle Control
   * Validates: Requirements 3.4
   *
   * For any recommendation request, when new card suggestions are disabled,
   * the suggested new cards list should always be empty regardless of whether
   * better cards exist.
   */

  it('should return empty suggestions when toggle is disabled', () => {
    fc.assert(
      fc.property(
        storeArbitrary,
        nonEmptyCardsArbitrary,
        rewardTypeArbitrary,
        (store, userCards, rewardType) => {
          const uniqueCards = [...new Map(userCards.map((c) => [c.id, c])).values()];
          if (uniqueCards.length === 0) return;

          const portfolio: UserCard[] = uniqueCards.map(toUserCard);
          const preferences: UserPreferences = {
            rewardType,
            newCardSuggestionsEnabled: false, // Disabled
          };

          const recommendation = getStoreRecommendation(store.name, portfolio, preferences);

          if (recommendation) {
            // Suggestions should always be empty when disabled
            expect(recommendation.suggestedNewCards.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should potentially return suggestions when toggle is enabled', () => {
    fc.assert(
      fc.property(
        storeArbitrary,
        fc.array(cardArbitrary, { minLength: 1, maxLength: 3 }),
        rewardTypeArbitrary,
        (store, userCards, rewardType) => {
          const uniqueCards = [...new Map(userCards.map((c) => [c.id, c])).values()];
          if (uniqueCards.length === 0) return;

          const portfolio: UserCard[] = uniqueCards.map(toUserCard);
          const preferencesEnabled: UserPreferences = {
            rewardType,
            newCardSuggestionsEnabled: true,
          };
          const preferencesDisabled: UserPreferences = {
            rewardType,
            newCardSuggestionsEnabled: false,
          };

          const recEnabled = getStoreRecommendation(store.name, portfolio, preferencesEnabled);
          const recDisabled = getStoreRecommendation(store.name, portfolio, preferencesDisabled);

          if (recEnabled && recDisabled) {
            // Disabled should always be empty
            expect(recDisabled.suggestedNewCards.length).toBe(0);

            // Enabled should have >= suggestions than disabled (which is 0)
            expect(recEnabled.suggestedNewCards.length).toBeGreaterThanOrEqual(
              recDisabled.suggestedNewCards.length
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 2: Card Removal Excludes from Recommendations', () => {
  /**
   * Feature: rewards-optimizer, Property 2: Card Removal Excludes from Recommendations
   * Validates: Requirements 1.3
   *
   * For any card portfolio and any card within it, after removing that card,
   * all subsequent recommendations should not include the removed card in their results.
   */

  it('should not include removed card in recommendations', () => {
    fc.assert(
      fc.property(
        storeArbitrary,
        fc.array(cardArbitrary, { minLength: 2, maxLength: 5 }),
        rewardTypeArbitrary,
        (store, userCards, rewardType) => {
          const uniqueCards = [...new Map(userCards.map((c) => [c.id, c])).values()];
          if (uniqueCards.length < 2) return;

          // Pick a card to "remove"
          const cardToRemove = uniqueCards[0];
          const remainingCards = uniqueCards.slice(1);

          const portfolio: UserCard[] = remainingCards.map(toUserCard);
          const preferences: UserPreferences = {
            rewardType,
            newCardSuggestionsEnabled: true,
          };

          const recommendation = getStoreRecommendation(store.name, portfolio, preferences);

          if (recommendation) {
            // Removed card should not be in allCards
            const allCardIds = recommendation.allCards.map((rc) => rc.card.id);
            expect(allCardIds).not.toContain(cardToRemove.id);

            // Removed card should not be bestCard
            if (recommendation.bestCard) {
              expect(recommendation.bestCard.card.id).not.toBe(cardToRemove.id);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update best card when previous best is removed', () => {
    fc.assert(
      fc.property(
        storeArbitrary,
        fc.array(cardArbitrary, { minLength: 2, maxLength: 5 }),
        rewardTypeArbitrary,
        (store, userCards, rewardType) => {
          const uniqueCards = [...new Map(userCards.map((c) => [c.id, c])).values()];
          if (uniqueCards.length < 2) return;

          const preferences: UserPreferences = {
            rewardType,
            newCardSuggestionsEnabled: false,
          };

          // Get recommendation with all cards
          const fullPortfolio: UserCard[] = uniqueCards.map(toUserCard);
          const fullRec = getStoreRecommendation(store.name, fullPortfolio, preferences);

          if (!fullRec || !fullRec.bestCard) return;

          // Remove the best card
          const bestCardId = fullRec.bestCard.card.id;
          const reducedCards = uniqueCards.filter((c) => c.id !== bestCardId);

          if (reducedCards.length === 0) return;

          const reducedPortfolio: UserCard[] = reducedCards.map(toUserCard);
          const reducedRec = getStoreRecommendation(store.name, reducedPortfolio, preferences);

          if (reducedRec) {
            // Best card should not be the removed card
            if (reducedRec.bestCard) {
              expect(reducedRec.bestCard.card.id).not.toBe(bestCardId);
            }

            // All cards should not include the removed card
            const allCardIds = reducedRec.allCards.map((rc) => rc.card.id);
            expect(allCardIds).not.toContain(bestCardId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
