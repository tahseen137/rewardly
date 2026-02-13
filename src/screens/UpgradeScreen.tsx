/**
 * UpgradeScreen - Dedicated screen for viewing and purchasing subscription tiers
 * 
 * Can be navigated to from anywhere in the app with optional context
 * about which feature prompted the upgrade
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { X } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import Paywall from '../components/Paywall';
import { SubscriptionTier, BillingPeriod, refreshSubscription } from '../services/SubscriptionService';

// Import Feature type from SubscriptionService
import type { Feature } from '../services/SubscriptionService';

export type RootStackParamList = {
  MainTabs: undefined;
  Upgrade: { 
    feature?: Feature; 
    source?: string;
  };
};

type UpgradeScreenProps = {
  route: RouteProp<RootStackParamList, 'Upgrade'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Upgrade'>;
};

export default function UpgradeScreen({ route, navigation }: UpgradeScreenProps) {
  const { feature, source } = route.params || {};
  const [showPaywall, setShowPaywall] = useState(true);

  // Auto-show paywall on mount
  useEffect(() => {
    setShowPaywall(true);
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubscribe = useCallback(async (tier: SubscriptionTier, period: BillingPeriod) => {
    // Refresh subscription state after successful subscription
    // The webhook should have already updated the database
    await refreshSubscription();
    
    // Close the screen
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleClose} 
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Paywall component */}
      <Paywall
        visible={showPaywall}
        onClose={handleClose}
        onSubscribe={handleSubscribe}
        highlightFeature={feature}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
