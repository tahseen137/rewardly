/**
 * PremiumOnboardingScreen - 5-step guided flow with emotional impact
 * 
 * Steps:
 * 1. Value Prop - "Stop leaving money on the table"
 * 2. Add Your Cards - Select from portfolio
 * 3. Spending Habits - Category sliders for budget
 * 4. Enable Smart Wallet - Location-based recommendations
 * 5. See Your Rewards IQ - Immediate gratification
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  CreditCard,
  DollarSign,
  Navigation,
  Target,
  Sparkles,
  TrendingUp,
  Search,
  MapPin,
  Bell,
  Shield,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Card, SpendingCategory } from '../types';
import { RewardsIQScore } from '../types/rewards-iq';
import {
  setOnboardingComplete,
  Country,
  setCountry,
  getCountry,
} from '../services/PreferenceManager';
import { onCountryChange, getAllCards } from '../services/CardDataService';
import { addCard, getCards } from '../services/CardPortfolioManager';
import { saveSpendingProfile, calculateRewardsIQ } from '../services/RewardsIQService';
import { 
  requestLocationPermission, 
  requestNotificationPermission, 
  enableAutoPilot 
} from '../services/AutoPilotService';
import { CATEGORY_INFO } from '../services/MockTransactionData';

interface PremiumOnboardingScreenProps {
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 5;

// ============================================================================
// Step 1: Value Proposition
// ============================================================================

function ValuePropStep({ onNext }: { onNext: () => void }) {
  const titleScale = useSharedValue(0.8);
  const badgeOpacity = useSharedValue(0);
  
  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 12 });
    badgeOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, []);
  
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));
  
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
  }));
  
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={FadeIn.duration(500)}>
        <View style={styles.iconHero}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.iconHeroGradient}
          >
            <DollarSign size={48} color={colors.background.primary} />
          </LinearGradient>
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={styles.heroTitle}>Stop Leaving Money{'\n'}On The Table</Text>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={styles.heroSubtitle}>
          The average Canadian leaves <Text style={styles.highlightText}>$500+/year</Text> in 
          unclaimed rewards by using the wrong credit card.
        </Text>
      </Animated.View>
      
      <Animated.View style={badgeStyle}>
        <View style={styles.statsBadge}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$127</Text>
            <Text style={styles.statLabel}>avg. saved/month</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2 min</Text>
            <Text style={styles.statLabel}>setup time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>free</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Features */}
      <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.featuresList}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Target size={20} color={colors.primary.main} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Smart Card Recommendations</Text>
            <Text style={styles.featureDesc}>Know the best card for every purchase</Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Navigation size={20} color={colors.primary.main} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Smart Wallet</Text>
            <Text style={styles.featureDesc}>Get notified when you arrive at stores</Text>
          </View>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <TrendingUp size={20} color={colors.primary.main} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Track Your Rewards IQ</Text>
            <Text style={styles.featureDesc}>Gamify your optimization journey</Text>
          </View>
        </View>
      </Animated.View>
      
      <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.ctaContainer}>
        <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Let's Get Started</Text>
            <ChevronRight size={24} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Step 2: Add Your Cards
// ============================================================================

