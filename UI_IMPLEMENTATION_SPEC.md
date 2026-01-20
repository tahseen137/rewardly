# UI Implementation Specification

This document provides implementation-ready specifications for the Rewardly UI redesign. Each section includes TypeScript interfaces, exact style values, and code examples.

---

## Table of Contents

1. [Phase 1: Foundation](#phase-1-foundation)
2. [Phase 2: Components](#phase-2-components)
3. [Phase 3: Screen Redesigns](#phase-3-screen-redesigns)
4. [Phase 4: Animations](#phase-4-animations)

---

# Phase 1: Foundation

## 1.1 Theme Migration Pattern

### Standard Screen Template

Every screen should follow this pattern for theme integration:

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../theme';

export default function ExampleScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {/* Screen content */}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.screenPadding,
  },
});
```

### Color Migration Map

Replace these hardcoded values in all screens:

| Hardcoded Value | Theme Token |
|-----------------|-------------|
| `'#F2F2F7'` | `theme.colors.background.primary` |
| `'#FFFFFF'`, `'#fff'` | `theme.colors.background.secondary` |
| `'#007AFF'` | `theme.colors.primary.main` |
| `'#000000'`, `'#000'` | `theme.colors.text.primary` |
| `'#666666'`, `'#666'` | `theme.colors.text.secondary` |
| `'#8E8E93'` | `theme.colors.text.tertiary` |
| `'#C7C7CC'` | `theme.colors.text.disabled` |
| `'#34C759'` | `theme.colors.success.main` |
| `'#FF3B30'` | `theme.colors.error.main` |
| `'#FF9500'` | `theme.colors.warning.main` |
| `'#E5E5EA'` | `theme.colors.border.light` |
| `'rgba(0,0,0,0.1)'` | `theme.colors.overlay.light` |
| `'rgba(0,0,0,0.5)'` | `theme.colors.overlay.dark` |

### Typography Migration

Replace inline font styles with theme textStyles:

```typescript
// Before
const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: '#000' },
  body: { fontSize: 15, color: '#666' },
  caption: { fontSize: 12, color: '#8E8E93' },
});

// After
const createStyles = (theme: Theme) => StyleSheet.create({
  title: {
    ...theme.textStyles.h2,
    color: theme.colors.text.primary,
  },
  body: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
  caption: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
  },
});
```

### Typography Reference

| Use Case | Theme Token | Size | Weight |
|----------|-------------|------|--------|
| Screen title | `theme.textStyles.h1` | 28px | 700 |
| Section header | `theme.textStyles.h2` | 22px | 700 |
| Card title | `theme.textStyles.h3` | 18px | 600 |
| Subsection | `theme.textStyles.h4` | 16px | 600 |
| Body text | `theme.textStyles.body` | 15px | 400 |
| Secondary info | `theme.textStyles.bodySmall` | 13px | 400 |
| Labels | `theme.textStyles.label` | 13px | 500 |
| Captions | `theme.textStyles.caption` | 12px | 400 |
| Buttons | `theme.textStyles.button` | 16px | 600 |

### Spacing Migration

Replace magic numbers with spacing tokens:

```typescript
// Before
const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { marginBottom: 12, padding: 14 },
  section: { marginTop: 24 },
});

// After
const createStyles = (theme: Theme) => StyleSheet.create({
  container: { padding: theme.spacing.screenPadding },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.cardPadding
  },
  section: { marginTop: theme.spacing.sectionGap },
});
```

---

# Phase 2: Components

## 2.1 CardDetailModal (Extracted Component)

### Interface

```typescript
// src/components/CardDetailModal.tsx

import { Card, RewardType } from '../types';

interface CardDetailModalProps {
  /** The card to display details for */
  card: Card | null;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional: Current reward rate at selected store */
  currentRewardRate?: {
    value: number;
    type: RewardType;
    unit: 'percent' | 'multiplier';
  };
  /** Optional: Action button (e.g., "Add to Portfolio") */
  actionButton?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  };
}
```

### Implementation

```typescript
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../theme';
import { Button } from './Button';

