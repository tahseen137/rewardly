/**
 * AmountInput - Numeric input with currency formatting for purchase amounts
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from './Input';
import { validateAmount, formatCurrency } from '../utils/amountUtils';
import { useTheme } from '../theme';

interface AmountInputProps {
  value: number | null;
  onChange: (amount: number | null) => void;
  error?: string | null;
  label?: string;
  placeholder?: string;
}

export function AmountInput({
  value,
  onChange,
  error: externalError,
  label = 'Purchase Amount',
  placeholder = 'Enter amount',
}: AmountInputProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState<string>('');
  const [internalError, setInternalError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Initialize input value from prop
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setInputValue(formatCurrency(value));
    } else if (value === null) {
      setInputValue('');
    }
  }, [value]);

  // Debounced validation and onChange
  const handleChangeText = useCallback(
    (text: string) => {
      setInputValue(text);

      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer for debounced validation
      const timer = setTimeout(() => {
        const validation = validateAmount(text);
        
        if (validation.isValid && validation.value !== null) {
          setInternalError(null);
          onChange(validation.value);
        } else {
          setInternalError(validation.error);
          onChange(null);
        }
      }, 500); // 500ms debounce

      setDebounceTimer(timer);
    },
    [debounceTimer, onChange]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Use external error if provided, otherwise use internal error
  const displayError = externalError || internalError;

  return (
    <View style={styles.container}>
      <Input
        label={label}
        value={inputValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        error={displayError || undefined}
        leftIcon={
          <Text style={[styles.currencySymbol, { color: theme.colors.text.secondary }]}>
            $
          </Text>
        }
        accessibilityLabel={label}
        accessibilityHint="Enter the purchase amount in Canadian dollars"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AmountInput;
