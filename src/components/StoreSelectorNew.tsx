/**
 * StoreSelector - Redesigned to match web version
 * Simpler layout with search and popular stores grid
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Store, SpendingCategory } from '../types';
import { searchStores, getAllStores } from '../services/StoreDataService';

interface StoreSelectorProps {
  selectedStore: Store | null;
  onStoreSelect: (store: Store | null) => void;
  onCategoryChange: (category: SpendingCategory) => void;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  selectedStore,
  onStoreSelect,
  onCategoryChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allStores = getAllStores();

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return allStores.slice(0, 6); // Show first 6 stores
    const results = searchStores(searchQuery);
    return results.slice(0, 6);
  }, [searchQuery, allStores]);

  const handleStoreSelect = (store: Store) => {
    onStoreSelect(store);
    onCategoryChange(store.category);
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearStore = () => {
    onStoreSelect(null);
    setSearchQuery('');
  };

  // If a store is selected and not in search mode, show selected state
  if (selectedStore && !isOpen) {
    return (
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedLabel}>Store:</Text>
        <Text style={styles.selectedName}>{selectedStore.name}</Text>
        <TouchableOpacity
          onPress={clearStore}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear selected store"
        >
          <X size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search
          size={16}
          color={colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search stores (optional)"
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={styles.searchInput}
          accessibilityLabel="Search for stores"
        />
      </View>

      {/* Store Grid */}
      {isOpen && (
        <View style={styles.gridContainer}>
          {filteredStores.map((store) => (
            <TouchableOpacity
              key={store.id}
              onPress={() => handleStoreSelect(store)}
              style={styles.storeItem}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Select ${store.name}`}
            >
              <Text style={styles.storeText} numberOfLines={2}>
                {store.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  // Selected store display
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: borderRadius.md, // rounded-lg
    backgroundColor: colors.background.tertiary, // secondary
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectedLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  selectedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search input
  searchContainer: {
    position: 'relative',
    height: 44,
    backgroundColor: colors.background.tertiary, // secondary
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 32, // Make space for icon (12px left + 16px icon + 4px gap)
    fontSize: 15,
    color: colors.text.primary,
  },
  // Store grid (3 columns)
  gridContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Negative margin for gap effect
  },
  storeItem: {
    width: '31%', // ~31% for 3 columns with gaps
    margin: '1%', // 1% margin = 2% gap between items
    minHeight: 50,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: colors.text.primary,
  },
});

export default StoreSelector;
