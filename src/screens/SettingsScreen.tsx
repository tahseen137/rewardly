/**
 * SettingsScreen - User preferences and settings
 * Redesigned to match web with section grouping and lucide icons
 * Now includes country selector and account management
 * Requirements: 5.1, 3.4
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Bell, Globe, RefreshCw, Info, MapPin, LogOut, LogIn, User, Crown, Navigation, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

import {
  isNewCardSuggestionsEnabled,
  setNewCardSuggestionsEnabled,
  getLanguage,
  setLanguage,
  getCountry,
  setCountry,
  getCountryFlag,
  getCountryName,
  initializePreferences,
  Language,
  Country,
} from '../services/PreferenceManager';
import { refreshCards, getLastSyncTime, getAllCards, onCountryChange, getTotalCardCount } from '../services/CardDataService';
import { CountryChangeEmitter } from '../services/CountryChangeEmitter';
import { isSupabaseConfigured } from '../services/supabase';
import { getCurrentUser, signOut, AuthUser } from '../services/AuthService';
import { 
  getCurrentTier, 
  SUBSCRIPTION_TIERS, 
  SubscriptionTier,
  getSageUsage,
  SageUsage,
  isAdminSync,
  getSubscriptionState,
  SubscriptionState,
  SAGE_LIMITS,
  refreshSubscription,
  openCustomerPortal,
} from '../services/SubscriptionService';
import Paywall from '../components/Paywall';
import {
  isAutoPilotEnabled,
  enableAutoPilot,
  disableAutoPilot,
  getAutoPilotStatus,
  initializeAutoPilot,
  AutoPilotStatus,
} from '../services/AutoPilotService';

/**
 * Language options
 */
const LANGUAGE_OPTIONS: Array<{ code: Language; labelKey: string; icon: string }> = [
  { code: 'en', labelKey: 'languages.en', icon: '🇬🇧' },
  { code: 'fr', labelKey: 'languages.fr', icon: '🇫🇷' },
];

/**
 * Country options
 */
const COUNTRY_OPTIONS: Country[] = ['US', 'CA'];

/**
 * Settings section header component
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

/**
 * Settings row component (matches web design)
 */