export function CardDetailModal({
  card,
  visible,
  onClose,
  currentRewardRate,
  actionButton,
}: CardDetailModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!card) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('cardDetail.title')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.doneButton}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardIssuer}>{card.issuer}</Text>
            <Text style={styles.cardProgram}>{card.rewardProgram}</Text>
            <View style={styles.feeContainer}>
              <Text style={styles.feeLabel}>{t('cardDetail.annualFee')}</Text>
              <Text style={styles.feeValue}>
                {card.annualFee === 0 ? t('cardDetail.noFee') : `$${card.annualFee}/yr`}
              </Text>
            </View>
          </View>

          {/* Current Store Rate (if provided) */}
          {currentRewardRate && (
            <View style={styles.highlightSection}>
              <Text style={styles.highlightLabel}>{t('cardDetail.rewardAtThisStore')}</Text>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightValue}>
                  {currentRewardRate.unit === 'percent'
                    ? `${currentRewardRate.value}%`
                    : `${currentRewardRate.value}x`}
                </Text>
                <Text style={styles.highlightType}>
                  {t(`rewardTypes.${currentRewardRate.type.toLowerCase()}`)}
                </Text>
              </View>
            </View>
          )}

          {/* Base Reward */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('cardDetail.baseReward')}</Text>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardCategory}>{t('cardDetail.allPurchases')}</Text>
              <Text style={styles.rewardValue}>
                {card.baseRewardRate.unit === 'percent'
                  ? `${card.baseRewardRate.value}%`
                  : `${card.baseRewardRate.value}x`}
              </Text>
            </View>
          </View>

          {/* Category Rewards */}
          {card.categoryRewards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('cardDetail.bonusCategories')}</Text>
              {card.categoryRewards.map((cr, index) => (
                <View key={index} style={styles.rewardRow}>
                  <Text style={styles.rewardCategory}>
                    {cr.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                  <Text style={[styles.rewardValue, styles.rewardValueHighlight]}>
                    {cr.rewardRate.unit === 'percent'
                      ? `${cr.rewardRate.value}%`
                      : `${cr.rewardRate.value}x`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Signup Bonus */}
          {card.signupBonus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('cardDetail.signupBonus')}</Text>
              <View style={styles.bonusBox}>
                <Text style={styles.bonusAmount}>
                  {card.signupBonus.currency === 'cashback' ? '$' : ''}
                  {card.signupBonus.amount.toLocaleString()}
                  {card.signupBonus.currency !== 'cashback' ? ` ${card.signupBonus.currency}` : ''}
                </Text>
                <Text style={styles.bonusRequirement}>
                  {t('cardDetail.signupBonusDetails', {
                    spendRequirement: `$${card.signupBonus.spendRequirement.toLocaleString()}`,
                    timeframeDays: card.signupBonus.timeframeDays,
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Spacer for action button */}
          {actionButton && <View style={{ height: 80 }} />}
        </ScrollView>

        {/* Fixed Action Button */}
        {actionButton && (
          <View style={styles.actionContainer}>
            <Button
              title={actionButton.label}
              onPress={actionButton.onPress}
              variant={actionButton.variant || 'primary'}
              fullWidth
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
  },
  headerTitle: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
  },
  doneButton: {
    ...theme.textStyles.button,
    color: theme.colors.primary.main,
  },
  content: {
    flex: 1,
    padding: theme.spacing.screenPadding,
  },
  cardHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  cardName: {
    ...theme.textStyles.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardIssuer: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  cardProgram: {
    ...theme.textStyles.label,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.md,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  feeLabel: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.tertiary,
  },
  feeValue: {
    ...theme.textStyles.label,
    color: theme.colors.text.primary,
  },
  highlightSection: {
    backgroundColor: theme.colors.primary.main + '10', // 10% opacity
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  highlightLabel: {
    ...theme.textStyles.label,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.sm,
  },
  highlightBox: {
    alignItems: 'center',
  },
  highlightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  highlightType: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.primary.dark,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  rewardCategory: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    flex: 1,
  },
  rewardValue: {
    ...theme.textStyles.label,
    color: theme.colors.text.secondary,
  },
  rewardValueHighlight: {
    color: theme.colors.success.main,
    fontWeight: '600',
  },
  bonusBox: {
    backgroundColor: theme.colors.success.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  bonusAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.success.dark,
    marginBottom: theme.spacing.sm,
  },
  bonusRequirement: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.success.dark,
    textAlign: 'center',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});
```

---

## 2.2 RewardBadge Component

### Interface

```typescript
// src/components/RewardBadge.tsx

import { RewardType } from '../types';

interface RewardBadgeProps {
  /** Reward type determines color */
  type: RewardType;
  /** Reward value to display */
  value: number;
  /** Unit type */
  unit: 'percent' | 'multiplier';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show as rank badge (1st, 2nd, etc.) */
  rank?: number;
}
```

### Implementation

```typescript
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../theme';
import { RewardType } from '../types';

const SIZES = {
  small: { badge: 24, text: 11, padding: 6 },
  medium: { badge: 32, text: 14, padding: 8 },
  large: { badge: 44, text: 18, padding: 12 },
};

export function RewardBadge({
  type,
  value,
  unit,
  size = 'medium',
  rank,
}: RewardBadgeProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = SIZES[size];

  const backgroundColor = {
    [RewardType.CASHBACK]: theme.colors.rewards.cashback,
    [RewardType.POINTS]: theme.colors.rewards.points,
    [RewardType.AIRLINE_MILES]: theme.colors.rewards.miles,
    [RewardType.HOTEL_POINTS]: theme.colors.rewards.hotel,
  }[type] || theme.colors.primary.main;

  const formattedValue = unit === 'percent' ? `${value}%` : `${value}x`;

  if (rank !== undefined) {
    return (
      <View style={[styles.rankBadge, { backgroundColor }]}>
        <Text style={[styles.rankText, { fontSize: sizeConfig.text }]}>
          #{rank}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor,
        paddingHorizontal: sizeConfig.padding,
        paddingVertical: sizeConfig.padding / 2,
      }
    ]}>
      <Text style={[styles.text, { fontSize: sizeConfig.text }]}>
        {formattedValue}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
```

---

## 2.3 CardVisual Component

### Interface

```typescript
// src/components/CardVisual.tsx

interface CardVisualProps {
  /** Card name */
  name: string;
  /** Card issuer (determines color scheme) */
  issuer: string;
  /** Card network (Visa, Mastercard, Amex) */
  network?: string;
  /** Optional last 4 digits */
  lastFour?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether card is selected */
  selected?: boolean;
  /** Press handler */
  onPress?: () => void;
}
```

### Implementation

```typescript
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme, Theme } from '../theme';

// Standard credit card aspect ratio is 1.586:1 (85.6mm x 53.98mm)
const CARD_ASPECT_RATIO = 1.586;

const SIZES = {
  small: { width: 180 },
  medium: { width: 280 },
  large: { width: Dimensions.get('window').width - 48 },
};

// Issuer color schemes
const ISSUER_COLORS: Record<string, { primary: string; secondary: string }> = {
  'TD': { primary: '#008A4B', secondary: '#00A85A' },
  'RBC': { primary: '#003168', secondary: '#0051A8' },
  'BMO': { primary: '#0075BE', secondary: '#00A0DF' },
  'CIBC': { primary: '#C41F3E', secondary: '#E8315B' },
  'Scotiabank': { primary: '#C41F3E', secondary: '#FF3B5C' },
  'American Express': { primary: '#006FCF', secondary: '#00A0E9' },
  'Tangerine': { primary: '#FF8300', secondary: '#FFA640' },
  'default': { primary: '#1C1C1E', secondary: '#3A3A3C' },
};

export function CardVisual({
  name,
  issuer,
  network,
  lastFour,
  size = 'medium',
  selected = false,
  onPress,
}: CardVisualProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = SIZES[size];
  const cardWidth = sizeConfig.width;
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  const colors = ISSUER_COLORS[issuer] || ISSUER_COLORS.default;

  const content = (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: colors.primary,
        },
        selected && styles.cardSelected,
      ]}
    >
      {/* Gradient overlay effect */}
      <View style={[styles.gradientOverlay, { backgroundColor: colors.secondary }]} />

      {/* Chip */}
      <View style={styles.chip}>
        <View style={styles.chipLine} />
        <View style={styles.chipLine} />
        <View style={styles.chipLine} />
      </View>

      {/* Card Number */}
      {lastFour && (
        <Text style={styles.cardNumber}>•••• •••• •••• {lastFour}</Text>
      )}

      {/* Card Name */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.issuerName}>{issuer}</Text>
      </View>

      {/* Network Logo Placeholder */}
      {network && (
        <View style={styles.networkLogo}>
          <Text style={styles.networkText}>{network}</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '100%',
    opacity: 0.3,
    transform: [{ skewX: '-20deg' }, { translateX: 50 }],
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: '#D4AF37',
    borderRadius: 4,
    marginBottom: 16,
    padding: 4,
    justifyContent: 'space-between',
  },
  chipLine: {
    height: 4,
    backgroundColor: '#B8962E',
    borderRadius: 1,
  },
  cardNumber: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 60,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  issuerName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  networkLogo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
```

---

## 2.4 BottomSheet Component

### Interface

```typescript
// src/components/BottomSheet.tsx

interface BottomSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when sheet is closed */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Height as percentage of screen (0-1) */
  height?: number;
  /** Title for the sheet header */
  title?: string;
  /** Show drag handle */
  showHandle?: boolean;
}
```

### Implementation

```typescript
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useTheme, Theme } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function BottomSheet({
  visible,
  onClose,
  children,
  height = 0.5,
  title,
  showHandle = true,
}: BottomSheetProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const sheetHeight = SCREEN_HEIGHT * height;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}

          {/* Header */}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay.dark,
  },
  sheet: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: theme.colors.neutral.gray300,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
  },
  closeButton: {
    ...theme.textStyles.button,
    color: theme.colors.primary.main,
  },
  content: {
    flex: 1,
  },
});
```

---

## 2.5 Toast Component

### Interface

```typescript
// src/components/Toast.tsx

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  /** Message to display */
  message: string;
  /** Toast type determines styling */
  type?: ToastType;
  /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
  duration?: number;
  /** Whether toast is visible */
  visible: boolean;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Optional action button */
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

