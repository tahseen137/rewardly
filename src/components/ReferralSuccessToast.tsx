/**
 * ReferralSuccessToast — Phase 1 UI component
 *
 * Shown after a referred user signs up to confirm both parties earned rewards.
 *
 * Usage:
 *   <ReferralSuccessToast visible={showToast} onDismiss={() => setShowToast(false)} />
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onDismiss?: () => void;
  /** Auto-dismiss after this many ms (default: 5000) */
  autoDismissMs?: number;
}

export function ReferralSuccessToast({ visible, onDismiss, autoDismissMs = 5000 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 200 }),
      ]).start();

      // Auto-dismiss
      const timer = setTimeout(() => {
        dismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.icon}>🎉</Text>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Referral Bonus Earned!</Text>
        <Text style={styles.body}>
          You and your friend both just earned rewards for joining Rewardly. Welcome!
        </Text>
      </View>
      <TouchableOpacity onPress={dismiss} accessibilityLabel="Dismiss" style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 999,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    color: '#111827',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  close: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
});

export default ReferralSuccessToast;
