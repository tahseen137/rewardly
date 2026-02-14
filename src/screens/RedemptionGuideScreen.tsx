/**
 * RedemptionGuideScreen - F7: Reward Redemption Guide
 * Shows transfer partners and optimal redemption methods
 * Tier: Max
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plane, Hotel, CreditCard, Gift, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { LockedFeature } from '../components';
import { canAccessFeatureSync } from '../services/SubscriptionService';
import {
  getRedemptionGuide,
  formatCPP,
  getRatingForCPP,
  ProgramRedemption,
  TransferPartner,
} from '../services/RedemptionService';

// ============================================================================
// Transfer Partner Card
// ============================================================================

interface TransferPartnerCardProps {
  partner: TransferPartner;
}

function TransferPartnerCard({ partner }: TransferPartnerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = partner.partnerType === 'airline' ? Plane : Hotel;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.partnerCard}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <View style={styles.partnerHeader}>
          <Icon size={20} color={colors.primary.main} />
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{partner.partnerName}</Text>
            <Text style={styles.partnerType}>
              {partner.partnerType === 'airline' ? 'Airline' : 'Hotel'}
            </Text>
          </View>
          <View style={styles.partnerRatio}>
            <Text style={styles.partnerRatioText}>
              {partner.transferRatio}:1
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={20} color={colors.text.secondary} />
          ) : (
            <ChevronDown size={20} color={colors.text.secondary} />
          )}
        </View>

        {expanded && (
          <View style={styles.partnerDetails}>
            <View style={styles.partnerDetailRow}>
              <Text style={styles.partnerDetailLabel}>Transfer Time:</Text>
              <Text style={styles.partnerDetailValue}>{partner.transferTime}</Text>
            </View>
            
            {partner.sweetSpots.length > 0 && (
              <>
                <Text style={styles.sweetSpotsTitle}>Sweet Spots:</Text>
                {partner.sweetSpots.map((spot, index) => (
                  <Text key={index} style={styles.sweetSpot}>• {spot}</Text>
                ))}
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

interface Props {
  route: {
    params: {
      programId: string;
      cardId?: string;
    };
  };
}

export default function RedemptionGuideScreen({ route }: Props) {
  const { programId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [redemption, setRedemption] = useState<ProgramRedemption | null>(null);

  const hasAccess = canAccessFeatureSync('concierge_service'); // Max feature

  useEffect(() => {
    loadRedemptionGuide();
  }, [programId]);

  const loadRedemptionGuide = useCallback(async () => {
    try {
      const data = await getRedemptionGuide(programId);
      setRedemption(data);
    } catch (error) {
      console.error('Failed to load redemption guide:', error);
    } finally {
      setIsLoading(false);
    }
  }, [programId]);

  if (!hasAccess) {
    return (
      <LockedFeature
        feature="concierge_service"
        title="Redemption Guide"
        description="Maximize your points with transfer partners and redemption strategies"
        variant="overlay"
      >
        <View style={styles.container} />
      </LockedFeature>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!redemption) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load redemption guide</Text>
      </View>
    );
  }

  const directRating = getRatingForCPP(redemption.directRateCents);
  const optimalRating = getRatingForCPP(redemption.optimalRateCents);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{redemption.programName}</Text>
          <Text style={styles.subtitle}>Redemption Guide</Text>
        </View>

        <View style={styles.cppOverview}>
          <View style={styles.cppCard}>
            <Text style={styles.cppLabel}>Direct Redemption</Text>
            <Text style={styles.cppValue}>{formatCPP(redemption.directRateCents)}</Text>
            <Text style={styles.cppRating}>{directRating}</Text>
          </View>

          <TrendingUp size={24} color={colors.success.main} />

          <View style={styles.cppCard}>
            <Text style={styles.cppLabel}>Optimal Value</Text>
            <Text style={[styles.cppValue, { color: colors.success.main }]}>
              {formatCPP(redemption.optimalRateCents)}
            </Text>
            <Text style={styles.cppRating}>{optimalRating}</Text>
          </View>
        </View>

        <View style={styles.optimalMethod}>
          <Text style={styles.optimalMethodLabel}>Best Method:</Text>
          <Text style={styles.optimalMethodValue}>{redemption.optimalMethod}</Text>
        </View>

        {redemption.transferPartners.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Transfer Partners</Text>
            {redemption.transferPartners.map(partner => (
              <TransferPartnerCard key={partner.id} partner={partner} />
            ))}
          </>
        )}

        {redemption.redemptionOptions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Other Redemptions</Text>
            {redemption.redemptionOptions.map((option, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInDown.delay(index * 50).duration(400)}
                style={styles.optionCard}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionType}>{option.type}</Text>
                  <Text style={styles.optionCPP}>{formatCPP(option.centsPerPoint)}</Text>
                </View>
                {option.notes && (
                  <Text style={styles.optionNotes}>{option.notes}</Text>
                )}
              </Animated.View>
            ))}
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  cppOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  cppCard: {
    flex: 1,
    alignItems: 'center',
  },
  cppLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  cppValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cppRating: {
    fontSize: 11,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  optimalMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.md,
  },
  optimalMethodLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 8,
  },
  optimalMethodValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success.main,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  partnerCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  partnerType: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  partnerRatio: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  partnerRatioText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  partnerDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  partnerDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  partnerDetailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 8,
  },
  partnerDetailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  sweetSpotsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 8,
  },
  sweetSpot: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  optionCPP: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
  },
  optionNotes: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 16,
    color: colors.error.main,
    textAlign: 'center',
    marginTop: 40,
  },
});
