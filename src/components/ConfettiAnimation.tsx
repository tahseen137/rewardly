/**
 * ConfettiAnimation - Celebration animation for achievements
 * Used when users complete signup bonuses, improve Rewards IQ, etc.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
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
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const randomRotation = Math.random() * 720 - 360;
    
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration,
        easing: Easing.linear,
      })
    );
    
    translateX.value = withDelay(
      delay,
      withTiming(randomX, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    rotate.value = withDelay(
      delay,
      withTiming(randomRotation, {
        duration,
        easing: Easing.linear,
      })
    );
    
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, {
        duration: duration * 0.3,
      }, () => {
        if (onComplete && index === 0) {
          runOnJS(onComplete)();
        }
      })
    );
    
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 100 })
      )
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
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
        },
        animatedStyle,
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
  
  const pieces = Array.from({ length: count }).map((_, index) => ({
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
