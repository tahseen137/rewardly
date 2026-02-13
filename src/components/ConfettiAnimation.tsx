/**
 * ConfettiAnimation - Celebration animation for achievements
 * Used when users complete signup bonuses, improve Rewards IQ, etc.
 * 
 * Uses standard RN Animated for web compatibility
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPieceProps {
  index: number;
  color: string;
  startX: number;
  duration: number;
  delay: number;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  colors.primary.main,
  colors.accent.main,
  colors.warning.main,
  colors.info.main,
  '#FFD700', // Gold
  '#FF69B4', // Hot pink
  '#00CED1', // Dark turquoise
  '#FF6347', // Tomato
];

function ConfettiPiece({ index, color, startX, duration, delay, onComplete }: ConfettiPieceProps) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const randomRotation = Math.random() * 720 - 360;
    
    const timer = setTimeout(() => {
      Animated.parallel([
        // Fall down
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration,
          useNativeDriver: true,
        }),
        // Drift sideways
        Animated.timing(translateX, {
          toValue: randomX,
          duration,
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(rotate, {
          toValue: randomRotation,
          duration,
          useNativeDriver: true,
        }),
        // Fade out near the end
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
        // Pop effect
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (onComplete && index === 0) {
          onComplete();
        }
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [duration, delay, index, onComplete, translateY, translateX, rotate, scale, opacity]);
  
  const rotateInterpolation = rotate.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });
  
  const isSquare = index % 3 === 0;
  const isCircle = index % 3 === 1;
  
  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: startX,
          backgroundColor: color,
          width: isCircle ? 10 : 8,
          height: isCircle ? 10 : isSquare ? 8 : 14,
          borderRadius: isCircle ? 5 : 2,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotateInterpolation },
            { scale },
          ],
        },
      ]}
    />
  );
}

interface ConfettiAnimationProps {
  active: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export default function ConfettiAnimation({
  active,
  count = 50,
  duration = 3000,
  onComplete,
}: ConfettiAnimationProps) {
  if (!active) return null;
  
  // Reduce count on web for performance
  const pieceCount = Platform.OS === 'web' ? Math.min(count, 30) : count;
  
  const pieces = Array.from({ length: pieceCount }).map((_, index) => ({
    index,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    startX: Math.random() * SCREEN_WIDTH,
    duration: duration + Math.random() * 1000,
    delay: Math.random() * 500,
  }));
  
  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.index}
          {...piece}
          onComplete={piece.index === 0 ? onComplete : undefined}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
});
