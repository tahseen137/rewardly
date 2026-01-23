/**
 * Property-based tests for RewardsCalculatorService
 * Uses fast-check for property testing
 */

import * as fc from 'fast-check';
import {
  getApplicableMultiplier,
  calculateRewards,
  pointsToCad,
  CalculatorInput,
} from '../../RewardsCalculatorService';
import { Card, SpendingCategory, RewardType, CategoryReward } from '../../../types';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid spending category
 */
const categoryArb = fc.constantFrom(...Object.values(SpendingCategory));

/**
 * Generate a valid reward type
 */
const rewardTypeArb = fc.constantFrom(...Object.values(RewardType));

/**
 * Generate a positive multiplier value (0.5 to 10)
 */
const multiplierArb = fc.double({ min: 0.5, max: 10, noNaN: true });

/**
 * Generate a category reward
 */
const categoryRewardArb = fc.record({
  category: categoryArb,
  rewardRate: fc.record({
    value: multiplierArb,
    type: rewardTypeArb,
    unit: fc.constantFrom('percent' as const, 'multiplier' as const),
  }),
});

/**
 * Generate a card with optional category rewards
 */
const cardArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  issuer: fc.string({ minLength: 1, maxLength: 30 }),
  rewardProgram: fc.string({ minLength: 1, maxLength: 30 }),
  baseRewardRate: fc.record({
    value: multiplierArb,
    type: rewardTypeArb,
    unit: fc.constantFrom('percent' as const, 'multiplier' as const),
  }),
  categoryRewards: fc.array(categoryRewardArb, { maxLength: 5 }),
  annualFee: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
});

/**
 * Generate a positive purchase amount (1 to 10000 CAD)
 */
const amountArb = fc.double({ min: 1, max: 10000, noNaN: true });

/**
 * Generate a point valuation in CAD cents (0.5 to 5 cents)
 */
const pointValuationArb = fc.double({ min: 0.5, max: 5, noNaN: true });

// ============================================================================
// Property Tests
// ============================================================================

