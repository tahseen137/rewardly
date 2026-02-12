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
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Home, CreditCard, Settings, TrendingUp, Navigation, BarChart3 } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { 
  MyCardsScreen, 
  SettingsScreen, 
  SageScreen, 
  AutoPilotScreen,
  InsightsHomeScreen,
  MissedRewardsScreen,
  RewardsIQScreen,
  PortfolioOptimizerScreen,
  SpendingInsightsScreen,
} from '../screens';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PremiumOnboardingScreen from '../screens/PremiumOnboardingScreen';
import { ErrorBoundary } from '../components';
import { useTheme } from '../theme';
import { colors } from '../theme/colors';
import { getCurrentUser, onAuthStateChange, AuthUser } from '../services/AuthService';
import { isOnboardingComplete, initializePreferences } from '../services/PreferenceManager';
import { initializeSubscription } from '../services/SubscriptionService';
import { initializeAutoPilot } from '../services/AutoPilotService';

// Stack navigator for Insights screens
export type InsightsStackParamList = {
  InsightsHome: undefined;
  MissedRewards: undefined;
  RewardsIQ: undefined;
  PortfolioOptimizer: undefined;
  SpendingInsights: undefined;
};

export type RootTabParamList = {
  Sage: undefined;
  Insights: undefined;
  AutoPilot: undefined;
  MyCards: undefined;
  Settings: undefined;
};

type AppState = 'loading' | 'auth' | 'onboarding' | 'main';

const Tab = createBottomTabNavigator<RootTabParamList>();
const InsightsStack = createNativeStackNavigator<InsightsStackParamList>();

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
        name="SpendingInsights" 
        component={SpendingInsightsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </InsightsStack.Navigator>
  );
}

/**
 * Tab icon component using lucide-react-native with scale animation
 */
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const scale = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(focused ? 1.1 : 1.0, {
          damping: 15,
          stiffness: 150,
        }),
      },
    ],
  }));

  const iconProps = {
    size: 20, // h-5 w-5
    color,
  };

  let IconComponent;
  switch (name) {
    case 'Sage':
      IconComponent = Home;
      break;
    case 'Insights':
      IconComponent = BarChart3;
      break;
    case 'AutoPilot':
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
    <Animated.View style={scale}>
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

function SettingsScreenWithErrorBoundary({ onSignOut }: { onSignOut: () => void }) {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load settings"
      fallbackMessage="There was a problem loading settings. Please try again."
    >
      <SettingsScreen onSignOut={onSignOut} />
    </ErrorBoundary>
  );
}

function AutoPilotScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load AutoPilot"
      fallbackMessage="There was a problem loading AutoPilot. Please try again."
    >
      <AutoPilotScreen />
    </ErrorBoundary>
  );
}

/**
 * Main tab navigator
 */
function MainTabs({ onSignOut }: { onSignOut: () => void }) {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.secondary,
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
        name="Sage"
        component={SageScreenWithErrorBoundary}
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
        name="AutoPilot"
        component={AutoPilotScreenWithErrorBoundary}
        options={{
          tabBarLabel: 'AutoPilot',
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
        {() => <SettingsScreenWithErrorBoundary onSignOut={onSignOut} />}
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
        
        // Initialize AutoPilot service
        await initializeAutoPilot();
        
        // Check for existing user
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          // User exists, check onboarding
          const onboardingDone = isOnboardingComplete();
          setAppState(onboardingDone ? 'main' : 'onboarding');
        } else {
          // No user, show auth
          setAppState('auth');
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
    const unsubscribe = onAuthStateChange((event, authUser) => {
      if (event === 'SIGNED_IN' && authUser) {
        setUser(authUser);
        const onboardingDone = isOnboardingComplete();
        setAppState(onboardingDone ? 'main' : 'onboarding');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAppState('auth');
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
      <MainTabs onSignOut={handleSignOut} />
    </NavigationContainer>
  );
}
