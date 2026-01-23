/**
 * Property-based tests for rewardFormatUtils
 * Uses fast-check for property testing
 */

import * as fc from 'fast-check';
import { formatRewardEarned, formatAnnualFee } from '../../rewardFormatUtils';
import { RewardType } from '../../../types';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid reward amount (positive number)
 */
const rewardAmountArb = fc.double({ min: 0.01, max: 1000000, noNaN: true, noDefaultInfinity: true });

/**
 * Generate a RewardType enum value
 */
const rewardTypeArb = fc.constantFrom(
  RewardType.CASHBACK,
  RewardType.POINTS,
  RewardType.AIRLINE_MILES,
  RewardType.HOTEL_POINTS
);

/**
 * Generate a valid annual fee (0 or positive)
 */
const annualFeeArb = fc.oneof(
  fc.constant(0),
  fc.integer({ min: 1, max: 10000 })
);

// ============================================================================
// Property Tests
// ============================================================================

describe('rewardFormatUtils - Property Tests', () => {
  describe('Property 12: Reward Amount Formatting', () => {
    /**
     * **Feature: rewards-value-calculator, Property 12: Reward Amount Formatting**
     * **Validates: Requirements 5.2**
     *
     * For any reward calculation result, the reward earned should be formatted as
     * "[amount] [reward_type]" (e.g., "150 Aeroplan Miles").
     */
    it('should format all reward amounts with correct pattern', () => {
      fc.assert(
        fc.property(rewardAmountArb, rewardTypeArb, (amount: number, rewardType: RewardType) => {
          const formatted = formatRewardEarned(amount, rewardType);

          // Should contain a space separating amount and type
          expect(formatted).toMatch(/^[\d.]+ .+$/);

          // Should end with the reward type label
          const expectedLabels = ['Cash Back', 'Points', 'Miles', 'Hotel Points'];
          const endsWithLabel = expectedLabels.some(label => formatted.endsWith(label));
          expect(endsWithLabel).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should format cashback with two decimal places', () => {
      fc.assert(
        fc.property(rewardAmountArb, (amount: number) => {
          const formatted = formatRewardEarned(amount, RewardType.CASHBACK);

          // Should have exactly two decimal places for cashback
          expect(formatted).toMatch(/^\d+\.\d{2} Cash Back$/);

          // Extract the numeric part and verify it matches the amount
          const numericPart = formatted.split(' ')[0];
          expect(parseFloat(numericPart)).toBeCloseTo(amount, 2);
        }),
        { numRuns: 100 }
      );
    });

    it('should format points as whole numbers', () => {
      fc.assert(
        fc.property(rewardAmountArb, (amount: number) => {
          const formatted = formatRewardEarned(amount, RewardType.POINTS);

          // Should not have decimal places for points
          expect(formatted).toMatch(/^\d+ Points$/);

          // Extract the numeric part and verify it's rounded
          const numericPart = formatted.split(' ')[0];
          expect(parseInt(numericPart, 10)).toBe(Math.round(amount));
        }),
        { numRuns: 100 }
      );
    });

    it('should format airline miles as whole numbers', () => {
      fc.assert(
        fc.property(rewardAmountArb, (amount: number) => {
          const formatted = formatRewardEarned(amount, RewardType.AIRLINE_MILES);

          // Should not have decimal places for miles
          expect(formatted).toMatch(/^\d+ Miles$/);

          // Extract the numeric part and verify it's rounded
          const numericPart = formatted.split(' ')[0];
          expect(parseInt(numericPart, 10)).toBe(Math.round(amount));
        }),
        { numRuns: 100 }
      );
    });

    it('should format hotel points as whole numbers', () => {
      fc.assert(
        fc.property(rewardAmountArb, (amount: number) => {
          const formatted = formatRewardEarned(amount, RewardType.HOTEL_POINTS);

          // Should not have decimal places for hotel points
          expect(formatted).toMatch(/^\d+ Hotel Points$/);

          // Extract the numeric part and verify it's rounded
          const numericPart = formatted.split(' ')[0];
          expect(parseInt(numericPart, 10)).toBe(Math.round(amount));
        }),
        { numRuns: 100 }
      );
    });

    it('should handle zero amounts correctly', () => {
      const rewardTypes = [
        RewardType.CASHBACK,
        RewardType.POINTS,
        RewardType.AIRLINE_MILES,
        RewardType.HOTEL_POINTS,
      ];

      rewardTypes.forEach(rewardType => {
        const formatted = formatRewardEarned(0, rewardType);

        // Should format zero appropriately
        expect(formatted).toMatch(/^0(\.00)? .+$/);
      });
    });

    it('should handle very large amounts correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1000000, max: 10000000, noNaN: true }),
          rewardTypeArb,
          (amount: number, rewardType: RewardType) => {
            const formatted = formatRewardEarned(amount, rewardType);

            // Should still follow the pattern
            expect(formatted).toMatch(/^[\d.]+ .+$/);

            // Should contain the reward type label
            const expectedLabels = ['Cash Back', 'Points', 'Miles', 'Hotel Points'];
            const endsWithLabel = expectedLabels.some(label => formatted.endsWith(label));
            expect(endsWithLabel).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle very small amounts correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1, noNaN: true }),
          rewardTypeArb,
          (amount: number, rewardType: RewardType) => {
            const formatted = formatRewardEarned(amount, rewardType);

            // Should still follow the pattern
            expect(formatted).toMatch(/^[\d.]+ .+$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce consistent output for the same inputs', () => {
      fc.assert(
        fc.property(rewardAmountArb, rewardTypeArb, (amount: number, rewardType: RewardType) => {
          const formatted1 = formatRewardEarned(amount, rewardType);
          const formatted2 = formatRewardEarned(amount, rewardType);

          expect(formatted1).toBe(formatted2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Annual Fee Display', () => {
    /**
     * **Feature: rewards-value-calculator, Property 15: Annual Fee Display**
     * **Validates: Requirements 6.1**
     *
     * For any card with a non-zero annual fee, the display should show
     * "Annual fee: $X" with the correct amount.
     */
    it('should format non-zero annual fees with correct pattern', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (fee: number) => {
            const formatted = formatAnnualFee(fee);

            // Should match the pattern "Annual fee: $X"
            expect(formatted).toMatch(/^Annual fee: \$\d+$/);

            // Extract the numeric part and verify it matches
            const numericPart = formatted.replace('Annual fee: $', '');
            expect(parseInt(numericPart, 10)).toBe(fee);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display "No annual fee" for zero fee', () => {
      const formatted = formatAnnualFee(0);
      expect(formatted).toBe('No annual fee');
    });

    it('should display "No annual fee" for undefined fee', () => {
      const formatted = formatAnnualFee(undefined);
      expect(formatted).toBe('No annual fee');
    });

    it('should handle all annual fee values consistently', () => {
      fc.assert(
        fc.property(annualFeeArb, (fee: number) => {
          const formatted = formatAnnualFee(fee);

          if (fee === 0) {
            expect(formatted).toBe('No annual fee');
          } else {
            expect(formatted).toMatch(/^Annual fee: \$\d+$/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should format common annual fee amounts correctly', () => {
      const commonFees = [0, 50, 95, 120, 150, 399, 499, 599];

      commonFees.forEach(fee => {
        const formatted = formatAnnualFee(fee);

        if (fee === 0) {
          expect(formatted).toBe('No annual fee');
        } else {
          expect(formatted).toBe(`Annual fee: $${fee}`);
        }
      });
    });

    it('should produce consistent output for the same fee', () => {
      fc.assert(
        fc.property(annualFeeArb, (fee: number) => {
          const formatted1 = formatAnnualFee(fee);
          const formatted2 = formatAnnualFee(fee);

          expect(formatted1).toBe(formatted2);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle very large annual fees', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          (fee: number) => {
            const formatted = formatAnnualFee(fee);

            expect(formatted).toMatch(/^Annual fee: \$\d+$/);
            expect(formatted).toBe(`Annual fee: $${fee}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should differentiate between zero and non-zero fees', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (fee: number) => {
            const zeroFormatted = formatAnnualFee(0);
            const nonZeroFormatted = formatAnnualFee(fee);

            expect(zeroFormatted).not.toBe(nonZeroFormatted);
            expect(zeroFormatted).toBe('No annual fee');
            expect(nonZeroFormatted).toContain('Annual fee:');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