### Implementation

```typescript
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../theme';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onDismiss,
  action,
}: ToastProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const backgroundColor = {
    success: theme.colors.success.main,
    error: theme.colors.error.main,
    warning: theme.colors.warning.main,
    info: theme.colors.info.main,
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{ICONS[type]}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.screenPadding,
    right: theme.spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
```

---

# Phase 3: Screen Redesigns

## 3.1 HomeScreen Layout Specification

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│  Status Bar                         │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search stores...         │   │  <- Hero Search
│  └─────────────────────────────┘   │
│                                     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │  <- Quick Categories
│  │🛒 │ │⛽ │ │🍽️ │ │✈️ │ │💊 │    │     (Horizontal scroll)
│  └───┘ └───┘ └───┘ └───┘ └───┘    │
│                                     │
│  Recent Stores                      │  <- Section Header
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Store│ │Store│ │Store│          │  <- Recent chips
│  └─────┘ └─────┘ └─────┘          │
│                                     │
├─────────────────────────────────────┤
│  [After Search]                     │
│                                     │
│  Best Card for [Store]              │  <- Result Header
│  ┌─────────────────────────────┐   │
│  │ ┌───────────┐               │   │
│  │ │           │  Card Name    │   │  <- Best Card Hero
│  │ │  CardVis  │  5% cashback  │   │     (Larger, prominent)
│  │ │           │  ───────────  │   │
│  │ └───────────┘  [View More]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Other Options                      │  <- Section Header
│  ┌─────────────────────────────┐   │
│  │ 2  Card Name         3.5%  │   │  <- Ranked list
│  │ 3  Card Name         2.0%  │   │
│  │ 4  Card Name         1.5%  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Suggested New Cards                │  <- If enabled
│  ┌─────────────────────────────┐   │
│  │ Card suggestion cards...    │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Dimensions

