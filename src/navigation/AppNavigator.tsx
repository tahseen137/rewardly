/**
 * AppNavigator - Main navigation structure with bottom tabs
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

import { HomeScreen, MyCardsScreen, SettingsScreen, ProductSearchScreen } from '../screens';
import { ErrorBoundary } from '../components';

export type RootTabParamList = {
  Home: undefined;
  ProductSearch: undefined;
  MyCards: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Simple icon component using emoji
 */
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    ProductSearch: '🔍',
    MyCards: '💳',
    Settings: '⚙️',
  };

  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[name] || '•'}
    </Text>
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
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
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

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
});
