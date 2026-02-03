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
    marginHorizontal: -4,
    gap: 8, // Modern gap property
  },
  itemWrapper: {
    width: '30%', // 3 columns for cleaner look
    marginBottom: 8,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 72, // Fixed height instead of aspect ratio
  },
  itemSelected: {
    backgroundColor: colors.primary.bg20,
    borderColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  itemUnselected: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.light,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  labelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default CategoryGrid;
