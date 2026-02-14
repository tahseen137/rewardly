/**
 * AmountInput - Numeric input with currency formatting for purchase amounts
 * Redesigned to match web - larger sizing, lucide icons
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import { validateAmount, formatCurrency } from '../utils/amountUtils';
import { useTheme } from '../theme';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

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
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Only sync from prop when NOT focused (prevents overwriting user input)
  useEffect(() => {
    if (!isFocused) {
      if (value !== null && value !== undefined) {
        // Format for display when not focused (without $ prefix since icon shows it)
        setInputValue(value.toFixed(2));
      } else if (value === null) {
        setInputValue('');
      }
    }
  }, [value, isFocused]);

  // Handle focus - switch to raw input mode
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Remove formatting when user focuses (strip non-numeric except decimal)
    const numericValue = inputValue.replace(/[^0-9.]/g, '');
    setInputValue(numericValue);
  }, [inputValue]);

  // Handle blur - format the display value
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Validate and format when user leaves the field
    const validation = validateAmount(inputValue);
    if (validation.isValid && validation.value !== null) {
      setInputValue(validation.value.toFixed(2));
      setInternalError(null);
      onChange(validation.value);
    } else if (inputValue.trim() === '') {
      setInputValue('');
      setInternalError(null);
      onChange(null);
    }
  }, [inputValue, onChange]);

  // Debounced validation and onChange
  const handleChangeText = useCallback(
    (text: string) => {
      // Strip $ prefix and other non-numeric characters except decimal point
      const cleanText = text.replace(/^\$/, '').replace(/[^0-9.]/g, '');
      setInputValue(cleanText);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced validation
      debounceTimerRef.current = setTimeout(() => {
        const validation = validateAmount(cleanText);
        
        if (validation.isValid && validation.value !== null) {
          setInternalError(null);
          onChange(validation.value);
        } else if (cleanText.trim() === '') {
          setInternalError(null);
          onChange(null);
        } else {
          setInternalError(validation.error);
          onChange(null);
        }
      }, 500); // 500ms debounce
    },
    [onChange]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Use external error if provided, otherwise use internal error
  const displayError = externalError || internalError;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer,
        displayError && styles.inputContainerError
      ]}>
        <DollarSign
          size={20}
          color={colors.text.secondary}
          style={styles.dollarIcon}
        />
        <TextInput
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel={label}
          accessibilityHint="Enter the purchase amount"
        />
      </View>
      {displayError && (
        <Text style={styles.errorText}>
          {displayError}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    height: 56, // h-14 (14 * 4px = 56px)
    backgroundColor: colors.background.tertiary, // secondary
    borderRadius: borderRadius.md, // 12px
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
  },
  inputContainerError: {
    borderColor: colors.error.main,
  },
  dollarIcon: {
    position: 'absolute',
    left: 12,
  },
  input: {
    flex: 1,
    paddingLeft: 40, // Make space for the dollar icon (left: 12px + icon width 20px + 8px gap)
    fontSize: 24, // text-2xl
    fontWeight: '700', // bold
    color: colors.text.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error.main,
    marginTop: 6,
  },
});

export default AmountInput;
