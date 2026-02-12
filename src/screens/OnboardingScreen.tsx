/**
 * OnboardingScreen - 3-step onboarding flow
 * Step 1: Select your country (🇺🇸 / 🇨🇦)
 * Step 2: Add your credit cards
 * Step 3: Meet Sage, your AI assistant
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CreditCard, MessageCircle, MapPin, ChevronRight, Check, Search } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  Country,
  setCountry,
  getCountry,
  getCountryFlag,
  getCountryName,
  setOnboardingComplete,
} from '../services/PreferenceManager';
import { onCountryChange, getAllCards } from '../services/CardDataService';
import { addCard, getCards } from '../services/CardPortfolioManager';
import { Card } from '../types';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>(getCountry());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const animatedStep = useSharedValue(0);

  // Load cards when country changes
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await getAllCards();
        setAvailableCards(cards); // Show all cards (will be filtered by search)
      } catch (err) {
        // Use empty array if cards fail to load
        setAvailableCards([]);
      }
    };
    loadCards();
  }, [selectedCountry]);

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableCards;
    }
    
    const query = searchQuery.toLowerCase();
    return availableCards.filter(card => 
      card.name.toLowerCase().includes(query) ||
      card.issuer.toLowerCase().includes(query)
    );
  }, [availableCards, searchQuery]);

  // Load existing portfolio
  useEffect(() => {
    const existingCards = getCards();
    setSelectedCards(existingCards.map(c => c.cardId));
  }, []);

  // Animate step changes
  useEffect(() => {
    animatedStep.value = withSpring(currentStep, {
      damping: 15,
      stiffness: 100,
    });
  }, [currentStep]);

  const handleCountrySelect = useCallback(async (country: Country) => {
    setSelectedCountry(country);
    await setCountry(country);
    await onCountryChange();
    
    // Reload cards for new country
    try {
      const cards = await getAllCards();
      setAvailableCards(cards.slice(0, 20));
    } catch (err) {
      setAvailableCards([]);
    }
  }, []);

  const handleCardToggle = useCallback((cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      // Save selected cards
      setIsLoading(true);
      try {
        const existingCards = getCards().map(c => c.cardId);
        
        // Add new cards
        for (const cardId of selectedCards) {
          if (!existingCards.includes(cardId)) {
            await addCard(cardId);
          }
        }
      } catch (err) {
        console.warn('Failed to save cards:', err);
      }
      setIsLoading(false);
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await setOnboardingComplete(true);
      onComplete();
    }
  }, [currentStep, selectedCards, onComplete]);

  const handleSkip = useCallback(async () => {
    await setOnboardingComplete(true);
    onComplete();
  }, [onComplete]);

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.progressDotActive,
            index < currentStep && styles.progressDotComplete,
          ]}
        />
      ))}
    </View>
  );

  const renderCountryStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <MapPin size={48} color={colors.primary.main} />
      </View>
      <Text style={styles.stepTitle}>{t('onboarding.countryTitle')}</Text>
      <Text style={styles.stepDescription}>{t('onboarding.countryDescription')}</Text>

      <View style={styles.countryOptions}>
        {(['US', 'CA'] as Country[]).map(country => (
          <TouchableOpacity
            key={country}
            style={[
              styles.countryOption,
              selectedCountry === country && styles.countryOptionSelected,
            ]}
            onPress={() => handleCountrySelect(country)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{getCountryFlag(country)}</Text>
            <Text style={[
              styles.countryName,
              selectedCountry === country && styles.countryNameSelected,
            ]}>
              {getCountryName(country)}
            </Text>
            {selectedCountry === country && (
              <View style={styles.checkmark}>
                <Check size={20} color={colors.primary.main} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCardStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <CreditCard size={48} color={colors.primary.main} />
      </View>
      <Text style={styles.stepTitle}>{t('onboarding.cardsTitle')}</Text>
      <Text style={styles.stepDescription}>{t('onboarding.cardsDescription')}</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('onboarding.searchCards')}
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Result Count */}
      {searchQuery.trim() && (
        <Text style={styles.resultCount}>
          {t('onboarding.showingCards', { 
            count: filteredCards.length, 
            total: availableCards.length 
          })}
        </Text>
      )}

      <ScrollView 
        style={styles.cardList}
        contentContainerStyle={styles.cardListContent}
        showsVerticalScrollIndicator={false}
      >
        {availableCards.length === 0 ? (
          <View style={styles.emptyCards}>
            <Text style={styles.emptyCardsText}>{t('onboarding.loadingCards')}</Text>
          </View>
        ) : filteredCards.length === 0 ? (
          <View style={styles.emptyCards}>
            <Text style={styles.emptyCardsText}>{t('onboarding.noCardsFound')}</Text>
          </View>
        ) : (
          filteredCards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardOption,
                selectedCards.includes(card.id) && styles.cardOptionSelected,
              ]}
              onPress={() => handleCardToggle(card.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                <Text style={styles.cardIssuer}>{card.issuer}</Text>
              </View>
              <View style={[
                styles.cardCheckbox,
                selectedCards.includes(card.id) && styles.cardCheckboxSelected,
              ]}>
                {selectedCards.includes(card.id) && (
                  <Check size={16} color={colors.background.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Text style={styles.cardHint}>
        {t('onboarding.cardsHint', { count: selectedCards.length })}
      </Text>
    </View>
  );

  const renderSageStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <MessageCircle size={48} color={colors.primary.main} />
      </View>
      <Text style={styles.stepTitle}>{t('onboarding.sageTitle')}</Text>
      <Text style={styles.stepDescription}>{t('onboarding.sageDescription')}</Text>

      <View style={styles.sageFeatures}>
        <View style={styles.sageFeature}>
          <View style={styles.sageFeatureIcon}>
            <Text style={styles.sageFeatureEmoji}>🎯</Text>
          </View>
          <View style={styles.sageFeatureText}>
            <Text style={styles.sageFeatureTitle}>{t('onboarding.sageFeature1Title')}</Text>
            <Text style={styles.sageFeatureDesc}>{t('onboarding.sageFeature1Desc')}</Text>
          </View>
        </View>

        <View style={styles.sageFeature}>
          <View style={styles.sageFeatureIcon}>
            <Text style={styles.sageFeatureEmoji}>✈️</Text>
          </View>
          <View style={styles.sageFeatureText}>
            <Text style={styles.sageFeatureTitle}>{t('onboarding.sageFeature2Title')}</Text>
            <Text style={styles.sageFeatureDesc}>{t('onboarding.sageFeature2Desc')}</Text>
          </View>
        </View>

        <View style={styles.sageFeature}>
          <View style={styles.sageFeatureIcon}>
            <Text style={styles.sageFeatureEmoji}>💡</Text>
          </View>
          <View style={styles.sageFeatureText}>
            <Text style={styles.sageFeatureTitle}>{t('onboarding.sageFeature3Title')}</Text>
            <Text style={styles.sageFeatureDesc}>{t('onboarding.sageFeature3Desc')}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderCountryStep();
      case 1:
        return renderCardStep();
      case 2:
        return renderSageStep();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with skip and progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
        {renderProgressDots()}
        <View style={styles.skipButton} /> {/* Spacer for alignment */}
      </View>

      {/* Step Content */}
      {renderStep()}

      {/* Footer with CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TOTAL_STEPS - 1
                ? t('onboarding.getStarted')
                : t('onboarding.continue')}
            </Text>
            <ChevronRight size={20} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  },
  skipButton: {
    width: 60,
    paddingVertical: 8,
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary.main,
  },
  progressDotComplete: {
    backgroundColor: colors.primary.dark,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.bg10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  // Country Step
  countryOptions: {
    gap: 16,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    padding: 20,
    gap: 16,
  },
  countryOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.bg10,
  },
  countryFlag: {
    fontSize: 40,
  },
  countryName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  countryNameSelected: {
    color: colors.primary.main,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card Step
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text.primary,
  },
  resultCount: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  cardList: {
    flex: 1,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  cardListContent: {
    gap: 8,
    paddingBottom: 16,
  },
  emptyCards: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCardsText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 14,
    gap: 12,
  },
  cardOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.bg10,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardIssuer: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  cardCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCheckboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  cardHint: {
    color: colors.text.tertiary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  // Sage Step
  sageFeatures: {
    gap: 20,
  },
  sageFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  sageFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sageFeatureEmoji: {
    fontSize: 24,
  },
  sageFeatureText: {
    flex: 1,
  },
  sageFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sageFeatureDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  nextButtonText: {
    color: colors.background.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});
