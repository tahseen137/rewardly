/**
 * FadeInView - Animated component that fades in and slides up
 * Used throughout the app for smooth entry animations
 * Supports delay prop for staggered animations
 */

import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number; // Delay in ms before animation starts
  duration?: number; // Animation duration in ms
  style?: StyleProp<ViewStyle>;
}

/**
 * FadeInView component
 *
 * Animates opacity from 0 to 1 and translateY from 10 to 0
 *
 * @param children - Content to animate
 * @param delay - Delay before animation starts (default: 0)
 * @param duration - Animation duration (default: 300)
 * @param style - Additional styles to apply
 */
export function FadeInView({
  children,
  delay = 0,
  duration = 300,
  style,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
