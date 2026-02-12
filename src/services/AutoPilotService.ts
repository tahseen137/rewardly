/**
 * AutoPilotService - Proactive credit card optimizer
 * 
 * Privacy-first geofencing service that alerts users when they enter
 * a monitored merchant location with the best card recommendation.
 * 
 * Key Features:
 * - User-controlled geofences (only monitors stores user explicitly pins)
 * - On-device processing (no raw location data sent to server)
 * - Easy enable/disable controls
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getCards } from './CardPortfolioManager';
import { SpendingCategory, Card } from '../types';
import {
  getBestCardForCategory as getBestCardForCategoryV2,
  getAllCardRecommendations,
  formatNotificationMessage,
  CardRecommendation,
} from './BestCardRecommendationService';

// ============================================================================
// Constants
// ============================================================================

const GEOFENCE_TASK_NAME = 'AUTOPILOT_GEOFENCE_TASK';
const STORAGE_KEY_ENABLED = '@autopilot/enabled';
const STORAGE_KEY_GEOFENCES = '@autopilot/geofences';
const STORAGE_KEY_LAST_NOTIFIED = '@autopilot/last_notified';

// Default geofence radius in meters (150m = roughly store parking lot)
const DEFAULT_GEOFENCE_RADIUS = 150;

// Cooldown between notifications for same merchant (1 hour)
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

export interface MerchantGeofence {
  id: string;
  merchantName: string;
  category: SpendingCategory;
  latitude: number;
  longitude: number;
  radius: number;
  enabled: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

export interface BestCardRecommendation {
  card: Card;
  rewardRate: number;
  estimatedValue: number;
  category: SpendingCategory;
  comparisonCard?: Card;
  comparisonRate?: number;
}

export interface AutoPilotStatus {
  enabled: boolean;
  hasLocationPermission: boolean;
  hasNotificationPermission: boolean;
  activeGeofences: number;
  lastNotificationAt?: Date;
}

// ============================================================================
// In-Memory State
// ============================================================================

let isInitialized = false;
let cachedGeofences: MerchantGeofence[] = [];
let cachedEnabled = false;

// ============================================================================
// Seed Merchant Data (Canadian High-Priority Merchants)
// ============================================================================

export interface SeedMerchant {
  name: string;
  category: SpendingCategory;
  // Toronto-area coordinates for testing
  locations: { lat: number; lng: number; address?: string }[];
}

export const SEED_MERCHANTS: SeedMerchant[] = [
  {
    name: 'Costco',
    category: SpendingCategory.GROCERIES,
    locations: [
      { lat: 43.7735, lng: -79.3334, address: 'Costco Scarborough' },
      { lat: 43.7857, lng: -79.2458, address: 'Costco Markham' },
      { lat: 43.6542, lng: -79.5556, address: 'Costco Etobicoke' },
    ],
  },
  {
    name: 'Loblaws',
    category: SpendingCategory.GROCERIES,
    locations: [
      { lat: 43.6677, lng: -79.3948, address: 'Loblaws Queens Quay' },
      { lat: 43.6789, lng: -79.4112, address: 'Loblaws Dupont' },
    ],
  },
  {
    name: 'Walmart',
    category: SpendingCategory.GROCERIES,
    locations: [
      { lat: 43.7615, lng: -79.4111, address: 'Walmart Centerpoint Mall' },
      { lat: 43.7734, lng: -79.3457, address: 'Walmart Scarborough Town Centre' },
    ],
  },
  {
    name: 'Shoppers Drug Mart',
    category: SpendingCategory.DRUGSTORES,
    locations: [
      { lat: 43.6544, lng: -79.3807, address: 'Shoppers Downtown' },
      { lat: 43.6789, lng: -79.3456, address: 'Shoppers Danforth' },
    ],
  },
  {
    name: 'Starbucks',
    category: SpendingCategory.DINING,
    locations: [
      { lat: 43.6532, lng: -79.3832, address: 'Starbucks Union Station' },
      { lat: 43.6706, lng: -79.3867, address: 'Starbucks Yonge & Bloor' },
    ],
  },
  {
    name: 'Tim Hortons',
    category: SpendingCategory.DINING,
    locations: [
      { lat: 43.6545, lng: -79.3806, address: 'Tim Hortons Downtown' },
      { lat: 43.6785, lng: -79.4234, address: 'Tim Hortons Bloor West' },
    ],
  },
  {
    name: 'Canadian Tire',
    category: SpendingCategory.HOME_IMPROVEMENT,
    locations: [
      { lat: 43.6789, lng: -79.2876, address: 'Canadian Tire East York' },
      { lat: 43.7567, lng: -79.4234, address: 'Canadian Tire North York' },
    ],
  },
  {
    name: 'Metro',
    category: SpendingCategory.GROCERIES,
    locations: [
      { lat: 43.6654, lng: -79.3867, address: 'Metro College Park' },
      { lat: 43.6734, lng: -79.4023, address: 'Metro Annex' },
    ],
  },
  {
    name: 'Esso / Mobil',
    category: SpendingCategory.GAS,
    locations: [
      { lat: 43.6678, lng: -79.3945, address: 'Esso Downtown' },
      { lat: 43.7123, lng: -79.3987, address: 'Esso Midtown' },
    ],
  },
  {
    name: 'Shell',
    category: SpendingCategory.GAS,
    locations: [
      { lat: 43.6598, lng: -79.3789, address: 'Shell Downtown' },
      { lat: 43.7234, lng: -79.4567, address: 'Shell North York' },
    ],
  },
];

// ============================================================================
// Permission Helpers
// ============================================================================

/**
 * Request location permission (foreground + background for geofencing)
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    // First request foreground permission
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.log('[AutoPilot] Foreground location permission denied');
      return false;
    }
    
    // Then request background permission (needed for geofencing)
    if (Platform.OS !== 'web') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('[AutoPilot] Background location permission denied');
        // Can still work with foreground only, but geofencing won't work when app is backgrounded
        return true; // Return true since foreground was granted
      }
    }
    
    console.log('[AutoPilot] Location permissions granted');
    return true;
  } catch (error) {
    console.error('[AutoPilot] Error requesting location permission:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[AutoPilot] Notification permission denied');
      return false;
    }
    
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    
    console.log('[AutoPilot] Notification permission granted');
    return true;
  } catch (error) {
    console.error('[AutoPilot] Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check current permission status
 */
