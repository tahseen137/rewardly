/**
 * Amount validation and formatting utilities
 * Handles currency input validation and formatting for the rewards calculator
 */

export interface AmountValidationResult {
  isValid: boolean;
  error: string | null;
  value: number | null;
}

/**
 * Validates a purchase amount input
 * 
 * Requirements:
 * - 3.1: Accept numeric values representing CAD dollars
 * - 3.3: Reject invalid amounts (non-numeric, negative, or zero)
 * 
 * @param input - The input value to validate (string or number)
 * @returns Validation result with isValid flag, error message, and parsed value
 */
export function validateAmount(input: string | number | null | undefined): AmountValidationResult {
  // Handle empty input
  if (input === null || input === undefined || input === '') {
    return {
      isValid: false,
      error: 'Please enter a purchase amount',
      value: null,
    };
  }

  // If string, validate it's purely numeric (with optional decimal point)
  if (typeof input === 'string') {
    // Trim whitespace
    const trimmed = input.trim();
    
    // Check if string is purely numeric (allows optional decimal point and digits)
    // This regex matches: optional minus, digits, optional decimal point with digits
    const numericRegex = /^-?\d+(\.\d+)?$/;
    
    if (!numericRegex.test(trimmed)) {
      return {
        isValid: false,
        error: 'Please enter a valid number',
        value: null,
      };
    }
  }

  // Convert to number if string
  const numValue = typeof input === 'string' ? parseFloat(input) : input;

  // Check if valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return {
      isValid: false,
      error: 'Please enter a valid number',
      value: null,
    };
  }

  // Check if zero
  if (numValue === 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than zero',
      value: null,
    };
  }

  // Check if negative
  if (numValue < 0) {
    return {
      isValid: false,
      error: 'Amount must be positive',
      value: null,
    };
  }

  // Valid amount
  return {
    isValid: true,
    error: null,
    value: numValue,
  };
}

/**
 * Formats a numeric amount as currency in "$X.XX" format
 * 
 * Requirement 3.2: Format amount as currency with exactly two decimal places
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "$100.00")
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Formats a CAD value with currency symbol and "CAD" suffix
 * 
 * Requirement 5.3: Format CAD value as "$X.XX CAD"
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted CAD value string (e.g., "$100.00 CAD")
 */
export function formatCadValue(amount: number): string {
  return `$${amount.toFixed(2)} CAD`;
}
