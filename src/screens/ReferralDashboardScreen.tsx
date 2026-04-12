/**
 * ReferralDashboardScreen — Complete referral program dashboard
 *
 * Shows:
 * - User's referral code + share options
 * - Referral stats (signups, rewards earned)
 * - Progress toward next reward tier
 * - Referral history
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { getCurrentUser } from '../services/AuthService';
import { ReferralService, ReferralStats } from '../services/ReferralService';
import { LinearGradient } from 'expo-linear-gradient';

// Reward tiers matching ReferralService
const REWARD_TIERS = [
  { threshold: 1, reward: 'Advocate Badge', color: '#10b981', icon: '🌟' },
  { threshold: 5, reward: '1 Month Pro', color: '#3b82f6', icon: '💎' },
  { threshold: 10, reward: '3 Months Pro', color: '#8b5cf6', icon: '👑' },
  { threshold: 25, reward: 'Lifetime Pro', color: '#f59e0b', icon: '🏆' },
];

export function ReferralDashboardScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedTooltip, setCopiedTooltip] = useState(false);

  // Load user ID on mount
  useEffect(() => {
    getCurrentUser().then(user => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await ReferralService.getReferralStats(userId);
      setStats(data);
    } catch (err) {
      console.error('[ReferralDashboard] Error loading stats:', err);
      Alert.alert('Error', 'Failed to load referral stats. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleCopyLink = async () => {
    if (!stats?.referralLink) return;

    try {
      Clipboard.setString(stats.referralLink);
      setCopiedTooltip(true);
      setTimeout(() => setCopiedTooltip(false), 2000);
    } catch (err) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShare = async (platform?: 'twitter' | 'whatsapp' | 'email') => {
    if (!stats?.referralLink || !stats?.referralCode) return;

    const message = `Check out Rewardly! 🎁 Track all your Canadian credit card rewards in one place. Sign up with my code ${stats.referralCode} and we both earn rewards! ${stats.referralLink}`;

    try {
      if (platform === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
        // Open URL (implementation depends on Linking or WebBrowser)
        console.log('[ReferralDashboard] Twitter share:', twitterUrl);
        Alert.alert('Share on Twitter', 'Opening Twitter...');
      } else if (platform === 'whatsapp') {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        console.log('[ReferralDashboard] WhatsApp share:', whatsappUrl);
        Alert.alert('Share on WhatsApp', 'Opening WhatsApp...');
      } else if (platform === 'email') {
        const emailUrl = `mailto:?subject=${encodeURIComponent('Join me on Rewardly!')}&body=${encodeURIComponent(message)}`;
        console.log('[ReferralDashboard] Email share:', emailUrl);
        Alert.alert('Share via Email', 'Opening email...');
      } else {
        // Native share sheet
        await Share.share({
          message,
          url: stats.referralLink,
          title: 'Join me on Rewardly',
        });
      }
    } catch (err) {
      console.warn('[ReferralDashboard] Share failed:', err);
    }
  };

  // Calculate next reward tier
  const getNextReward = () => {
    if (!stats) return null;
    const next = REWARD_TIERS.find((t) => t.threshold > stats.claimedSignups);
    return next;
  };

  const getCurrentReward = () => {
    if (!stats) return null;
    const current = [...REWARD_TIERS]
      .reverse()
      .find((t) => t.threshold <= stats.claimedSignups);
    return current;
  };

  const getProgressPercentage = () => {
    if (!stats) return 0;
    const next = getNextReward();
    if (!next) return 100;
    const current = getCurrentReward()?.threshold || 0;
    const progress = stats.claimedSignups - current;
    const range = next.threshold - current;
    return Math.min(100, (progress / range) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading your referral dashboard...</Text>
      </View>
    );
  }

  const nextReward = getNextReward();
  const currentReward = getCurrentReward();
  const progress = getProgressPercentage();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#7c3aed']} />
      }
    >
      {/* Hero Section */}
      <LinearGradient colors={['#7c3aed', '#a855f7', '#c084fc']} style={styles.heroSection}>
        <Text style={styles.heroTitle}>🎁 Invite & Earn Rewards</Text>
        <Text style={styles.heroSubtitle}>
          Share Rewardly with friends and earn Pro features for free!
        </Text>
      </LinearGradient>

      {/* Referral Code Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Referral Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{stats?.referralCode || 'LOADING...'}</Text>
        </View>
        <Text style={styles.codeHint}>Share this code or use the link below</Text>

        {/* Copy Link Button */}
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink} activeOpacity={0.8}>
          <Text style={styles.copyButtonIcon}>🔗</Text>
          <Text style={styles.copyButtonText}>
            {copiedTooltip ? 'Copied!' : 'Copy Referral Link'}
          </Text>
        </TouchableOpacity>

        {/* Social Share Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#1da1f2' }]}
            onPress={() => handleShare('twitter')}
            activeOpacity={0.8}
          >
            <Text style={styles.socialButtonText}>🐦 Twitter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#25d366' }]}
            onPress={() => handleShare('whatsapp')}
            activeOpacity={0.8}
          >
            <Text style={styles.socialButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#ea4335' }]}
            onPress={() => handleShare('email')}
            activeOpacity={0.8}
          >
            <Text style={styles.socialButtonText}>✉️ Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#6b7280' }]}
            onPress={() => handleShare()}
            activeOpacity={0.8}
          >
            <Text style={styles.socialButtonText}>📤 More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.statNumber}>{stats?.claimedSignups || 0}</Text>
          <Text style={styles.statLabel}>Successful Referrals</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statNumber}>{stats?.pendingSignups || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reward Progress</Text>
        
        {currentReward && (
          <View style={styles.currentRewardBadge}>
            <Text style={styles.currentRewardIcon}>{currentReward.icon}</Text>
            <Text style={styles.currentRewardText}>
              Current: {currentReward.reward}
            </Text>
          </View>
        )}

        {nextReward ? (
          <>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {stats?.claimedSignups} / {nextReward.threshold} referrals to unlock{' '}
              <Text style={styles.progressTextBold}>{nextReward.reward}</Text>
            </Text>

            {/* Reward Tiers */}
            <View style={styles.tiersList}>
              {REWARD_TIERS.map((tier) => {
                const isUnlocked = (stats?.claimedSignups || 0) >= tier.threshold;
                return (
                  <View
                    key={tier.threshold}
                    style={[
                      styles.tierItem,
                      isUnlocked && styles.tierItemUnlocked,
                    ]}
                  >
                    <Text style={styles.tierIcon}>{tier.icon}</Text>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierReward, isUnlocked && styles.tierRewardUnlocked]}>
                        {tier.reward}
                      </Text>
                      <Text style={styles.tierThreshold}>{tier.threshold} referrals</Text>
                    </View>
                    {isUnlocked && <Text style={styles.tierCheck}>✓</Text>}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.maxRewardContainer}>
            <Text style={styles.maxRewardIcon}>🏆</Text>
            <Text style={styles.maxRewardText}>
              Congratulations! You've unlocked Lifetime Pro!
            </Text>
          </View>
        )}
      </View>

      {/* How It Works */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How It Works</Text>
        <View style={styles.howItWorksStep}>
          <Text style={styles.stepNumber}>1️⃣</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Share your link</Text>
            <Text style={styles.stepText}>
              Send your referral link to friends via social media, email, or messaging
            </Text>
          </View>
        </View>

        <View style={styles.howItWorksStep}>
          <Text style={styles.stepNumber}>2️⃣</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>They sign up</Text>
            <Text style={styles.stepText}>
              When they create an account using your link, you both get rewards
            </Text>
          </View>
        </View>

        <View style={styles.howItWorksStep}>
          <Text style={styles.stepNumber}>3️⃣</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Unlock Pro features</Text>
            <Text style={styles.stepText}>
              Reach reward tiers to unlock free Pro access (up to Lifetime!)
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  heroSection: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#7c3aed',
    borderStyle: 'dashed',
  },
  code: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7c3aed',
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  copyButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  currentRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  currentRewardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  currentRewardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressTextBold: {
    fontWeight: '700',
    color: '#7c3aed',
  },
  tiersList: {
    gap: 12,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  tierItemUnlocked: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    opacity: 1,
  },
  tierIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierReward: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  tierRewardUnlocked: {
    color: '#059669',
  },
  tierThreshold: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  tierCheck: {
    fontSize: 20,
    color: '#10b981',
  },
  maxRewardContainer: {
    alignItems: 'center',
    padding: 24,
  },
  maxRewardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  maxRewardText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  howItWorksStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 24,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});

export default ReferralDashboardScreen;
