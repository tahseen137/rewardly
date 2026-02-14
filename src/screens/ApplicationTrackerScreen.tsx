/**
 * ApplicationTrackerScreen - F16: 5/24 Tracker UI
 * 
 * Features:
 * - Hero section: X/24 cards with visual gauge
 * - Issuer cooldown status cards
 * - Application timeline list
 * - Add Application form
 * - Strategy advice section
 * - Tier gating: Free = basic count, Pro = cooldowns + timeline, Max = strategy advisor
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Calendar, AlertCircle, TrendingUp, Clock } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTheme, Theme } from '../theme';
import {
  initializeApplicationTracker,
  getApplications,
  getTrackerState,
  addApplication,
  deleteApplication,
  ISSUER_RULES,
} from '../services/ApplicationTrackerService';
import { getAllCardsSync } from '../services/CardDataService';
import { canAccessFeatureSync, getCurrentTierSync } from '../services/SubscriptionService';
import {
  ApplicationTracker,
  CardApplication,
  ApplicationStatus,
  IssuerCooldownStatus,
  ApplicationTimelineEvent,
  SubscriptionTier,
} from '../types';

type ViewMode = 'overview' | 'add';

export default function ApplicationTrackerScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [tracker, setTracker] = useState<ApplicationTracker | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [tier, setTier] = useState<SubscriptionTier>('free');

  // Form state
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [applicationDate, setApplicationDate] = useState(new Date());
  const [status, setStatus] = useState<ApplicationStatus>('approved');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await initializeApplicationTracker();
      const state = await getTrackerState();
      setTracker(state);
      setTier(getCurrentTierSync());
    } catch (error) {
      console.error('Failed to load tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const allCards = useMemo(() => getAllCardsSync(), []);

  const handleAddApplication = async () => {
    if (!selectedCardId) {
      Alert.alert('Error', 'Please select a card');
      return;
    }

    const card = allCards.find(c => c.id === selectedCardId);
    if (!card) return;

    setSaving(true);
    try {
      const result = await addApplication({
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        applicationDate,
        status,
      });

      if (result.success) {
        await loadData();
        setViewMode('overview');
        setSelectedCardId('');
        setApplicationDate(new Date());
        setStatus('approved');
      } else {
        Alert.alert('Error', 'Failed to add application');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save application');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteApplication(appId);
            await loadData();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Tracker</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  if (!tracker) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Tracker</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load tracker</Text>
        </View>
      </View>
    );
  }

  if (viewMode === 'add') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('overview')} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Application</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Card Selection */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Select Card</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScrollView}>
              {allCards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardOption,
                    selectedCardId === card.id && styles.cardOptionSelected,
                  ]}
                  onPress={() => setSelectedCardId(card.id)}
                >
                  <Text style={[
                    styles.cardOptionName,
                    selectedCardId === card.id && styles.cardOptionNameSelected,
                  ]}>
                    {card.name}
                  </Text>
                  <Text style={styles.cardOptionIssuer}>{card.issuer}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Application Date */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Application Date</Text>
            <Text style={styles.dateDisplay}>
              {applicationDate.toLocaleDateString()}
            </Text>
            <Text style={styles.formHint}>Tap to change date (future feature)</Text>
          </View>

          {/* Status */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'approved' && styles.statusButtonActive,
                ]}
                onPress={() => setStatus('approved')}
              >
                <Text style={[
                  styles.statusButtonText,
                  status === 'approved' && styles.statusButtonTextActive,
                ]}>
                  Approved
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'pending' && styles.statusButtonActive,
                ]}
                onPress={() => setStatus('pending')}
              >
                <Text style={[
                  styles.statusButtonText,
                  status === 'pending' && styles.statusButtonTextActive,
                ]}>
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'denied' && styles.statusButtonActive,
                ]}
                onPress={() => setStatus('denied')}
              >
                <Text style={[
                  styles.statusButtonText,
                  status === 'denied' && styles.statusButtonTextActive,
                ]}>
                  Denied
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (!selectedCardId || saving) && styles.saveButtonDisabled]}
            onPress={handleAddApplication}
            disabled={!selectedCardId || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Add Application</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Tracker</Text>
        <TouchableOpacity onPress={() => setViewMode('add')} style={styles.addButton}>
          <Plus size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section - X/24 Gauge */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>5/24 Status</Text>
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeCircle}>
                <Text style={styles.gaugeNumber}>{tracker.countLast24Months}</Text>
                <Text style={styles.gaugeDenominator}>/24</Text>
              </View>
            </View>
            <Text style={styles.heroSubtitle}>
              {tracker.countLast24Months === 0
                ? 'You have no applications in the last 24 months'
                : tracker.countLast24Months >= 5
                ? 'You are over 5/24 - Chase cards will be difficult'
                : `${5 - tracker.countLast24Months} more card${5 - tracker.countLast24Months === 1 ? '' : 's'} until 5/24`}
            </Text>
            
            {/* Visual gauge bar */}
            <View style={styles.gaugeBar}>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.gaugeSegment,
                    i < tracker.countLast24Months && styles.gaugeSegmentFilled,
                    i === 4 && tracker.countLast24Months >= 5 && styles.gaugeSegmentWarning,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Pro Feature Gate - Cooldowns */}
        {tier === 'free' ? (
          <View style={styles.tierGateCard}>
            <View style={styles.tierGateIcon}>
              <TrendingUp size={24} color={colors.primary.main} />
            </View>
            <View style={styles.tierGateContent}>
              <Text style={styles.tierGateTitle}>Upgrade to Pro</Text>
              <Text style={styles.tierGateDescription}>
                Track issuer cooldowns, application timeline, and get eligibility alerts
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.tierGateButton}
              onPress={() => navigation.navigate('Upgrade' as never, { feature: 'application_tracker' } as never)}
            >
              <Text style={styles.tierGateButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Issuer Cooldown Status Cards */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Issuer Cooldowns</Text>
              {tracker.issuerCooldowns.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No applications yet</Text>
                </View>
              ) : (
                <View style={styles.cooldownGrid}>
                  {tracker.issuerCooldowns.map(cooldown => (
                    <View
                      key={cooldown.issuer}
                      style={[
                        styles.cooldownCard,
                        cooldown.isEligible ? styles.cooldownCardEligible : styles.cooldownCardWaiting,
                      ]}
                    >
                      <View style={styles.cooldownHeader}>
                        <Text style={styles.cooldownIssuer}>{cooldown.issuer}</Text>
                        <Text style={styles.cooldownStatus}>
                          {cooldown.isEligible ? '✅' : '⏳'}
                        </Text>
                      </View>
                      <Text style={styles.cooldownDescription}>
                        {cooldown.isEligible
                          ? 'Eligible to apply'
                          : `Wait ${cooldown.daysUntilEligible} day${cooldown.daysUntilEligible === 1 ? '' : 's'}`}
                      </Text>
                      {cooldown.rule.cooldownDays > 0 && (
                        <Text style={styles.cooldownRule}>
                          {cooldown.rule.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Application Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Application Timeline</Text>
              {tracker.applications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Add your first application to track eligibility
                  </Text>
                </View>
              ) : (
                <View style={styles.timeline}>
                  {tracker.applications.map((app, index) => (
                    <View key={app.id} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      {index < tracker.applications.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <View style={styles.timelineInfo}>
                            <Text style={styles.timelineCardName}>{app.cardName}</Text>
                            <Text style={styles.timelineDate}>
                              {new Date(app.applicationDate).toLocaleDateString()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteApplication(app.id)}
                            style={styles.deleteButton}
                          >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.timelineIssuer}>{app.issuer}</Text>
                        <Text style={styles.timelineFalloff}>
                          Falls off: {new Date(app.fallOffDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Max Feature Gate - Strategy Advisor */}
        {tier !== 'max' && (
          <View style={styles.tierGateCard}>
            <View style={styles.tierGateIcon}>
              <TrendingUp size={24} color={colors.primary.main} />
            </View>
            <View style={styles.tierGateContent}>
              <Text style={styles.tierGateTitle}>Upgrade to Max</Text>
              <Text style={styles.tierGateDescription}>
                Get AI-powered strategy advice on when to apply for cards
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.tierGateButton}
              onPress={() => navigation.navigate('Upgrade' as never, { feature: 'strategy_advisor' } as never)}
            >
              <Text style={styles.tierGateButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alerts */}
        {tracker.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            <View style={styles.alertsList}>
              {tracker.alerts.map(alert => (
                <View key={alert.id} style={styles.alertCard}>
                  <AlertCircle size={20} color={colors.warning.main} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 15,
      color: colors.text.secondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    heroCard: {
      backgroundColor: colors.primary.bg20,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.primary.main,
    },
    heroContent: {
      alignItems: 'center',
    },
    heroTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary.dark,
      marginBottom: 16,
    },
    gaugeContainer: {
      marginBottom: 16,
    },
    gaugeCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 8,
      borderColor: colors.primary.light,
    },
    gaugeNumber: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.background.primary,
    },
    gaugeDenominator: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.background.primary,
      opacity: 0.8,
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.primary.dark,
      textAlign: 'center',
      marginBottom: 16,
    },
    gaugeBar: {
      flexDirection: 'row',
      gap: 4,
      width: '100%',
      maxWidth: 200,
    },
    gaugeSegment: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border.light,
      borderRadius: 4,
    },
    gaugeSegmentFilled: {
      backgroundColor: colors.primary.main,
    },
    gaugeSegmentWarning: {
      backgroundColor: colors.error.main,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 12,
    },
    cooldownGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    cooldownCard: {
      width: Platform.OS === 'web' ? 'calc(50% - 6px)' : '48%',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
    },
    cooldownCardEligible: {
      borderColor: colors.success.main,
    },
    cooldownCardWaiting: {
      borderColor: colors.warning.main,
    },
    cooldownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cooldownIssuer: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
    },
    cooldownStatus: {
      fontSize: 20,
    },
    cooldownDescription: {
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    cooldownRule: {
      fontSize: 11,
      color: colors.text.tertiary,
      lineHeight: 14,
    },
    timeline: {
      gap: 0,
    },
    timelineItem: {
      flexDirection: 'row',
      position: 'relative',
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary.main,
      marginTop: 4,
      zIndex: 1,
    },
    timelineLine: {
      position: 'absolute',
      left: 5,
      top: 16,
      width: 2,
      height: '100%',
      backgroundColor: colors.border.light,
    },
    timelineContent: {
      flex: 1,
      marginLeft: 16,
      paddingBottom: 20,
    },
    timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    timelineInfo: {
      flex: 1,
    },
    timelineCardName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    timelineDate: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    timelineIssuer: {
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    timelineFalloff: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    deleteButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.error.bg20,
    },
    deleteButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.error.main,
    },
    emptyState: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    tierGateCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary.main,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    tierGateIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary.bg20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierGateContent: {
      flex: 1,
    },
    tierGateTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    tierGateDescription: {
      fontSize: 13,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    tierGateButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary.main,
    },
    tierGateButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.background.primary,
    },
    alertsList: {
      gap: 12,
    },
    alertCard: {
      backgroundColor: colors.warning.bg20,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.warning.main,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.warning.dark,
      marginBottom: 4,
    },
    alertMessage: {
      fontSize: 13,
      color: colors.warning.dark,
      lineHeight: 18,
    },
    // Add Application Form Styles
    formSection: {
      marginBottom: 24,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 12,
    },
    formHint: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 4,
    },
    cardScrollView: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
    },
    cardOption: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      borderWidth: 2,
      borderColor: colors.border.light,
      minWidth: 160,
    },
    cardOptionSelected: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.bg20,
    },
    cardOptionName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    cardOptionNameSelected: {
      color: colors.primary.dark,
    },
    cardOptionIssuer: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    dateDisplay: {
      fontSize: 16,
      color: colors.text.primary,
      fontWeight: '500',
    },
    statusButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    statusButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.background.secondary,
      borderWidth: 2,
      borderColor: colors.border.light,
      alignItems: 'center',
    },
    statusButtonActive: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.bg20,
    },
    statusButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    statusButtonTextActive: {
      color: colors.primary.dark,
    },
    saveButton: {
      backgroundColor: colors.primary.main,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.background.primary,
    },
  });
