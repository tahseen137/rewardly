/**
 * SkeletonLoader - Skeleton/shimmer loading placeholders
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton - Basic skeleton placeholder with shimmer animation
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.neutral.gray200,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
            backgroundColor: theme.colors.neutral.white,
          },
        ]}
      />
    </View>
  );
}

/**
 * SkeletonText - Text placeholder with multiple lines
 */
interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: number | `${number}%`;
  lineHeight?: number;
  spacing?: number;
  style?: ViewStyle;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%' as const,
  lineHeight = 14,
  spacing = 8,
  style,
}: SkeletonTextProps) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

/**
 * SkeletonCard - Card placeholder for list items
 */
interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.card,
          padding: theme.spacing.cardPadding,
          ...theme.shadows.card,
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
      <View style={styles.cardContent}>
        <Skeleton width="50%" height={14} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

/**
 * SkeletonListItem - Simple list item placeholder
 */
interface SkeletonListItemProps {
  hasAvatar?: boolean;
  style?: ViewStyle;
}

export function SkeletonListItem({ hasAvatar = false, style }: SkeletonListItemProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: theme.colors.background.secondary,
          padding: theme.spacing.listItemPadding.vertical,
          paddingHorizontal: theme.spacing.listItemPadding.horizontal,
        },
        style,
      ]}
    >
      {hasAvatar && (
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      )}
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={50} height={16} />
    </View>
  );
}

/**
 * SkeletonSearchResult - Search result placeholder
 */
export function SkeletonSearchResult({ style }: { style?: ViewStyle }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.searchResult,
        {
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.card,
          padding: theme.spacing.cardPadding,
          ...theme.shadows.card,
        },
        style,
      ]}
    >
      <View style={styles.searchHeader}>
        <Skeleton width="50%" height={20} />
        <Skeleton width={60} height={20} />
      </View>
      <View style={styles.searchDivider}>
        <Skeleton width="100%" height={1} />
      </View>
      <View style={styles.searchCardInfo}>
        <View style={styles.searchCardLeft}>
          <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={20} height={20} />
      </View>
      <View style={styles.searchPriceBox}>
        <Skeleton width="100%" height={60} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  cardContent: {},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  searchResult: {
    marginBottom: 12,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchDivider: {
    marginBottom: 12,
  },
  searchCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchCardLeft: {
    flex: 1,
  },
  searchPriceBox: {},
});

export default Skeleton;
