/**
 * AppNavigator - Main navigation structure with auth handling
 * Shows AuthScreen if not logged in, OnboardingScreen for new users
 * Then bottom tabs with glass morphism effect and lucide icons
 *
 * MEGA BUILD UPDATE: Added Insights tab with MissedRewards, RewardsIQ, PortfolioOptimizer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Home, CreditCard, Settings, Sparkles, Navigation, BarChart3 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import {
  HomeScreen,
  MyCardsScreen,
  SettingsScreen,
  SageScreen,
  SmartWalletScreen,
  InsightsHomeScreen,
  MissedRewardsScreen,
  RewardsIQScreen,
  PortfolioOptimizerScreen,
  WalletOptimizerScreen,
  SpendingInsightsScreen,
  CardTrackerScreen,
  CardBenefitsScreen,
  SUBTrackerScreen,
  CardCompareScreen,
  SpendingLogScreen,
  RecurringScreen,
  AnnualFeeScreen,
  RedemptionGuideScreen,
  CardRecommendationsScreen,
  NotificationsScreen,
  SavingsReportScreen,
  StatementUploadScreen,
  InsightsDashboardScreen,
  AchievementsScreen,
  ApplicationTrackerScreen,
  ExploreCardsScreen,
} from '../screens';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PremiumOnboardingScreen from '../screens/PremiumOnboardingScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import LandingPage from '../screens/LandingPage';
import { ErrorBoundary } from '../components';
import { useTheme } from '../theme';
import { colors } from '../theme/colors';
import { getCurrentUser, onAuthStateChange, AuthUser } from '../services/AuthService';
import { isOnboardingComplete, initializePreferences } from '../services/PreferenceManager';
import { initializeSubscription, refreshSubscription, canAccessFeatureSync, getCurrentTierSync, SubscriptionTier } from '../services/SubscriptionService';
import { initializeAutoPilot } from '../services/AutoPilotService';
import { AchievementEventEmitter } from '../services/AchievementEventEmitter';

// Stack navigator for Insights screens
export type InsightsStackParamList = {
  InsightsHome: undefined;
  MissedRewards: undefined;
  RewardsIQ: undefined;
  PortfolioOptimizer: undefined;
  WalletOptimizer: undefined;
  SpendingInsights: undefined;
  CardTracker: undefined;
  CardBenefits: { cardId: string };
  SUBTracker: undefined;
  CardCompare: { preselectedCards?: string[] };
  SpendingLog: undefined;
  Recurring: undefined;
  AnnualFee: undefined;
  RedemptionGuide: { programId: string; cardId?: string };
  CardRecommendations: undefined;
  SavingsReport: { reportId?: string };
  StatementUpload: undefined;
  InsightsDashboard: undefined;
  Achievements: undefined;
  ApplicationTracker: undefined;
  ExploreCards: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Insights: undefined;
  Sage: undefined;
  SmartWallet: undefined;
  MyCards: undefined;
  Settings: undefined;
};

// Root Stack for modals (Upgrade screen, Notifications)
export type RootStackParamList = {
  MainTabs: undefined;
  Upgrade: {
    feature?: string;
    source?: string;
  };
  Notifications: undefined;
};

type AppState = 'loading' | 'landing' | 'auth' | 'onboarding' | 'main';

const Tab = createBottomTabNavigator<RootTabParamList>();
const InsightsStack = createNativeStackNavigator<InsightsStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Insights Stack Navigator - Contains InsightsHome, MissedRewards, RewardsIQ, PortfolioOptimizer
 */
