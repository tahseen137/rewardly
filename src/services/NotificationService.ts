/**
 * NotificationService - F9: Notifications Center
 * Manages in-app notifications for SUB deadlines, fee renewals, etc.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';
import { SubscriptionTier, getCurrentTierSync } from './SubscriptionService';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 
  | 'sub_deadline' 
  | 'fee_renewal' 
  | 'bonus_category' 
  | 'monthly_report' 
  | 'new_card_offer'
  | 'spending_alert'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string; // Screen name or deep link
  actionData?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Constants
// ============================================================================

const NOTIFICATIONS_KEY = 'app_notifications';
const UNREAD_COUNT_KEY = 'unread_notification_count';

// ============================================================================
// State
// ============================================================================

let isInitialized = false;
let notificationsCache: AppNotification[] = [];
let unreadCount = 0;

// ============================================================================
// Tier Gating
// ============================================================================

export function getNotificationTypesForTier(tier: SubscriptionTier): NotificationType[] {
  if (tier === 'free') {
    return ['sub_deadline', 'fee_renewal'];
  }
  // Pro+ gets all notification types
  return [
    'sub_deadline',
    'fee_renewal',
    'bonus_category',
    'monthly_report',
    'new_card_offer',
    'spending_alert',
    'general',
  ];
}

function canReceiveNotificationType(type: NotificationType): boolean {
  const tier = getCurrentTierSync();
  const allowedTypes = getNotificationTypesForTier(tier);
  return allowedTypes.includes(type);
}

// ============================================================================
// Initialization
// ============================================================================

export async function initializeNotifications(): Promise<void> {
  if (isInitialized) return;
  
  try {
    // Load from AsyncStorage first (local cache)
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      notificationsCache = parsed.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
      }));
    }
    
    // Sync with Supabase
    await syncNotifications();
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
}

async function syncNotifications(): Promise<void> {
  try {
    if (!supabase) return;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    
    const { data, error } = await (supabase
      .from('notifications') as any)
      .select('*')
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    if (data) {
      notificationsCache = (data as any[]).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type as NotificationType,
        title: row.title,
        message: row.message,
        isRead: row.is_read,
        actionUrl: row.action_url,
        actionData: row.action_data,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        createdAt: new Date(row.created_at),
      }));
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsCache));
      await updateUnreadCount();
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function getNotifications(limit?: number): Promise<AppNotification[]> {
  await initializeNotifications();
  
  // Filter out expired notifications
  const now = new Date();
  let valid = notificationsCache.filter(n => !n.expiresAt || n.expiresAt > now);
  
  // Filter by tier access
  const tier = getCurrentTierSync();
  const allowedTypes = getNotificationTypesForTier(tier);
  valid = valid.filter(n => allowedTypes.includes(n.type));
  
  if (limit) {
    return valid.slice(0, limit);
  }
  
  return valid;
}

export async function getUnreadCount(): Promise<number> {
  await initializeNotifications();
  return unreadCount;
}

async function updateUnreadCount(): Promise<void> {
  const notifications = await getNotifications();
  unreadCount = notifications.filter(n => !n.isRead).length;
  await AsyncStorage.setItem(UNREAD_COUNT_KEY, unreadCount.toString());
}

export async function markAsRead(id: string): Promise<void> {
  await initializeNotifications();
  
  try {
    if (!supabase) return;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    
    // Update in Supabase
    const { error } = await (supabase
      .from('notifications') as any)
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.data.user.id);
    
    if (error) throw error;
    
    // Update cache
    const notification = notificationsCache.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsCache));
      await updateUnreadCount();
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

export async function markAllAsRead(): Promise<void> {
  await initializeNotifications();
  
  try {
    if (!supabase) return;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    
    // Update all in Supabase
    const { error } = await (supabase
      .from('notifications') as any)
      .update({ is_read: true })
      .eq('user_id', user.data.user.id)
      .eq('is_read', false);
    
    if (error) throw error;
    
    // Update cache
    notificationsCache.forEach(n => { n.isRead = true; });
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsCache));
    await updateUnreadCount();
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  await initializeNotifications();
  
  try {
    if (!supabase) return;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    
    // Delete from Supabase
    const { error } = await (supabase
      .from('notifications') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.data.user.id);
    
    if (error) throw error;
    
    // Update cache
    notificationsCache = notificationsCache.filter(n => n.id !== id);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsCache));
    await updateUnreadCount();
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
}

export async function createNotification(
  notification: Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
): Promise<AppNotification | null> {
  await initializeNotifications();
  
  // Check tier access
  if (!canReceiveNotificationType(notification.type)) {
    return null;
  }
  
  try {
    if (!supabase) return null;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;
    
    const { data, error } = await (supabase
      .from('notifications') as any)
      .insert({
        user_id: user.data.user.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        action_url: notification.actionUrl,
        action_data: notification.actionData,
        expires_at: notification.expiresAt?.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    const d = data as any;
    const newNotification: AppNotification = {
      id: d.id,
      userId: d.user_id,
      type: d.type as NotificationType,
      title: d.title,
      message: d.message,
      isRead: false,
      actionUrl: d.action_url,
      actionData: d.action_data,
      expiresAt: d.expires_at ? new Date(d.expires_at) : undefined,
      createdAt: new Date(d.created_at),
    };
    
    notificationsCache.unshift(newNotification);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsCache));
    await updateUnreadCount();
    
    return newNotification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

// ============================================================================
// Notification Generators
// ============================================================================

export async function generateSUBDeadlineAlert(sub: any): Promise<void> {
  const daysRemaining = Math.ceil(
    (new Date(sub.deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  await createNotification({
    type: 'sub_deadline',
    title: 'Sign-Up Bonus Deadline Approaching',
    message: `Only ${daysRemaining} days left to hit your spending target for ${sub.cardId}!`,
    actionUrl: 'SUBTracker',
    actionData: { subId: sub.id },
  });
}

export async function generateFeeRenewalAlert(cardId: string, daysUntil: number): Promise<void> {
  await createNotification({
    type: 'fee_renewal',
    title: 'Annual Fee Coming Up',
    message: `Your ${cardId} annual fee is due in ${daysUntil} days. Review if this card is still worth keeping.`,
    actionUrl: 'AnnualFee',
    actionData: { cardId },
  });
}

export async function generateMonthlyReportNotification(reportId: string): Promise<void> {
  await createNotification({
    type: 'monthly_report',
    title: 'Your Monthly Savings Report is Ready',
    message: 'See how much you earned (and missed) this month!',
    actionUrl: 'SavingsReport',
    actionData: { reportId },
  });
}
