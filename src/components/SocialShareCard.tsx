/**
 * SocialShareCard - Generates shareable card for social media
 * Creates a visually appealing card to share on Twitter, Instagram, etc.
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  Share2,
  Target,
  Trophy,
  Sparkles,
  Twitter,
  Instagram,
  Facebook,
  Link,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { ShareableStats } from '../types/rewards-iq';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SocialShareCardProps {
  stats: ShareableStats;
  onShare?: (platform: 'twitter' | 'instagram' | 'facebook' | 'copy') => void;
}

// ============================================================================
// Share Button Component
// ============================================================================

interface ShareButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}

function ShareButton({ icon, label, color, onPress }: ShareButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  return (
    <TouchableOpacity
      style={styles.shareButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.shareButtonIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={styles.shareButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SocialShareCard({ stats, onShare }: SocialShareCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.primary.main;
    if (score >= 60) return colors.warning.main;
    return colors.error.main;
  };
  
  const scoreColor = getScoreColor(stats.rewardsIQ);
  
  const handleShareNative = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      await Share.share({
        message: stats.shareText + '\n' + stats.shareUrl,
        url: stats.shareUrl,
        title: `My Rewards IQ is ${stats.rewardsIQ}!`,
      });
      onShare?.('copy');
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [stats, onShare]);
  
  const handlePlatformShare = useCallback(async (platform: 'twitter' | 'instagram' | 'facebook') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // For now, use native share. In production, would use deep links
    await handleShareNative();
    onShare?.(platform);
  }, [handleShareNative, onShare]);
  
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      {/* Preview Card */}
      <View style={styles.previewCard}>
        <LinearGradient
          colors={[colors.background.secondary, colors.background.tertiary]}
          style={styles.previewGradient}
        >
          {/* Logo/Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Sparkles size={16} color={colors.primary.main} />
              <Text style={styles.logoText}>Rewardly</Text>
            </View>
          </View>
          
          {/* Score Display */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreCircle}>
              <LinearGradient
                colors={[scoreColor, scoreColor + 'CC']}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreNumber}>{stats.rewardsIQ}</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.scoreLabel}>Rewards IQ</Text>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Trophy size={16} color={colors.warning.main} />
              <Text style={styles.statText}>Top {100 - stats.percentile}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Target size={16} color={colors.primary.main} />
              <Text style={styles.statText}>
                ${stats.annualOptimization.toLocaleString()}/yr
              </Text>
            </View>
          </View>
          
          {/* CTA */}
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>Get your Rewards IQ →</Text>
            <Text style={styles.urlText}>{stats.shareUrl}</Text>
          </View>
        </LinearGradient>
      </View>
      
      {/* Share Buttons */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Text style={styles.shareTitle}>Share to</Text>
        
        <View style={styles.shareButtonsRow}>
          <ShareButton
            icon={<Twitter size={20} color="#1DA1F2" />}
            label="Twitter"
            color="#1DA1F2"
            onPress={() => handlePlatformShare('twitter')}
          />
          <ShareButton
            icon={<Instagram size={20} color="#E4405F" />}
            label="Instagram"
            color="#E4405F"
            onPress={() => handlePlatformShare('instagram')}
          />
          <ShareButton
            icon={<Facebook size={20} color="#1877F2" />}
            label="Facebook"
            color="#1877F2"
            onPress={() => handlePlatformShare('facebook')}
          />
          <ShareButton
            icon={<Link size={20} color={colors.text.secondary} />}
            label="Copy"
            color={colors.text.secondary}
            onPress={handleShareNative}
          />
        </View>
      </Animated.View>
      
      {/* Main Share Button */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <TouchableOpacity onPress={handleShareNative} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.accent.main, colors.accent.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainShareButton}
          >
            <Share2 size={20} color="#fff" />
            <Text style={styles.mainShareText}>Share My Score</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.shareHint}>
          Show off your rewards optimization skills 🎯
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  
  // Preview Card
  previewCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  previewGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  // Score Section
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    marginBottom: 12,
  },
  scoreGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.background.primary,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary + '50',
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.light,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  
  // CTA
  ctaRow: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  
  // Share Section
  shareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  shareButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  shareButton: {
    alignItems: 'center',
    gap: 6,
  },
  shareButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  
  // Main Share Button
  mainShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: 10,
  },
  mainShareText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  shareHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 12,
  },
});
