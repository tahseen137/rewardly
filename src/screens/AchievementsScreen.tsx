/**
 * AchievementsScreen - Trophy case displaying earned achievements
 * Requirements: F15 - Achievements & Gamification System
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTheme, Theme } from '../theme';
import {
  getAchievements,
  getAchievementDefinitions,
  getRankDefinitions,
  initializeAchievements,
} from '../services/AchievementService';
import {
  UserAchievements,
  AchievementDefinition,
  AchievementCategory,
} from '../types';

type FilterType = 'all' | AchievementCategory;

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      await initializeAchievements();
      const data = await getAchievements();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const allDefinitions = useMemo(() => getAchievementDefinitions(), []);
  const ranks = useMemo(() => getRankDefinitions(), []);

  const currentRank = useMemo(() => {
    if (!achievements) return ranks[0];
    return ranks.find(r => r.rank === achievements.rank) || ranks[0];
  }, [achievements, ranks]);

  const filteredAchievements = useMemo(() => {
    if (filter === 'all') return allDefinitions;
    return allDefinitions.filter(a => a.category === filter);
  }, [allDefinitions, filter]);

  const categoryStats = useMemo(() => {
    const stats: Record<AchievementCategory, { earned: number; total: number }> = {
      getting_started: { earned: 0, total: 0 },
      optimization: { earned: 0, total: 0 },
      data_insights: { earned: 0, total: 0 },
      engagement: { earned: 0, total: 0 },
      mastery: { earned: 0, total: 0 },
    };

    allDefinitions.forEach(def => {
      stats[def.category].total++;
      if (achievements?.achievements[def.id]?.isUnlocked) {
        stats[def.category].earned++;
      }
    });

    return stats;
  }, [allDefinitions, achievements]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  if (!achievements) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load achievements</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Rank Card */}
        <View style={styles.rankCard}>
          <View style={styles.rankIconContainer}>
            <Text style={styles.rankIcon}>{currentRank.emoji}</Text>
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.rankTitle}>{currentRank.title}</Text>
            <Text style={styles.rankProgress}>
              {achievements.totalUnlocked} / {achievements.totalAchievements} Achievements
            </Text>
            
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${(achievements.totalUnlocked / achievements.totalAchievements) * 100}%` 
                  }
                ]} 
              />
            </View>
            
            {/* Streak display */}
            {achievements.currentStreak > 0 && (
              <View style={styles.streakContainer}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakText}>
                  {achievements.currentStreak} day streak
                </Text>
                {achievements.longestStreak > achievements.currentStreak && (
                  <Text style={styles.longestStreak}>
                    (Best: {achievements.longestStreak})
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({achievements.totalUnlocked}/{achievements.totalAchievements})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'getting_started' && styles.filterButtonActive]}
            onPress={() => setFilter('getting_started')}
          >
            <Text style={[styles.filterText, filter === 'getting_started' && styles.filterTextActive]}>
              Getting Started ({categoryStats.getting_started.earned}/{categoryStats.getting_started.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'optimization' && styles.filterButtonActive]}
            onPress={() => setFilter('optimization')}
          >
            <Text style={[styles.filterText, filter === 'optimization' && styles.filterTextActive]}>
              Optimization ({categoryStats.optimization.earned}/{categoryStats.optimization.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'data_insights' && styles.filterButtonActive]}
            onPress={() => setFilter('data_insights')}
          >
            <Text style={[styles.filterText, filter === 'data_insights' && styles.filterTextActive]}>
              Insights ({categoryStats.data_insights.earned}/{categoryStats.data_insights.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'engagement' && styles.filterButtonActive]}
            onPress={() => setFilter('engagement')}
          >
            <Text style={[styles.filterText, filter === 'engagement' && styles.filterTextActive]}>
              Engagement ({categoryStats.engagement.earned}/{categoryStats.engagement.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'mastery' && styles.filterButtonActive]}
            onPress={() => setFilter('mastery')}
          >
            <Text style={[styles.filterText, filter === 'mastery' && styles.filterTextActive]}>
              Mastery ({categoryStats.mastery.earned}/{categoryStats.mastery.total})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Achievement Grid */}
        <View style={styles.achievementGrid}>
          {filteredAchievements.map(definition => {
            const progress = achievements.achievements[definition.id];
            const isUnlocked = progress?.isUnlocked || false;
            const percentComplete = progress?.percentComplete || 0;
            const hasProgress = (progress?.progressTarget || 1) > 1;

            return (
              <View
                key={definition.id}
                style={[
                  styles.achievementCard,
                  !isUnlocked && styles.achievementCardLocked,
                ]}
              >
                <View style={styles.achievementIconContainer}>
                  <Text style={[
                    styles.achievementIcon,
                    !isUnlocked && styles.achievementIconLocked,
                  ]}>
                    {definition.icon}
                  </Text>
                </View>
                
                <Text style={[
                  styles.achievementName,
                  !isUnlocked && styles.achievementNameLocked,
                ]}>
                  {definition.name}
                </Text>
                
                <Text style={styles.achievementDescription}>
                  {definition.description}
                </Text>

                {/* Progress bar for progressive achievements */}
                {hasProgress && (
                  <View style={styles.achievementProgressContainer}>
                    <View style={styles.achievementProgressBar}>
                      <View
                        style={[
                          styles.achievementProgressFill,
                          { width: `${percentComplete}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.achievementProgressText}>
                      {progress?.progress || 0} / {progress?.progressTarget || 1}
                    </Text>
                  </View>
                )}

                {/* Unlocked date */}
                {isUnlocked && progress?.unlockedAt && (
                  <Text style={styles.unlockedDate}>
                    Unlocked {new Date(progress.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 15,
      color: colors.text.secondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    rankCard: {
      backgroundColor: colors.primary.bg20,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.primary.main,
    },
    rankIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankIcon: {
      fontSize: 48,
    },
    rankInfo: {
      flex: 1,
    },
    rankTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary.dark,
      marginBottom: 4,
    },
    rankProgress: {
      fontSize: 14,
      color: colors.primary.dark,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.background.secondary,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary.main,
      borderRadius: 4,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    streakEmoji: {
      fontSize: 16,
    },
    streakText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary.dark,
    },
    longestStreak: {
      fontSize: 12,
      color: colors.primary.dark,
      opacity: 0.7,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 16,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    filterButtonActive: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    filterTextActive: {
      color: colors.background.primary,
    },
    achievementGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    achievementCard: {
      width: Platform.OS === 'web' ? 'calc(50% - 6px)' : '48%',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.success.main,
      minHeight: 180,
    },
    achievementCardLocked: {
      borderColor: colors.border.light,
      opacity: 0.6,
    },
    achievementIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary.bg20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    achievementIcon: {
      fontSize: 28,
    },
    achievementIconLocked: {
      opacity: 0.4,
    },
    achievementName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 4,
    },
    achievementNameLocked: {
      color: colors.text.secondary,
    },
    achievementDescription: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
      marginBottom: 8,
    },
    achievementProgressContainer: {
      marginTop: 8,
    },
    achievementProgressBar: {
      height: 4,
      backgroundColor: colors.border.light,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    achievementProgressFill: {
      height: '100%',
      backgroundColor: colors.primary.main,
    },
    achievementProgressText: {
      fontSize: 11,
      color: colors.text.tertiary,
      textAlign: 'right',
    },
    unlockedDate: {
      fontSize: 11,
      color: colors.success.main,
      marginTop: 4,
      fontWeight: '500',
    },
  });
