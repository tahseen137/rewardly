/**
 * ApplyNowButton - Reusable CTA for card application affiliate links
 * 
 * Prominent "Apply Now" button that opens the card's application URL
 * in the device browser and tracks clicks for affiliate analytics.
 * 
 * Variants:
 * - primary: Full-width, solid background (for card detail pages)
 * - compact: Smaller, inline button (for list items)
 * - outline: Outlined style (for secondary placements)
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { Card } from '../types';
import { handleApplyNow } from '../services/AffiliateService';
import { getCurrentTierSync } from '../services/SubscriptionService';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

// ============================================================================
// Types
// ============================================================================

export interface ApplyNowButtonProps {
  /** The card to apply for */
  card: Card;
  /** Where in the app this button is shown (for analytics) */
  sourceScreen: string;
  /** Visual variant */
  variant?: 'primary' | 'compact' | 'outline';
  /** Custom label (default: "Apply Now") */
  label?: string;
  /** Show disclosure text below button */
  showDisclosure?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ApplyNowButton({
  card,
  sourceScreen,
  variant = 'primary',
  label = 'Apply Now',
  showDisclosure = false,
  disabled = false,
}: ApplyNowButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePress = useCallback(async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    try {
      const tier = getCurrentTierSync();
      await handleApplyNow(card, sourceScreen, tier);
    } finally {
      setIsLoading(false);
    }
  }, [card, sourceScreen, isLoading, disabled]);

  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'compact' && styles.buttonCompact,
    variant === 'outline' && styles.buttonOutline,
    disabled && styles.buttonDisabled,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.textPrimary,
    variant === 'compact' && styles.textCompact,
    variant === 'outline' && styles.textOutline,
  ];

  const iconColor =
    variant === 'outline' ? colors.primary.main : colors.background.primary;
  const iconSize = variant === 'compact' ? 14 : 18;

  return (
    <View>
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
        accessibilityLabel={`Apply for ${card.name}`}
        accessibilityRole="link"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <>
            <Text style={textStyles}>{label}</Text>
            <ExternalLink size={iconSize} color={iconColor} />
          </>
        )}
      </TouchableOpacity>
      {showDisclosure && (
        <Text style={styles.disclosure}>
          Rewardly may earn a commission if you apply through our link.
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
    minHeight: 50,
  },
  buttonCompact: {
    backgroundColor: colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    minHeight: 36,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    minHeight: 46,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: '600',
  },
  textPrimary: {
    fontSize: 16,
    color: colors.background.primary,
  },
  textCompact: {
    fontSize: 13,
    color: colors.background.primary,
  },
  textOutline: {
    fontSize: 15,
    color: colors.primary.main,
  },
  disclosure: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ApplyNowButton;
