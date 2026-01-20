/**
 * AppNavigator - Main navigation structure with bottom tabs
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

import { HomeScreen, MyCardsScreen, SettingsScreen, ProductSearchScreen } from '../screens';
import { ErrorBoundary, Icon } from '../components';
import { useTheme } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  ProductSearch: undefined;
  MyCards: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Tab icon component using Icon component
 */
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const iconMap: Record<string, string> = {
    Home: 'home',
    ProductSearch: 'search',
    MyCards: 'cards',
    Settings: 'settings',
  };

  return <Icon name={iconMap[name] || 'home'} size={focused ? 26 : 24} color={color} />;
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

function ProductSearchScreenWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallbackTitle="Unable to load product search"
      fallbackMessage="There was a problem loading product search. Please try again."
    >
      <ProductSearchScreen />
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
          tabBarActiveTintColor: theme.colors.primary.main,
          tabBarInactiveTintColor: theme.colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: theme.colors.background.secondary,
            borderTopColor: theme.colors.border.light,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary.main,
          },
          headerTintColor: theme.colors.primary.contrast,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreenWithErrorBoundary}
          options={{
            title: 'Find Best Card',
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="ProductSearch"
          component={ProductSearchScreenWithErrorBoundary}
          options={{
            title: 'Product Search',
            tabBarLabel: 'Products',
          }}
        />
        <Tab.Screen
          name="MyCards"
          component={MyCardsScreenWithErrorBoundary}
          options={{
            title: 'My Cards',
            tabBarLabel: 'My Cards',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreenWithErrorBoundary}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Styles removed - using theme-based Icon component