interface AddCardsStepProps {
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function AddCardsStep({ selectedCards, onToggleCard, onNext, onBack }: AddCardsStepProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadCards = async () => {
      try {
        const allCards = await getAllCards();
        setCards(allCards);
      } catch (e) {
        console.error('Failed to load cards:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, []);
  
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return cards.filter(
      c => c.name.toLowerCase().includes(query) || c.issuer.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [cards, searchQuery]);
  
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.stepHeader}>
          <View style={styles.iconCircle}>
            <CreditCard size={28} color={colors.primary.main} />
          </View>
          <Text style={styles.stepTitle}>Add Your Cards</Text>
          <Text style={styles.stepSubtitle}>
            Select the credit cards you currently have
          </Text>
        </View>
      </Animated.View>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Card List */}
      <ScrollView 
        style={styles.cardsList}
        contentContainerStyle={styles.cardsListContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingCards}>
            <Text style={styles.loadingCardsText}>Loading cards...</Text>
          </View>
        ) : filteredCards.length === 0 && searchQuery.trim() ? (
          <View style={styles.loadingCards}>
            <Text style={styles.loadingCardsText}>No cards found for "{searchQuery}"</Text>
          </View>
        ) : null}
        {filteredCards.map((card, index) => (
          <Animated.View
            key={card.id}
            entering={FadeInDown.delay(index * 50).duration(300)}
          >
            <TouchableOpacity
              style={[
                styles.cardItem,
                selectedCards.includes(card.id) && styles.cardItemSelected,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                onToggleCard(card.id);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardItemInfo}>
                <Text style={styles.cardItemName} numberOfLines={2}>{card.name}</Text>
                <Text style={styles.cardItemIssuer}>{card.issuer}</Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedCards.includes(card.id) && styles.checkboxSelected,
              ]}>
                {selectedCards.includes(card.id) && (
                  <Check size={16} color={colors.background.primary} />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
      
      <View style={styles.selectedCount}>
        <Text style={styles.selectedCountText}>
          {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
      
      {/* Navigation */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={20} color={colors.text.secondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.9}
          disabled={selectedCards.length === 0}
        >
          <LinearGradient
            colors={selectedCards.length > 0 
              ? [colors.primary.main, colors.primary.dark]
              : [colors.text.disabled, colors.text.disabled]
            }
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <ChevronRight size={20} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Step 3: Spending Habits
// ============================================================================

interface SpendingStepProps {
  spending: Map<SpendingCategory, number>;
  onUpdateSpending: (category: SpendingCategory, amount: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const SPENDING_CATEGORIES = [
  SpendingCategory.GROCERIES,
  SpendingCategory.DINING,
  SpendingCategory.GAS,
  SpendingCategory.ONLINE_SHOPPING,
  SpendingCategory.TRAVEL,
  SpendingCategory.ENTERTAINMENT,
];

function SpendingStep({ spending, onUpdateSpending, onNext, onBack }: SpendingStepProps) {
  const totalMonthly = Array.from(spending.values()).reduce((sum, v) => sum + v, 0);
  
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.stepHeader}>
          <View style={styles.iconCircle}>
            <DollarSign size={28} color={colors.primary.main} />
          </View>
          <Text style={styles.stepTitle}>Your Spending Habits</Text>
          <Text style={styles.stepSubtitle}>
            Estimate your monthly spending by category
          </Text>
        </View>
      </Animated.View>
      
      <View style={styles.totalMonthly}>
        <Text style={styles.totalLabel}>Total Monthly</Text>
        <Text style={styles.totalValue}>${totalMonthly.toLocaleString()}</Text>
      </View>
      
      <ScrollView 
        style={styles.spendingList}
        contentContainerStyle={styles.spendingListContent}
        showsVerticalScrollIndicator={false}
      >
        {SPENDING_CATEGORIES.map((category, index) => {
          const info = CATEGORY_INFO[category];
          const amount = spending.get(category) || 0;
          
          return (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(index * 80).duration(300)}
              style={styles.spendingItem}
            >
              <View style={styles.spendingItemHeader}>
                <View style={[styles.spendingIcon, { backgroundColor: info.color + '20' }]}>
                  <Text style={styles.spendingEmoji}>{info.icon}</Text>
                </View>
                <Text style={styles.spendingLabel}>{info.label}</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountPrefix}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={amount > 0 ? String(amount) : ''}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      onUpdateSpending(category, num);
                    }}
                    placeholder="0"
                    placeholderTextColor={colors.text.disabled}
                  />
                </View>
              </View>
              
              {/* Quick preset buttons */}
              <View style={styles.presetRow}>
                {[100, 300, 500, 800].map(preset => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      amount === preset && styles.presetButtonActive,
                    ]}
                    onPress={() => onUpdateSpending(category, preset)}
                  >
                    <Text style={[
                      styles.presetText,
                      amount === preset && styles.presetTextActive,
                    ]}>
                      ${preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
      
      {/* Navigation */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={20} color={colors.text.secondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <ChevronRight size={20} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Step 4: Smart Wallet Setup
// ============================================================================

interface SmartWalletStepProps {
  onEnable: () => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

function SmartWalletStep({ onEnable, onSkip, onBack }: SmartWalletStepProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  
  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      await onEnable();
    } finally {
      setIsEnabling(false);
    }
  };
  
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.stepHeader}>
          <View style={styles.iconCircle}>
            <Navigation size={28} color={colors.primary.main} />
          </View>
          <Text style={styles.stepTitle}>Enable Smart Wallet</Text>
          <Text style={styles.stepSubtitle}>
            Get automatic card recommendations when you arrive at stores
          </Text>
        </View>
      </Animated.View>
      
      {/* Features */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.smartWalletFeatures}>
        <View style={styles.smartWalletFeature}>
          <MapPin size={24} color={colors.primary.main} />
          <View style={styles.smartWalletFeatureText}>
            <Text style={styles.smartWalletFeatureTitle}>Location-Based</Text>
            <Text style={styles.smartWalletFeatureDesc}>
              Detects when you're at a store like Costco or Tim Hortons
            </Text>
          </View>
        </View>
        
        <View style={styles.smartWalletFeature}>
          <Bell size={24} color={colors.primary.main} />
          <View style={styles.smartWalletFeatureText}>
            <Text style={styles.smartWalletFeatureTitle}>Smart Notifications</Text>
            <Text style={styles.smartWalletFeatureDesc}>
              Shows the best card to use before you pay
            </Text>
          </View>
        </View>
        
        <View style={styles.smartWalletFeature}>
          <Shield size={24} color={colors.primary.main} />
          <View style={styles.smartWalletFeatureText}>
            <Text style={styles.smartWalletFeatureTitle}>Privacy First</Text>
            <Text style={styles.smartWalletFeatureDesc}>
              Location data stays on your device
            </Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Buttons */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.smartWalletButtons}>
        <TouchableOpacity
          onPress={handleEnable}
          activeOpacity={0.9}
          disabled={isEnabling}
        >
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.enableButton}
          >
            <Navigation size={20} color="#fff" />
            <Text style={styles.enableButtonText}>
              {isEnabling ? 'Enabling...' : 'Enable Smart Wallet'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Back */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={20} color={colors.text.secondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ============================================================================
// Step 5: Rewards IQ Result
// ============================================================================

interface RewardsIQStepProps {
  score: RewardsIQScore | null;
  onComplete: () => void;
}

function RewardsIQStep({ score, onComplete }: RewardsIQStepProps) {
  const scoreScale = useSharedValue(0);
  const celebrationScale = useSharedValue(0);
  
  useEffect(() => {
    scoreScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    celebrationScale.value = withDelay(
      1000,
      withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 12 })
      )
    );
    
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);
    }
  }, []);
  
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    opacity: scoreScale.value,
  }));
  
  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return colors.primary.main;
    if (s >= 60) return colors.warning.main;
    return colors.error.main;
  };
  
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.stepHeader}>
          <Animated.View style={[styles.confettiContainer, celebrationStyle]}>
            <Text style={styles.confetti}>🎉</Text>
          </Animated.View>
          <Text style={styles.congratsTitle}>You're All Set!</Text>
          <Text style={styles.stepSubtitle}>
            Here's your initial Rewards IQ score
          </Text>
        </View>
      </Animated.View>
      
      {/* Score Display */}
      <Animated.View style={[styles.iqScoreContainer, scoreStyle]}>
        {score && (
          <LinearGradient
            colors={[getScoreColor(score.overallScore), getScoreColor(score.overallScore) + 'CC']}
            style={styles.iqScoreCircle}
          >
            <Text style={styles.iqScoreNumber}>{score.overallScore}</Text>
            <Text style={styles.iqScoreLabel}>Rewards IQ</Text>
          </LinearGradient>
        )}
        
        {score && (
          <View style={styles.percentileBadge}>
            <Sparkles size={16} color={colors.warning.main} />
            <Text style={styles.percentileText}>
              Top {100 - score.percentile}% of users
            </Text>
          </View>
        )}
      </Animated.View>
      
      {/* What's Next */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.whatsNextSection}>
        <Text style={styles.whatsNextTitle}>What's Next?</Text>
        
        <View style={styles.whatsNextItem}>
          <View style={styles.whatsNextIcon}>
            <Target size={20} color={colors.primary.main} />
          </View>
          <Text style={styles.whatsNextText}>
            Check which card to use before each purchase
          </Text>
        </View>
        
        <View style={styles.whatsNextItem}>
          <View style={styles.whatsNextIcon}>
            <TrendingUp size={20} color={colors.primary.main} />
          </View>
          <Text style={styles.whatsNextText}>
            Track your missed rewards and optimize
          </Text>
        </View>
        
        <View style={styles.whatsNextItem}>
          <View style={styles.whatsNextIcon}>
            <Sparkles size={20} color={colors.primary.main} />
          </View>
          <Text style={styles.whatsNextText}>
            Improve your score over time
          </Text>
        </View>
      </Animated.View>
      
      {/* Complete Button */}
      <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.ctaContainer}>
        <TouchableOpacity onPress={onComplete} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Start Optimizing</Text>
            <ChevronRight size={24} color={colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function PremiumOnboardingScreen({ onComplete }: PremiumOnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [spending, setSpending] = useState<Map<SpendingCategory, number>>(() => {
    const map = new Map<SpendingCategory, number>();
    map.set(SpendingCategory.GROCERIES, 500);
    map.set(SpendingCategory.DINING, 200);
    map.set(SpendingCategory.GAS, 150);
    map.set(SpendingCategory.ONLINE_SHOPPING, 200);
    map.set(SpendingCategory.TRAVEL, 100);
    map.set(SpendingCategory.ENTERTAINMENT, 100);
    return map;
  });
  const [rewardsIQ, setRewardsIQ] = useState<RewardsIQScore | null>(null);
  
  const handleToggleCard = useCallback((cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  }, []);
  
  const handleUpdateSpending = useCallback((category: SpendingCategory, amount: number) => {
    setSpending(prev => {
      const newMap = new Map(prev);
      newMap.set(category, amount);
      return newMap;
    });
  }, []);
  
  const handleEnableSmartWallet = useCallback(async () => {
    try {
      const locationGranted = await requestLocationPermission();
      const notificationGranted = await requestNotificationPermission();
      if (locationGranted) {
        await enableAutoPilot();
      }
      setCurrentStep(4);
    } catch (e) {
      console.error('Smart Wallet setup failed:', e);
      setCurrentStep(4);
    }
  }, []);
  
  const handleSkipSmartWallet = useCallback(() => {
    setCurrentStep(4);
  }, []);
  
  const handleComplete = useCallback(async () => {
    try {
      // Save cards
      for (const cardId of selectedCards) {
        await addCard(cardId);
      }
      
      // Save spending profile
      await saveSpendingProfile(spending);
      
      // Mark onboarding complete
      await setOnboardingComplete(true);
      
      onComplete();
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
      onComplete();
    }
  }, [selectedCards, spending, onComplete]);
  
  // Calculate Rewards IQ when reaching final step
  useEffect(() => {
    if (currentStep === 4) {
      const calculateScore = async () => {
        try {
          // First save the spending profile
          await saveSpendingProfile(spending);
          const score = await calculateRewardsIQ();
          setRewardsIQ(score);
        } catch (e) {
          console.error('Failed to calculate Rewards IQ:', e);
        }
      };
      calculateScore();
    }
  }, [currentStep, spending]);
  
  // Progress dots
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
  
  const handleSkipAll = useCallback(async () => {
    try {
      await setOnboardingComplete(true);
      onComplete();
    } catch (e) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <View style={styles.container}>
      {/* Progress indicator with skip */}
      <View style={styles.headerBar}>
        <View style={styles.headerBarInner}>
          <View style={styles.headerSpacer} />
          {renderProgressDots()}
          <TouchableOpacity onPress={handleSkipAll} style={styles.skipAllButton}>
            <Text style={styles.skipAllText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Steps */}
      {currentStep === 0 && (
        <ValuePropStep onNext={() => setCurrentStep(1)} />
      )}
      
      {currentStep === 1 && (
        <AddCardsStep
          selectedCards={selectedCards}
          onToggleCard={handleToggleCard}
          onNext={() => setCurrentStep(2)}
          onBack={() => setCurrentStep(0)}
        />
      )}
      
      {currentStep === 2 && (
        <SpendingStep
          spending={spending}
          onUpdateSpending={handleUpdateSpending}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}
      
      {currentStep === 3 && (
        <SmartWalletStep
          onEnable={handleEnableSmartWallet}
          onSkip={handleSkipSmartWallet}
          onBack={() => setCurrentStep(2)}
        />
      )}
      
      {currentStep === 4 && (
        <RewardsIQStep
          score={rewardsIQ}
          onComplete={handleComplete}
        />
      )}
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
  headerBar: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 50,
  },
  skipAllButton: {
    width: 50,
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  skipAllText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  
  // Step Header
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleAccent: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  
  // Value Prop Step
  iconHero: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  iconHeroGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  highlightText: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  statsBadge: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary.main,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: 8,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  ctaContainer: {
    paddingBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background.primary,
  },
  
  // Cards Step
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text.primary,
  },
  cardsList: {
    flex: 1,
    marginHorizontal: -8,
  },
  cardsListContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    gap: 8,
  },
  loadingCards: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingCardsText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  cardItemInfo: {
    flex: 1,
  },
  cardItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardItemIssuer: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  selectedCount: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  
  // Spending Step
  totalMonthly: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary.main,
  },
  spendingList: {
    flex: 1,
  },
  spendingListContent: {
    paddingBottom: 16,
    gap: 16,
  },
  spendingItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  spendingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  spendingEmoji: {
    fontSize: 18,
  },
  spendingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    width: 110,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  amountPrefix: {
    fontSize: 15,
    color: colors.text.secondary,
    marginRight: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
    minWidth: 60,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.primary.main + '20',
  },
  presetText: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  presetTextActive: {
    color: colors.primary.main,
  },
  
  // Smart Wallet Step
  smartWalletFeatures: {
    gap: 20,
    marginVertical: 32,
  },
  smartWalletFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  smartWalletFeatureText: {
    flex: 1,
  },
  smartWalletFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  smartWalletFeatureDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  smartWalletButtons: {
    gap: 16,
    marginBottom: 24,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: 10,
  },
  enableButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  
  // Rewards IQ Step
  confettiContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  confetti: {
    fontSize: 48,
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  iqScoreContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iqScoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iqScoreNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.background.primary,
  },
  iqScoreLabel: {
    fontSize: 14,
    color: colors.background.primary,
    opacity: 0.9,
  },
  percentileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  percentileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.main,
  },
  whatsNextSection: {
    marginBottom: 24,
  },
  whatsNextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  whatsNextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  whatsNextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsNextText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
