/**
 * AppNavigator - Main navigation structure with bottom tabs
 * Redesigned with glass morphism effect and lucide icons
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Home, CreditCard, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { HomeScreen, MyCardsScreen, SettingsScreen } from '../screens';
import { ErrorBoundary } from '../components';
import { useTheme } from '../theme';
import { colors } from '../theme/colors';
import { BlurView } from 'expo-blur';

export type RootTabParamList = {
  Home: undefined;
  MyCards: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

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
    case 'Home':
      IconComponent = Home;
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
 * Wrapped screen components with error boundaries
 */
function HomeScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load recommendations"
      fallbackMessage="There was a problem loading the recommendation screen. Please try again."
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

function SettingsScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load settings"
      fallbackMessage="There was a problem loading settings. Please try again."
    >
      <SettingsScreen />
    </ErrorBoundary>
  );
}

export default function AppNavigator() {
  const theme = useTheme();

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

  return (
    <NavigationContainer theme={navigationTheme}>
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
          name="Home"
          component={HomeScreenWithErrorBoundary}
          options={{
            tabBarLabel: 'Home',
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
          component={SettingsScreenWithErrorBoundary}
          options={{
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