| Element | Value |
|---------|-------|
| Screen padding | 16px |
| Search input height | 48px |
| Category chip size | 64x64px |
| Category chip gap | 12px |
| Recent store chip height | 32px |
| Best card hero height | 160px |
| Ranked card item height | 72px |
| Section gap | 24px |

### State Handling

```typescript
// States to handle
interface HomeScreenState {
  searchQuery: string;
  searchResults: StoreRecommendation | null;
  isSearching: boolean;
  recentStores: string[];
  suggestions: PlaceSuggestion[];
  selectedCard: Card | null;
  isCardModalVisible: boolean;
}

// Loading states
- Initial: Show search + categories + recent stores
- Searching: Show skeleton in results area
- Results: Show best card + ranked list
- Error: Show error banner with retry
- Empty: Show "No results" with suggestions
```

---

## 3.2 MyCardsScreen Card Stack Specification

### Card Stack Layout

```
┌─────────────────────────────────────┐
│  My Cards (3)                       │  <- Header with count
├─────────────────────────────────────┤
│                                     │
│       ┌───────────────────┐         │
│      ┌┤                   │         │
│     ┌┤│   Selected Card   │         │  <- Card stack
│    ┌┤│└───────────────────┘         │     (3D perspective)
│   ┌┤│└─────────────────────┘        │
│  ┌┤│└───────────────────────┘       │
│  └┤└─────────────────────────┘      │
│   └───────────────────────────┘     │
│                                     │
│  Swipe to browse cards              │  <- Hint text
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Card Details                       │  <- Selected card info
│  ┌─────────────────────────────┐   │
│  │ Base: 1.5% cashback         │   │
│  │ Groceries: 5%               │   │
│  │ Dining: 3%                  │   │
│  │ Annual fee: $120/yr         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       [Remove Card]         │   │  <- Action buttons
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │       [+ Add Card]          │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Card Stack Animation Config

```typescript
// Card stack positioning
const CARD_STACK_CONFIG = {
  // Vertical offset between stacked cards
  stackOffset: 8,
  // Scale reduction per card in stack
  scaleReduction: 0.05,
  // Opacity reduction per card
  opacityReduction: 0.15,
  // Max cards visible in stack
  maxVisibleCards: 4,
  // Swipe threshold to change card
  swipeThreshold: 100,
  // Animation spring config
  spring: {
    tension: 100,
    friction: 10,
  },
};

