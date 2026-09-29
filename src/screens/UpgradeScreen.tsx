/**
 * UpgradeScreen - Rewardly is now completely free.
 * This screen now informs users that all features are available at no cost.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function UpgradeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Sparkles size={48} color={colors.primary.main} />
        </View>
        <Text style={styles.title}>Rewardly is Free 🎉</Text>
        <Text style={styles.subtitle}>
          All features are available to everyone at no cost. Enjoy unlimited card recommendations,
          Sage AI, insights, and more — completely free.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary.bg20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
