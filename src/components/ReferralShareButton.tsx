/**
 * ReferralShareButton — Phase 1 UI component
 *
 * Displays a "Share & Earn Rewards" button on card recommendation results.
 * Fetches (or creates) the user's referral code and opens the native Share sheet.
 *
 * Usage:
 *   <ReferralShareButton userId={user.id} cardName="CIBC Aventura Visa Infinite" />
 */

import React, { useEffect, useState } from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { ReferralService } from '../services/ReferralService';

interface Props {
  userId: string;
  cardName?: string;
  style?: object;
}

export function ReferralShareButton({ userId, cardName, style }: Props) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    ReferralService.getOrCreateReferralCode(userId)
      .then((data) => {
        if (!cancelled && data) setReferralCode(data.code);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleShare = async () => {
    if (!referralCode) return;

    const link = ReferralService.buildReferralLink(referralCode);
    const cardContext = cardName ? ` I'm using the ${cardName} and saving money on every purchase.` : '';
    const message = `Check out Rewardly!${cardContext} Sign up with my referral link and we both earn rewards: ${link}`;

    try {
      await Share.share({
        message,
        url: link,
        title: 'Join me on Rewardly',
      });
    } catch (error) {
      console.warn('[ReferralShareButton] Share failed:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.button, styles.loadingButton, style]}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (!referralCode) return null;

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleShare}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Share Rewardly and earn rewards"
    >
      {/* Gift icon using emoji — no extra dep required */}
      <Text style={styles.icon}>🎁</Text>
      <Text style={styles.label}>Share & Earn Rewards</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',  // emerald-500
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingButton: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ReferralShareButton;
