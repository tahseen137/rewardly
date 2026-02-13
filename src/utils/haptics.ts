/**
 * Haptics Utilities - Centralized haptic feedback management
 * Provides consistent tactile feedback across the app
 * 
 * NOTE: This module uses the platform wrapper for web safety.
 * All haptic calls are no-ops on web.
 */

import { haptic, isNative } from './platform';

/**
 * Check if haptics are available on this platform
 */
export const hapticsAvailable = isNative;

/**
 * Light tap feedback - for button presses, toggles
 */
export async function lightTap(): Promise<void> {
  return haptic('light');
}

/**
 * Medium tap feedback - for selections, card taps
 */
export async function mediumTap(): Promise<void> {
  return haptic('medium');
}

/**
 * Heavy tap feedback - for important actions, confirmations
 */
export async function heavyTap(): Promise<void> {
  return haptic('heavy');
}

/**
 * Selection feedback - for scroll wheel, picker changes
 */
export async function selection(): Promise<void> {
  return haptic('selection');
}

/**
 * Success notification - for completed actions
 */
export async function successNotification(): Promise<void> {
  return haptic('success');
}

/**
 * Warning notification - for important alerts
 */
export async function warningNotification(): Promise<void> {
  return haptic('warning');
}

/**
 * Error notification - for errors, failures
 */
export async function errorNotification(): Promise<void> {
  return haptic('error');
}

/**
 * Celebration pattern - double tap for achievements
 */
export async function celebration(): Promise<void> {
  if (!isNative) return;
  
  await haptic('heavy');
  await new Promise(resolve => setTimeout(resolve, 100));
  await haptic('medium');
}

/**
 * Money pattern - for rewards/earnings display
 */
export async function moneyPattern(): Promise<void> {
  if (!isNative) return;
  
  await haptic('light');
  await new Promise(resolve => setTimeout(resolve, 50));
  await haptic('light');
  await new Promise(resolve => setTimeout(resolve, 50));
  await haptic('medium');
}
