/**
 * SettingsScreen - User preferences and settings
 * Requirements: 5.1, 3.4
 */

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
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { RewardType } from '../types';
import {
  getRewardTypePreference,
  setRewardTypePreference,
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
 * Reward type option data
 */
const REWARD_TYPE_OPTIONS: Array<{
  type: RewardType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
}> = [
  {
    type: RewardType.CASHBACK,
    labelKey: 'rewardTypes.cashback',
    descriptionKey: 'rewardTypes.cashbackDescription',
    icon: '💵',
  },
  {
    type: RewardType.POINTS,
    labelKey: 'rewardTypes.points',
    descriptionKey: 'rewardTypes.pointsDescription',
    icon: '⭐',
  },
  {
    type: RewardType.AIRLINE_MILES,
    labelKey: 'rewardTypes.airline_miles',
    descriptionKey: 'rewardTypes.airline_milesDescription',
    icon: '✈️',
  },
  {
    type: RewardType.HOTEL_POINTS,
    labelKey: 'rewardTypes.hotel_points',
    descriptionKey: 'rewardTypes.hotel_pointsDescription',
    icon: '🏨',
  },
];

/**
 * Language options
 */
const LANGUAGE_OPTIONS: Array<{ code: Language; labelKey: string; icon: string }> = [
  { code: 'en', labelKey: 'languages.en', icon: '🇬🇧' },
  { code: 'fr', labelKey: 'languages.fr', icon: '🇫🇷' },
];

/**
 * Reward type selector option component
 */
function RewardTypeOption({
  type,
  labelKey,
  descriptionKey,
  icon,
  isSelected,
  onSelect,
}: {
  type: RewardType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  isSelected: boolean;
  onSelect: (type: RewardType) => void;
}) {
  const { t } = useTranslation();
  const label = t(labelKey);
  const description = t(descriptionKey);

  return (
    <TouchableOpacity
      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
      onPress={() => onSelect(type)}
      accessibilityLabel={`${label}: ${description}${isSelected ? ', selected' : ''}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={styles.optionInfo}>
        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
          {label}
        </Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Language selector option component
 */
function LanguageOption({
  code,
  labelKey,
  icon,
  isSelected,
  onSelect,
}: {
  code: Language;
  labelKey: string;
  icon: string;
  isSelected: boolean;
  onSelect: (code: Language) => void;
}) {
  const { t } = useTranslation();
  const label = t(labelKey);

  return (
    <TouchableOpacity
      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
      onPress={() => onSelect(code)}
      accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={styles.optionInfo}>
        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
          {label}
        </Text>
      </View>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

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

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [rewardType, setRewardType] = useState<RewardType>(RewardType.CASHBACK);
  const [newCardSuggestions, setNewCardSuggestions] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);

  const loadPreferences = useCallback(async () => {
    await initializePreferences();
    setRewardType(getRewardTypePreference());
    setNewCardSuggestions(isNewCardSuggestionsEnabled());
    setCurrentLanguage(getLanguage());
    
    // Load card count and last sync time
    const cards = await getAllCards();
    setCardCount(cards.length);
    const syncTime = await getLastSyncTime();
    setLastSync(syncTime);
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleRewardTypeChange = async (type: RewardType) => {
    setRewardType(type);
    await setRewardTypePreference(type);
  };

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
      Alert.alert(
        t('settings.refreshCards'),
        t('settings.supabaseNotConfigured'),
        [{ text: t('common.ok') }]
      );
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
      Alert.alert(
        t('settings.refreshError'),
        t('settings.refreshErrorMessage'),
        [{ text: t('common.ok') }]
      );
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <SectionHeader title={t('settings.rewardPreference')} />
      <View style={styles.section}>
        <Text style={styles.sectionDescription}>
          {t('settings.rewardPreferenceDescription')}
        </Text>
        <View style={styles.optionsContainer}>
          {REWARD_TYPE_OPTIONS.map((option) => (
            <RewardTypeOption
              key={option.type}
              type={option.type}
              labelKey={option.labelKey}
              descriptionKey={option.descriptionKey}
              icon={option.icon}
              isSelected={rewardType === option.type}
              onSelect={handleRewardTypeChange}
            />
          ))}
        </View>
      </View>

      <SectionHeader title={t('settings.recommendations')} />
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>{t('settings.newCardSuggestions')}</Text>
            <Text style={styles.toggleDescription}>
              {t('settings.newCardSuggestionsDescription')}
            </Text>
          </View>
          <Switch
            value={newCardSuggestions}
            onValueChange={handleNewCardSuggestionsChange}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#fff"
            accessibilityLabel={t('settings.newCardSuggestions')}
            accessibilityRole="switch"
          />
        </View>
      </View>

      <SectionHeader title={t('settings.language')} />
      <View style={styles.section}>
        <Text style={styles.sectionDescription}>
          {t('settings.languageDescription')}
        </Text>
        <View style={styles.optionsContainer}>
          {LANGUAGE_OPTIONS.map((option) => (
            <LanguageOption
              key={option.code}
              code={option.code}
              labelKey={option.labelKey}
              icon={option.icon}
              isSelected={currentLanguage === option.code}
              onSelect={handleLanguageChange}
            />
          ))}
        </View>
      </View>

      <SectionHeader title={t('settings.about')} />
      <View style={styles.section}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>{t('settings.version')}</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>{t('settings.cardsInDatabase')}</Text>
          <Text style={styles.aboutValue}>{cardCount}</Text>
        </View>
        {lastSync && (
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{t('settings.lastSync')}</Text>
            <Text style={styles.aboutValue}>
              {lastSync.toLocaleDateString(currentLanguage === 'fr' ? 'fr-CA' : 'en-CA')}
            </Text>
          </View>
        )}
        <View style={[styles.aboutRow, styles.aboutRowLast]}>
          <Text style={styles.aboutLabel}>{t('settings.dataSource')}</Text>
          <Text style={styles.aboutValue}>
            {isSupabaseConfigured() ? 'Supabase' : t('settings.localData')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshCards}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <>
              <Text style={styles.refreshButtonIcon}>🔄</Text>
              <Text style={styles.refreshButtonText}>{t('settings.refreshCards')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('settings.footerText')}
        </Text>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    padding: 16,
    paddingBottom: 8,
  },
  optionsContainer: {
    paddingBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  aboutRowLast: {
    borderBottomWidth: 0,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#000',
  },
  aboutValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F0F7FF',
  },
  refreshButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
