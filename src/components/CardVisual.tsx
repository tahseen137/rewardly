/**
 * CardVisual - Visual representation of a credit card with realistic styling
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme, Theme } from '../theme';

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

// Standard credit card aspect ratio is 1.586:1 (85.6mm x 53.98mm)
const CARD_ASPECT_RATIO = 1.586;

const SIZES = {
  small: { width: 180 },
  medium: { width: 280 },
  large: { width: Dimensions.get('window').width - 48 },
};

// Issuer color schemes
const ISSUER_COLORS: Record<string, { primary: string; secondary: string }> = {
  TD: { primary: '#008A4B', secondary: '#00A85A' },
  RBC: { primary: '#003168', secondary: '#0051A8' },
  BMO: { primary: '#0075BE', secondary: '#00A0DF' },
  CIBC: { primary: '#C41F3E', secondary: '#E8315B' },
  Scotiabank: { primary: '#C41F3E', secondary: '#FF3B5C' },
  'American Express': { primary: '#006FCF', secondary: '#00A0E9' },
  Tangerine: { primary: '#FF8300', secondary: '#FFA640' },
  default: { primary: '#1C1C1E', secondary: '#3A3A3C' },
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
      {lastFour && <Text style={styles.cardNumber}>•••• •••• •••• {lastFour}</Text>}

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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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

export default CardVisual;
