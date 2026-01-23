/**
 * Property Tests for CardPortfolioManager
 * Feature: rewards-optimizer
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardType, SpendingCategory, Card } from '../../../types';

// Mock card data for testing
const mockCards: Card[] = [
  {
    id: 'amex-cobalt-canada',
    name: 'American Express Cobalt Card',
    issuer: 'American Express Canada',
    rewardProgram: 'Membership Rewards',
    annualFee: 156,
    baseRewardRate: { value: 1, type: RewardType.POINTS, unit: 'multiplier' },
    categoryRewards: [
      { category: SpendingCategory.DINING, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
      { category: SpendingCategory.GROCERIES, rewardRate: { value: 5, type: RewardType.POINTS, unit: 'multiplier' } },
    ],
  },
  {
    id: 'td-cash-back-visa-infinite',
    name: 'TD Cash Back Visa Infinite',
    issuer: 'TD Canada Trust',
    rewardProgram: 'Cash Back',
    annualFee: 139,
    baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
    categoryRewards: [
      { category: SpendingCategory.GROCERIES, rewardRate: { value: 3, type: RewardType.CASHBACK, unit: 'percent' } },
      { category: SpendingCategory.GAS, rewardRate: { value: 3, type: RewardType.CASHBACK, unit: 'percent' } },
    ],
  },
  {
    id: 'cibc-dividend-visa-infinite',
    name: 'CIBC Dividend Visa Infinite',
    issuer: 'CIBC',
    rewardProgram: 'Cash Back',
    annualFee: 120,
    baseRewardRate: { value: 1, type: RewardType.CASHBACK, unit: 'percent' },
    categoryRewards: [
      { category: SpendingCategory.GROCERIES, rewardRate: { value: 4, type: RewardType.CASHBACK, unit: 'percent' } },
    ],
  },
];

// Mock the CardDataService module
jest.mock('../../CardDataService', () => ({
  getAllCardsSync: jest.fn(() => mockCards),
  getCardByIdSync: jest.fn((id: string) => mockCards.find((c) => c.id === id) || null),
}));

import {
  addCard,
  removeCard,
  getCards,
  isDuplicate,
  clearPortfolio,
  resetCache,
  initializePortfolio,
} from '../../CardPortfolioManager';

const validCardIds = mockCards.map((c) => c.id);

// Arbitrary for selecting a random valid card ID
const cardIdArbitrary = fc.constantFrom(...validCardIds);

describe('Property 1: Card Addition Round-Trip', () => {
  /**
   * Feature: rewards-optimizer, Property 1: Card Addition Round-Trip
   * Validates: Requirements 1.1
   *
   * For any valid card ID from the card database, adding it to the portfolio
   * and then retrieving the portfolio should include that card.
   */

  beforeEach(async () => {
    // Clear mock storage and reset cache before each test
    (AsyncStorage as unknown as { __clearMockStorage: () => void }).__clearMockStorage();
    resetCache();
    await initializePortfolio();
  });

  it('should include added card in portfolio after retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(cardIdArbitrary, async (cardId) => {
        // Clear portfolio for each iteration
        await clearPortfolio();

        // Add the card
        const result = await addCard(cardId);

        // Should succeed
        expect(result.success).toBe(true);

        // Retrieve portfolio
        const cards = getCards();

        // Portfolio should contain the added card
        const found = cards.some((c) => c.cardId === cardId);
        expect(found).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve card ID exactly after round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(cardIdArbitrary, async (cardId) => {
        // Clear portfolio for each iteration
        await clearPortfolio();

        // Add the card
        await addCard(cardId);

        // Retrieve portfolio
        const cards = getCards();

        // Find the added card
        const addedCard = cards.find((c) => c.cardId === cardId);

        // Card ID should match exactly
        expect(addedCard).toBeDefined();
        expect(addedCard!.cardId).toBe(cardId);
      }),
      { numRuns: 100 }
    );
  });

  it('should have addedAt date after adding card', async () => {
    await fc.assert(
      fc.asyncProperty(cardIdArbitrary, async (cardId) => {
        // Clear portfolio for each iteration
        await clearPortfolio();

        const beforeAdd = new Date();

        // Add the card
        const result = await addCard(cardId);

        const afterAdd = new Date();

        // Should succeed
        expect(result.success).toBe(true);
        if (result.success) {
          // addedAt should be between before and after timestamps
          expect(result.value.addedAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
          expect(result.value.addedAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Duplicate Card Rejection', () => {
  /**
   * Feature: rewards-optimizer, Property 3: Duplicate Card Rejection
   * Validates: Requirements 1.4
   *
   * For any card that already exists in the user's portfolio, attempting to add
   * it again should fail with a duplicate error, and the portfolio should remain unchanged.
   */

  beforeEach(async () => {
    // Clear mock storage and reset cache before each test
    (AsyncStorage as unknown as { __clearMockStorage: () => void }).__clearMockStorage();
    resetCache();
    await initializePortfolio();
  });

  it('should reject duplicate card with DUPLICATE_CARD error', async () => {
    await fc.assert(
      fc.asyncProperty(cardIdArbitrary, async (cardId) => {
        // Clear portfolio for each iteration
        await clearPortfolio();

        // Add the card first time
        const firstResult = await addCard(cardId);
        expect(firstResult.success).toBe(true);

        // Try to add the same card again
        const secondResult = await addCard(cardId);

        // Should fail with DUPLICATE_CARD error
        expect(secondResult.success).toBe(false);
        if (!secondResult.success) {
          expect(secondResult.error.type).toBe('DUPLICATE_CARD');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not change portfolio size when adding duplicate', async () => {
    await fc.assert(
      fc.asyncProperty(cardIdArbitrary, async (cardId) => {
        // Clear portfolio for each iteration
        await clearPortfolio();

        // Add the card first time
        await addCard(cardId);
        const sizeAfterFirst = getCards().length;

        // Try to add the same card again
        await addCard(cardId);
        const sizeAfterSecond = getCards().length;

        // Size should remain the same
        expect(sizeAfterSecond).toBe(sizeAfterFirst);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify duplicates via isDuplicate', async () => {
    await fc.assert(
      fc.asyncProperty(cardIdArbitrary, async (cardId) => {
        // Clear portfolio for each iteration
        await clearPortfolio();

        // Before adding, should not be duplicate
        expect(isDuplicate(cardId)).toBe(false);

        // Add the card
        await addCard(cardId);

        // After adding, should be duplicate
        expect(isDuplicate(cardId)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
