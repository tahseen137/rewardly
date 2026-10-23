/**
 * ReferralScreen — Simple invite-a-friend screen
 *
 * Local-first: no Supabase required. Uses AsyncStorage via ReferralService helpers.
 *
 * Shows:
 * - User's referral code
 * - How it works (3 steps)
 * - Invite a Friend button
 * - Friends invited counter
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Gift, Users, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  getReferralCode,
  getLocalReferralCount,
  shareReferral,
} from '../services/ReferralService';

export default function ReferralScreen() {
  const navigation = useNavigation();
  const [code, setCode] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  const loadData = useCallback(async () => {
    const [c, count] = await Promise.all([getReferralCode(), getLocalReferralCount()]);
    setCode(c);
    setFriendCount(count);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async () => {
    setIsSharing(true);
    try {
      await shareReferral();
      // Refresh count — shareReferral increments it on share
      const count = await getLocalReferralCount();
      setFriendCount(count);
    } finally {
      setIsSharing(false);
    }
  };

  const HOW_IT_WORKS = [
    {
      emoji: '📤',
      title: 'You invite a friend',
      description: 'Share your personal link or code with anyone who might love Rewardly.',
    },
    {
      emoji: '📲',
      title: 'They sign up free',
      description: 'Your friend downloads Rewardly and creates an account — it's 100% free.',
    },
    {
      emoji: '🎯',
      title: 'Both get a wallet analysis',
      description:
        'You and your friend each unlock a personalized wallet analysis showing your best card combo.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🍁</Text>
          <Text style={styles.heroTitle}>Invite a friend, both get a wallet analysis</Text>
          <Text style={styles.heroSubtitle}>
            Help a friend optimize their credit card rewards — and unlock a personalized analysis for
            yourself too.
          </Text>
        </Animated.View>

        {/* Referral Code */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          {code ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{code}</Text>
            </View>
          ) : (
            <ActivityIndicator color={colors.primary.main} style={{ marginVertical: 16 }} />
          )}
          <Text style={styles.codeHint}>rewardly.ca/ref/{code ?? '…'}</Text>
        </Animated.View>

        {/* Friends invited counter */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.counterCard}>
          <Users size={22} color={colors.primary.main} />
          <View style={styles.counterText}>
            <Text style={styles.counterNumber}>{friendCount}</Text>
            <Text style={styles.counterLabel}>
              {friendCount === 1 ? 'friend invited' : 'friends invited'}
            </Text>
          </View>
          <Gift size={22} color={colors.primary.light} />
        </Animated.View>

        {/* Big Invite Button */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inviteSection}>
          <TouchableOpacity
            style={[styles.inviteButton, isSharing && styles.inviteButtonDisabled]}
            onPress={handleInvite}
            activeOpacity={0.85}
            disabled={isSharing || !code}
          >
            {isSharing ? (
              <ActivityIndicator color={colors.background.primary} />
            ) : (
              <>
                <Share2 size={20} color={colors.background.primary} />
                <Text style={styles.inviteButtonText}>Invite a Friend</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* How it works */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={[styles.stepRow, i < HOW_IT_WORKS.length - 1 && styles.stepBorder]}>
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  heroCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary.main,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.lg,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.primary.main + '40',
  },
  counterText: {
    flex: 1,
  },
  counterNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary.main,
  },
  counterLabel: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
  },
  inviteSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: 18,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background.primary,
  },
  howCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  howTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 16,
    marginBottom: 16,
  },
  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  stepEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
});