// Calculate card transforms
const getCardStyle = (index: number, totalCards: number) => {
  const reverseIndex = totalCards - 1 - index;
  return {
    transform: [
      { translateY: reverseIndex * CARD_STACK_CONFIG.stackOffset },
      { scale: 1 - reverseIndex * CARD_STACK_CONFIG.scaleReduction },
    ],
    opacity: 1 - reverseIndex * CARD_STACK_CONFIG.opacityReduction,
    zIndex: totalCards - reverseIndex,
  };
};
```

### Swipe Gesture Implementation

```typescript
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const CardStack = ({ cards, onCardChange }) => {
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > CARD_STACK_CONFIG.swipeThreshold) {
        const direction = event.translationX > 0 ? -1 : 1;
        const newIndex = Math.max(0, Math.min(cards.length - 1, currentIndex.value + direction));

        if (newIndex !== currentIndex.value) {
          currentIndex.value = newIndex;
          runOnJS(onCardChange)(newIndex);
        }
      }
      translateX.value = withSpring(0, CARD_STACK_CONFIG.spring);
    },
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={styles.stackContainer}>
        {cards.map((card, index) => (
          <CardVisual key={card.id} {...card} style={getCardStyle(index, cards.length)} />
        ))}
      </Animated.View>
    </PanGestureHandler>
  );
};
```

---

# Phase 4: Animations

## 4.1 List Item Animations

### Staggered Entrance Animation

```typescript
import Animated, {
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';

// Option 1: Using entering prop (simpler)
const AnimatedListItem = ({ index, children }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).springify()}
    >
      {children}
    </Animated.View>
  );
};

