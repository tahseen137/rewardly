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
} from 'react-native';
import { Bell, Globe, RefreshCw, Info, MapPin, LogOut, User, Crown } from 'lucide-react-native';
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
import { refreshCards, getLastSyncTime, getAllCards, onCountryChange } from '../services/CardDataService';
import { isSupabaseConfigured } from '../services/supabase';
import { getCurrentUser, signOut, AuthUser } from '../services/AuthService';
import { getCurrentTier, SUBSCRIPTION_TIERS, SubscriptionTier } from '../services/SubscriptionService';
import Paywall from '../components/Paywall';

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
}

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const [newCardSuggestions, setNewCardSuggestions] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentCountry, setCurrentCountry] = useState<Country>('US');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [showPaywall, setShowPaywall] = useState(false);

  const loadPreferences = useCallback(async () => {
    await initializePreferences();
    setNewCardSuggestions(isNewCardSuggestionsEnabled());
    setCurrentLanguage(getLanguage());
    setCurrentCountry(getCountry());

    // Load user
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    // Load subscription tier
    const tier = await getCurrentTier();
    setSubscriptionTier(tier);

    // Load card count and last sync time
    try {
      const cards = await getAllCards();
      setCardCount(cards.length);
    } catch {
      setCardCount(0);
    }
    const syncTime = await getLastSyncTime();
    setLastSync(syncTime);

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

  const handleCountryChange = async (country: Country) => {
    if (country === currentCountry) return;
    
    // Show confirmation
    Alert.alert(
      t('settings.changeCountryTitle'),
      t('settings.changeCountryMessage', { country: getCountryName(country) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: async () => {
            setIsLoading(true);
            setCurrentCountry(country);
            await setCountry(country);
            await onCountryChange();
            
            // Reload cards for new country
            try {
              const cards = await getAllCards();
              setCardCount(cards.length);
            } catch {
              setCardCount(0);
            }
            
            setIsLoading(false);
          },
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
      setCardCount(cards.length);
      const syncTime = await getLastSyncTime();
      setLastSync(syncTime);

      Alert.alert(
        t('settings.refreshSuccess'),
        t('settings.refreshSuccessMessage', { count: cards.length }),
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
                description={user.isAnonymous ? t('settings.guestMode') : user.email || undefined}
                isLast={false}
              >
                {!user.isAnonymous && (
                  <TouchableOpacity onPress={handleSignOut}>
                    <LogOut size={20} color={colors.error.main} />
                  </TouchableOpacity>
                )}
              </SettingsRow>

              <SettingsRow
                icon={<Crown size={20} color={tierConfig.id === 'free' ? colors.text.secondary : colors.primary.main} />}
                title={t('settings.subscription')}
                description={tierConfig.name}
                isLast={true}
                onPress={subscriptionTier === 'free' ? handleUpgrade : undefined}
              >
                {subscriptionTier === 'free' && (
                  <Text style={styles.upgradeText}>{t('settings.upgrade')}</Text>
                )}
              </SettingsRow>
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
            description={lastSync ? `${t('settings.lastSynced')}: ${lastSync.toLocaleDateString()}` : undefined}
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
