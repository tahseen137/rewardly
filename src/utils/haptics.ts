/**
 * Haptics Utilities - Centralized haptic feedback management
 * Provides consistent tactile feedback across the app
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Check if haptics are available on this platform
 */
export const hapticsAvailable = Platform.OS !== 'web';

/**
 * Light tap feedback - for button presses, toggles
 */
export async function lightTap(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // Silently fail - haptics are optional
  }
}

/**
 * Medium tap feedback - for selections, card taps
 */
export async function mediumTap(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Heavy tap feedback - for important actions, confirmations
 */
export async function heavyTap(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Selection feedback - for scroll wheel, picker changes
 */
export async function selection(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.selectionAsync();
  } catch (e) {
    // Silently fail
  }
}

/**
 * Success notification - for completed actions
 */
export async function successNotification(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Warning notification - for important alerts
 */
export async function warningNotification(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Error notification - for errors, failures
 */
export async function errorNotification(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Celebration pattern - double tap for achievements
 */
export async function celebration(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Money pattern - for rewards/earnings display
 */
export async function moneyPattern(): Promise<void> {
  if (!hapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    // Silently fail
  }
}
