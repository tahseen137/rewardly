/**
 * CardBenefitsScreen - Display all card benefits grouped by category
 * 
 * Tier: Pro+ (Free sees first 2 benefits + locked overlay)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Plane, ShieldCheck, Umbrella, Star, DollarSign, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Benefit, BenefitCategory } from '../types';
import {
  getBenefitsForCard,
  getBenefitsByCategory,
  getVisibleBenefits,
  canViewAllBenefits,
  getLockedBenefitsCount,
  getBenefitCategoryName,
} from '../services/BenefitsService';
import { getCardByIdSync } from '../services/CardDataService';
import { getCurrentTierSync } from '../services/SubscriptionService';
import { getSpendingProfileSync } from '../services/SpendingProfileService';
import { calculateFeeBreakeven } from '../services/FeeBreakevenService';
import { calculateSignupBonusROI } from '../services/SignupBonusService';
import { AchievementEventEmitter } from '../services/AchievementEventEmitter';
import { LockedFeature, FeeBreakevenCard, SignupBonusCard, ApplyNowButton } from '../components';
import { InsightsStackParamList } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = RouteProp<InsightsStackParamList & { CardBenefits: { cardId: string } }, 'CardBenefits'>;

// ============================================================================
// Benefit Card Component
// ============================================================================

interface BenefitCardProps {
  benefit: Benefit;
  isLocked?: boolean;
  index: number;
}

function BenefitCard({ benefit, isLocked, index }: BenefitCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[styles.benefitCard, isLocked && styles.benefitCardLocked]}
    >
      <View style={styles.benefitHeader}>
        <Text style={styles.benefitName}>{benefit.name}</Text>
        {benefit.value && (
          <Text style={styles.benefitValue}>{benefit.value}</Text>
        )}
      </View>
      <Text style={[styles.benefitDescription, isLocked && styles.benefitDescriptionBlurred]}>
        {benefit.description}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// Benefits Section Component
// ============================================================================

interface BenefitsSectionProps {
  category: BenefitCategory;
  benefits: Benefit[];
  startIndex: number;
}

function BenefitsSection({ category, benefits, startIndex }: BenefitsSectionProps) {
  if (benefits.length === 0) return null;

  const getCategoryIcon = () => {
    switch (category) {
      case 'travel':
        return <Plane size={20} color={colors.primary.main} />;
      case 'purchase':
        return <ShieldCheck size={20} color={colors.secondary.main} />;
      case 'insurance':
        return <Umbrella size={20} color={colors.accent.main} />;
      case 'lifestyle':
        return <Star size={20} color={colors.warning.main} />;
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {getCategoryIcon()}
        <Text style={styles.sectionTitle}>{getBenefitCategoryName(category)}</Text>
      </View>
      {benefits.map((benefit, index) => (
        <BenefitCard
          key={`${category}-${index}`}
          benefit={benefit}
          index={startIndex + index}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function CardBenefitsScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { cardId } = route.params;

  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [hasAccess, setHasAccess] = useState(true);
  const [lockedCount, setLockedCount] = useState(0);
  const [feeBreakevenResult, setFeeBreakevenResult] = useState<any>(null);
  const [signupBonusResult, setSignupBonusResult] = useState<any>(null);
  const [hasSpendingProfile, setHasSpendingProfile] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  const card = useMemo(() => getCardByIdSync(cardId), [cardId]);

  // Track achievement on mount
  useEffect(() => {
    AchievementEventEmitter.track('card_benefits_viewed', { cardId });
  }, [cardId]);

  useEffect(() => {
    const allBenefits = getBenefitsForCard(cardId);
    const tier = getCurrentTierSync();
    const visible = getVisibleBenefits(allBenefits, tier);
    
    setBenefits(visible);
    setHasAccess(canViewAllBenefits(tier));
    setLockedCount(getLockedBenefitsCount(allBenefits.length, tier));
  }, [cardId]);

  // Load fee breakeven and signup bonus analysis
  useEffect(() => {
    const loadAnalysis = async () => {
      setLoadingAnalysis(true);
      const profile = getSpendingProfileSync();
      
      if (profile) {
        setHasSpendingProfile(true);
        
        // Calculate fee breakeven if card has annual fee
        if (card?.annualFee && card.annualFee > 0) {
          const feeResult = calculateFeeBreakeven(cardId, profile);
          if (feeResult.success) {
            setFeeBreakevenResult(feeResult.value);
          }
        }
        
        // Calculate signup bonus ROI if card has signup bonus
        if (card?.signupBonus) {
          const bonusResult = calculateSignupBonusROI(cardId, profile);
          if (bonusResult.success) {
            setSignupBonusResult(bonusResult.value);
          }
        }
      } else {
        setHasSpendingProfile(false);
      }
      
      setLoadingAnalysis(false);
    };
    
    if (card) {
      loadAnalysis();
    }
  }, [cardId, card]);

  const groupedBenefits = useMemo(() => {
    return getBenefitsByCategory(benefits);
  }, [benefits]);

  const renderContent = () => {
    if (benefits.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Star size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Benefits Data</Text>
          <Text style={styles.emptyDescription}>
            No benefits information is available for this card yet.
          </Text>
        </View>
      );
    }

    let benefitIndex = 0;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.cardName}>{card?.name}</Text>
          <Text style={styles.cardIssuer}>{card?.issuer}</Text>
        </View>

        {/* Travel Benefits */}
        {groupedBenefits.travel.length > 0 && (
          <BenefitsSection
            category="travel"
            benefits={groupedBenefits.travel}
            startIndex={benefitIndex}
          />
        )}
        {(benefitIndex += groupedBenefits.travel.length, null)}

        {/* Insurance Benefits */}
        {groupedBenefits.insurance.length > 0 && (
          <BenefitsSection
            category="insurance"
            benefits={groupedBenefits.insurance}
            startIndex={benefitIndex}
          />
        )}
        {(benefitIndex += groupedBenefits.insurance.length, null)}

        {/* Purchase Benefits */}
        {groupedBenefits.purchase.length > 0 && (
          <BenefitsSection
            category="purchase"
            benefits={groupedBenefits.purchase}
            startIndex={benefitIndex}
          />
        )}
        {(benefitIndex += groupedBenefits.purchase.length, null)}

        {/* Lifestyle Benefits */}
        {groupedBenefits.lifestyle.length > 0 && (
          <BenefitsSection
            category="lifestyle"
            benefits={groupedBenefits.lifestyle}
            startIndex={benefitIndex}
          />
        )}

        {/* Signup Bonus Analysis Section */}
        {!loadingAnalysis && signupBonusResult && (
          <View style={styles.analysisSection}>
            <View style={styles.analysisSectionHeader}>
              <TrendingUp size={20} color={colors.success.main} />
              <Text style={styles.analysisSectionTitle}>Signup Bonus Analysis</Text>
            </View>
            <SignupBonusCard result={signupBonusResult} />
          </View>
        )}

        {/* Fee Analysis Section */}
        {!loadingAnalysis && feeBreakevenResult && (
          <View style={styles.analysisSection}>
            <View style={styles.analysisSectionHeader}>
              <DollarSign size={20} color={colors.warning.main} />
              <Text style={styles.analysisSectionTitle}>Fee Analysis</Text>
            </View>
            <FeeBreakevenCard result={feeBreakevenResult} />
          </View>
        )}

        {/* No Spending Profile CTA */}
        {!loadingAnalysis && !hasSpendingProfile && (card?.annualFee || card?.signupBonus) && (
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Get Personalized Insights</Text>
              <Text style={styles.ctaDescription}>
                Set up your spending profile to see if this card's {card?.annualFee && card?.signupBonus ? 'fee and signup bonus are' : card?.annualFee ? 'fee is' : 'signup bonus is'} worth it for you.
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate('WalletOptimizer' as never)}
              >
                <Text style={styles.ctaButtonText}>Set Up Spending Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Apply Now CTA */}
        {card && (
          <View style={styles.applyNowSection}>
            <ApplyNowButton
              card={card}
              sourceScreen="CardBenefits"
              variant="primary"
              showDisclosure
            />
          </View>
        )}

        {/* Locked Benefits Banner */}
        {!hasAccess && lockedCount > 0 && (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>
              +{lockedCount} more benefit{lockedCount !== 1 ? 's' : ''} available with Pro
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  if (!hasAccess && lockedCount > 0) {
    return (
      <LockedFeature
        feature="insights"
        title="Unlock All Benefits"
        description={`Upgrade to Pro to see all ${benefits.length + lockedCount} benefits for this card.`}
        variant="overlay"
      >
        {renderContent()}
      </LockedFeature>
    );
  }

  return renderContent();
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardIssuer: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  benefitCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral.gray800,
  },
  benefitCardLocked: {
    opacity: 0.5,
  },
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  benefitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: 12,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  benefitDescriptionBlurred: {
    opacity: 0.3,
  },
  lockedBanner: {
    backgroundColor: colors.primary.main + '20',
    borderRadius: borderRadius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary.main + '40',
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  analysisSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ctaSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ctaCard: {
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary.main,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: colors.primary.dark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background.primary,
  },
  applyNowSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
});
