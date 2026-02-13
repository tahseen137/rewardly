/**
 * AnimatedNumber - Smooth number counting animation
 * Used throughout the app for engaging number reveals
 * 
 * Note: Uses requestAnimationFrame for web compatibility (no reanimated dependency)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  formatFunction?: (value: number) => string;
}

export default function AnimatedNumber({
  value,
  duration = 1500,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  formatFunction,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationStartTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);
  
  useEffect(() => {
    const startAnimation = () => {
      const startValue = previousValue.current;
      const endValue = value;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function - ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (endValue - startValue) * eased;
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          animationFrame.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          previousValue.current = endValue;
        }
      };
      
      animationFrame.current = requestAnimationFrame(animate);
    };
    
    if (delay > 0) {
      const timeout = setTimeout(startAnimation, delay);
      return () => {
        clearTimeout(timeout);
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    } else {
      startAnimation();
      return () => {
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    }
  }, [value, duration, delay]);
  
  const formattedValue = formatFunction
    ? formatFunction(displayValue)
    : displayValue.toFixed(decimals);
  
  return (
    <Text style={style}>
      {prefix}{formattedValue}{suffix}
    </Text>
  );
}

/**
 * AnimatedCurrency - Specialized for currency display
 */
interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  duration?: number;
  delay?: number;
  style?: TextStyle;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  currency = '$',
  duration = 1500,
  delay = 0,
  style,
  showSign = false,
}: AnimatedCurrencyProps) {
  const sign = showSign && value > 0 ? '+' : value < 0 ? '-' : '';
  const absValue = Math.abs(value);
  
  return (
    <AnimatedNumber
      value={absValue}
      duration={duration}
      delay={delay}
      prefix={`${sign}${currency}`}
      decimals={2}
      style={style}
      formatFunction={(v) => v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    />
  );
}

/**
 * AnimatedPoints - Specialized for points display
 */
interface AnimatedPointsProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: TextStyle;
}

export function AnimatedPoints({
  value,
  duration = 1500,
  delay = 0,
  style,
}: AnimatedPointsProps) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      delay={delay}
      decimals={0}
      style={style}
      formatFunction={(v) => Math.round(v).toLocaleString()}
    />
  );
}

/**
 * AnimatedPercent - Specialized for percentage display
 */
interface AnimatedPercentProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: TextStyle;
  showPlusSign?: boolean;
}

export function AnimatedPercent({
  value,
  duration = 1500,
  delay = 0,
  style,
  showPlusSign = false,
}: AnimatedPercentProps) {
  const sign = showPlusSign && value > 0 ? '+' : '';
  
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      delay={delay}
      prefix={sign}
      suffix="%"
      decimals={1}
      style={style}
    />
  );
}
