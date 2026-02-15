/**
 * CardDetailScreen - Full card detail view accessible from anywhere
 * 
 * A root-level screen that shows complete card information:
 * - Card name, issuer, network
 * - All reward rates by category
 * - Annual fee and sign-up bonus
 * - Benefits summary
 * - "Apply Now" button
 * 
 * This screen is registered in RootStack for easy navigation from any tab.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ArrowLeft, CreditCard, DollarSign, Gift, TrendingUp, Star, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Card, SpendingCategory } from '../types';
import { getCardByIdSync, getAllCardsSync } from '../services/CardDataService';
import { getCards } from '../services/CardPortfolioManager';
import { getBenefitsForCard } from '../services/BenefitsService';
import { getSpendingProfileSync } from '../services/SpendingProfileService';
import { calculateFeeBreakeven } from '../services/FeeBreakevenService';
import { calculateSignupBonusROI } from '../services/SignupBonusService';
import { AchievementEventEmitter } from '../services/AchievementEventEmitter';
import { ApplyNowButton, FeeBreakevenCard, SignupBonusCard } from '../components';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = RouteProp<RootStackParamList, 'CardDetail'>;

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  [SpendingCategory.GROCERIES]: 'Groceries',
  [SpendingCategory.DINING]: 'Dining',
  [SpendingCategory.GAS]: 'Gas',
  [SpendingCategory.TRAVEL]: 'Travel',
  [SpendingCategory.ONLINE_SHOPPING]: 'Online Shopping',
  [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
  [SpendingCategory.DRUGSTORES]: 'Drugstores',
  [SpendingCategory.HOME_IMPROVEMENT]: 'Home Improvement',
  [SpendingCategory.OTHER]: 'Everything Else',
};

// ============================================================================
// Reward Rate Card Component
// ============================================================================

interface RewardRateCardProps {
  category: string;
  rate: number;
  isBase?: boolean;
  index: number;
}

function RewardRateCard({ category, rate, isBase, index }: RewardRateCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(200)}
      style={[styles.rateCard, isBase && styles.rateCardBase]}
    >
      <Text style={styles.rateCategory}>
        {CATEGORY_LABELS[category] || category.replace(/_/g, ' ')}
      </Text>
      <Text style={[styles.rateValue, isBase && styles.rateValueBase]}>
        {rate}x
      </Text>
      {isBase && <Text style={styles.baseLabel}>Base</Text>}
    </Animated.View>
  );
}

// ============================================================================
// Info Row Component
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

function InfoRow({ icon, label, value, valueColor }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        {icon}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function CardDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { cardId } = route.params;

  const [feeBreakevenResult, setFeeBreakevenResult] = useState<any>(null);
  const [signupBonusResult, setSignupBonusResult] = useState<any>(null);
  const [hasSpendingProfile, setHasSpendingProfile] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  const card = useMemo(() => getCardByIdSync(cardId), [cardId]);
  const benefits = useMemo(() => getBenefitsForCard(cardId), [cardId]);
  const isOwnedCard = useMemo(() => {
    const portfolio = getCards();
    return portfolio.some((uc) => uc.cardId === cardId);
  }, [cardId]);

  // Track achievement on mount
  useEffect(() => {
    try { AchievementEventEmitter.track('card_benefits_viewed', { cardId }); } catch (_e) { /* setImmediate not available on web */ }
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

  // Get all reward rates sorted by value
  const rewardRates = useMemo(() => {
    if (!card?.rewardRates) return [];
    
    const rates: { category: string; rate: number; isBase: boolean }[] = [];
    
    // Add category-specific rates
    Object.entries(card.rewardRates).forEach(([category, rate]) => {
      if (category !== 'base' && rate > 0) {
        rates.push({ category, rate, isBase: false });
      }
    });
    
    // Sort by rate descending
    rates.sort((a, b) => b.rate - a.rate);
    
    // Add base rate at the end
    if (card.rewardRates.base) {
      rates.push({ category: 'base', rate: card.rewardRates.base, isBase: true });
    }
    
    return rates;
  }, [card]);

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleViewAllBenefits = useCallback(() => {
    // Navigate to CardBenefits in Insights stack for full benefits view
    navigation.navigate('Insights' as never, { 
      screen: 'CardBenefits', 
      params: { cardId } 
    } as never);
  }, [navigation, cardId]);

  if (!card) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Card Not Found</Text>
        <Text style={styles.errorDescription}>
          We couldn't find this card. It may have been removed.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Card Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card Info Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <CreditCard size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardIssuer}>{card.issuer}</Text>
          {card.network && (
            <Text style={styles.cardNetwork}>{card.network}</Text>
          )}
        </View>

        {/* Key Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Information</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon={<DollarSign size={18} color={colors.warning.main} />}
              label="Annual Fee"
              value={card.annualFee ? `$${card.annualFee}` : 'No Fee'}
              valueColor={card.annualFee ? colors.warning.main : colors.success.main}
            />
            {card.signupBonus && (
              <InfoRow
                icon={<Gift size={18} color={colors.success.main} />}
                label="Sign-Up Bonus"
                value={`${card.signupBonus.amount} ${card.signupBonus.currency === 'cashback' ? 'cash back' : 'points'} (spend $${card.signupBonus.spendRequirement} in ${Math.round(card.signupBonus.timeframeDays / 30)} mo)`}
              />
            )}
            {card.pointValuation && (
              <InfoRow
                icon={<TrendingUp size={18} color={colors.primary.main} />}
                label="Point Value"
                value={`${card.pointValuation}¢ each`}
              />
            )}
          </View>
        </View>

        {/* Reward Rates Section */}
        {rewardRates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reward Rates</Text>
            <View style={styles.ratesGrid}>
              {rewardRates.map((rate, index) => (
                <RewardRateCard
                  key={rate.category}
                  category={rate.category}
                  rate={rate.rate}
                  isBase={rate.isBase}
                  index={index}
                />
              ))}
            </View>
          </View>
        )}

        {/* Signup Bonus Analysis */}
        {!loadingAnalysis && signupBonusResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signup Bonus Analysis</Text>
            <SignupBonusCard result={signupBonusResult} />
          </View>
        )}

        {/* Fee Analysis */}
        {!loadingAnalysis && feeBreakevenResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fee Analysis</Text>
            <FeeBreakevenCard result={feeBreakevenResult} />
          </View>
        )}

        {/* Benefits Preview */}
        {benefits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={handleViewAllBenefits}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={16} color={colors.primary.main} />
              </TouchableOpacity>
            </View>
            <View style={styles.benefitsPreview}>
              {benefits.slice(0, 3).map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Star size={14} color={colors.primary.main} />
                  <Text style={styles.benefitText} numberOfLines={1}>
                    {benefit.name}
                  </Text>
                </View>
              ))}
              {benefits.length > 3 && (
                <Text style={styles.moreBenefits}>
                  +{benefits.length - 3} more benefits
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Spending Profile CTA */}
        {!loadingAnalysis && !hasSpendingProfile && (card.annualFee || card.signupBonus) && (
          <View style={styles.section}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Get Personalized Insights</Text>
              <Text style={styles.ctaDescription}>
                Set up your spending profile to see detailed analysis for this card.
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate('Insights' as never, { 
                  screen: 'WalletOptimizer' 
                } as never)}
              >
                <Text style={styles.ctaButtonText}>Set Up Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Apply Now Button - only for cards user doesn't own */}
        {!isOwnedCard && (
          <View style={styles.applySection}>
            <ApplyNowButton
              card={card}
              sourceScreen="CardDetail"
              variant="primary"
              showDisclosure
            />
          </View>
        )}

        {/* My Card Rewards Summary - only for cards user owns */}
        {isOwnedCard && card.categoryRewards && card.categoryRewards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rewards Summary</Text>
            <View style={styles.infoCard}>
              {card.categoryRewards.map((cr, index) => (
                <View key={index} style={styles.infoRow}>
                  <View style={styles.infoRowLeft}>
                    <DollarSign size={18} color={colors.success.main} />
                    <Text style={styles.infoLabel}>
                      {cr.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.success.main }]}>
                    {cr.rewardRate.unit === 'percent'
                      ? `${cr.rewardRate.value}% cash back`
                      : `${cr.rewardRate.value}x points`}
                  </Text>
                </View>
              ))}
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <DollarSign size={18} color={colors.text.tertiary} />
                  <Text style={styles.infoLabel}>Everything Else</Text>
                </View>
                <Text style={styles.infoValue}>
                  {card.baseRewardRate.unit === 'percent'
                    ? `${card.baseRewardRate.value}% cash back`
                    : `${card.baseRewardRate.value}x points`}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  heroCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardIssuer: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  cardNetwork: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ratesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rateCard: {
    backgroundColor: colors.success.main + '15',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.success.main + '30',
    minWidth: (SCREEN_WIDTH - 32 - 20) / 3,
    alignItems: 'center',
  },
  rateCardBase: {
    backgroundColor: colors.neutral.gray800,
    borderColor: colors.border.light,
  },
  rateCategory: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  rateValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success.main,
  },
  rateValueBase: {
    color: colors.text.secondary,
  },
  baseLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  benefitsPreview: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  moreBenefits: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
    marginTop: 4,
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
  applySection: {
    marginBottom: 24,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background.primary,
  },
});
