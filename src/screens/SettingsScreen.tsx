import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  Bell,
  Globe,
  RefreshCw,
  MapPin,
  LogOut,
  LogIn,
  User,
  Crown,
  Navigation,
  ChevronRight,
  Gift,
  Trash2,
  Shield,
  Database,
  CreditCard,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import Badge from '../components/Badge';

import {
  isNewCardSuggestionsEnabled,
  setNewCardSuggestionsEnabled,
  getLanguage,
  setLanguage,
  getCountry,
  setCountry,
  getCountryName,
  initializePreferences,
  Language,
  Country,
} from '../services/PreferenceManager';
import {
  refreshCards,
  getLastSyncTime,
  onCountryChange,
  getTotalCardCount,
} from '../services/CardDataService';
import { CountryChangeEmitter } from '../services/CountryChangeEmitter';
import { isSupabaseConfigured } from '../services/supabase';
import { getCurrentUser, signOut, AuthUser } from '../services/AuthService';
import {
  getCurrentTier,
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  getSageUsage,
  SageUsage,
  getSubscriptionState,
  SubscriptionState,
  refreshSubscription,
  openCustomerPortal,
} from '../services/SubscriptionService';
import Paywall from '../components/Paywall';
import {
  enableAutoPilot,
  disableAutoPilot,
  getAutoPilotStatus,
  initializeAutoPilot,
  AutoPilotStatus,
} from '../services/AutoPilotService';
import { initializePortfolio, getCards } from '../services/CardPortfolioManager';

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  value,
  children,
  onPress,
  isLast = false,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
}) {
  const content = (
    <View style={[styles.settingsRow, !isLast && styles.settingsRowBorder]}>
      <View style={styles.settingsRowIcon}>{icon}</View>
      <Text style={[styles.settingsRowTitle, danger && styles.settingsRowTitleDanger]}>
        {title}
      </Text>
      <View style={styles.settingsRowRight}>
        {value ? <Text style={styles.settingsRowValue}>{value}</Text> : null}
        {children}
        {onPress && !danger && !children ? (
          <ChevronRight size={16} color={colors.text.secondary} />
        ) : null}
      </View>
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [newCardSuggestions, setNewCardSuggestions] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentCountry, setCurrentCountry] = useState<Country>('US');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [_lastSync, setLastSync] = useState<Date | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);
  const [_cardCountDetail, setCardCountDetail] = useState<string>('');
  const [portfolioCount, setPortfolioCount] = useState<number>(0);
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

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    await refreshSubscription();
    const tier = await getCurrentTier();
    setSubscriptionTier(tier);

    const subState = await getSubscriptionState();
    setSubscriptionState(subState);

    if (tier === 'pro') {
      const usage = await getSageUsage();
      setSageUsage(usage);
    }

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

    await initializeAutoPilot();
    const apStatus = await getAutoPilotStatus();
    setAutoPilotStatus(apStatus);

    await initializePortfolio();
    setPortfolioCount(getCards().length);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useFocusEffect(
    useCallback(() => {
      const refreshAutoPilot = async () => {
        const apStatus = await getAutoPilotStatus();
        setAutoPilotStatus(apStatus);
      };
      refreshAutoPilot();
    }, [])
  );

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

    try {
      const cardStats = await getTotalCardCount();
      setCardCount(cardStats.total);
      setCardCountDetail(`${cardStats.us} US + ${cardStats.ca} CA`);
    } catch {
      setCardCount(0);
      setCardCountDetail('');
    }

    CountryChangeEmitter.emit();
    setIsLoading(false);
  };

  const handleCountryChange = async (country: Country) => {
    if (country === currentCountry) return;

    if (Platform.OS === 'web') {
      await performCountrySwitch(country);
      return;
    }

    Alert.alert(
      t('settings.changeCountryTitle'),
      t('settings.changeCountryMessage', { country: getCountryName(country) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.ok'), onPress: () => performCountrySwitch(country) },
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
      await refreshCards();
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
    } catch {
      Alert.alert(t('settings.refreshError'), t('settings.refreshErrorMessage'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      await signOut();
      onSignOut?.();
      return;
    }

    Alert.alert(t('settings.signOutTitle'), t('settings.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          onSignOut?.();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onSignOut?.();
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export data',
      'Your data export will be sent to your email address within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    const url = 'https://rewardly.ca/privacy-policy';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  };

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const handleAutoPilotToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enableAutoPilot();
      if (!success) {
        Alert.alert(
          t('settings.smartWalletPermissionTitle') || 'Permission Required',
          t('settings.smartWalletPermissionMessage') ||
            'Smart Wallet needs location and notification permissions to work. Please enable them in your device settings.',
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
        <ActivityIndicator size="small" color={colors.primary.main} />
      </View>
    );
  }

  const tierConfig = SUBSCRIPTION_TIERS[subscriptionTier];

  const getTierBadgeLabel = () => {
    if (subscriptionState?.isAdmin) return 'Admin';
    if (subscriptionTier === 'lifetime') return 'Lifetime';
    if (subscriptionTier === 'max') return 'Max';
    if (subscriptionTier === 'pro') return 'Pro';
    return 'Free';
  };

  const getTierBadgeVariant = (): 'primary' | 'secondary' | 'success' | 'warning' | 'neutral' => {
    if (subscriptionState?.isAdmin) return 'warning';
    if (subscriptionTier === 'lifetime') return 'success';
    if (subscriptionTier === 'max') return 'primary';
    if (subscriptionTier === 'pro') return 'secondary';
    return 'neutral';
  };

  const getLanguageLabel = (lang: Language) => (lang === 'en' ? 'English' : 'Français');

  const countryValue = currentCountry === 'CA' ? 'Canada 🇨🇦' : 'United States 🇺🇸';

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title') || 'Settings'}</Text>
          <Text style={styles.subtitle}>{t('settings.customizeExperience')}</Text>
        </View>

        {/* Account card */}
        <View style={styles.accountCard}>
          <View style={styles.accountAvatar}>
            <User size={22} color={colors.primary.main} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName} numberOfLines={1}>
              {user?.displayName || user?.email || t('settings.guest') || 'Guest'}
            </Text>
            {user && !user.isAnonymous && user.email ? (
              <Text style={styles.accountEmail} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
          <Badge label={getTierBadgeLabel()} variant={getTierBadgeVariant()} size="small" />
          {user && !user.isAnonymous ? (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <LogOut size={18} color={colors.error.main} />
            </TouchableOpacity>
          ) : onSignIn ? (
            <TouchableOpacity onPress={onSignIn} style={styles.signOutButton}>
              <LogIn size={18} color={colors.primary.main} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ACCOUNT section */}
        <SectionHeader title={t('settings.account')} />
        <View style={styles.section}>
          <SettingsRow
            icon={<CreditCard size={16} color={colors.text.secondary} />}
            title="My portfolio"
            value={`${portfolioCount} cards`}
            onPress={() => navigation.navigate('MyCards' as never)}
          />
          <SettingsRow
            icon={<Bell size={16} color={colors.text.secondary} />}
            title={t('settings.newCardSuggestions') || 'Notifications'}
            value={newCardSuggestions ? 'On' : 'Off'}
          >
            <Switch
              value={newCardSuggestions}
              onValueChange={handleNewCardSuggestionsChange}
              trackColor={{ false: colors.border.light, true: colors.success.main }}
              thumbColor={colors.background.secondary}
            />
          </SettingsRow>
          <SettingsRow
            icon={<MapPin size={16} color={colors.text.secondary} />}
            title={t('settings.country') || 'Country'}
            value={countryValue}
            onPress={() => {
              const next: Country = currentCountry === 'CA' ? 'US' : 'CA';
              handleCountryChange(next);
            }}
          />
          <SettingsRow
            icon={<Globe size={16} color={colors.text.secondary} />}
            title={t('settings.language') || 'Language'}
            value={getLanguageLabel(currentLanguage)}
            isLast
            onPress={() => {
              const newLang = currentLanguage === 'en' ? 'fr' : 'en';
              handleLanguageChange(newLang);
            }}
          />
        </View>

        {/* SUBSCRIPTION section */}
        <SectionHeader title={t('settings.subscription_header')} />
        <View style={[styles.section, styles.subscriptionCard]}>
          <View style={styles.subscriptionHeader}>
            <View>
              <Text style={styles.subscriptionPlan}>
                {subscriptionTier === 'lifetime'
                  ? 'Lifetime Member ✨'
                  : subscriptionState?.isAdmin
                    ? 'Admin Access'
                    : tierConfig.name}
              </Text>
              <Text style={styles.subscriptionDesc}>
                {subscriptionTier === 'free'
                  ? 'Upgrade to unlock AI, insights, and more'
                  : subscriptionTier === 'lifetime'
                    ? 'All Premium features — forever'
                    : 'Full access to all features'}
              </Text>
            </View>
            {subscriptionTier === 'lifetime' && <Crown size={20} color="#FFD700" />}
          </View>

          {subscriptionTier === 'pro' && sageUsage && sageUsage.limit !== null && (
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>
                Sage AI: {sageUsage.chatCount} / {sageUsage.limit} chats
              </Text>
              <Text
                style={[
                  styles.usageRemaining,
                  sageUsage.remaining !== null && sageUsage.remaining <= 2
                    ? styles.usageWarning
                    : null,
                  sageUsage.remaining === 0 ? styles.usageDanger : null,
                ]}
              >
                {sageUsage.remaining ?? 0} left
              </Text>
            </View>
          )}

          {subscriptionTier === 'free' ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          ) : (subscriptionTier === 'pro' || subscriptionTier === 'max') &&
            !subscriptionState?.isAdmin ? (
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
              <Text style={styles.manageButtonText}>Manage subscription</Text>
              <ChevronRight size={14} color={colors.primary.main} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Referral row */}
        <SectionHeader title={t('settings.earn')} />
        <View style={styles.section}>
          <SettingsRow
            icon={<Gift size={16} color={colors.primary.main} />}
            title="Invite & Earn Rewards"
            value="Share Rewardly"
            isLast
            onPress={() => navigation.navigate('ReferralDashboard' as never)}
          />
        </View>

        {/* Smart Wallet row */}
        <SectionHeader title={t('settings.smartWallet')} />
        <View style={styles.section}>
          <SettingsRow
            icon={
              <Navigation
                size={16}
                color={autoPilotStatus?.enabled ? colors.primary.main : colors.text.secondary}
              />
            }
            title={t('settings.smartWalletEnabled') || 'Enable Smart Wallet'}
            value={autoPilotStatus?.enabled ? 'On' : 'Off'}
            isLast
          >
            <Switch
              value={autoPilotStatus?.enabled || false}
              onValueChange={handleAutoPilotToggle}
              trackColor={{ false: colors.border.light, true: colors.success.main }}
              thumbColor={colors.background.secondary}
            />
          </SettingsRow>
        </View>

        {/* DATA & PRIVACY section */}
        <SectionHeader title={t('settings.dataPrivacy')} />
        <View style={styles.section}>
          <SettingsRow
            icon={<Shield size={16} color={colors.text.secondary} />}
            title="Privacy policy"
            onPress={handlePrivacyPolicy}
          />
          <SettingsRow
            icon={
              isRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : (
                <Database size={16} color={colors.text.secondary} />
              )
            }
            title="Export my data"
            onPress={handleExportData}
          />
          <SettingsRow
            icon={<RefreshCw size={16} color={colors.text.secondary} />}
            title={t('settings.refreshCards') || 'Refresh card database'}
            value={cardCount > 0 ? `${cardCount} cards` : undefined}
            onPress={isRefreshing ? undefined : handleRefreshCards}
          >
            {isRefreshing ? <ActivityIndicator size="small" color={colors.primary.main} /> : null}
          </SettingsRow>
          <SettingsRow
            icon={<Trash2 size={16} color={colors.error.main} />}
            title="Delete account"
            isLast
            danger
            onPress={handleDeleteAccount}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made for the Canadian rewards community</Text>
        </View>
      </ScrollView>

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
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Account card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background.elevated,
    marginHorizontal: 16,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginBottom: 4,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  accountEmail: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  signOutButton: {
    padding: 4,
  },
  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Section container
  section: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  // Settings row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingsRowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingsRowTitleDanger: {
    color: colors.error.main,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  settingsRowValue: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  // Subscription card
  subscriptionCard: {
    padding: 16,
    gap: 12,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  subscriptionPlan: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subscriptionDesc: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  usageLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  usageRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  usageWarning: {
    color: colors.warning.main,
  },
  usageDanger: {
    color: colors.error.main,
  },
  upgradeButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.button,
    paddingVertical: 11,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background.primary,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.button,
    paddingVertical: 10,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
  },
  // Footer
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