// Option 2: Custom animation (more control)
const useStaggeredAnimation = (index: number, isVisible: boolean) => {
  const delay = index * 50; // 50ms stagger between items

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withDelay(delay, withTiming(isVisible ? 1 : 0, { duration: 200 })),
      transform: [
        {
          translateY: withDelay(
            delay,
            withSpring(isVisible ? 0 : 20, {
              damping: 15,
              stiffness: 100,
            })
          ),
        },
      ],
    };
  });

  return animatedStyle;
};
```

### Swipe-to-Delete Animation

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const DELETE_THRESHOLD = -80;

const SwipeableItem = ({ children, onDelete }) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(72);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd((event) => {
      if (translateX.value < DELETE_THRESHOLD) {
        // Trigger delete
        translateX.value = withTiming(-400, { duration: 200 });
        itemHeight.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onDelete)();
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [DELETE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Animated.View style={containerStyle}>
      <Animated.View style={[styles.deleteButton, deleteButtonStyle]}>
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};
```

## 4.2 Button Press Animation

```typescript
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedButton = ({ onPress, children, style }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
```

## 4.3 Success Animation (Checkmark)

```typescript
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const SuccessCheckmark = ({ visible }) => {
  const scale = useSharedValue(0);
  const pathLength = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12 })
      );
      pathLength.value = withDelay(200, withTiming(1, { duration: 300 }));
    } else {
      scale.value = withTiming(0);
      pathLength.value = 0;
    }
  }, [visible]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 0.5], [0, 1]),
  }));

  return (
    <Animated.View style={[styles.checkContainer, circleStyle]}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        <AnimatedPath
          d="M10 20 L17 27 L30 13"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={30}
          strokeDashoffset={interpolate(pathLength.value, [0, 1], [30, 0])}
        />
      </Svg>
    </Animated.View>
  );
};
```

---

# Appendix: Dependencies

## Required Packages

```json
{
  "dependencies": {
    "react-native-reanimated": "^3.x",
    "react-native-gesture-handler": "^2.x",
    "expo-haptics": "^12.x"
  }
}
```

## babel.config.js Update

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

---

# Checklist

## Phase 1 Checklist
- [ ] HomeScreen.tsx - Theme migration complete
- [ ] MyCardsScreen.tsx - Theme migration complete
- [ ] ProductSearchScreen.tsx - Theme migration complete
- [ ] SettingsScreen.tsx - Theme verification complete
- [ ] All hardcoded colors replaced
- [ ] All typography using textStyles
- [ ] All spacing using theme tokens

## Phase 2 Checklist
- [ ] CardDetailModal extracted and working
- [ ] RewardBadge component created
- [ ] CardVisual component created
- [ ] BottomSheet component created
- [ ] Toast component created
- [ ] All components exported from index.ts

## Phase 3 Checklist
- [ ] HomeScreen redesign complete
- [ ] MyCardsScreen card stack implemented
- [ ] ProductSearchScreen redesign complete
- [ ] SettingsScreen visual refresh complete

## Phase 4 Checklist
- [ ] react-native-reanimated configured
- [ ] Staggered list animations working
- [ ] Swipe-to-delete implemented
- [ ] Button press animations added
- [ ] Success/error animations created
- [ ] Haptic feedback integrated
