/**
 * StoreSelector - Searchable dropdown for store selection
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SearchInput } from './SearchInput';
import { Card } from './Card';
import { Button } from './Button';
import { useTheme } from '../theme';
import { Store, SpendingCategory } from '../types';
import { searchStores } from '../services/StoreDataService';

interface StoreSelectorProps {
  onStoreSelect: (store: Store) => void;
  onCategorySelect: (category: SpendingCategory) => void;
  selectedStore: Store | null;
  selectedCategory: SpendingCategory | null;
  label?: string;
  placeholder?: string;
}

export function StoreSelector({
  onStoreSelect,
  onCategorySelect,
  selectedStore,
  selectedCategory,
  label = 'Select Store',
  placeholder = 'Search for a store...',
}: StoreSelectorProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Store[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);

  // Update suggestions when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setShowNoResults(false);
    } else {
      const results = searchStores(searchQuery);
      setSuggestions(results.slice(0, 10)); // Limit to 10 suggestions
      
      // Show "no results" if user has typed enough and no matches
      setShowNoResults(searchQuery.length >= 3 && results.length === 0);
    }
  }, [searchQuery]);

  const handleStoreSelect = (store: Store) => {
    onStoreSelect(store);
    setSearchQuery('');
    setSuggestions([]);
    setIsDropdownVisible(false);
    setShowNoResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowNoResults(false);
  };

  const handleClearSelection = () => {
    onStoreSelect(null as any);
    setSearchQuery('');
  };

  const getCategoryLabel = (category: SpendingCategory): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryIcon = (category: SpendingCategory): string => {
    const icons: Record<SpendingCategory, string> = {
      [SpendingCategory.GROCERIES]: '🛒',
      [SpendingCategory.DINING]: '🍽️',
      [SpendingCategory.GAS]: '⛽',
      [SpendingCategory.TRAVEL]: '✈️',
      [SpendingCategory.ONLINE_SHOPPING]: '🛍️',
      [SpendingCategory.ENTERTAINMENT]: '🎬',
      [SpendingCategory.DRUGSTORES]: '💊',
      [SpendingCategory.HOME_IMPROVEMENT]: '🔨',
      [SpendingCategory.OTHER]: '📦',
    };
    return icons[category] || '📦';
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{label}</Text>
      )}

      {/* Selected Store Display */}
      {selectedStore ? (
        <Card variant="outlined" padding="medium" style={styles.selectedCard}>
          <View style={styles.selectedStoreContainer}>
            <View style={styles.selectedStoreInfo}>
              <Text style={[styles.selectedStoreName, { color: theme.colors.text.primary }]}>
                {selectedStore.name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(selectedStore.category)}</Text>
                <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
                  {getCategoryLabel(selectedStore.category)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClearSelection}
              style={styles.clearButton}
              accessibilityLabel="Clear store selection"
              accessibilityRole="button"
            >
              <Text style={[styles.clearIcon, { color: theme.colors.text.tertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <>
          {/* Search Input */}
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={handleClear}
            placeholder={placeholder}
            onFocus={() => setIsDropdownVisible(true)}
          />

          {/* Suggestions Dropdown */}
          {isDropdownVisible && (suggestions.length > 0 || showNoResults) && (
            <Modal
              visible={isDropdownVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setIsDropdownVisible(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setIsDropdownVisible(false)}
              >
                <View
                  style={[
                    styles.dropdownContainer,
                    {
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border.light,
                      ...theme.shadows.card,
                    },
                  ]}
                >
                  {suggestions.length > 0 ? (
                    <FlatList
                      data={suggestions}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.suggestionItem,
                            { borderBottomColor: theme.colors.border.light },
                          ]}
                          onPress={() => handleStoreSelect(item)}
                          accessibilityLabel={`Select ${item.name}`}
                          accessibilityRole="button"
                        >
                          <View style={styles.suggestionContent}>
                            <Text style={[styles.storeName, { color: theme.colors.text.primary }]}>
                              {item.name}
                            </Text>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
                              <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
                                {getCategoryLabel(item.category)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )}
                      style={styles.suggestionsList}
                      keyboardShouldPersistTaps="handled"
                    />
                  ) : showNoResults ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={[styles.noResultsText, { color: theme.colors.text.secondary }]}>
                        Store not found
                      </Text>
                      <Text style={[styles.noResultsSubtext, { color: theme.colors.text.tertiary }]}>
                        Try selecting a category manually instead
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            </Modal>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectedCard: {
    marginTop: 0,
  },
  selectedStoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedStoreInfo: {
    flex: 1,
  },
  selectedStoreName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
  },
  clearButton: {
    padding: 8,
  },
  clearIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '90%',
    maxHeight: 400,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 400,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionContent: {
    flexDirection: 'column',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StoreSelector;
