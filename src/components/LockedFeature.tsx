/**
 * LockedFeature - Reusable paywall overlay for locked features
 * 
 * Shows which tier unlocks the feature and provides upgrade CTA
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  Feature,
  SubscriptionTier,
  getFeatureUnlockTier,
  SUBSCRIPTION_TIERS,
} from '../services/SubscriptionService';
import Paywall from './Paywall';

interface LockedFeatureProps {
  /** The feature that is locked */
  feature: Feature;
  /** Title to show on the lock screen */
  title: string;
  /** Description of what the feature does */
  description: string;
  /** Optional custom icon */
  icon?: React.ReactNode;
  /** Whether to show as full screen overlay or inline */
  variant?: 'overlay' | 'inline' | 'card';
  /** Callback when user subscribes */
  onSubscribe?: (tier: SubscriptionTier) => void;
  /** Children to render behind the overlay (for 'overlay' variant) */
  children?: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Get icon for tier
 */
function getTierIcon(tier: SubscriptionTier, size: number = 24) {
  switch (tier) {
    case 'pro':
      return <Zap size={size} color={colors.primary.main} />;
    case 'max':
      return <Crown size={size} color={colors.warning.main} />;
    default:
      return <Sparkles size={size} color={colors.text.secondary} />;
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

export default function LockedFeature({
  feature,
  title,
  description,
  icon,
  variant = 'overlay',
  onSubscribe,
  children,
}: LockedFeatureProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  
  const requiredTier = getFeatureUnlockTier(feature);
  const tierConfig = SUBSCRIPTION_TIERS[requiredTier];
  const tierGradient = getTierGradient(requiredTier);

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const handleSubscribe = (tier: SubscriptionTier) => {
    setShowPaywall(false);
    onSubscribe?.(tier);
  };

  // Card variant - smaller inline card
  if (variant === 'card') {
    return (
      <>
        <TouchableOpacity 
          style={styles.cardContainer}
          onPress={handleUpgrade}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconContainer}>
            <Lock size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>
          <View style={styles.cardBadge}>
            {getTierIcon(requiredTier, 16)}
            <Text style={styles.cardBadgeText}>{tierConfig.name}</Text>
          </View>
        </TouchableOpacity>

        <Paywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
        />
      </>
    );
  }

  // Inline variant - for use within scrollable content
  if (variant === 'inline') {
    return (
      <>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.inlineContainer}
        >
          <View style={styles.inlineIconContainer}>
            {icon || <Lock size={48} color={colors.text.secondary} />}
          </View>
          
          <Text style={styles.inlineTitle}>{title}</Text>
          <Text style={styles.inlineDescription}>{description}</Text>
          
          <View style={styles.tierBadge}>
            {getTierIcon(requiredTier, 18)}
            <Text style={styles.tierBadgeText}>
              Requires {tierConfig.name}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={tierGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButton}
            >
              <Text style={styles.upgradeButtonText}>
                Upgrade to {tierConfig.name}
              </Text>
              <ArrowRight size={18} color={colors.background.primary} />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.priceText}>
            Starting at ${tierConfig.monthlyPrice}/month
          </Text>
        </Animated.View>

        <Paywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
        />
      </>
    );
  }

  // Overlay variant - full screen with blur
  return (
    <>
      <View style={styles.overlayContainer}>
        {/* Blurred background content */}
        <View style={styles.backgroundContent}>
          {children}
        </View>
        
        {/* Blur overlay */}
        <BlurView
          intensity={20}
          tint="dark"
          style={styles.blurOverlay}
        >
          <Animated.View 
            entering={FadeIn.duration(400)}
            style={styles.overlayContent}
          >
            <View style={styles.overlayIconContainer}>
              {icon || <Lock size={56} color={colors.text.secondary} />}
            </View>
            
            <Text style={styles.overlayTitle}>{title}</Text>
            <Text style={styles.overlayDescription}>{description}</Text>
            
            <View style={styles.tierBadgeLarge}>
              {getTierIcon(requiredTier, 24)}
              <Text style={styles.tierBadgeLargeText}>
                {tierConfig.name} Feature
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleUpgrade}
              activeOpacity={0.8}
              style={styles.overlayButtonContainer}
            >
              <LinearGradient
                colors={tierGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overlayButton}
              >
                <Text style={styles.overlayButtonText}>
                  Upgrade to {tierConfig.name}
                </Text>
                <ArrowRight size={20} color={colors.background.primary} />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.overlayPriceText}>
              Starting at ${tierConfig.monthlyPrice}/month
              {tierConfig.annualPrice > 0 && ` • $${tierConfig.annualPrice}/year`}
            </Text>
          </Animated.View>
        </BlurView>
      </View>

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Card variant styles
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Inline variant styles
  inlineContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  inlineIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  inlineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  inlineDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 300,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    gap: 8,
    marginBottom: 24,
  },
  tierBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: borderRadius.lg,
    gap: 8,
    minWidth: 200,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  priceText: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 16,
  },

  // Overlay variant styles
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundContent: {
    flex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
  },
  overlayIconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  overlayDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  tierBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    gap: 10,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tierBadgeLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  overlayButtonContainer: {
    width: '100%',
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: borderRadius.lg,
    gap: 10,
  },
  overlayButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background.primary,
  },
  overlayPriceText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 20,
    textAlign: 'center',
  },
});
