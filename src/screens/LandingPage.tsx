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
  Image,
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
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import owlLogoSrc from '../../assets/owl-logo.png';

interface LandingPageProps {
  onGetStarted: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const _isWide = SCREEN_WIDTH > 768;

// ============================================================================
// Nav Header (sticky, mobile-first)
// ============================================================================

function NavHeader({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={navStyles.header}>
      <View style={navStyles.inner}>
        <View style={navStyles.logoLockup}>
          <Image
            source={owlLogoSrc}
            style={navStyles.owlIcon}
            resizeMode="contain"
            accessibilityLabel="Rewardly owl logo"
          />
          <Text style={navStyles.logo}>Rewardly</Text>
        </View>
        <TouchableOpacity style={navStyles.ctaBtn} onPress={onGetStarted} activeOpacity={0.8}>
          <Text style={navStyles.ctaBtnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: 'rgba(10, 14, 31, 0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    position: Platform.OS === 'web' ? ('sticky' as any) : 'relative',
    top: 0,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  logoLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  owlIcon: {
    width: 28,
    height: 28,
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  ctaBtn: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

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
      <LinearGradient colors={['#0A0E1F', '#0F1528', '#0A0E1F']} style={styles.heroGradient}>
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
            Which Card Earns the Most{'\n'}
            <Text style={styles.heroTitleAccent}>at Loblaws? Gas? Tim Hortons?</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Rewardly knows. Most Canadians swipe the wrong card 3× a week — losing $40–80/month in
            rewards they should have earned. We show you the best card for every purchase. Free.
            Takes 2 minutes.
          </Text>

          {/* Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>$400–800</Text>
              <Text style={styles.heroStatLabel}>more per year</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>410+</Text>
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

          {/* Demo mode link — for screenshots & Product Hunt */}
          <TouchableOpacity
            onPress={() => {
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('demo', 'true');
                window.location.href = url.toString();
              }
            }}
            activeOpacity={0.7}
            style={styles.demoLink}
          >
            <Text style={styles.demoLinkText}>Try Demo (no signup)</Text>
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
      style={[styles.featureCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
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
        'At Loblaws, your Scotia Gold earns 6× — but your TD Cash Back earns 3%. Rewardly tells you which card wins for every purchase, every time. Works for 410+ Canadian cards.',
    },
    {
      icon: <Navigation size={28} color={colors.accent.main} />,
      title: 'Smart Wallet',
      description:
        'Walking into Shoppers Drug Mart? Your phone tells you which card to tap before you reach the checkout. No guessing, no fumbling, no missed rewards.',
    },
    {
      icon: <BarChart3 size={28} color={colors.info.main} />,
      title: 'Rewards IQ Score',
      description:
        "See exactly how optimized your card usage is — and where you're leaving money behind. Most users recover $40–60/month in missed rewards in the first week.",
    },
    {
      icon: <Sparkles size={28} color={colors.warning.main} />,
      title: 'Sage AI Assistant',
      description:
        'Ask: "Which card is best for my Costco run?" or "Should I get the TD Aeroplan or RBC Avion?" Real answers for Canadian cards — not American ones.',
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
      description:
        'Choose from 410+ Canadian credit cards — TD, RBC, CIBC, Scotiabank, BMO, Amex, and more.',
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
      title: 'Start Earning More',
      description:
        'Pull up Rewardly before you pay. The average user captures $400–800 more per year from the same spending.',
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

// ============================================================================
// How Rewardly Works Examples
// ============================================================================

function SocialProofSection() {
  const scenarios = [
    {
      scenario:
        "Shopping at Loblaws? Your Scotiabank Gold earns 6× on groceries vs 1× on your TD card — that's 5× more points on every trip.",
      emoji: '🛒',
      category: 'Groceries',
    },
    {
      scenario:
        "Gas station? Your CIBC Dividend Platinum gives 4% cash back vs 1% on most cards — that's $12 extra per tank on a $300 fill.",
      emoji: '⛽',
      category: 'Gas',
    },
    {
      scenario:
        'Booking a flight? Aeroplan points from your TD Aeroplan Visa are worth 2.1¢ each when booked for travel — not 1¢ like cash back.',
      emoji: '✈️',
      category: 'Travel',
    },
  ];

  return (
    <View style={socialStyles.section}>
      <Text style={socialStyles.label}>HOW REWARDLY WORKS</Text>
      <Text style={socialStyles.title}>Real Scenarios. Real Value.</Text>
      <View style={socialStyles.grid}>
        {scenarios.map((s, i) => (
          <View key={i} style={socialStyles.card}>
            <Text style={socialStyles.emoji}>{s.emoji}</Text>
            <Text style={socialStyles.category}>{s.category}</Text>
            <Text style={socialStyles.scenario}>{s.scenario}</Text>
          </View>
        ))}
      </View>
      <View style={socialStyles.statRow}>
        <View style={socialStyles.statItem}>
          <Text style={socialStyles.statValue}>$400–800</Text>
          <Text style={socialStyles.statLabel}>avg. additional rewards/year</Text>
        </View>
        <View style={socialStyles.statDivider} />
        <View style={socialStyles.statItem}>
          <Text style={socialStyles.statValue}>2 min</Text>
          <Text style={socialStyles.statLabel}>to get your first recommendation</Text>
        </View>
        <View style={socialStyles.statDivider} />
        <View style={socialStyles.statItem}>
          <Text style={socialStyles.statValue}>$0</Text>
          <Text style={socialStyles.statLabel}>to get started</Text>
        </View>
      </View>
    </View>
  );
}

const socialStyles = StyleSheet.create({
  section: {
    backgroundColor: '#0A0E1F',
    paddingVertical: 64,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.primary.main,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 1100,
    width: '100%',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    width: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 12,
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.main,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scenario: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary.main,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 120,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

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
    <View style={[styles.pricingCard, highlighted && styles.pricingCardHighlighted]}>
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
            <Check size={16} color={highlighted ? colors.primary.main : colors.text.secondary} />
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

function LifetimeBanner({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={styles.lifetimeBanner}>
      <LinearGradient colors={['#FFD70015', '#FF8C0008']} style={styles.lifetimeBannerGradient}>
        <View style={styles.lifetimeBannerBadge}>
          <Text style={styles.lifetimeBannerBadgeText}>🔥 EARLY ADOPTER SPECIAL</Text>
        </View>
        <Text style={styles.lifetimeBannerTitle}>Lifetime Deal</Text>
        <View style={styles.lifetimeBannerPriceRow}>
          <Text style={styles.lifetimeBannerPrice}>$49.99</Text>
          <Text style={styles.lifetimeBannerOnce}> one-time</Text>
        </View>
        <Text style={styles.lifetimeBannerDesc}>
          Get all Premium features forever. No monthly payments. Saves $155+/year.
        </Text>
        <View style={styles.lifetimeBannerFeatures}>
          <View style={styles.pricingFeatureRow}>
            <Check size={16} color="#FFD700" />
            <Text style={styles.pricingFeatureText}>Everything in Premium — forever</Text>
          </View>
          <View style={styles.pricingFeatureRow}>
            <Check size={16} color="#FFD700" />
            <Text style={styles.pricingFeatureText}>Unlimited Sage AI + Smart Wallet</Text>
          </View>
          <View style={styles.pricingFeatureRow}>
            <Check size={16} color="#FFD700" />
            <Text style={styles.pricingFeatureText}>All future features included</Text>
          </View>
          <View style={styles.pricingFeatureRow}>
            <Check size={16} color="#FFD700" />
            <Text style={styles.pricingFeatureText}>Pay once, never again</Text>
          </View>
        </View>
        <Text style={styles.lifetimeBannerUrgency}>⏳ Only available for first 100 users</Text>
        <TouchableOpacity onPress={onGetStarted} activeOpacity={0.9}>
          <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.pricingButton}>
            <Text style={styles.pricingButtonTextHighlighted}>Claim Lifetime Access</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
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
        'Smart Wallet',
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
      <Text style={styles.pricingSublabel}>Start free. Upgrade when you're ready.</Text>

      {/* Lifetime Deal Banner — above the pricing grid */}
      <LifetimeBanner onGetStarted={onGetStarted} />

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
          <Text style={styles.trustTitle}>Built for Canadians</Text>
          <Text style={styles.trustDesc}>
            TD, RBC, CIBC, Scotiabank, BMO — all 410+ cards supported
          </Text>
        </View>
        <View style={styles.trustItem}>
          <Shield size={24} color={colors.primary.main} />
          <Text style={styles.trustTitle}>No Bank Login Required</Text>
          <Text style={styles.trustDesc}>
            Rewardly never asks for your banking credentials. Ever.
          </Text>
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
          <Text style={styles.footerTagline}>Maximize every swipe.</Text>
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
            <TouchableOpacity
              onPress={() => Linking.openURL('/privacy-policy')}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerLink, styles.footerLinkClickable]}>Privacy Policy</Text>
            </TouchableOpacity>
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
        <Text style={styles.finalCTATitle}>Ready to Stop Leaving{'\n'}Money on the Table?</Text>
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
      stickyHeaderIndices={[0]}
    >
      <NavHeader onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
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
    paddingTop: SCREEN_WIDTH > 768 ? 80 : 48,
    paddingBottom: SCREEN_WIDTH > 768 ? 80 : 56,
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
  demoLink: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  demoLinkText: {
    fontSize: 14,
    color: colors.primary.light ?? colors.primary.main,
    textDecorationLine: 'underline',
    textAlign: 'center',
    opacity: 0.85,
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
  // Lifetime Banner
  lifetimeBanner: {
    width: '100%',
    maxWidth: SCREEN_WIDTH > 768 ? '100%' : 360,
    marginBottom: 32,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD70060',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  lifetimeBannerGradient: {
    padding: 28,
    alignItems: 'center',
  },
  lifetimeBannerBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  lifetimeBannerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  lifetimeBannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  lifetimeBannerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  lifetimeBannerPrice: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFD700',
  },
  lifetimeBannerOnce: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  lifetimeBannerDesc: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    maxWidth: 400,
  },
  lifetimeBannerFeatures: {
    gap: 10,
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 360,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  lifetimeBannerUrgency: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 20,
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
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(29, 219, 130, 0.15)' } : {}),
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
  footerLinkClickable: {
    textDecorationLine: 'underline',
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