export async function checkPermissions(): Promise<{
  location: boolean;
  backgroundLocation: boolean;
  notifications: boolean;
}> {
  try {
    const [locationStatus, notificationStatus] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Notifications.getPermissionsAsync(),
    ]);
    
    let backgroundLocation = false;
    if (Platform.OS !== 'web') {
      const bgStatus = await Location.getBackgroundPermissionsAsync();
      backgroundLocation = bgStatus.status === 'granted';
    }
    
    return {
      location: locationStatus.status === 'granted',
      backgroundLocation,
      notifications: notificationStatus.status === 'granted',
    };
  } catch (error) {
    console.error('[AutoPilot] Error checking permissions:', error);
    return { location: false, backgroundLocation: false, notifications: false };
  }
}

// ============================================================================
// Geofence Management
// ============================================================================

/**
 * Initialize AutoPilot service
 */
export async function initializeAutoPilot(): Promise<void> {
  if (isInitialized) return;
  
  try {
    // Load saved state
    const [enabledStr, geofencesStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_ENABLED),
      AsyncStorage.getItem(STORAGE_KEY_GEOFENCES),
    ]);
    
    cachedEnabled = enabledStr === 'true';
    cachedGeofences = geofencesStr ? JSON.parse(geofencesStr) : [];
    
    // Register background task if enabled
    if (cachedEnabled && Platform.OS !== 'web') {
      await registerGeofenceTask();
    }
    
    isInitialized = true;
    console.log('[AutoPilot] Initialized with', cachedGeofences.length, 'geofences');
  } catch (error) {
    console.error('[AutoPilot] Failed to initialize:', error);
    isInitialized = true; // Mark as initialized even on error to prevent repeated attempts
  }
}

/**
 * Enable AutoPilot
 */
export async function enableAutoPilot(): Promise<boolean> {
  try {
    // Check permissions first
    const permissions = await checkPermissions();
    
    if (!permissions.location) {
      const granted = await requestLocationPermission();
      if (!granted) return false;
    }
    
    if (!permissions.notifications) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }
    
    // Save enabled state
    cachedEnabled = true;
    await AsyncStorage.setItem(STORAGE_KEY_ENABLED, 'true');
    
    // Start geofencing if we have any geofences
    if (cachedGeofences.filter(g => g.enabled).length > 0) {
      await startGeofencing();
    }
    
    console.log('[AutoPilot] Enabled');
    return true;
  } catch (error) {
    console.error('[AutoPilot] Failed to enable:', error);
    return false;
  }
}

/**
 * Disable AutoPilot
 */
export async function disableAutoPilot(): Promise<void> {
  try {
    cachedEnabled = false;
    await AsyncStorage.setItem(STORAGE_KEY_ENABLED, 'false');
    await stopGeofencing();
    console.log('[AutoPilot] Disabled');
  } catch (error) {
    console.error('[AutoPilot] Failed to disable:', error);
  }
}

/**
 * Check if AutoPilot is enabled
 */
