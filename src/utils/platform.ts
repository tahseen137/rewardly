/**
 * Platform Utilities - Web-Safe Native Module Wrappers
 * 
 * This module provides graceful fallbacks for native-only features on web.
 * Import from here instead of directly from native modules to ensure
 * web compatibility.
 * 
 * NEVER import directly from:
 * - expo-haptics
 * - expo-location  
 * - react-native-reanimated (for layout animations)
 * - expo-notifications (for push tokens)
 * 
 * Instead, use the safe wrappers exported from this module.
 */

import { Platform } from 'react-native';

// ============================================================================
// Platform Detection
// ============================================================================

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = !isWeb;

/**
 * Run code only on native platforms (iOS/Android)
 */
export function onNative<T>(fn: () => T): T | undefined {
  if (isNative) {
    return fn();
  }
  return undefined;
}

/**
 * Run code only on web
 */
export function onWeb<T>(fn: () => T): T | undefined {
  if (isWeb) {
    return fn();
  }
  return undefined;
}

/**
 * Platform-specific value selector
 */
export function select<T>(options: { web?: T; native?: T; ios?: T; android?: T; default: T }): T {
  if (isIOS && options.ios !== undefined) return options.ios;
  if (isAndroid && options.android !== undefined) return options.android;
  if (isWeb && options.web !== undefined) return options.web;
  if (isNative && options.native !== undefined) return options.native;
  return options.default;
}

// ============================================================================
// Safe Haptics Wrapper
// ============================================================================

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback safely (no-op on web)
 */
export async function haptic(style: HapticStyle = 'light'): Promise<void> {
  if (isWeb) return;
  
  try {
    // Dynamic import to avoid bundling on web
    const Haptics = await import('expo-haptics');
    
    switch (style) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (e) {
    // Silently fail - haptics are optional UX enhancement
    console.debug('[Platform] Haptics unavailable:', e);
  }
}

// ============================================================================
// Safe Location Wrapper
// ============================================================================

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationResult {
  success: boolean;
  coords?: LocationCoords;
  error?: string;
}

/**
 * Request location permission safely
 * Returns true if granted, false otherwise
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (isWeb) {
    // Use browser Geolocation API permission
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted';
    } catch {
      return false;
    }
  }
  
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.error('[Platform] Location permission error:', e);
    return false;
  }
}

/**
 * Get current location safely
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  if (isWeb) {
    // Use browser Geolocation API
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'Geolocation not supported' });
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          });
        },
        (error) => {
          resolve({ success: false, error: error.message });
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }
  
  try {
    const Location = await import('expo-location');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      success: true,
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Location unavailable',
    };
  }
}

// ============================================================================
// Safe Animation Helpers
// ============================================================================

/**
 * Check if layout animations are available
 * Layout animations (entering/exiting) have limited web support
 */
export function supportsLayoutAnimations(): boolean {
  return isNative;
}

/**
 * Get animation duration adjusted for platform
 * Web animations can be faster since there's no native bridge overhead
 */
export function getAnimationDuration(baseDuration: number): number {
  return isWeb ? baseDuration * 0.8 : baseDuration;
}

// ============================================================================
// Safe Notification Helpers
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function supportsPushNotifications(): boolean {
  return isNative;
}

/**
 * Request notification permissions safely
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    // Web notifications are different - use Notification API
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.error('[Platform] Notification permission error:', e);
    return false;
  }
}

// ============================================================================
// Feature Detection
// ============================================================================

export const features = {
  haptics: isNative,
  pushNotifications: isNative,
  backgroundLocation: isNative,
  geofencing: isNative,
  biometrics: isNative,
  nfc: isNative && isAndroid,
  layoutAnimations: isNative,
  
  // Web has these
  geolocation: true, // Both native and web support this
  localStorage: isWeb,
  webShare: isWeb && typeof navigator.share === 'function',
} as const;

/**
 * Check if a feature is available on the current platform
 */
export function hasFeature(feature: keyof typeof features): boolean {
  return features[feature];
}

// ============================================================================
// Console Helpers for Debugging
// ============================================================================

/**
 * Log with platform prefix for debugging
 */
export function platformLog(message: string, ...args: unknown[]): void {
  const prefix = isWeb ? '[WEB]' : isIOS ? '[iOS]' : '[Android]';
  console.log(`${prefix} ${message}`, ...args);
}

/**
 * Warn about web-incompatible usage
 */
export function warnWebIncompatible(feature: string): void {
  if (isWeb) {
    console.warn(`[Platform] "${feature}" is not available on web. Using fallback.`);
  }
}
