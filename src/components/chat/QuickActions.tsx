/**
 * QuickActions - Suggestion chips for quick interactions with Sage
 * 
 * Displays horizontally scrollable action chips that users can tap
 * to quickly send common questions.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  Utensils,
  ShoppingCart,
  Plane,
  ArrowLeftRight,
  Gift,
  Map,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface QuickAction {
  id: string;
  label: string;
  message: string;
  icon?: LucideIcon;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
  onActionPress: (message: string) => void;
  disabled?: boolean;
  variant?: 'horizontal' | 'grid';
}

// Default quick actions
const DEFAULT_ACTIONS: QuickAction[] = [
  { 
    id: 'dining', 
    label: 'Best for dining', 
    message: "What's my best card for dining and restaurants?",
    icon: Utensils
  },
  { 
    id: 'groceries', 
    label: 'Best for groceries', 
    message: 'Which card should I use for grocery shopping?',
    icon: ShoppingCart
  },
  { 
    id: 'travel', 
    label: 'Best for travel', 
    message: "What's the best card in my wallet for travel purchases?",
    icon: Plane
  },
  { 
    id: 'compare', 
    label: 'Compare my cards', 
    message: 'Can you compare my cards and tell me which is best overall?',
    icon: ArrowLeftRight
  },
  { 
    id: 'redeem', 
    label: 'Redeem points', 
    message: "What's the best way to redeem my points for maximum value?",
    icon: Gift
  },
  { 
    id: 'trip', 
    label: 'Plan a trip', 
    message: 'I want to plan a trip using my points. Can you help?',
    icon: Map
  },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ChipProps {
  action: QuickAction;
  onPress: () => void;
  disabled: boolean;
  index: number;
}

const ActionChip: React.FC<ChipProps> = ({ action, onPress, disabled, index }) => {
  const Icon = action.icon || Sparkles;
  
  return (
    <AnimatedTouchable
      entering={FadeInRight.delay(index * 50).duration(300)}
      style={[
        styles.chip,
        disabled && styles.chipDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityHint={`Ask Sage: ${action.message}`}
    >
      <Icon size={14} color={colors.primary.main} />
      <Text style={styles.chipText}>{action.label}</Text>
    </AnimatedTouchable>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = DEFAULT_ACTIONS,
  onActionPress,
  disabled = false,
  variant = 'horizontal',
}) => {
  const handlePress = useCallback((message: string) => {
    if (!disabled) {
      onActionPress(message);
    }
  }, [disabled, onActionPress]);
  
  if (variant === 'grid') {
    return (
      <View style={styles.gridContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {actions.map((action, index) => (
            <ActionChip
              key={action.id}
              action={action}
              onPress={() => handlePress(action.message)}
              disabled={disabled}
              index={index}
            />
          ))}
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {actions.map((action, index) => (
          <ActionChip
            key={action.id}
            action={action}
            onPress={() => handlePress(action.message)}
            disabled={disabled}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  gridContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.bg10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary.bg20,
    gap: 6,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
});

export default QuickActions;