function InsightsNavigator() {
  return (
    <InsightsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
      initialRouteName="InsightsHome"
    >
      <InsightsStack.Screen
        name="InsightsHome"
        component={InsightsHomeScreen}
      />
      <InsightsStack.Screen
        name="MissedRewards"
        component={MissedRewardsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="RewardsIQ"
        component={RewardsIQScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen 
        name="PortfolioOptimizer" 
        component={PortfolioOptimizerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen 
        name="WalletOptimizer" 
        component={WalletOptimizerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen 
        name="SpendingInsights" 
        component={SpendingInsightsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="CardTracker"
        component={CardTrackerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="CardBenefits"
        component={CardBenefitsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="SUBTracker"
        component={SUBTrackerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="CardCompare"
        component={CardCompareScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="SpendingLog"
        component={SpendingLogScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="Recurring"
        component={RecurringScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="AnnualFee"
        component={AnnualFeeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="RedemptionGuide"
        component={RedemptionGuideScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="CardRecommendations"
        component={CardRecommendationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="SavingsReport"
        component={SavingsReportScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="StatementUpload"
        component={StatementUploadScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="InsightsDashboard"
        component={InsightsDashboardScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="ApplicationTracker"
        component={ApplicationTrackerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <InsightsStack.Screen
        name="ExploreCards"
        component={ExploreCardsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </InsightsStack.Navigator>
  );
}

/**
 * Tab icon component using lucide-react-native with scale animation
 * Uses standard RN Animated for web compatibility
 */
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1.0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  const iconProps = {
    size: 20, // h-5 w-5
    color,
  };

  let IconComponent;
  switch (name) {
    case 'Home':
      IconComponent = Home;
      break;
    case 'Insights':
      IconComponent = BarChart3;
      break;
    case 'Sage':
      IconComponent = Sparkles;
      break;
    case 'SmartWallet':
      IconComponent = Navigation;
      break;
    case 'MyCards':
      IconComponent = CreditCard;
      break;
    case 'Settings':
      IconComponent = Settings;
      break;
    default:
      IconComponent = Home;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <IconComponent {...iconProps} />
    </Animated.View>
  );
}

/**
 * Loading screen
 */
function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Wrapped screen components with error boundaries
 */
function HomeScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load calculator"
      fallbackMessage="There was a problem loading the rewards calculator. Please try again."
    >
      <HomeScreen />
    </ErrorBoundary>
  );
}

function MyCardsScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load cards"
      fallbackMessage="There was a problem loading your cards. Please try again."
    >
      <MyCardsScreen />
    </ErrorBoundary>
  );
}

function SageScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load Sage"
      fallbackMessage="There was a problem loading the AI assistant. Please try again."
    >
      <SageScreen />
    </ErrorBoundary>
  );
}

function SettingsScreenWithErrorBoundary({ onSignOut, onSignIn }: { onSignOut: () => void; onSignIn: () => void }) {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load settings"
      fallbackMessage="There was a problem loading settings. Please try again."
    >
      <SettingsScreen onSignOut={onSignOut} onSignIn={onSignIn} />
    </ErrorBoundary>
  );
}

function SmartWalletScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load Smart Wallet"
      fallbackMessage="There was a problem loading Smart Wallet. Please try again."
    >
      <SmartWalletScreen />
    </ErrorBoundary>
  );
}

/**
 * Main tab navigator
 */
function MainTabs({ onSignOut, onSignIn }: { onSignOut: () => void; onSignIn: () => void }) {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.secondary,
        unmountOnBlur: true, // BUG #5 FIX: Unmount inactive tabs to prevent overlap
        lazy: true, // Don't pre-render inactive tabs
        tabBarStyle: {
          height: 64, // h-16
          backgroundColor: Platform.OS === 'web'
            ? 'rgba(15, 21, 40, 0.8)' // Glass effect fallback for web
            : colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          position: 'absolute',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8, // Safe area inset bottom
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarBackground: () =>
          Platform.OS === 'web' ? null : (
            <BlurView
              intensity={25}
              tint="dark"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ),
        headerShown: false, // Hide headers for cleaner design
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenWithErrorBoundary}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsNavigator}
        options={{
          tabBarLabel: 'Insights',
        }}
      />
      <Tab.Screen
        name="Sage"
        component={SageScreenWithErrorBoundary}
        options={{
          tabBarLabel: 'Sage',
        }}
      />
      <Tab.Screen
        name="SmartWallet"
        component={SmartWalletScreenWithErrorBoundary}
        options={{
          tabBarLabel: 'Smart Wallet',
        }}
      />
      <Tab.Screen
        name="MyCards"
        component={MyCardsScreenWithErrorBoundary}
        options={{
          tabBarLabel: 'My Cards',
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
        }}
      >
        {() => <SettingsScreenWithErrorBoundary onSignOut={onSignOut} onSignIn={onSignIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const theme = useTheme();
  const [appState, setAppState] = useState<AppState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  // Initialize app state
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize preferences
        await initializePreferences();

        // Initialize subscription service
        await initializeSubscription();

        // Initialize Smart Wallet service (uses AutoPilot service internally)
        await initializeAutoPilot();

        // Track app open for streak achievement
        AchievementEventEmitter.track('app_opened', {});

        // Check for existing user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          // User exists, check onboarding
          const onboardingDone = isOnboardingComplete();
          setAppState(onboardingDone ? 'main' : 'onboarding');
        } else {
          // No user — show landing page on web, auth on mobile
          setAppState(Platform.OS === 'web' ? 'landing' : 'auth');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Default to auth screen on error
        setAppState('auth');
      }
    };

    initializeApp();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (event, authUser) => {
      if (event === 'SIGNED_IN' && authUser) {
        setUser(authUser);
        // Refresh subscription tier so features unlock immediately
        try {
          await refreshSubscription();
        } catch (e) {
          console.warn('Failed to refresh subscription on sign-in:', e);
        }
        const onboardingDone = isOnboardingComplete();
        setAppState(onboardingDone ? 'main' : 'onboarding');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAppState(Platform.OS === 'web' ? 'landing' : 'auth');
      }
    });

    return unsubscribe;
  }, []);

  const handleAuthSuccess = useCallback(() => {
    const onboardingDone = isOnboardingComplete();
    setAppState(onboardingDone ? 'main' : 'onboarding');
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setAppState('main');
  }, []);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setAppState(Platform.OS === 'web' ? 'landing' : 'auth');
  }, []);

  const handleSignIn = useCallback(() => {
    setAppState('auth');
  }, []);

  const handleLandingGetStarted = useCallback(() => {
    setAppState('auth');
  }, []);

  // Create navigation theme based on app theme
  const navigationTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: theme.colors.primary.main,
          background: theme.colors.background.primary,
          card: theme.colors.background.secondary,
          text: theme.colors.text.primary,
          border: theme.colors.border.light,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: theme.colors.primary.main,
          background: theme.colors.background.primary,
          card: theme.colors.background.secondary,
          text: theme.colors.text.primary,
          border: theme.colors.border.light,
        },
      };

  // Show loading screen while initializing
  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  // Show web landing page
  if (appState === 'landing') {
    return <LandingPage onGetStarted={handleLandingGetStarted} />;
  }

  // Show auth screen if not logged in
  if (appState === 'auth') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Show onboarding for new users
  if (appState === 'onboarding') {
    return <PremiumOnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Main app with tabs
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator onSignOut={handleSignOut} onSignIn={handleSignIn} />
    </NavigationContainer>
  );
}

/**
 * RootNavigator - Wraps MainTabs and provides modal screens (Upgrade)
 */
function RootNavigator({ onSignOut, onSignIn }: { onSignOut: () => void; onSignIn: () => void }) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs">
        {() => <MainTabs onSignOut={onSignOut} onSignIn={onSignIn} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </RootStack.Navigator>
  );
}