export function isAutoPilotEnabled(): boolean {
  return cachedEnabled;
}

/**
 * Get all configured geofences
 */
export function getGeofences(): MerchantGeofence[] {
  return [...cachedGeofences];
}

/**
 * Add a new merchant geofence
 */
export async function addGeofence(
  merchantName: string,
  category: SpendingCategory,
  latitude: number,
  longitude: number,
  radius: number = DEFAULT_GEOFENCE_RADIUS
): Promise<MerchantGeofence> {
  const geofence: MerchantGeofence = {
    id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    merchantName,
    category,
    latitude,
    longitude,
    radius,
    enabled: true,
    createdAt: new Date(),
  };
  
  cachedGeofences.push(geofence);
  await saveGeofences();
  
  // Restart geofencing with new fence
  if (cachedEnabled) {
    await startGeofencing();
  }
  
  console.log('[AutoPilot] Added geofence for', merchantName);
  return geofence;
}

/**
 * Remove a geofence
 */
export async function removeGeofence(geofenceId: string): Promise<void> {
  cachedGeofences = cachedGeofences.filter(g => g.id !== geofenceId);
  await saveGeofences();
  
  if (cachedEnabled) {
    await startGeofencing();
  }
  
  console.log('[AutoPilot] Removed geofence', geofenceId);
}

/**
 * Toggle a geofence on/off
 */
export async function toggleGeofence(geofenceId: string, enabled: boolean): Promise<void> {
  const geofence = cachedGeofences.find(g => g.id === geofenceId);
  if (geofence) {
    geofence.enabled = enabled;
    await saveGeofences();
    
    if (cachedEnabled) {
      await startGeofencing();
    }
  }
}

/**
 * Save geofences to storage
 */
async function saveGeofences(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_GEOFENCES, JSON.stringify(cachedGeofences));
}

// ============================================================================
// Geofencing Implementation
// ============================================================================

/**
 * Register the background geofence task
 */
async function registerGeofenceTask(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
  
  if (!isRegistered) {
    TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data, error }: TaskManager.TaskManagerTaskBody<{ eventType: Location.GeofencingEventType; region: Location.LocationRegion }>) => {
      if (error) {
        console.error('[AutoPilot] Geofence task error:', error);
        return;
      }
      
      if (data) {
        const { eventType, region } = data;
        handleGeofenceEvent(eventType, region);
      }
    });
    
    console.log('[AutoPilot] Geofence task registered');
  }
}

/**
 * Start geofencing for all enabled fences
 */
async function startGeofencing(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('[AutoPilot] Geofencing not available on web');
    return;
  }
  
  try {
    // Stop existing geofencing first
    await stopGeofencing();
    
    // Get enabled geofences
    const enabledGeofences = cachedGeofences.filter(g => g.enabled);
    
    if (enabledGeofences.length === 0) {
      console.log('[AutoPilot] No enabled geofences');
      return;
    }
    
    // Convert to Expo Location regions
    const regions: Location.LocationRegion[] = enabledGeofences.map(g => ({
      identifier: g.id,
      latitude: g.latitude,
      longitude: g.longitude,
      radius: g.radius,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));
    
    // Start geofencing
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    
    console.log('[AutoPilot] Started geofencing with', regions.length, 'regions');
  } catch (error) {
    console.error('[AutoPilot] Failed to start geofencing:', error);
  }
}

/**
 * Stop geofencing
 */
async function stopGeofencing(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    const isRunning = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
    if (isRunning) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      console.log('[AutoPilot] Stopped geofencing');
    }
  } catch (error) {
    // Ignore errors when stopping (might not have been started)
  }
}

/**
 * Handle geofence enter/exit events
 */
async function handleGeofenceEvent(
  eventType: Location.GeofencingEventType,
  region: Location.LocationRegion
): Promise<void> {
  if (eventType !== Location.GeofencingEventType.Enter) {
    return; // Only care about entering
  }
  
  const geofenceId = region.identifier;
  const geofence = cachedGeofences.find(g => g.id === geofenceId);
  
  if (!geofence) {
    console.log('[AutoPilot] Unknown geofence:', geofenceId);
    return;
  }
  
  // Check cooldown
  if (await isOnCooldown(geofenceId)) {
    console.log('[AutoPilot] Geofence on cooldown:', geofence.merchantName);
    return;
  }
  
  // Get best card recommendation
  const recommendation = await getBestCardForCategory(geofence.category);
  
  if (recommendation) {
    await sendNotification(geofence, recommendation);
    await updateLastNotified(geofenceId);
  }
}

/**
 * Check if a geofence is on notification cooldown
 */
