/**
 * OnboardingScreen - 3-step onboarding flow
 * Step 1: Select your country (🇺🇸 / 🇨🇦)
 * Step 2: Add your credit cards
 * Step 3: Meet Sage, your AI assistant
 * 
 * Feb 27, 2026: Implemented onboarding fixes from ONBOARDING_AUDIT.md
 * - Added back button (P0)
 * - Added Popular/All/Search tabs for cards (P0)
 * - Added value prop callouts (P1)
 * - Added skip confirmation (P1)
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
import { CreditCard, MessageCircle, MapPin, ChevronRight, ChevronLeft, Check, Search, Sparkles } from 'lucide-react-native';

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

// Popular Canadian cards (most common rewards cards)
const POPULAR_CARDS_CA = [
  'tangerine-cashback-mastercard',
  'scotiabank-momentum-infinite-visa',
  'td-cash-back-infinite-visa',
  'pc-financial-world-elite-mastercard',
  'american-express-cobalt-card',
  'cibc-dividend-visa-infinite',
  'bmo-eclipse-visa-infinite',
  'rbc-avion-visa-infinite',
  'td-aeroplan-visa-infinite',
  'amex-gold-rewards-card',
];

// Popular US cards
const POPULAR_CARDS_US = [
  'chase-sapphire-preferred',
  'chase-sapphire-reserve',
  'american-express-platinum',
  'capital-one-venture-x',
  'chase-freedom-unlimited',
  'amex-gold-card',
  'citi-double-cash',
  'discover-it-cash-back',
  'wells-fargo-active-cash',
  'capital-one-quicksilver',
];

type CardViewMode = 'popular' | 'all' | 'search';

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>(getCountry());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>('popular');
  
  const animatedStep = useSharedValue(0);

  // Load cards when country changes
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await getAllCards();
        setAvailableCards(cards);
      } catch (err) {
        setAvailableCards([]);
      }
    };
    loadCards();
  }, [selectedCountry]);

  // Get popular cards based on country
  const popularCardIds = useMemo(() => {
    return selectedCountry === 'CA' ? POPULAR_CARDS_CA : POPULAR_CARDS_US;
  }, [selectedCountry]);

  // Filter cards based on view mode and search query
  const displayedCards = useMemo(() => {
    let cards = availableCards;

    // Apply view mode filter
    if (cardViewMode === 'popular') {
      cards = cards.filter(card => 
        popularCardIds.some(popId => 
          card.id.toLowerCase().includes(popId.toLowerCase()) ||
          card.cardId?.toLowerCase().includes(popId.toLowerCase())
        )
      );
    } else if (cardViewMode === 'search' || searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(card => 
        card.name.toLowerCase().includes(query) ||
        card.issuer.toLowerCase().includes(query)
      );
    }

    return cards;
  }, [availableCards, cardViewMode, searchQuery, popularCardIds]);

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
      setAvailableCards(cards);
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

  // P0: Back button handler
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

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

  // P1: Skip confirmation (especially important on card step)
  const handleSkip = useCallback(() => {
    if (currentStep === 1 && selectedCards.length === 0) {
      // Show confirmation dialog on card step if no cards selected
      Alert.alert(
        t('onboarding.skipCardTitle'),
        t('onboarding.skipCardMessage'),
        [
          { 
            text: t('onboarding.skipCardAddNow'), 
            style: 'cancel' 
          },
          { 
            text: t('onboarding.skipCardConfirm'), 
            onPress: async () => {
              await setOnboardingComplete(true);
              onComplete();
            },
            style: 'destructive' 
          }
        ]
      );
    } else {
      // Skip without confirmation on other steps
      setOnboardingComplete(true).then(onComplete);
    }
  }, [currentStep, selectedCards, onComplete, t]);

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

  // P1: Value prop callout component
  const renderValueCallout = (messageKey: string) => (
    <View style={styles.valueCallout}>
      <Sparkles size={16} color={colors.primary.main} />
      <Text style={styles.valueCalloutText}>
        {t(messageKey)}
      </Text>
    </View>
  );

  const renderCountryStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <MapPin size={48} color={colors.primary.main} />
      </View>
      <Text style={styles.stepTitle}>{t('onboarding.countryTitle')}</Text>
      <Text style={styles.stepDescription}>{t('onboarding.countryDescription')}</Text>

      {/* P1: Value callout */}
      {renderValueCallout('onboarding.countryValue')}

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

      {/* P1: Value callout */}
      {renderValueCallout('onboarding.cardsValue')}

      {/* P1: Guidance text */}
      <Text style={styles.cardGuidance}>
        {t('onboarding.cardsGuidance')}
      </Text>

      {/* P0: Card View Mode Tabs */}
      <View style={styles.cardTabs}>
        <TouchableOpacity
          style={[styles.cardTab, cardViewMode === 'popular' && styles.cardTabActive]}
          onPress={() => {
            setCardViewMode('popular');
            setSearchQuery('');
          }}
        >
          <Text style={[
            styles.cardTabText,
            cardViewMode === 'popular' && styles.cardTabTextActive
          ]}>
            {t('onboarding.popularTab')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.cardTab, cardViewMode === 'all' && styles.cardTabActive]}
          onPress={() => {
            setCardViewMode('all');
            setSearchQuery('');
          }}
        >
          <Text style={[
            styles.cardTabText,
            cardViewMode === 'all' && styles.cardTabTextActive
          ]}>
            {t('onboarding.allTab')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.cardTab, cardViewMode === 'search' && styles.cardTabActive]}
          onPress={() => setCardViewMode('search')}
        >
          <Text style={[
            styles.cardTabText,
            cardViewMode === 'search' && styles.cardTabTextActive
          ]}>
            {t('onboarding.searchTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input (only show in search mode) */}
      {cardViewMode === 'search' && (
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
            autoFocus
          />
        </View>
      )}

      {/* Result Count */}
      {(cardViewMode === 'search' && searchQuery.trim()) && (
        <Text style={styles.resultCount}>
          {t('onboarding.showingCards', { 
            count: displayedCards.length, 
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
        ) : displayedCards.length === 0 ? (
          <View style={styles.emptyCards}>
            <Text style={styles.emptyCardsText}>
              {cardViewMode === 'search' 
                ? t('onboarding.noCardsFound')
                : t('onboarding.noPopularCards')
              }
            </Text>
          </View>
        ) : (
          displayedCards.map(card => (
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

      {/* P1: Value callout */}
      {renderValueCallout('onboarding.sageValue')}

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
        {/* P0: Back button (show on steps 2 and 3) */}
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={20} color={colors.text.secondary} />
            <Text style={styles.backButtonText}>{t('onboarding.back')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        
        {renderProgressDots()}
        
        {/* P1: Make skip less prominent on card step */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[
            styles.skipText,
            currentStep === 1 && styles.skipTextSubtle
          ]}>
            {currentStep === 1 
              ? t('onboarding.skipLater') 
              : t('onboarding.skip')
            }
          </Text>
        </TouchableOpacity>
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
  // P0: Back button styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    minWidth: 60,
  },
  backButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  // P1: Subtle skip text on card step
  skipTextSubtle: {
    color: colors.text.tertiary,
    fontSize: 13,
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
    marginBottom: 16,
  },
  // P1: Value callout styles
  valueCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary.bg10,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  valueCalloutText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
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
  cardGuidance: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  // P0: Card tabs
  cardTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  cardTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  cardTabActive: {
    backgroundColor: colors.primary.main,
  },
  cardTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  cardTabTextActive: {
    color: colors.background.primary,
  },
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
