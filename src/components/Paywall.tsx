/**
 * Paywall - Beautiful subscription paywall screen
 * Shows all tiers (Free/Pro/Max) with feature comparison
 * Monthly/Annual toggle with savings display
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Crown, Sparkles, Zap, Star } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  SubscriptionTier,
  BillingPeriod,
  SUBSCRIPTION_TIERS,
  TierConfig,
  getAnnualSavings,
  setTier,
  createCheckoutSession,
} from '../services/SubscriptionService';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (tier: SubscriptionTier, period: BillingPeriod) => void;
  highlightFeature?: string;
  /** Pre-select a specific tier */
  defaultTier?: SubscriptionTier;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stripe price IDs (to be set in production)
const STRIPE_PRICES = {
  pro_monthly: 'price_pro_monthly', // Replace with actual Stripe price IDs
  pro_annual: 'price_pro_annual',
  max_monthly: 'price_max_monthly',
  max_annual: 'price_max_annual',
};

/**
 * Get icon for tier
 */
function getTierIcon(tier: SubscriptionTier) {
  switch (tier) {
    case 'pro':
      return <Zap size={20} color={colors.primary.main} />;
    case 'max':
      return <Crown size={20} color={colors.warning.main} />;
    default:
      return <Sparkles size={20} color={colors.text.secondary} />;
  }
}

/**
 * Get tier gradient colors
 */
function getTierGradient(tier: SubscriptionTier): string[] {
  switch (tier) {
    case 'pro':
      return [colors.primary.main, colors.primary.dark];
    case 'max':
      return [colors.warning.main, colors.warning.dark];
    default:
      return [colors.neutral.gray600, colors.neutral.gray700];
  }
}

export default function Paywall({
  visible,
  onClose,
  onSubscribe,
  highlightFeature,
  defaultTier = 'pro',
}: PaywallProps) {
  const { t } = useTranslation();
  
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(defaultTier);
  const [isProcessing, setIsProcessing] = useState(false);

  // Only show Pro and Max tiers
  const tiers = [SUBSCRIPTION_TIERS.pro, SUBSCRIPTION_TIERS.max];

  const handleSubscribe = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // In development, allow quick testing by setting tier directly
      if (__DEV__ && false) { // Set to true only for local testing
        await setTier(selectedTier, billingPeriod);
        onSubscribe?.(selectedTier, billingPeriod);
        onClose();
        return;
      }
      
      // Call create-checkout edge function to get Stripe Checkout URL
      const result = await createCheckoutSession(
        selectedTier,
        billingPeriod === 'annual' ? 'year' : 'month'
      );
      
      if ('error' in result) {
        Alert.alert(
          'Subscription Error',
          result.error,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Open Stripe Checkout in browser
      const supported = await Linking.canOpenURL(result.url);
      if (supported) {
        await Linking.openURL(result.url);
        // User will return to app after checkout
        // Webhook will update subscription state automatically
        onClose();
        
        // Optionally notify parent component
        onSubscribe?.(selectedTier, billingPeriod);
      } else {
        Alert.alert(
          'Error',
          'Unable to open checkout page. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Error',
        'Unable to start subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTier, billingPeriod, onSubscribe, onClose]);

  const renderTierCard = (tier: TierConfig) => {
    const isSelected = selectedTier === tier.id;
    const price = billingPeriod === 'annual' 
      ? (tier.annualPrice / 12).toFixed(2)
      : tier.monthlyPrice.toFixed(2);
    const savings = getAnnualSavings(tier.id);

    return (
      <TouchableOpacity
        key={tier.id}
        style={[
          styles.tierCard,
          isSelected && styles.tierCardSelected,
          tier.highlighted && styles.tierCardHighlighted,
        ]}
        onPress={() => setSelectedTier(tier.id)}
        activeOpacity={0.7}
      >
        {tier.id === 'pro' && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.tierHeader}>
          <View style={styles.tierIconContainer}>
            {getTierIcon(tier.id)}
          </View>
          <Text style={styles.tierName}>{tier.name}</Text>
        </View>

        <View style={styles.tierPricing}>
          <Text style={styles.tierPrice}>${price}</Text>
          <Text style={styles.tierPeriod}>/mo</Text>
        </View>

        {billingPeriod === 'annual' && savings > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              Save ${savings.toFixed(0)}/year
            </Text>
          </View>
        )}

        <View style={styles.tierFeatures}>
          {tier.featureDescriptions.slice(0, 5).map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Check size={16} color={colors.primary.main} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {tier.featureDescriptions.length > 5 && (
            <Text style={styles.moreFeatures}>
              +{tier.featureDescriptions.length - 5} more features
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Check size={20} color={colors.primary.main} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Sparkles size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited access to all features and maximize your rewards
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.billingOption,
              billingPeriod === 'monthly' && styles.billingOptionActive,
            ]}
            onPress={() => setBillingPeriod('monthly')}
          >
            <Text style={[
              styles.billingOptionText,
              billingPeriod === 'monthly' && styles.billingOptionTextActive,
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.billingOption,
              billingPeriod === 'annual' && styles.billingOptionActive,
            ]}
            onPress={() => setBillingPeriod('annual')}
          >
            <Text style={[
              styles.billingOptionText,
              billingPeriod === 'annual' && styles.billingOptionTextActive,
            ]}>
              Annual
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>Save 30%+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tier Cards */}
        <ScrollView
          style={styles.tierList}
          contentContainerStyle={styles.tierListContent}
          showsVerticalScrollIndicator={false}
        >
          {tiers.map(renderTierCard)}
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={getTierGradient(selectedTier)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                {isProcessing ? 'Processing...' : `Subscribe to ${SUBSCRIPTION_TIERS[selectedTier].name}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            7-day free trial • Cancel anytime
          </Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://rewardly.app/terms')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://rewardly.app/privacy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={() => {
              // TODO: Restore purchases via Stripe
              Alert.alert('Restore Purchases', 'Contact support@rewardly.app to restore your subscription.');
            }}>
              <Text style={styles.legalLink}>Restore Purchases</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.bg10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  billingOptionActive: {
    backgroundColor: colors.background.primary,
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  billingOptionTextActive: {
    color: colors.text.primary,
  },
  discountBadge: {
    backgroundColor: colors.primary.bg20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.main,
  },
  tierList: {
    flex: 1,
  },
  tierListContent: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 16,
  },
  tierCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    padding: 20,
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: colors.primary.main,
  },
  tierCardHighlighted: {
    borderColor: colors.primary.main,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.background.primary,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tierIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tierPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tierPeriod: {
    fontSize: 15,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  savingsBadge: {
    backgroundColor: colors.success.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success.main,
  },
  tierFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 4,
    marginLeft: 26,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  ctaButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background.primary,
  },
  trialNote: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legalLink: {
    fontSize: 12,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginHorizontal: 8,
  },
});
