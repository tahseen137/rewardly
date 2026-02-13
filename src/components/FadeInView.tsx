/**
 * FadeInView - Animated component that fades in and slides up
 * Used throughout the app for smooth entry animations
 * Supports delay prop for staggered animations
 * 
 * Uses standard RN Animated for web compatibility
 */

import React, { useEffect, useRef } from 'react';
import { StyleProp, ViewStyle, Animated, Easing } from 'react-native';

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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
