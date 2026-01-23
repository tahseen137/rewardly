/**
 * CategoryPicker - Manual category selection component
 * Requirements: 2.1, 2.3
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../theme';
import { SpendingCategory } from '../types';

interface CategoryPickerProps {
  onCategorySelect: (category: SpendingCategory) => void;
  selectedCategory: SpendingCategory | null;
  label?: string;
}

const CATEGORY_CONFIG: Record<
  SpendingCategory,
  { label: string; icon: string; description: string }
> = {
  [SpendingCategory.GROCERIES]: {
    label: 'Groceries',
    icon: '🛒',
    description: 'Supermarkets and grocery stores',
  },
  [SpendingCategory.DINING]: {
    label: 'Dining',
    icon: '🍽️',
    description: 'Restaurants and food delivery',
  },
  [SpendingCategory.GAS]: {
    label: 'Gas',
    icon: '⛽',
    description: 'Gas stations and fuel',
  },
  [SpendingCategory.TRAVEL]: {
    label: 'Travel',
    icon: '✈️',
    description: 'Flights, hotels, and transportation',
  },
  [SpendingCategory.ONLINE_SHOPPING]: {
    label: 'Online Shopping',
    icon: '🛍️',
    description: 'E-commerce and online purchases',
  },
  [SpendingCategory.ENTERTAINMENT]: {
    label: 'Entertainment',
    icon: '🎬',
    description: 'Movies, concerts, and events',
  },
  [SpendingCategory.DRUGSTORES]: {
    label: 'Drugstores',
    icon: '💊',
    description: 'Pharmacies and health products',
  },
  [SpendingCategory.HOME_IMPROVEMENT]: {
    label: 'Home Improvement',
    icon: '🔨',
    description: 'Hardware and home supplies',
  },
  [SpendingCategory.OTHER]: {
    label: 'Other',
    icon: '📦',
    description: 'General purchases',
  },
};

export function CategoryPicker({
  onCategorySelect,
  selectedCategory,
  label = 'Select Category',
}: CategoryPickerProps) {
  const theme = useTheme();

  const categories = Object.values(SpendingCategory);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>{label}</Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const config = CATEGORY_CONFIG[category];
          const isSelected = selectedCategory === category;

          const cardStyle = [
            styles.categoryCard,
            ...(isSelected ? [{
              backgroundColor: theme.colors.primary.main,
              borderColor: theme.colors.primary.main,
            }] : []),
          ];

          return (
            <TouchableOpacity
              key={category}
              onPress={() => onCategorySelect(category)}
              accessibilityLabel={`Select ${config.label} category`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Card
                variant={isSelected ? 'filled' : 'outlined'}
                padding="medium"
                style={cardStyle}
              >
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryIcon}>{config.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color: isSelected
                          ? theme.colors.primary.contrast
                          : theme.colors.text.primary,
                      },
                    ]}
                  >
                    {config.label}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedCategory && (
        <Text style={[styles.description, { color: theme.colors.text.tertiary }]}>
          {CATEGORY_CONFIG[selectedCategory].description}
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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryCard: {
    minWidth: 100,
    marginRight: 8,
  },
  categoryContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CategoryPicker;