async function isOnCooldown(geofenceId: string): Promise<boolean> {
  try {
    const lastNotifiedStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);
    if (!lastNotifiedStr) return false;
    
    const lastNotified: Record<string, number> = JSON.parse(lastNotifiedStr);
    const lastTime = lastNotified[geofenceId];
    
    if (!lastTime) return false;
    
    return Date.now() - lastTime < NOTIFICATION_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * Update last notification time for a geofence
 */
async function updateLastNotified(geofenceId: string): Promise<void> {
  try {
    const lastNotifiedStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);
    const lastNotified: Record<string, number> = lastNotifiedStr ? JSON.parse(lastNotifiedStr) : {};
    
    lastNotified[geofenceId] = Date.now();
    
    await AsyncStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, JSON.stringify(lastNotified));
  } catch (error) {
    console.error('[AutoPilot] Failed to update last notified:', error);
  }
}

// ============================================================================
// Card Recommendation Engine
// ============================================================================

/**
 * Get the best card for a spending category from user's portfolio
 * Uses the enhanced BestCardRecommendationService
 */
export async function getBestCardForCategory(
  category: SpendingCategory
): Promise<BestCardRecommendation | null> {
  try {
    // Use the enhanced recommendation service
    const recommendations = await getAllCardRecommendations(category);
    
    if (recommendations.length === 0) {
      console.log('[AutoPilot] No cards in portfolio');
      return null;
    }
    
    const best = recommendations[0];
    const second = recommendations.length > 1 ? recommendations[1] : undefined;
    
    return {
      card: best.card,
      rewardRate: best.rewardRate,
      estimatedValue: best.estimatedValue,
      category,
      comparisonCard: second?.card,
      comparisonRate: second?.rewardRate,
    };
  } catch (error) {
    console.error('[AutoPilot] Error getting best card:', error);
    return null;
  }
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Send a card recommendation notification
 */
async function sendNotification(
  geofence: MerchantGeofence,
  recommendation: BestCardRecommendation
): Promise<void> {
  try {
    const title = `🎯 Best Card for ${geofence.merchantName}`;
    
    let body = `Use ${recommendation.card.name} for ${recommendation.rewardRate}% back`;
    
    if (recommendation.comparisonCard && recommendation.comparisonRate) {
      body += ` (vs ${recommendation.comparisonRate}% on ${recommendation.comparisonCard.name})`;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'autopilot',
          geofenceId: geofence.id,
          merchantName: geofence.merchantName,
          cardId: recommendation.card.id,
          category: geofence.category,
        },
        sound: true,
        badge: 1,
      },
      trigger: null, // Send immediately
    });
    
    console.log('[AutoPilot] Sent notification for', geofence.merchantName);
  } catch (error) {
    console.error('[AutoPilot] Failed to send notification:', error);
  }
}

/**
 * Send a test notification (for development/demo)
 */
export async function sendTestNotification(
  merchantName: string = 'Costco',
  category: SpendingCategory = SpendingCategory.GROCERIES
): Promise<void> {
  const recommendation = await getBestCardForCategory(category);
  
  if (!recommendation) {
    // Send fallback notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 Best Card for ${merchantName}`,
        body: 'Add cards to your portfolio to get personalized recommendations!',
        data: { type: 'autopilot_test' },
        sound: true,
      },
      trigger: null,
    });
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎯 Best Card for ${merchantName}`,
      body: `Use ${recommendation.card.name} for ${recommendation.rewardRate}% back`,
      data: {
        type: 'autopilot_test',
        merchantName,
        cardId: recommendation.card.id,
        category,
      },
      sound: true,
    },
    trigger: null,
  });
}

// ============================================================================
// Status & Debugging
// ============================================================================

/**
 * Get AutoPilot status
 */
export async function getAutoPilotStatus(): Promise<AutoPilotStatus> {
  const permissions = await checkPermissions();
  
  return {
    enabled: cachedEnabled,
    hasLocationPermission: permissions.location,
    hasNotificationPermission: permissions.notifications,
    activeGeofences: cachedGeofences.filter(g => g.enabled).length,
  };
}

/**
 * Get current location (for testing/debugging)
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const permissions = await checkPermissions();
    if (!permissions.location) return null;
    
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    console.error('[AutoPilot] Failed to get current location:', error);
    return null;
  }
}

/**
 * Manually trigger a geofence check (for testing)
 */
export async function simulateGeofenceEntry(geofenceId: string): Promise<void> {
  const geofence = cachedGeofences.find(g => g.id === geofenceId);
  if (!geofence) {
    console.log('[AutoPilot] Geofence not found:', geofenceId);
    return;
  }
  
  const recommendation = await getBestCardForCategory(geofence.category);
  if (recommendation) {
    await sendNotification(geofence, recommendation);
  }
}
