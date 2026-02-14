/**
 * AnnualFeeScreen - F6: Annual Fee Tracker
 * Shows which cards are worth keeping based on fees vs rewards
 * Tier: Pro+
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { LockedFeature } from '../components';
import { getCardByIdSync } from '../services/CardDataService';
import { canAccessFeatureSync } from '../services/SubscriptionService';
import {
  initializeAnnualFee,
  analyzeCardFees,
  getFeeSummary,
  setCardOpenDate,
  CardFeeAnalysis,
  FeeSummary,
} from '../services/AnnualFeeService';

// ============================================================================
// Worth Badge Component
// ============================================================================

interface WorthBadgeProps {
  worth: 'yes' | 'maybe' | 'no';
  reason?: string;
}

function WorthBadge({ worth, reason }: WorthBadgeProps) {
  const config = {
    yes: {
      icon: CheckCircle,
      color: colors.success.main,
      label: 'Worth Keeping',
      bg: colors.success.light,
    },
    maybe: {
      icon: AlertCircle,
      color: colors.warning.main,
      label: 'Review Needed',
      bg: colors.warning.light,
    },
    no: {
      icon: XCircle,
      color: colors.error.main,
      label: 'Consider Canceling',
      bg: colors.error.light,
    },
  };

  const { icon: Icon, color, label, bg } = config[worth];

  return (
    <View style={[styles.worthBadge, { backgroundColor: bg }]}>
      <Icon size={16} color={color} />
      <Text style={[styles.worthBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ============================================================================
// Fee Card Component
// ============================================================================

interface FeeCardProps {
  analysis: CardFeeAnalysis;
  onSetOpenDate: () => void;
}

function FeeCard({ analysis, onSetOpenDate }: FeeCardProps) {
  const card = getCardByIdSync(analysis.cardId);
  if (!card) return null;

  const isUpcoming = analysis.daysUntilRenewal !== null && analysis.daysUntilRenewal <= 30;

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[styles.feeCard, isUpcoming && styles.feeCardUpcoming]}
    >
      <View style={styles.feeCardHeader}>
        <View style={styles.feeCardInfo}>
          <Text style={styles.feeCardName}>{card.name}</Text>
          <Text style={styles.feeCardIssuer}>{card.issuer}</Text>
        </View>
        <TouchableOpacity onPress={onSetOpenDate} style={styles.editButton}>
          <Edit size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.feeCardStats}>
        <View style={styles.feeCardStat}>
          <DollarSign size={16} color={colors.error.main} />
          <Text style={styles.feeCardStatLabel}>Annual Fee</Text>
          <Text style={styles.feeCardStatValue}>${analysis.annualFee}</Text>
        </View>

        <View style={styles.feeCardStat}>
          <TrendingUp size={16} color={colors.success.main} />
          <Text style={styles.feeCardStatLabel}>Rewards Earned</Text>
          <Text style={styles.feeCardStatValue}>
            ${analysis.estimatedRewardsEarned.toFixed(2)}
          </Text>
        </View>

        <View style={styles.feeCardStat}>
          <DollarSign size={16} color={analysis.netValue >= 0 ? colors.success.main : colors.error.main} />
          <Text style={styles.feeCardStatLabel}>Net Value</Text>
          <Text style={[
            styles.feeCardStatValue,
            { color: analysis.netValue >= 0 ? colors.success.main : colors.error.main }
          ]}>
            ${Math.abs(analysis.netValue).toFixed(2)}
          </Text>
        </View>
      </View>

      {analysis.daysUntilRenewal !== null && (
        <View style={styles.feeCardRenewal}>
          <Calendar size={14} color={colors.text.secondary} />
          <Text style={styles.feeCardRenewalText}>
            Renews in {analysis.daysUntilRenewal} days
          </Text>
        </View>
      )}

      {!analysis.renewalDate && (
        <TouchableOpacity onPress={onSetOpenDate} style={styles.setDateButton}>
          <Text style={styles.setDateButtonText}>Set Card Open Date</Text>
        </TouchableOpacity>
      )}

      <WorthBadge worth={analysis.worthKeeping} reason={analysis.worthReason} />
    </Animated.View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function AnnualFeeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyses, setAnalyses] = useState<CardFeeAnalysis[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const hasAccess = canAccessFeatureSync('benefits_tracking'); // Pro+ feature

  const loadData = useCallback(async () => {
    try {
      await initializeAnnualFee();
      const [feeAnalyses, feeSummary] = await Promise.all([
        analyzeCardFees(),
        getFeeSummary(),
      ]);
      setAnalyses(feeAnalyses);
      setSummary(feeSummary);
    } catch (error) {
      console.error('Failed to load annual fee data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleSetOpenDate = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
    setShowDateModal(true);
  }, []);

  const handleSaveDate = useCallback(async () => {
    if (!selectedCardId) return;
    
    await setCardOpenDate(selectedCardId, selectedDate);
    setShowDateModal(false);
    await loadData();
  }, [selectedCardId, selectedDate, loadData]);

  const upcomingRenewals = useMemo(() => 
    analyses.filter(a => a.daysUntilRenewal !== null && a.daysUntilRenewal <= 30)
  , [analyses]);

  const allFeesAnalyses = useMemo(() => analyses, [analyses]);

  if (!hasAccess) {
    return (
      <LockedFeature
        feature="benefits_tracking"
        title="Annual Fee Tracker"
        description="See which cards are worth keeping based on fees vs rewards earned"
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Annual Fees</Text>
          <Text style={styles.subtitle}>Are your cards worth keeping?</Text>
        </View>

        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryLabel}>Total Fees</Text>
                <Text style={styles.summaryValue}>${summary.totalAnnualFees}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryLabel}>Rewards Earned</Text>
                <Text style={[styles.summaryValue, { color: colors.success.main }]}>
                  ${summary.totalRewardsEarned.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryLabel}>Net Value</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: summary.netValue >= 0 ? colors.success.main : colors.error.main }
                ]}>
                  ${Math.abs(summary.netValue).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryLabel}>Cards Status</Text>
                <Text style={styles.summaryValue}>
                  {summary.cardsWorthKeeping} OK / {summary.cardsToReview} Review
                </Text>
              </View>
            </View>
          </View>
        )}

        {upcomingRenewals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Renewals</Text>
            {upcomingRenewals.map(analysis => (
              <FeeCard
                key={analysis.cardId}
                analysis={analysis}
                onSetOpenDate={() => handleSetOpenDate(analysis.cardId)}
              />
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>All Cards with Fees</Text>
        {allFeesAnalyses.length > 0 ? (
          allFeesAnalyses.map(analysis => (
            <FeeCard
              key={analysis.cardId}
              analysis={analysis}
              onSetOpenDate={() => handleSetOpenDate(analysis.cardId)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No cards with annual fees</Text>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Card Open Date</Text>
            <Text style={styles.modalDescription}>
              When did you open this card? This helps calculate your renewal date.
            </Text>
            
            {/* Simple date input - in production would use DateTimePicker */}
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={selectedDate.toISOString().split('T')[0]}
              onChangeText={(text) => {
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                  setSelectedDate(date);
                }
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveDate}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryStat: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  feeCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  feeCardUpcoming: {
    borderColor: colors.warning.main,
    borderWidth: 2,
  },
  feeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  feeCardInfo: {
    flex: 1,
  },
  feeCardName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  feeCardIssuer: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  editButton: {
    padding: 8,
  },
  feeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feeCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  feeCardStatLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  feeCardStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  feeCardRenewal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  feeCardRenewalText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  setDateButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  setDateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.background.primary,
  },
  worthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginTop: 12,
  },
  worthBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  dateInput: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background.tertiary,
  },
  modalButtonSave: {
    backgroundColor: colors.primary.main,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
});
