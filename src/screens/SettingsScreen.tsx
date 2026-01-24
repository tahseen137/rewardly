/**
 * SettingsScreen - User preferences and settings
 * Redesigned to match web with section grouping and lucide icons
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
import { Bell, Globe, RefreshCw, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';

import {
  isNewCardSuggestionsEnabled,
  setNewCardSuggestionsEnabled,
  getLanguage,
  setLanguage,
  initializePreferences,
  Language,
} from '../services/PreferenceManager';
import { refreshCards, getLastSyncTime, getAllCards } from '../services/CardDataService';
import { isSupabaseConfigured } from '../services/supabase';

/**
 * Language options
 */
const LANGUAGE_OPTIONS: Array<{ code: Language; labelKey: string; icon: string }> = [
  { code: 'en', labelKey: 'languages.en', icon: '🇬🇧' },
  { code: 'fr', labelKey: 'languages.fr', icon: '🇫🇷' },
];

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

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [newCardSuggestions, setNewCardSuggestions] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);

  const loadPreferences = useCallback(async () => {
    await initializePreferences();
    setNewCardSuggestions(isNewCardSuggestionsEnabled());
    setCurrentLanguage(getLanguage());

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title') || 'Settings'}</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      {/* Preferences Section */}
      <SectionHeader title="PREFERENCES" />
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
          description="Choose your preferred language"
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
      <SectionHeader title="DATA" />
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
          description="Refresh card data from server"
          isLast={true}
          onPress={isRefreshing ? undefined : handleRefreshCards}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </SettingsRow>
      </View>

      {/* About Section */}
      <SectionHeader title="ABOUT" />
      <View style={styles.section}>
        <SettingsRow
          icon={<Info size={20} color={colors.text.secondary} />}
          title="App Version"
          description="Rewards Optimizer"
          isLast={false}
        >
          <Text style={styles.aboutValue}>1.0.0</Text>
        </SettingsRow>

        <SettingsRow
          icon={<Info size={20} color={colors.text.secondary} />}
          title={t('settings.cardsInDatabase')}
          description={lastSync ? `Last synced: ${lastSync.toLocaleDateString()}` : undefined}
          isLast={true}
        >
          <Text style={styles.aboutValue}>{cardCount}</Text>
        </SettingsRow>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with 💳 for smart spenders</Text>
      </View>
    </ScrollView>
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