describe('RewardsCalculatorService - Property Tests', () => {
  describe('Property 8: Correct Multiplier Selection', () => {
    /**
     * **Feature: rewards-value-calculator, Property 8: Correct Multiplier Selection**
     * **Validates: Requirements 4.2**
     *
     * For any card and spending category combination, the calculator should use
     * the category-specific multiplier if one exists, otherwise the base reward rate.
     */
    it('should use category multiplier when available, otherwise base rate', () => {
      fc.assert(
        fc.property(cardArb, categoryArb, (card: Card, category: SpendingCategory) => {
          const multiplier = getApplicableMultiplier(card, category);

          // Find if card has a category-specific reward
          const categoryReward = card.categoryRewards.find((r) => r.category === category);

          if (categoryReward) {
            // Should use category-specific multiplier
            expect(multiplier).toBe(categoryReward.rewardRate.value);
          } else {
            // Should use base reward rate
            expect(multiplier).toBe(card.baseRewardRate.value);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should always return a positive multiplier', () => {
      fc.assert(
        fc.property(cardArb, categoryArb, (card: Card, category: SpendingCategory) => {
          const multiplier = getApplicableMultiplier(card, category);
          expect(multiplier).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return the same multiplier for the same card and category', () => {
      fc.assert(
        fc.property(cardArb, categoryArb, (card: Card, category: SpendingCategory) => {
          const multiplier1 = getApplicableMultiplier(card, category);
          const multiplier2 = getApplicableMultiplier(card, category);
          expect(multiplier1).toBe(multiplier2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Points Calculation Correctness', () => {
    /**
     * **Feature: rewards-value-calculator, Property 9: Points Calculation Correctness**
     * **Validates: Requirements 4.3**
     *
     * For any purchase amount and multiplier, the points earned should equal: amount × multiplier.
     */
    it('should calculate points as amount × multiplier', () => {
      fc.assert(
        fc.property(
          cardArb,
          categoryArb,
          amountArb,
          pointValuationArb,
          (card: Card, category: SpendingCategory, amount: number, pointValuation: number) => {
            const input: CalculatorInput = {
              category,
              amount,
              portfolioCardIds: [card.id],
            };

            const pointValuations = new Map<string, number>();
            pointValuations.set(card.id, pointValuation);

            const output = calculateRewards(input, [card], pointValuations);

            expect(output.results).toHaveLength(1);
            const result = output.results[0];

            // Get expected multiplier
            const expectedMultiplier = getApplicableMultiplier(card, category);

            // Calculate expected points
            const expectedPoints = amount * expectedMultiplier;

            // Verify points calculation
            expect(result.pointsEarned).toBeCloseTo(expectedPoints, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate zero points for zero amount', () => {
      fc.assert(
        fc.property(
          cardArb,
          categoryArb,
          pointValuationArb,
          (card: Card, category: SpendingCategory, pointValuation: number) => {
            const input: CalculatorInput = {
              category,
              amount: 0,
              portfolioCardIds: [card.id],
            };

            const pointValuations = new Map<string, number>();
            pointValuations.set(card.id, pointValuation);

            const output = calculateRewards(input, [card], pointValuations);

            expect(output.results).toHaveLength(1);
            expect(output.results[0].pointsEarned).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should scale points linearly with amount', () => {
      fc.assert(
        fc.property(
          cardArb,
          categoryArb,
          amountArb,
          pointValuationArb,
          (card: Card, category: SpendingCategory, amount: number, pointValuation: number) => {
            const pointValuations = new Map<string, number>();
            pointValuations.set(card.id, pointValuation);

            // Calculate for amount
            const input1: CalculatorInput = {
              category,
              amount,
              portfolioCardIds: [card.id],
            };
            const output1 = calculateRewards(input1, [card], pointValuations);

            // Calculate for double amount
            const input2: CalculatorInput = {
              category,
              amount: amount * 2,
              portfolioCardIds: [card.id],
            };
            const output2 = calculateRewards(input2, [card], pointValuations);

            // Points should double
            expect(output2.results[0].pointsEarned).toBeCloseTo(
              output1.results[0].pointsEarned * 2,
              10
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: CAD Value Calculation Correctness', () => {
    /**
     * **Feature: rewards-value-calculator, Property 10: CAD Value Calculation Correctness**
     * **Validates: Requirements 4.4**
     *
     * For any points earned and point valuation (in cents), the CAD value should equal:
     * points × (point_valuation / 100).
     */
    it('should calculate CAD value as points × (valuation / 100)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100000, noNaN: true }),
          pointValuationArb,
          cardArb,
          (points: number, pointValuation: number, card: Card) => {
            // Create card without program details to use fallback
            const cardWithoutProgram = { ...card, programDetails: undefined };
            const cadValue = pointsToCad(points, cardWithoutProgram, pointValuation);
            const expectedValue = points * (pointValuation / 100);
            expect(cadValue).toBeCloseTo(expectedValue, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify CAD value in full calculation flow', () => {
      fc.assert(
        fc.property(
          cardArb,
          categoryArb,
          amountArb,
          pointValuationArb,
          (card: Card, category: SpendingCategory, amount: number, pointValuation: number) => {
            const input: CalculatorInput = {
              category,
              amount,
              portfolioCardIds: [card.id],
            };

            const pointValuations = new Map<string, number>();
            pointValuations.set(card.id, pointValuation);

            const output = calculateRewards(input, [card], pointValuations);

            expect(output.results).toHaveLength(1);
            const result = output.results[0];

            // Calculate expected CAD value
            const expectedCadValue = result.pointsEarned * (pointValuation / 100);

            // Verify CAD value calculation
            expect(result.cadValue).toBeCloseTo(expectedCadValue, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero CAD value for zero points', () => {
      fc.assert(
        fc.property(
          pointValuationArb,
          cardArb,
          (pointValuation: number, card: Card) => {
            const cardWithoutProgram = { ...card, programDetails: undefined };
            const cadValue = pointsToCad(0, cardWithoutProgram, pointValuation);
            expect(cadValue).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should scale CAD value linearly with point valuation', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 10000, noNaN: true }),
          pointValuationArb,
          cardArb,
          (points: number, pointValuation: number, card: Card) => {
            const cardWithoutProgram = { ...card, programDetails: undefined };
            const cadValue1 = pointsToCad(points, cardWithoutProgram, pointValuation);
            const cadValue2 = pointsToCad(points, cardWithoutProgram, pointValuation * 2);

            // CAD value should double when valuation doubles
            expect(cadValue2).toBeCloseTo(cadValue1 * 2, 10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Complete Portfolio Processing with Sorting', () => {
    /**
     * **Feature: rewards-value-calculator, Property 7: Complete Portfolio Processing with Sorting**
     * **Validates: Requirements 4.1, 4.5**
     *
     * For any card portfolio and valid calculation input, the results should contain
     * exactly one entry per portfolio card, sorted by CAD value in descending order.
     */
    it('should process all portfolio cards exactly once', () => {
      fc.assert(
        fc.property(
          fc.array(cardArb, { minLength: 1, maxLength: 10 }),
          categoryArb,
          amountArb,
          (cards: Card[], category: SpendingCategory, amount: number) => {
            // Create unique card IDs
            const uniqueCards = cards.map((card, index) => ({
              ...card,
              id: `card-${index}`,
            }));

            const portfolioCardIds = uniqueCards.map((c) => c.id);

            // Create point valuations for all cards
            const pointValuations = new Map<string, number>();
            uniqueCards.forEach((card) => {
              pointValuations.set(card.id, 1.5); // Use consistent valuation
            });

            const input: CalculatorInput = {
              category,
              amount,
              portfolioCardIds,
            };

            const output = calculateRewards(input, uniqueCards, pointValuations);

            // Should have exactly one result per portfolio card
            expect(output.results).toHaveLength(portfolioCardIds.length);

            // All portfolio cards should be present
            const resultCardIds = output.results.map((r) => r.cardId);
            portfolioCardIds.forEach((cardId) => {
              expect(resultCardIds).toContain(cardId);
            });

            // No duplicate results
            const uniqueResultIds = new Set(resultCardIds);
            expect(uniqueResultIds.size).toBe(portfolioCardIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sort results by CAD value in descending order', () => {
      fc.assert(
        fc.property(
          fc.array(cardArb, { minLength: 2, maxLength: 10 }),
          categoryArb,
          amountArb,
          (cards: Card[], category: SpendingCategory, amount: number) => {
            // Create unique cards with different multipliers
            const uniqueCards = cards.map((card, index) => ({
              ...card,
              id: `card-${index}`,
              baseRewardRate: {
                ...card.baseRewardRate,
                value: 1 + index * 0.5, // Different multipliers
              },
            }));

            const portfolioCardIds = uniqueCards.map((c) => c.id);

            // Create point valuations
            const pointValuations = new Map<string, number>();
            uniqueCards.forEach((card) => {
              pointValuations.set(card.id, 1.5);
            });

            const input: CalculatorInput = {
              category,
              amount,
              portfolioCardIds,
            };

            const output = calculateRewards(input, uniqueCards, pointValuations);

            // Verify descending order
            for (let i = 0; i < output.results.length - 1; i++) {
              expect(output.results[i].cadValue).toBeGreaterThanOrEqual(
                output.results[i + 1].cadValue
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify best card as first in sorted results', () => {
      fc.assert(
        fc.property(
          fc.array(cardArb, { minLength: 1, maxLength: 10 }),
          categoryArb,
          amountArb,
          (cards: Card[], category: SpendingCategory, amount: number) => {
            const uniqueCards = cards.map((card, index) => ({
              ...card,
              id: `card-${index}`,
            }));

            const portfolioCardIds = uniqueCards.map((c) => c.id);

            const pointValuations = new Map<string, number>();
            uniqueCards.forEach((card) => {
              pointValuations.set(card.id, 1.5);
            });

            const input: CalculatorInput = {
              category,
              amount,
              portfolioCardIds,
            };

            const output = calculateRewards(input, uniqueCards, pointValuations);

            if (output.results.length > 0) {
              // Best card should be the first result
              expect(output.bestCard).toEqual(output.results[0]);

              // Best card should have highest CAD value
              const maxCadValue = Math.max(...output.results.map((r) => r.cadValue));
              expect(output.bestCard!.cadValue).toBe(maxCadValue);
            } else {
              expect(output.bestCard).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty portfolio gracefully', () => {
      fc.assert(
        fc.property(categoryArb, amountArb, (category: SpendingCategory, amount: number) => {
          const input: CalculatorInput = {
            category,
            amount,
            portfolioCardIds: [],
          };

          const output = calculateRewards(input, [], new Map());

          expect(output.results).toHaveLength(0);
          expect(output.bestCard).toBeNull();
          expect(output.category).toBe(category);
          expect(output.amount).toBe(amount);
        }),
        { numRuns: 100 }
      );
    });
  });
});
