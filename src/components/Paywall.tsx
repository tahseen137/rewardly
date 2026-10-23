/**
 * Paywall - Beautiful subscription paywall screen
 * Shows all tiers (Free/Pro/Max) with feature comparison
 * Monthly/Annual toggle with savings display
 */

import React, { useState, useCallback, useEffect } from 'react';
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

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  SubscriptionTier,
  BillingPeriod,
  SUBSCRIPTION_TIERS,
  STRIPE_PRICE_IDS,
  TierConfig,
  getAnnualSavings,
  setTier,
  createCheckoutSession,
  getLifetimeSpotsRemaining,
} from '../services/SubscriptionService';

// Annual billing is available only when Stripe annual price IDs are configured
const ANNUAL_BILLING_AVAILABLE = !!(STRIPE_PRICE_IDS.pro_annual && STRIPE_PRICE_IDS.max_annual);

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (tier: SubscriptionTier, period: BillingPeriod) => void;
  highlightFeature?: string;
  /** Pre-select a specific tier */
  defaultTier?: SubscriptionTier;
}

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

// Stripe price IDs (live)
const _STRIPE_PRICES = {
  pro_monthly: 'price_1T0kbiAJmUBqj9CQPd8dhYEu',
  pro_annual: '', // Annual pricing not yet created
  max_monthly: 'price_1T0kcdAJmUBqj9CQeRMyl9h6',
  max_annual: '', // Annual pricing not yet created
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
    case 'lifetime':
      return <Star size={20} color="#FFD700" />;
    default:
      return <Sparkles size={20} color={colors.text.secondary} />;
  }
}

/**
 * Get tier gradient colors
 */
function getTierGradient(tier: SubscriptionTier): [string, string] {
  switch (tier) {
    case 'pro':
      return [colors.primary.main, colors.primary.dark];
    case 'max':
      return [colors.warning.main, colors.warning.dark];
    case 'lifetime':
      return ['#FFD700', '#FF8C00'];
    default:
      return [colors.neutral.gray600, colors.neutral.gray700];
  }
}

