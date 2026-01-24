/**
 * CategoryGrid Component
 *
 * 4-column grid layout for category selection
 * Replaces the old CategoryPicker with a modern grid design
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

export type CategoryType =
  | 'groceries'
  | 'dining'
  | 'gas'
  | 'travel'
  | 'online'
  | 'entertainment'
  | 'pharmacy'
  | 'homeImprovement'
  | 'other';

interface Category {
  id: CategoryType;
  label: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'dining', label: 'Dining', icon: '🍽️' },
  { id: 'gas', label: 'Gas', icon: '⛽' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'online', label: 'Online', icon: '🛍️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { id: 'homeImprovement', label: 'Home', icon: '🏠' },
  { id: 'other', label: 'Other', icon: '📦' },
];

interface CategoryGridProps {
  selectedCategory: CategoryType | null;
  onCategorySelect: (category: CategoryType) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;

        return (
          <Animated.View
            key={category.id}
            style={[
              styles.itemWrapper,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.item,
                isSelected ? styles.itemSelected : styles.itemUnselected,
              ]}
              onPress={() => onCategorySelect(category.id)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Select ${category.label} category`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.icon}>{category.icon}</Text>
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
                numberOfLines={2}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Negative margin to account for item margins
  },
  itemWrapper: {
    width: '23%', // ~23% width for 4 columns with gaps
    margin: '1%', // 1% margin = 2% gap between items
  },
  item: {
    aspectRatio: 1, // Square items
    borderRadius: borderRadius.md, // 12px
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  itemSelected: {
    backgroundColor: colors.primary.bg20, // primary/20
    borderColor: colors.primary.main,
  },
  itemUnselected: {
    backgroundColor: colors.background.muted,
    borderColor: 'transparent',
  },
  icon: {
    fontSize: 28, // Large emoji
    marginBottom: 4,
  },
  label: {
    fontSize: 10, // Small text
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  labelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default CategoryGrid;
