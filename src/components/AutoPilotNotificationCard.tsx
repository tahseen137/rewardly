/**
 * AutoPilotNotificationCard - Card recommendation display for in-app alerts
 * 
 * Shows the recommended card when user enters a monitored store
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MapPin, CreditCard, X, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { Card, SpendingCategory } from '../types';

interface AutoPilotNotificationCardProps {
  merchantName: string;
  category: SpendingCategory;
  recommendedCard: Card;
  rewardRate: number;
  estimatedValue: number;
  alternativeCard?: Card;
  alternativeRate?: number;
  onDismiss: () => void;
  onViewDetails?: () => void;
}

export default function AutoPilotNotificationCard({
  merchantName,
  category,
  recommendedCard,
  rewardRate,
  estimatedValue,
  alternativeCard,
  alternativeRate,
  onDismiss,
  onViewDetails,
}: AutoPilotNotificationCardProps) {
  const getCategoryEmoji = (cat: SpendingCategory): string => {
    const emojiMap: Record<SpendingCategory, string> = {
      [SpendingCategory.GROCERIES]: '🛒',
      [SpendingCategory.DINING]: '☕',
      [SpendingCategory.GAS]: '⛽',
      [SpendingCategory.TRAVEL]: '✈️',
      [SpendingCategory.ONLINE_SHOPPING]: '📦',
      [SpendingCategory.ENTERTAINMENT]: '🎬',
      [SpendingCategory.DRUGSTORES]: '💊',
      [SpendingCategory.HOME_IMPROVEMENT]: '🔧',
      [SpendingCategory.OTHER]: '🏷️',
    };
    return emojiMap[cat] || '🏷️';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary.main, colors.primary.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MapPin size={16} color="#FFFFFF" />
            <Text style={styles.merchantName}>{merchantName}</Text>
            <Text style={styles.emoji}>{getCategoryEmoji(category)}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <X size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>🎯 Best Card to Use</Text>
          
          <View style={styles.cardRecommendation}>
            <View style={styles.cardIcon}>
              <CreditCard size={24} color={colors.primary.main} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardName}>{recommendedCard.name}</Text>
              <Text style={styles.cardIssuer}>{recommendedCard.issuer}</Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardRate}>{rewardRate}%</Text>
              <Text style={styles.rewardLabel}>back</Text>
            </View>
          </View>

          {/* Comparison */}
          {alternativeCard && alternativeRate && (
            <View style={styles.comparison}>
              <Text style={styles.comparisonText}>
                vs {alternativeRate}% on {alternativeCard.name}
              </Text>
            </View>
          )}

          {/* Estimated Savings */}
          <View style={styles.savings}>
            <Text style={styles.savingsText}>
              Estimated reward: ${estimatedValue.toFixed(2)} on $50 purchase
            </Text>
          </View>
        </View>

        {/* Footer */}
        {onViewDetails && (
          <TouchableOpacity style={styles.footer} onPress={onViewDetails}>
            <Text style={styles.footerText}>View all card options</Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emoji: {
    fontSize: 14,
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  cardRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardIssuer: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  rewardBadge: {
    alignItems: 'center',
    backgroundColor: colors.semantic.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rewardRate: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  rewardLabel: {
    fontSize: 11,
    color: colors.semantic.success,
  },
  comparison: {
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  savings: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  savingsText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginRight: 4,
  },
});
