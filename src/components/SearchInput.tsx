/**
 * SearchInput - Specialized input for search functionality
 */

import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  containerStyle?: ViewStyle;
  showClearButton?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  onClear,
  onSubmit,
  placeholder,
  containerStyle,
  showClearButton = true,
  ...props
}: SearchInputProps) {
  const theme = useTheme();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.card,
          ...theme.shadows.sm,
        },
        containerStyle,
      ]}
    >
      <Text style={[styles.searchIcon, { color: theme.colors.text.tertiary }]}>🔍</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text.primary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        {...props}
      />
      {showClearButton && value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Text style={[styles.clearIcon, { color: theme.colors.text.tertiary }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearIcon: {
    fontSize: 16,
  },
});

export default SearchInput;