function SettingsRow({
  icon,
  title,
  description,
  children,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const content = (
    <View style={[styles.settingsRow, !isLast && styles.settingsRowBorder]}>
      <View style={styles.settingsRowIcon}>{icon}</View>
      <View style={styles.settingsRowContent}>
        <Text style={styles.settingsRowTitle}>{title}</Text>
        {description && <Text style={styles.settingsRowDescription}>{description}</Text>}
      </View>
      <View style={styles.settingsRowAction}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface SettingsScreenProps {
  onSignOut?: () => void;
  onSignIn?: () => void;
}

export default function SettingsScreen({ onSignOut, onSignIn }: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const [newCardSuggestions, setNewCardSuggestions] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentCountry, setCurrentCountry] = useState<Country>('US');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);
  const [cardCountDetail, setCardCountDetail] = useState<string>('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);
  const [sageUsage, setSageUsage] = useState<SageUsage | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [autoPilotStatus, setAutoPilotStatus] = useState<AutoPilotStatus | null>(null);

  const loadPreferences = useCallback(async () => {
    await initializePreferences();
    setNewCardSuggestions(isNewCardSuggestionsEnabled());
    setCurrentLanguage(getLanguage());
    setCurrentCountry(getCountry());

    // Load user
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    // Load subscription tier and state
    await refreshSubscription();
    const tier = await getCurrentTier();
    setSubscriptionTier(tier);
    
    const subState = await getSubscriptionState();
    setSubscriptionState(subState);
    
    // Load Sage usage if user has access
    if (tier === 'pro') {
      const usage = await getSageUsage();
      setSageUsage(usage);
    }

    // Load card count and last sync time
    try {
      const cardStats = await getTotalCardCount();
      setCardCount(cardStats.total);
      setCardCountDetail(`${cardStats.us} US + ${cardStats.ca} CA`);
    } catch {
      setCardCount(0);
      setCardCountDetail('');
    }
    const syncTime = await getLastSyncTime();
    setLastSync(syncTime);

    // Load AutoPilot status
    await initializeAutoPilot();
    const apStatus = await getAutoPilotStatus();
    setAutoPilotStatus(apStatus);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleNewCardSuggestionsChange = async (enabled: boolean) => {
    setNewCardSuggestions(enabled);
    await setNewCardSuggestionsEnabled(enabled);
  };

  const handleLanguageChange = async (lang: Language) => {
    setCurrentLanguage(lang);
    await setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const performCountrySwitch = async (country: Country) => {
    setIsLoading(true);
    setCurrentCountry(country);
    await setCountry(country);
    await onCountryChange();
    
    // Reload cards for new country
    try {
      const cardStats = await getTotalCardCount();
      setCardCount(cardStats.total);
      setCardCountDetail(`${cardStats.us} US + ${cardStats.ca} CA`);
    } catch {
      setCardCount(0);
      setCardCountDetail('');
    }
    
    // Notify other screens (HomeScreen) that country has changed
    CountryChangeEmitter.emit();
    
    setIsLoading(false);
  };

  const handleCountryChange = async (country: Country) => {
    if (country === currentCountry) return;
    
    // On web, Alert.alert callbacks don't work reliably — switch directly
    if (Platform.OS === 'web') {
      await performCountrySwitch(country);
      return;
    }
    
    // On native, show confirmation dialog
    Alert.alert(
      t('settings.changeCountryTitle'),
      t('settings.changeCountryMessage', { country: getCountryName(country) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: () => performCountrySwitch(country),
        },
      ]
    );
  };

  const handleRefreshCards = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(t('settings.refreshCards'), t('settings.supabaseNotConfigured'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    setIsRefreshing(true);
    try {
      const cards = await refreshCards();
      const cardStats = await getTotalCardCount();
      setCardCount(cardStats.total);
      setCardCountDetail(`${cardStats.us} US + ${cardStats.ca} CA`);
      const syncTime = await getLastSyncTime();
      setLastSync(syncTime);

      Alert.alert(
        t('settings.refreshSuccess'),
        t('settings.refreshSuccessMessage', { count: cardStats.total }),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(t('settings.refreshError'), t('settings.refreshErrorMessage'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('settings.signOutTitle'),
      t('settings.signOutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onSignOut?.();
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const handleAutoPilotToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enableAutoPilot();
      if (!success) {
        Alert.alert(
          t('settings.autoPilotPermissionTitle') || 'Permission Required',
          t('settings.autoPilotPermissionMessage') || 'AutoPilot needs location and notification permissions to work. Please enable them in your device settings.',
          [{ text: t('common.ok') || 'OK' }]
        );
        return;
      }
    } else {
      await disableAutoPilot();
    }
    const status = await getAutoPilotStatus();
    setAutoPilotStatus(status);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const getLanguageLabel = (lang: Language) => {
    return lang === 'en' ? 'English' : 'Français';
  };

  const tierConfig = SUBSCRIPTION_TIERS[subscriptionTier];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title') || 'Settings'}</Text>
          <Text style={styles.subtitle}>{t('settings.customizeExperience')}</Text>
        </View>

        {/* Account Section */}
        {user && (
          <>
            <SectionHeader title={t('settings.account')} />
            <View style={styles.section}>
              <SettingsRow
                icon={<User size={20} color={colors.text.secondary} />}
                title={user.displayName || user.email || t('settings.guest')}
                description={user.isAnonymous ? t('settings.signInPrompt') : user.email || undefined}
                isLast={false}
              >
                {!user.isAnonymous ? (
                  <TouchableOpacity onPress={handleSignOut}>
                    <LogOut size={20} color={colors.error.main} />
                  </TouchableOpacity>
                ) : onSignIn ? (
                  <TouchableOpacity onPress={onSignIn} style={styles.signInButton}>
                    <Text style={styles.signInText}>{t('settings.signIn')}</Text>
                    <LogIn size={18} color={colors.primary.main} />
                  </TouchableOpacity>
                ) : null}
              </SettingsRow>

              <SettingsRow
                icon={<Crown size={20} color={subscriptionState?.isAdmin ? colors.warning.main : tierConfig.id === 'free' ? colors.text.secondary : colors.primary.main} />}
                title={t('settings.subscription')}
                description={subscriptionState?.isAdmin ? 'Admin Access' : tierConfig.name}
                isLast={subscriptionTier !== 'pro'}
                onPress={subscriptionTier === 'free' ? handleUpgrade : undefined}
              >
                {subscriptionTier === 'free' && (
                  <Text style={styles.upgradeText}>{t('settings.upgrade')}</Text>
                )}
                {subscriptionState?.isAdmin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                )}
                {(subscriptionTier === 'pro' || subscriptionTier === 'max') && !subscriptionState?.isAdmin && (
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={async () => {
                      try {
                        const result = await openCustomerPortal();
                        if ('error' in result) {
                          Alert.alert('Error', result.error);
                        } else if (result.url) {
                          const supported = await Linking.canOpenURL(result.url);
                          if (supported) {
                            await Linking.openURL(result.url);
                          } else {
                            Alert.alert('Error', 'Unable to open settings page');
                          }
                        }
                      } catch (error) {
                        console.error('Portal error:', error);
                        Alert.alert('Error', 'Failed to open subscription management');
                      }
                    }}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                    <ChevronRight size={14} color={colors.primary.main} />
                  </TouchableOpacity>
                )}
              </SettingsRow>
              
              {/* Sage usage for Pro users */}
              {subscriptionTier === 'pro' && sageUsage && sageUsage.limit !== null && (
                <SettingsRow
                  icon={<Crown size={20} color={colors.primary.main} />}
                  title="Sage AI Usage"
                  description={`${sageUsage.chatCount} of ${sageUsage.limit} chats used this month`}
                  isLast={true}
                >
                  <Text style={[
                    styles.usageText,
                    sageUsage.remaining !== null && sageUsage.remaining <= 2 && styles.usageTextWarning,
                    sageUsage.remaining !== null && sageUsage.remaining === 0 && styles.usageTextDanger,
                  ]}>
                    {sageUsage.remaining ?? 0} left
                  </Text>
                </SettingsRow>
              )}
            </View>
          </>
        )}

        {/* Region Section */}
        <SectionHeader title={t('settings.region')} />
        <View style={styles.section}>
          <SettingsRow
            icon={<MapPin size={20} color={colors.text.secondary} />}
            title={t('settings.country')}
            description={t('settings.countryDescription')}
            isLast={true}
          >
            <View style={styles.countryToggle}>
              {COUNTRY_OPTIONS.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.countryOption,
                    currentCountry === country && styles.countryOptionActive,
                  ]}
                  onPress={() => handleCountryChange(country)}
                >
                  <Text style={styles.countryFlag}>{getCountryFlag(country)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingsRow>
        </View>

        {/* Preferences Section */}
        <SectionHeader title={t('settings.preferences')} />
        <View style={styles.section}>
          <SettingsRow
            icon={<Bell size={20} color={colors.text.secondary} />}
            title={t('settings.newCardSuggestions')}
            description={t('settings.newCardSuggestionsDescription')}
            isLast={false}
          >
            <Switch
              value={newCardSuggestions}
              onValueChange={handleNewCardSuggestionsChange}
              trackColor={{ false: colors.border.light, true: colors.success.main }}
              thumbColor={colors.background.secondary}
              accessibilityLabel={t('settings.newCardSuggestions')}
              accessibilityRole="switch"
            />
          </SettingsRow>

          <SettingsRow
            icon={<Globe size={20} color={colors.text.secondary} />}
            title={t('settings.language')}
            description={t('settings.languageDescription')}
            isLast={true}
            onPress={() => {
              // Toggle language for now (can be enhanced to a modal)
              const newLang = currentLanguage === 'en' ? 'fr' : 'en';
              handleLanguageChange(newLang);
            }}
          >
            <Text style={styles.languageValue}>{getLanguageLabel(currentLanguage)}</Text>
          </SettingsRow>
        </View>

        {/* AutoPilot Section */}
        <SectionHeader title={t('settings.autoPilot') || 'AutoPilot'} />
        <View style={styles.section}>
          <SettingsRow
            icon={<Navigation size={20} color={autoPilotStatus?.enabled ? colors.primary.main : colors.text.secondary} />}
            title={t('settings.autoPilotEnabled') || 'Enable AutoPilot'}
            description={
              autoPilotStatus?.enabled
                ? t('settings.autoPilotActiveDescription', { count: autoPilotStatus.activeGeofences })
                : t('settings.autoPilotDescription')
            }
            isLast={true}
          >
            <Switch
              value={autoPilotStatus?.enabled || false}
              onValueChange={handleAutoPilotToggle}
              trackColor={{ false: colors.border.light, true: colors.success.main }}
              thumbColor={colors.background.secondary}
              accessibilityLabel={t('settings.autoPilotEnabled') || 'Enable AutoPilot'}
              accessibilityRole="switch"
            />
          </SettingsRow>
        </View>

        {/* Data Section */}
        <SectionHeader title={t('settings.data')} />
        <View style={styles.section}>
          <SettingsRow
            icon={
              <RefreshCw
                size={20}
                color={colors.text.secondary}
                style={isRefreshing ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            }
            title={t('settings.refreshCards')}
            description={t('settings.refreshCardsDescription')}
            isLast={true}
            onPress={isRefreshing ? undefined : handleRefreshCards}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.primary.main} />
            ) : (
              <Text style={styles.syncButtonText}>{t('settings.syncNow')}</Text>
            )}
          </SettingsRow>
        </View>

        {/* About Section */}
        <SectionHeader title={t('settings.about')} />
        <View style={styles.section}>
          <SettingsRow
            icon={<Info size={20} color={colors.text.secondary} />}
            title={t('settings.appVersion')}
            description="Rewardly"
            isLast={false}
          >
            <Text style={styles.aboutValue}>1.0.0</Text>
          </SettingsRow>

          <SettingsRow
            icon={<Info size={20} color={colors.text.secondary} />}
            title={t('settings.cardsInDatabase')}
            description={
              cardCountDetail
                ? `${cardCountDetail}${lastSync ? ` • ${t('settings.lastSynced')}: ${lastSync.toLocaleDateString()}` : ''}`
                : lastSync
                ? `${t('settings.lastSynced')}: ${lastSync.toLocaleDateString()}`
                : undefined
            }
            isLast={true}
          >
            <Text style={styles.aboutValue}>{cardCount}</Text>
          </SettingsRow>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.footerText')}</Text>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={async (tier) => {
          setSubscriptionTier(tier);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  // Header
  header: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // bold
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13, // text-sm
    color: colors.text.secondary,
  },
  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 13, // text-sm
    fontWeight: '500', // font-medium
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5, // tracking-wide
  },
  // Section Container
  section: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsRowIcon: {
    flexShrink: 0,
  },
  settingsRowContent: {
    flex: 1,
    minWidth: 0,
  },
  settingsRowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingsRowDescription: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  settingsRowAction: {
    flexShrink: 0,
  },
  // Country toggle
  countryToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: 4,
    gap: 4,
  },
  countryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  countryOptionActive: {
    backgroundColor: colors.primary.bg20,
  },
  countryFlag: {
    fontSize: 20,
  },
  // Language value
  languageValue: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Sync button
  syncButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  // About value
  aboutValue: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Upgrade
  upgradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  // Admin badge
  adminBadge: {
    backgroundColor: colors.warning.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background.primary,
  },
  // Manage subscription button
  manageButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  // Usage text
  usageText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary.main,
  },
  usageTextWarning: {
    color: colors.warning.main,
  },
  usageTextDanger: {
    color: colors.error.main,
  },
  // Sign In
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signInText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  // Footer
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
