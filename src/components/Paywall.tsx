/**
 * Paywall - Beautiful subscription paywall screen
 * Shows all tiers with feature comparison
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
} from '../services/SubscriptionService';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (tier: SubscriptionTier, period: BillingPeriod) => void;
  highlightFeature?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Get icon for tier
 */
function getTierIcon(tier: SubscriptionTier) {
  switch (tier) {
    case 'plus':
      return <Zap size={20} color={colors.primary.main} />;
    case 'pro':
      return <Star size={20} color={colors.warning.main} />;
    case 'elite':
      return <Crown size={20} color={colors.accent.main} />;
    default:
      return <Sparkles size={20} color={colors.text.secondary} />;
  }
}

/**
 * Get tier gradient colors
 */
function getTierGradient(tier: SubscriptionTier): string[] {
  switch (tier) {
    case 'plus':
      return [colors.primary.main, colors.primary.dark];
    case 'pro':
      return [colors.warning.main, colors.warning.dark];
    case 'elite':
      return [colors.accent.main, colors.accent.dark];
    default:
      return [colors.neutral.gray600, colors.neutral.gray700];
  }
}

export default function Paywall({
  visible,
  onClose,
  onSubscribe,
  highlightFeature,
}: PaywallProps) {
  const { t } = useTranslation();
  
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('plus');
  const [isProcessing, setIsProcessing] = useState(false);

  const tiers = Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free');

  const handleSubscribe = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // In development, just set the tier directly
      if (__DEV__) {
        await setTier(selectedTier, billingPeriod);
        onSubscribe?.(selectedTier, billingPeriod);
        onClose();
        return;
      }
      
      // TODO: Integrate with RevenueCat for production
      // const offerings = await Purchases.getOfferings();
      // const pkg = offerings.current?.availablePackages.find(...);
      // await Purchases.purchasePackage(pkg);
      
      onSubscribe?.(selectedTier, billingPeriod);
      onClose();
    } catch (error) {
      console.error('Subscription error:', error);
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
        {tier.highlighted && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>{t('paywall.mostPopular')}</Text>
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
          <Text style={styles.tierPeriod}>/{t('paywall.month')}</Text>
        </View>

        {billingPeriod === 'annual' && savings > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              {t('paywall.saveAmount', { amount: savings.toFixed(0) })}
            </Text>
          </View>
        )}

        <View style={styles.tierFeatures}>
          {tier.features.slice(0, 4).map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Check size={16} color={colors.primary.main} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {tier.features.length > 4 && (
            <Text style={styles.moreFeatures}>
              +{tier.features.length - 4} {t('paywall.moreFeatures')}
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
          <Text style={styles.heroTitle}>{t('paywall.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('paywall.subtitle')}</Text>
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
              {t('paywall.monthly')}
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
              {t('paywall.annual')}
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{t('paywall.twoMonthsFree')}</Text>
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
                {t('paywall.startFreeTrial')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            {t('paywall.trialNote')}
          </Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity>
              <Text style={styles.legalLink}>{t('paywall.termsOfService')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.legalLink}>{t('paywall.privacyPolicy')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.legalLink}>{t('paywall.restorePurchases')}</Text>
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
    textTransform: 'uppercase',
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