export default function Paywall({
  visible,
  onClose,
  onSubscribe,
  highlightFeature: _highlightFeature,
  defaultTier = 'pro',
}: PaywallProps) {
  const { t: _t } = useTranslation();

  // Default to monthly — annual price IDs not yet configured in Stripe
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(defaultTier);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'error' | 'info';
    text: string;
  } | null>(null);
  const [lifetimeSpotsRemaining, setLifetimeSpotsRemaining] = useState<number | null>(null);

  // Fetch live lifetime spots count
  useEffect(() => {
    getLifetimeSpotsRemaining()
      .then(setLifetimeSpotsRemaining)
      .catch(() => {});
  }, []);

  // Show Pro, Max, and Lifetime tiers
  const tiers = [SUBSCRIPTION_TIERS.pro, SUBSCRIPTION_TIERS.max];

  const isLifetimeSelected = selectedTier === 'lifetime';

  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message, [{ text: 'OK' }]);
    }
  }, []);

  const handleSubscribe = useCallback(async () => {
    setIsProcessing(true);
    setInlineMessage(null);

    try {
      // In development, allow quick testing by setting tier directly
      // eslint-disable-next-line no-constant-condition
      if (__DEV__ && false) {
        // Set to true only for local testing
        await setTier(selectedTier, billingPeriod);
        onSubscribe?.(selectedTier, billingPeriod);
        onClose();
        return;
      }

      // Call create-checkout edge function to get Stripe Checkout URL
      const result = await createCheckoutSession(
        selectedTier as 'pro' | 'max' | 'lifetime',
        billingPeriod === 'annual' ? 'year' : 'month'
      );

      if ('error' in result) {
        if (result.error === 'Not authenticated') {
          setInlineMessage({
            type: 'info',
            text: '🔐 Please create an account or sign in to subscribe.',
          });
        } else {
          setInlineMessage({ type: 'error', text: result.error });
        }
        return;
      }

      // Open Stripe Checkout in browser
      if (Platform.OS === 'web') {
        // On web, use window.open for reliable redirect (Linking.openURL can fail in modals)
        window.open(result.url, '_blank');
        onClose();
        onSubscribe?.(selectedTier, billingPeriod);
      } else {
        const supported = await Linking.canOpenURL(result.url);
        if (supported) {
          await Linking.openURL(result.url);
          onClose();
          onSubscribe?.(selectedTier, billingPeriod);
        } else {
          showAlert('Error', 'Unable to open checkout page. Please try again.');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showAlert('Subscription Error', 'Unable to start subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTier, billingPeriod, onSubscribe, onClose]);

  const renderTierCard = (tier: TierConfig) => {
    const isSelected = selectedTier === tier.id;
    const price =
      billingPeriod === 'annual'
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
          <View style={styles.tierIconContainer}>{getTierIcon(tier.id)}</View>
          <Text style={styles.tierName}>{tier.name}</Text>
        </View>

        <View style={styles.tierPricing}>
          <Text style={styles.tierPrice}>${price}</Text>
          <Text style={styles.tierPeriod}>/mo</Text>
        </View>

        {billingPeriod === 'annual' && savings > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save ${savings.toFixed(0)}/year</Text>
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
          <Text style={styles.heroTitle}>See Every Reward You're Missing</Text>
          <Text style={styles.heroSubtitle}>
            Unlimited recommendations, AI assistance, and wallet analysis
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
            <Text
              style={[
                styles.billingOptionText,
                billingPeriod === 'monthly' && styles.billingOptionTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.billingOption,
              billingPeriod === 'annual' && styles.billingOptionActive,
              !ANNUAL_BILLING_AVAILABLE && styles.billingOptionDisabled,
            ]}
            onPress={() => ANNUAL_BILLING_AVAILABLE && setBillingPeriod('annual')}
            disabled={!ANNUAL_BILLING_AVAILABLE}
          >
            <Text
              style={[
                styles.billingOptionText,
                billingPeriod === 'annual' && styles.billingOptionTextActive,
                !ANNUAL_BILLING_AVAILABLE && styles.billingOptionTextDisabled,
              ]}
            >
              Annual
            </Text>
            {ANNUAL_BILLING_AVAILABLE ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>Save 30%+</Text>
              </View>
            ) : (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tier Cards */}
        <ScrollView
          style={styles.tierList}
          contentContainerStyle={styles.tierListContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 🔥 Lifetime Deal Banner */}
          <TouchableOpacity
            style={[styles.lifetimeCard, isLifetimeSelected && styles.lifetimeCardSelected]}
            onPress={() => setSelectedTier('lifetime')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFD70015', '#FF8C0010'] as [string, string]}
              style={styles.lifetimeGradient}
            >
              <View style={styles.lifetimeBadgeRow}>
                <View style={styles.lifetimeFireBadge}>
                  <Text style={styles.lifetimeFireBadgeText}>EARLY ADOPTER PRICING</Text>
                </View>
                {isLifetimeSelected && (
                  <View style={styles.selectedIndicator}>
                    <Check size={20} color="#FFD700" />
                  </View>
                )}
              </View>

              <View style={styles.lifetimeHeader}>
                <Star size={24} color="#FFD700" />
                <Text style={styles.lifetimeName}>Lifetime Deal</Text>
              </View>

              <View style={styles.lifetimePricing}>
                <Text style={styles.lifetimePrice}>$49.99</Text>
                <Text style={styles.lifetimeOnce}> once</Text>
              </View>

              <View style={styles.lifetimeSavings}>
                <Text style={styles.lifetimeSavingsText}>
                  Saves $105.89 in year one vs Max monthly ($12.99/mo x 12 = $155.88)
                </Text>
              </View>

              <View style={styles.lifetimeFeatures}>
                <View style={styles.featureRow}>
                  <Check size={16} color="#FFD700" />
                  <Text style={styles.lifetimeFeatureText}>Everything in Max — forever</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={16} color="#FFD700" />
                  <Text style={styles.lifetimeFeatureText}>Unlimited Sage AI + Smart Wallet</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={16} color="#FFD700" />
                  <Text style={styles.lifetimeFeatureText}>All future features included</Text>
                </View>
                <View style={styles.featureRow}>
                  <Check size={16} color="#FFD700" />
                  <Text style={styles.lifetimeFeatureText}>Pay once, never again</Text>
                </View>
              </View>

              {lifetimeSpotsRemaining !== null && lifetimeSpotsRemaining > 0 && (
                <View style={styles.lifetimeUrgency}>
                  <Text style={styles.lifetimeUrgencyText}>
                    {lifetimeSpotsRemaining} of 100 spots remaining
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {tiers.map(renderTierCard)}
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          {inlineMessage && (
            <View
              style={[
                styles.inlineMessage,
                inlineMessage.type === 'error'
                  ? styles.inlineMessageError
                  : styles.inlineMessageInfo,
              ]}
            >
              <Text
                style={[
                  styles.inlineMessageText,
                  inlineMessage.type === 'error'
                    ? styles.inlineMessageTextError
                    : styles.inlineMessageTextInfo,
                ]}
              >
                {inlineMessage.text}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleSubscribe} disabled={isProcessing} activeOpacity={0.8}>
            <LinearGradient
              colors={getTierGradient(selectedTier)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                {isProcessing
                  ? 'Processing...'
                  : isLifetimeSelected
                    ? 'Get Lifetime Access — $49.99'
                    : `Subscribe to ${SUBSCRIPTION_TIERS[selectedTier].name}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            {isLifetimeSelected
              ? 'One-time payment • Lifetime access • No recurring charges'
              : '7-day free trial • Cancel anytime'}
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
            <TouchableOpacity
              onPress={() => {
                showAlert(
                  'Restore Purchases',
                  'Contact support@rewardly.app to restore your subscription.'
                );
              }}
            >
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
  billingOptionDisabled: {
    opacity: 0.5,
  },
  billingOptionTextDisabled: {
    color: colors.text.tertiary,
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
  comingSoonBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lifetime Deal styles
  lifetimeCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#FFD70060',
    overflow: 'hidden',
    marginBottom: 4,
  },
  lifetimeCardSelected: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  lifetimeGradient: {
    padding: 20,
  },
  lifetimeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lifetimeFireBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  lifetimeFireBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  lifetimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  lifetimeName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  lifetimePricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  lifetimePrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFD700',
  },
  lifetimeOnce: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  lifetimeSavings: {
    backgroundColor: '#FFD70020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  lifetimeSavingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  lifetimeFeatures: {
    gap: 8,
    marginBottom: 12,
  },
  lifetimeFeatureText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  lifetimeUrgency: {
    backgroundColor: '#FF4D4D20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  lifetimeUrgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
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
  inlineMessage: {
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  inlineMessageError: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  inlineMessageInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  inlineMessageText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inlineMessageTextError: {
    color: '#FF6B6B',
  },
  inlineMessageTextInfo: {
    color: '#60A5FA',
  },
});
