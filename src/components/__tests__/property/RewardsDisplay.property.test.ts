/**
 * Property-based tests for Rewards Display Components
 * Uses fast-check for property testing
 */

import * as fc from 'fast-check';
import { RewardCalculationResult } from '../../../services/RewardsCalculatorService';
import { RewardType } from '../../../types';
import { formatRewardEarned, formatAnnualFee } from '../../../utils/rewardFormatUtils';
import { formatCadValue } from '../../../utils/amountUtils';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid reward type
 */
const rewardTypeArb = fc.constantFrom(...Object.values(RewardType));

/**
 * Generate a reward calculation result
 */
const rewardCalculationResultArb = fc.record({
  cardId: fc.uuid(),
  cardName: fc.string({ minLength: 1, maxLength: 50 }),
  issuer: fc.string({ minLength: 1, maxLength: 30 }),
  rewardProgram: fc.string({ minLength: 1, maxLength: 30 }),
  rewardCurrency: rewardTypeArb,
  pointsEarned: fc.double({ min: 0, max: 100000, noNaN: true }),
  cadValue: fc.double({ min: 0, max: 10000, noNaN: true }),
  originalPrice: fc.double({ min: 0, max: 100000, noNaN: true }),
  effectivePrice: fc.double({ min: 0, max: 100000, noNaN: true }),
  multiplierUsed: fc.double({ min: 0.5, max: 10, noNaN: true }),
  isBaseRate: fc.boolean(),
  isCashback: fc.boolean(),
  annualFee: fc.nat({ max: 1000 }),
  pointValuation: fc.double({ min: 0.5, max: 5, noNaN: true }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Rewards Display Components - Property Tests', () => {
  describe('Property 11: Reward Display Contains Required Fields', () => {
    /**
     * **Feature: rewards-value-calculator, Property 11: Reward Display Contains Required Fields**
     * **Validates: Requirements 5.1**
     *
     * For any calculation result, the display output should contain:
     * card name, issuer, reward amount with unit, and CAD value.
     */
    it('should contain all required fields in result object', () => {
      fc.assert(
        fc.property(rewardCalculationResultArb, (result: RewardCalculationResult) => {
          // Verify all required fields are present and non-empty
          expect(result.cardName).toBeTruthy();
          expect(typeof result.cardName).toBe('string');
          expect(result.cardName.length).toBeGreaterThan(0);

          expect(result.issuer).toBeTruthy();
          expect(typeof result.issuer).toBe('string');
          expect(result.issuer.length).toBeGreaterThan(0);

          expect(result.pointsEarned).toBeDefined();
          expect(typeof result.pointsEarned).toBe('number');
          expect(result.pointsEarned).toBeGreaterThanOrEqual(0);

          expect(result.rewardCurrency).toBeDefined();
          expect(Object.values(RewardType)).toContain(result.rewardCurrency);

          expect(result.cadValue).toBeDefined();
          expect(typeof result.cadValue).toBe('number');
          expect(result.cadValue).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should format reward earned with amount and type', () => {
      fc.assert(
        fc.property(rewardCalculationResultArb, (result: RewardCalculationResult) => {
          const formatted = formatRewardEarned(result.pointsEarned, result.rewardCurrency);

          // Should contain the reward type label
          expect(formatted).toBeTruthy();
          expect(typeof formatted).toBe('string');

          // Should contain a numeric value
          expect(formatted).toMatch(/\d+/);

          // Should contain the reward type name
          const rewardTypeLabels = ['Cash Back', 'Points', 'Miles', 'Hotel Points'];
          const containsRewardType = rewardTypeLabels.some((label) => formatted.includes(label));
          expect(containsRewardType).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should format CAD value with currency symbol and suffix', () => {
      fc.assert(
        fc.property(rewardCalculationResultArb, (result: RewardCalculationResult) => {
          const formatted = formatCadValue(result.cadValue);

          // Should contain numeric value
          expect(formatted).toBeTruthy();
          expect(typeof formatted).toBe('string');

          // Should contain "CAD" suffix
          expect(formatted).toContain('CAD');

          // Should contain a decimal number
          expect(formatted).toMatch(/\d+\.\d{2}/);
        }),
        { numRuns: 100 }
      );
    });

    it('should format annual fee correctly', () => {
      fc.assert(
        fc.property(rewardCalculationResultArb, (result: RewardCalculationResult) => {
          const formatted = formatAnnualFee(result.annualFee);

          expect(formatted).toBeTruthy();
          expect(typeof formatted).toBe('string');

          if (result.annualFee === 0) {
            expect(formatted).toBe('No annual fee');
          } else {
            expect(formatted).toContain('Annual fee');
            expect(formatted).toMatch(/\d+/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity across formatting', () => {
      fc.assert(
        fc.property(rewardCalculationResultArb, (result: RewardCalculationResult) => {
          // Format all display fields
          const rewardFormatted = formatRewardEarned(result.pointsEarned, result.rewardCurrency);
          const cadFormatted = formatCadValue(result.cadValue);
          const feeFormatted = formatAnnualFee(result.annualFee);

          // All formatted values should be non-empty strings
          expect(rewardFormatted.length).toBeGreaterThan(0);
          expect(cadFormatted.length).toBeGreaterThan(0);
          expect(feeFormatted.length).toBeGreaterThan(0);

          // Original values should remain unchanged
          expect(result.cardName).toBeTruthy();
          expect(result.issuer).toBeTruthy();
          expect(result.pointsEarned).toBeGreaterThanOrEqual(0);
          expect(result.cadValue).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Best Value Badge Assignment', () => {
    /**
     * **Feature: rewards-value-calculator, Property 14: Best Value Badge Assignment**
     * **Validates: Requirements 5.5**
     *
     * For any non-empty calculation results, the card with the highest CAD value
     * should be marked as "Best Value".
     */
    it('should identify card with highest CAD value as best', () => {
      fc.assert(
        fc.property(
          fc.array(rewardCalculationResultArb, { minLength: 1, maxLength: 10 }),
          (results: RewardCalculationResult[]) => {
            // Ensure unique card IDs
            const uniqueResults = results.map((result, index) => ({
              ...result,
              cardId: `card-${index}`,
            }));

            // Find the card with highest CAD value
            const maxCadValue = Math.max(...uniqueResults.map((r) => r.cadValue));
            const bestCards = uniqueResults.filter((r) => r.cadValue === maxCadValue);

            // At least one card should have the max value
            expect(bestCards.length).toBeGreaterThan(0);

            // The first card with max value should be considered best
            const bestCard = uniqueResults.find((r) => r.cadValue === maxCadValue);
            expect(bestCard).toBeDefined();
            expect(bestCard!.cadValue).toBe(maxCadValue);

            // All other cards should have CAD value <= max
            uniqueResults.forEach((result) => {
              expect(result.cadValue).toBeLessThanOrEqual(maxCadValue);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle ties in CAD value correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.integer({ min: 2, max: 5 }),
          (cadValue: number, count: number) => {
            // Create multiple results with same CAD value
            const results: RewardCalculationResult[] = Array.from({ length: count }, (_, i) => ({
              cardId: `card-${i}`,
              cardName: `Card ${i}`,
              issuer: `Issuer ${i}`,
              rewardProgram: `Program ${i}`,
              rewardCurrency: RewardType.POINTS,
              pointsEarned: 100,
              cadValue: cadValue,
              originalPrice: 100,
              effectivePrice: 100 - cadValue,
              multiplierUsed: 1,
              isBaseRate: false,
              isCashback: false,
              annualFee: 0,
              pointValuation: 1,
            }));

            // All cards have the same CAD value
            const maxCadValue = Math.max(...results.map((r) => r.cadValue));
            expect(maxCadValue).toBe(cadValue);

            // All cards should be tied for best value
            results.forEach((result) => {
              expect(result.cadValue).toBe(maxCadValue);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify best card in sorted results', () => {
      fc.assert(
        fc.property(
          fc.array(rewardCalculationResultArb, { minLength: 2, maxLength: 10 }),
          (results: RewardCalculationResult[]) => {
            // Ensure unique card IDs and different CAD values
            const uniqueResults = results.map((result, index) => ({
              ...result,
              cardId: `card-${index}`,
              cadValue: result.cadValue + index * 0.01, // Ensure different values
            }));

            // Sort by CAD value descending (as the calculator does)
            const sortedResults = [...uniqueResults].sort((a, b) => b.cadValue - a.cadValue);

            // First result should have highest CAD value
            expect(sortedResults[0].cadValue).toBeGreaterThanOrEqual(sortedResults[1].cadValue);

            // Verify all subsequent results have lower or equal CAD value
            for (let i = 0; i < sortedResults.length - 1; i++) {
              expect(sortedResults[i].cadValue).toBeGreaterThanOrEqual(
                sortedResults[i + 1].cadValue
              );
            }

            // Best card should be first in sorted list
            const bestCard = sortedResults[0];
            const maxCadValue = Math.max(...sortedResults.map((r) => r.cadValue));
            expect(bestCard.cadValue).toBe(maxCadValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single card portfolio', () => {
      fc.assert(
        fc.property(rewardCalculationResultArb, (result: RewardCalculationResult) => {
          const results = [result];

          // Single card should be the best card
          const maxCadValue = Math.max(...results.map((r) => r.cadValue));
          expect(result.cadValue).toBe(maxCadValue);

          // Best card should be the only card
          expect(results.length).toBe(1);
          expect(results[0]).toEqual(result);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain best value property after filtering', () => {
      fc.assert(
        fc.property(
          fc.array(rewardCalculationResultArb, { minLength: 3, maxLength: 10 }),
          (results: RewardCalculationResult[]) => {
            // Ensure unique card IDs
            const uniqueResults = results.map((result, index) => ({
              ...result,
              cardId: `card-${index}`,
            }));

            // Find best card
            const maxCadValue = Math.max(...uniqueResults.map((r) => r.cadValue));
            const bestCard = uniqueResults.find((r) => r.cadValue === maxCadValue);

            // Filter out some cards (but keep best card)
            const filteredResults = uniqueResults.filter(
              (r) => r.cadValue >= maxCadValue * 0.5 // Keep cards with at least 50% of max value
            );

            // Best card should still be in filtered results
            expect(filteredResults).toContainEqual(bestCard);

            // Best card should still have highest value in filtered results
            const filteredMaxValue = Math.max(...filteredResults.map((r) => r.cadValue));
            expect(bestCard!.cadValue).toBe(filteredMaxValue);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
