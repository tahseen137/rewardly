/**
 * Property-based tests for amountUtils
 * Uses fast-check for property testing
 */

import * as fc from 'fast-check';
import { validateAmount, formatCurrency, formatCadValue } from '../../amountUtils';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid positive amount (greater than 0)
 */
const validAmountArb = fc.double({ min: 0.01, max: 1000000, noNaN: true, noDefaultInfinity: true });

/**
 * Generate an invalid amount (negative, zero, NaN, or Infinity)
 */
const invalidAmountArb = fc.oneof(
  fc.constant(0), // Zero
  fc.double({ min: -1000000, max: -0.01, noNaN: true }), // Negative
  fc.constant(NaN), // NaN
  fc.constant(Infinity), // Infinity
  fc.constant(-Infinity) // -Infinity
);

/**
 * Generate invalid string inputs
 */
const invalidStringArb = fc.oneof(
  fc.constant(''), // Empty string
  fc.constant('abc'), // Non-numeric
  fc.constant('12.34.56'), // Invalid format
  fc.constant('$100'), // Currency symbol
  fc.constant('100 CAD'), // With text
  fc.constant('  '), // Whitespace only
  fc.constant('1e1000') // Overflow to Infinity
);

// ============================================================================
// Property Tests
// ============================================================================

describe('amountUtils - Property Tests', () => {
  describe('Property 4: Valid Amount Acceptance', () => {
    /**
     * **Feature: rewards-value-calculator, Property 4: Valid Amount Acceptance**
     * **Validates: Requirements 3.1**
     *
     * For any positive numeric value, the amount input should accept it without validation errors.
     */
    it('should accept all positive numeric values', () => {
      fc.assert(
        fc.property(validAmountArb, (amount: number) => {
          const result = validateAmount(amount);

          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
          expect(result.value).toBe(amount);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept positive numeric strings', () => {
      fc.assert(
        fc.property(validAmountArb, (amount: number) => {
          const amountString = amount.toString();
          const result = validateAmount(amountString);

          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
          expect(result.value).toBeCloseTo(amount, 10);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve the numeric value in validation result', () => {
      fc.assert(
        fc.property(validAmountArb, (amount: number) => {
          const result = validateAmount(amount);

          expect(result.value).not.toBeNull();
          expect(result.value).toBeCloseTo(amount, 10);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept very small positive amounts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.000001, max: 0.01, noNaN: true }),
          (amount: number) => {
            const result = validateAmount(amount);

            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept very large positive amounts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1000000, max: 10000000, noNaN: true }),
          (amount: number) => {
            const result = validateAmount(amount);

            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Invalid Amount Rejection', () => {
    /**
     * **Feature: rewards-value-calculator, Property 6: Invalid Amount Rejection**
     * **Validates: Requirements 3.3**
     *
     * For any invalid input (negative numbers, zero, or non-numeric strings),
     * the calculator should return a validation error.
     */
    it('should reject invalid numeric amounts', () => {
      fc.assert(
        fc.property(invalidAmountArb, (amount: number) => {
          const result = validateAmount(amount);

          expect(result.isValid).toBe(false);
          expect(result.error).not.toBeNull();
          expect(result.error).toBeTruthy();
          expect(result.value).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid string inputs', () => {
      fc.assert(
        fc.property(invalidStringArb, (input: string) => {
          const result = validateAmount(input);

          expect(result.isValid).toBe(false);
          expect(result.error).not.toBeNull();
          expect(result.error).toBeTruthy();
          expect(result.value).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject null and undefined', () => {
      const nullResult = validateAmount(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.error).not.toBeNull();

      const undefinedResult = validateAmount(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.error).not.toBeNull();
    });

    it('should provide meaningful error messages', () => {
      fc.assert(
        fc.property(invalidAmountArb, (amount: number) => {
          const result = validateAmount(amount);

          expect(result.error).toBeTruthy();
          expect(typeof result.error).toBe('string');
          expect(result.error!.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should specifically reject zero with appropriate message', () => {
      const result = validateAmount(0);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than zero');
    });

    it('should specifically reject negative amounts with appropriate message', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000000, max: -0.01, noNaN: true }),
          (amount: number) => {
            const result = validateAmount(amount);

            expect(result.isValid).toBe(false);
            expect(result.error).toContain('positive');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Currency Formatting', () => {
    /**
     * **Feature: rewards-value-calculator, Property 5: Currency Formatting**
     * **Validates: Requirements 3.2**
     *
     * For any valid numeric amount, the formatted output should match the pattern
     * "$X.XX" with exactly two decimal places.
     */
    it('should format all amounts with exactly two decimal places', () => {
      fc.assert(
        fc.property(validAmountArb, (amount: number) => {
          const formatted = formatCurrency(amount);

          // Should start with $
          expect(formatted).toMatch(/^\$/);

          // Should have exactly two decimal places
          expect(formatted).toMatch(/^\$\d+\.\d{2}$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should format zero correctly', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBe('$0.00');
    });

    it('should round to two decimal places', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.001, max: 1000, noNaN: true }),
          (amount: number) => {
            const formatted = formatCurrency(amount);
            const expectedValue = amount.toFixed(2);

            expect(formatted).toBe(`$${expectedValue}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whole numbers correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (amount: number) => {
          const formatted = formatCurrency(amount);

          expect(formatted).toBe(`$${amount}.00`);
        }),
        { numRuns: 100 }
      );
    });

    it('should format large amounts correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1000000, max: 10000000, noNaN: true }),
          (amount: number) => {
            const formatted = formatCurrency(amount);

            // Should still have exactly two decimal places
            expect(formatted).toMatch(/^\$\d+\.\d{2}$/);

            // Should preserve the value
            const numericPart = formatted.substring(1);
            expect(parseFloat(numericPart)).toBeCloseTo(amount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: CAD Value Formatting', () => {
    /**
     * **Feature: rewards-value-calculator, Property 13: CAD Value Formatting**
     * **Validates: Requirements 5.3**
     *
     * For any CAD value, the formatted output should match the pattern "$X.XX CAD".
     */
    it('should format all CAD values with exactly two decimal places and CAD suffix', () => {
      fc.assert(
        fc.property(validAmountArb, (amount: number) => {
          const formatted = formatCadValue(amount);

          // Should start with $ and end with " CAD"
          expect(formatted).toMatch(/^\$/);
          expect(formatted).toMatch(/ CAD$/);

          // Should have exactly two decimal places
          expect(formatted).toMatch(/^\$\d+\.\d{2} CAD$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should format zero CAD value correctly', () => {
      const formatted = formatCadValue(0);
      expect(formatted).toBe('$0.00 CAD');
    });

    it('should round CAD values to two decimal places', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.001, max: 1000, noNaN: true }),
          (amount: number) => {
            const formatted = formatCadValue(amount);
            const expectedValue = amount.toFixed(2);

            expect(formatted).toBe(`$${expectedValue} CAD`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whole CAD numbers correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (amount: number) => {
          const formatted = formatCadValue(amount);

          expect(formatted).toBe(`$${amount}.00 CAD`);
        }),
        { numRuns: 100 }
      );
    });

    it('should format large CAD amounts correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1000000, max: 10000000, noNaN: true }),
          (amount: number) => {
            const formatted = formatCadValue(amount);

            // Should still have exactly two decimal places and CAD suffix
            expect(formatted).toMatch(/^\$\d+\.\d{2} CAD$/);

            // Should preserve the value
            const numericPart = formatted.substring(1, formatted.length - 4);
            expect(parseFloat(numericPart)).toBeCloseTo(amount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should differ from formatCurrency by having CAD suffix', () => {
      fc.assert(
        fc.property(validAmountArb, (amount: number) => {
          const currencyFormatted = formatCurrency(amount);
          const cadFormatted = formatCadValue(amount);

          expect(cadFormatted).toBe(`${currencyFormatted} CAD`);
        }),
        { numRuns: 100 }
      );
    });
  });
});
