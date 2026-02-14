/**
 * LandingPage - Marketing/landing page shown on web before authentication
 * 
 * Features:
 * - Hero with value proposition
 * - Feature highlights
 * - Pricing table (Free / Pro / Premium)
 * - CTA to get started
 * - Footer with links
 * - Fully responsive (uses RN Web primitives)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard,
  BarChart3,
  Navigation,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Check,
  ChevronRight,
  Star,
  MapPin,
  Bell,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

interface LandingPageProps {
  onGetStarted: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWide = SCREEN_WIDTH > 768;

// ============================================================================
// Hero Section
// ============================================================================

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.heroSection}>
      <LinearGradient
        colors={['#0A0E1F', '#0F1528', '#0A0E1F']}
        style={styles.heroGradient}
      >
        {/* Decorative elements */}
        <View style={styles.heroDecorative}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
        </View>

        <Animated.View
          style={[
            styles.heroContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Badge */}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeFlag}>🇨🇦</Text>
            <Text style={styles.heroBadgeText}>Canada's #1 Rewards Optimizer</Text>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>
            Maximize Your{'\n'}
            <Text style={styles.heroTitleAccent}>Credit Card Rewards</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Stop leaving money on the table. Rewardly tells you the best card to use 
            for every purchase — automatically. Built for Canadian credit cards.
          </Text>

          {/* Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>$127</Text>
              <Text style={styles.heroStatLabel}>avg. saved/month</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>50+</Text>
              <Text style={styles.heroStatLabel}>Canadian cards</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>2 min</Text>
              <Text style={styles.heroStatLabel}>setup time</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity onPress={onGetStarted} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.primary.main, colors.primary.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCTA}
            >
              <Text style={styles.heroCTAText}>Get Started Free</Text>
              <ChevronRight size={22} color={colors.background.primary} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.heroFinePrint}>
            No credit card required · Free forever plan available
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

// ============================================================================
// Features Section
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.featureIconContainer}>{icon}</View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Animated.View>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <CreditCard size={28} color={colors.primary.main} />,
      title: 'Smart Card Picker',
      description:
        'Instantly know which card earns the most rewards at any store or category. Never miss a bonus again.',
    },
    {
      icon: <Navigation size={28} color={colors.accent.main} />,
      title: 'AutoPilot Mode',
      description:
        'Get automatic notifications when you arrive at stores, telling you exactly which card to pull out.',
    },
    {
      icon: <BarChart3 size={28} color={colors.info.main} />,
      title: 'Rewards IQ Score',
      description:
        'Track how well you\'re optimizing your rewards. See missed opportunities and improve your score.',
    },
    {
      icon: <Sparkles size={28} color={colors.warning.main} />,
      title: 'Sage AI Assistant',
      description:
        'Ask Sage anything about credit cards, points strategies, or travel redemptions. Your personal advisor.',
    },
  ];

  return (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionLabel}>FEATURES</Text>
      <Text style={styles.sectionTitle}>
        Everything You Need to{'\n'}
        <Text style={styles.sectionTitleAccent}>Maximize Rewards</Text>
      </Text>

      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={200 + index * 150}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// How It Works Section
// ============================================================================

function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Add Your Cards',
      description: 'Select from 50+ popular Canadian credit cards',
      icon: <CreditCard size={24} color={colors.primary.main} />,
    },
    {
      number: '2',
      title: 'Tell Us Your Spending',
      description: 'Quick spending profile — takes 30 seconds',
      icon: <TrendingUp size={24} color={colors.primary.main} />,
    },
    {
      number: '3',
      title: 'Start Saving',
      description: 'Get personalized recommendations for every purchase',
      icon: <Zap size={24} color={colors.primary.main} />,
    },
  ];

  return (
    <View style={styles.howItWorksSection}>
      <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
      <Text style={styles.sectionTitle}>
        Set Up in <Text style={styles.sectionTitleAccent}>2 Minutes</Text>
      </Text>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.number} style={styles.stepItem}>
            <View style={styles.stepNumberContainer}>
              <LinearGradient
                colors={[colors.primary.main, colors.primary.dark]}
                style={styles.stepNumberGradient}
              >
                <Text style={styles.stepNumber}>{step.number}</Text>
              </LinearGradient>
              {index < steps.length - 1 && <View style={styles.stepConnector} />}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Pricing Section
// ============================================================================

interface PricingCardProps {
  tier: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  onSelect: () => void;
}

function PricingCard({
  tier,
  price,
  period,
  features,
  highlighted = false,
  badge,
  onSelect,
}: PricingCardProps) {
  return (
    <View
      style={[
        styles.pricingCard,
        highlighted && styles.pricingCardHighlighted,
      ]}
    >
      {badge && (
        <View style={styles.pricingBadge}>
          <Text style={styles.pricingBadgeText}>{badge}</Text>
        </View>
      )}

      <Text style={styles.pricingTier}>{tier}</Text>
      <View style={styles.pricingPriceRow}>
        <Text style={[styles.pricingPrice, highlighted && styles.pricingPriceHighlighted]}>
          {price}
        </Text>
        {period !== '' && <Text style={styles.pricingPeriod}>{period}</Text>}
      </View>

      <View style={styles.pricingDivider} />

      <View style={styles.pricingFeatures}>
        {features.map((feature, index) => (
          <View key={index} style={styles.pricingFeatureRow}>
            <Check
              size={16}
              color={highlighted ? colors.primary.main : colors.text.secondary}
            />
            <Text style={styles.pricingFeatureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onSelect} activeOpacity={0.9}>
        {highlighted ? (
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.pricingButton}
          >
            <Text style={styles.pricingButtonTextHighlighted}>Get Started</Text>
          </LinearGradient>
        ) : (
          <View style={styles.pricingButtonOutline}>
            <Text style={styles.pricingButtonText}>Get Started</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  const plans = [
    {
      tier: 'Free',
      price: '$0',
      period: '/mo',
      features: [
        'Up to 3 cards',
        'Best card calculator',
        'Category-based rewards',
        'Basic card comparison',
      ],
      highlighted: false,
    },
    {
      tier: 'Pro',
      price: '$5.99',
      period: '/mo',
      badge: 'Most Popular',
      features: [
        'Unlimited cards',
        'Full Insights dashboard',
        'Rewards IQ tracking',
        '10 Sage AI chats/month',
        'Spending log & reports',
        'Sign-up bonus tracker',
      ],
      highlighted: true,
    },
    {
      tier: 'Premium',
      price: '$12.99',
      period: '/mo',
      features: [
        'Everything in Pro',
        'AutoPilot mode',
        'Unlimited Sage AI',
        'Statement upload & analysis',
        'Portfolio optimizer',
        'Multi-country support',
      ],
      highlighted: false,
    },
  ];

  return (
    <View style={styles.pricingSection}>
      <Text style={styles.sectionLabel}>PRICING</Text>
      <Text style={styles.sectionTitle}>
        Simple, <Text style={styles.sectionTitleAccent}>Transparent</Text> Pricing
      </Text>
      <Text style={styles.pricingSublabel}>
        Start free. Upgrade when you're ready.
      </Text>

      <View style={styles.pricingGrid}>
        {plans.map((plan) => (
          <PricingCard
            key={plan.tier}
            tier={plan.tier}
            price={plan.price}
            period={plan.period}
            features={plan.features}
            highlighted={plan.highlighted}
            badge={plan.badge}
            onSelect={onGetStarted}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Trust Section
// ============================================================================

function TrustSection() {
  return (
    <View style={styles.trustSection}>
      <View style={styles.trustItems}>
        <View style={styles.trustItem}>
          <Shield size={24} color={colors.primary.main} />
          <Text style={styles.trustTitle}>Bank-Level Security</Text>
          <Text style={styles.trustDesc}>Your data is encrypted and never shared</Text>
        </View>
        <View style={styles.trustItem}>
          <MapPin size={24} color={colors.primary.main} />
          <Text style={styles.trustTitle}>Privacy First</Text>
          <Text style={styles.trustDesc}>Location data stays on your device</Text>
        </View>
        <View style={styles.trustItem}>
          <Star size={24} color={colors.primary.main} />
          <Text style={styles.trustTitle}>Made for Canadians</Text>
          <Text style={styles.trustDesc}>All major Canadian issuers supported</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Footer
// ============================================================================

function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View style={styles.footerBrand}>
          <Text style={styles.footerLogo}>💳 Rewardly</Text>
          <Text style={styles.footerTagline}>
            Maximize every swipe.
          </Text>
        </View>

        <View style={styles.footerLinks}>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerLinkHeader}>Product</Text>
            <Text style={styles.footerLink}>Features</Text>
            <Text style={styles.footerLink}>Pricing</Text>
            <Text style={styles.footerLink}>FAQ</Text>
          </View>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerLinkHeader}>Legal</Text>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </View>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerLinkHeader}>Support</Text>
            <Text style={styles.footerLink}>Help Center</Text>
            <Text style={styles.footerLink}>Contact</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerDivider} />
      <Text style={styles.footerCopyright}>
        © {new Date().getFullYear()} Rewardly by Motu Inc. All rights reserved.
      </Text>
    </View>
  );
}

// ============================================================================
// Final CTA
// ============================================================================

function FinalCTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={styles.finalCTASection}>
      <LinearGradient
        colors={[colors.primary.main + '15', colors.primary.dark + '08']}
        style={styles.finalCTAGradient}
      >
        <Text style={styles.finalCTATitle}>
          Ready to Stop Leaving{'\n'}Money on the Table?
        </Text>
        <Text style={styles.finalCTASubtitle}>
          Join thousands of Canadians who are maximizing their credit card rewards.
        </Text>

        <TouchableOpacity onPress={onGetStarted} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finalCTAButton}
          >
            <Text style={styles.finalCTAButtonText}>Get Started Free</Text>
            <ChevronRight size={22} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection onGetStarted={onGetStarted} />
      <TrustSection />
      <FinalCTA onGetStarted={onGetStarted} />
      <Footer />
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const MAX_CONTENT_WIDTH = 1100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    alignItems: 'center',
  },

  // ---- Hero ----
  heroSection: {
    width: '100%',
  },
  heroGradient: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 80,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroDecorative: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.06,
  },
  decorCircle1: {
    width: 500,
    height: 500,
    backgroundColor: colors.primary.main,
    top: -200,
    right: -100,
  },
  decorCircle2: {
    width: 400,
    height: 400,
    backgroundColor: colors.accent.main,
    bottom: -150,
    left: -100,
  },
  heroContent: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.bg10,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  heroBadgeFlag: {
    fontSize: 18,
  },
  heroBadgeText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 56 : 36,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 66 : 44,
    marginBottom: 20,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    color: colors.primary.main,
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600,
    marginBottom: 32,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 32,
    maxWidth: 480,
    width: '100%',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: 12,
  },
  heroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 40,
    borderRadius: 28,
    gap: 8,
    minWidth: 240,
  },
  heroCTAText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background.primary,
  },
  heroFinePrint: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 16,
  },

  // ---- Features ----
  featuresSection: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.main,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 40 : 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 50 : 36,
  },
  sectionTitleAccent: {
    color: colors.primary.main,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  featureCard: {
    width: SCREEN_WIDTH > 768 ? '22%' : SCREEN_WIDTH > 500 ? '45%' : '100%',
    minWidth: SCREEN_WIDTH > 768 ? 220 : undefined,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary.bg10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // ---- How It Works ----
  howItWorksSection: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepsContainer: {
    maxWidth: 500,
    width: '100%',
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 20,
    minHeight: 100,
  },
  stepNumberContainer: {
    alignItems: 'center',
    width: 48,
  },
  stepNumberGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.background.primary,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primary.main + '30',
    marginVertical: 8,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // ---- Pricing ----
  pricingSection: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pricingSublabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: -32,
    marginBottom: 48,
    textAlign: 'center',
  },
  pricingGrid: {
    flexDirection: SCREEN_WIDTH > 768 ? 'row' : 'column',
    gap: 20,
    width: '100%',
    justifyContent: 'center',
    alignItems: SCREEN_WIDTH > 768 ? 'stretch' : 'center',
  },
  pricingCard: {
    width: SCREEN_WIDTH > 768 ? '30%' : '100%',
    maxWidth: 360,
    minWidth: SCREEN_WIDTH > 768 ? 280 : undefined,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  pricingCardHighlighted: {
    borderColor: colors.primary.main,
    borderWidth: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 40px rgba(29, 219, 130, 0.15)' }
      : {}),
  },
  pricingBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -55,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    zIndex: 1,
  },
  pricingBadgeText: {
    color: colors.background.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  pricingTier: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  pricingPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    gap: 4,
  },
  pricingPrice: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pricingPriceHighlighted: {
    color: colors.primary.main,
  },
  pricingPeriod: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: 20,
  },
  pricingFeatures: {
    gap: 12,
    marginBottom: 24,
  },
  pricingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pricingFeatureText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  pricingButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingButtonOutline: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  pricingButtonTextHighlighted: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  pricingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // ---- Trust ----
  trustSection: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  trustItems: {
    flexDirection: SCREEN_WIDTH > 600 ? 'row' : 'column',
    justifyContent: 'center',
    gap: 32,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  trustItem: {
    flex: SCREEN_WIDTH > 600 ? 1 : undefined,
    alignItems: 'center',
    gap: 10,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  trustDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // ---- Final CTA ----
  finalCTASection: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  finalCTAGradient: {
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.main + '20',
  },
  finalCTATitle: {
    fontSize: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 36 : 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 44 : 36,
  },
  finalCTASubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 500,
  },
  finalCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 40,
    borderRadius: 28,
    gap: 8,
    minWidth: 240,
  },
  finalCTAButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background.primary,
  },

  // ---- Footer ----
  footer: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerContent: {
    flexDirection: SCREEN_WIDTH > 600 ? 'row' : 'column',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
    gap: 40,
    marginBottom: 40,
  },
  footerBrand: {
    flex: SCREEN_WIDTH > 600 ? 1 : undefined,
  },
  footerLogo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 40,
  },
  footerLinkColumn: {
    gap: 10,
  },
  footerLinkHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 24,
  },
  footerCopyright: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
