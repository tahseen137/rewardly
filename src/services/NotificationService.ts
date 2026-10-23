/**
 * NotificationService - Weekly "missed rewards" push notification
 *
 * Schedules a local notification every Sunday at 9am reminding users
 * how much they could have earned by using their best card.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const WEEKLY_NOTIF_ID_KEY = 'rewardly_weekly_notif_id';
const WEEKLY_NOTIF_ID = 'rewardly-weekly-missed-rewards';

// Configure notification handler (call once at app startup)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permissions from the user.
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Web push notifications require a different flow; skip for now
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Returns a randomised missed-rewards estimate in the $8–$15 range.
 * Replace with real weekly tracking data once that feature is built.
 */
export function getMissedRewardsEstimate(): number {
  return parseFloat((8 + Math.random() * 7).toFixed(2));
}

/**
 * Schedule a weekly local notification (every Sunday at 9am).
 * Cancels any previously scheduled weekly notification first.
 */
export async function scheduleWeeklyMissedRewardsNotification(missedAmount: number): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  // Cancel existing weekly notification before rescheduling
  await cancelWeeklyNotification();

  const granted = await requestPermissions();
  if (!granted) {
    return;
  }

  const formattedAmount = missedAmount.toFixed(2);

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_NOTIF_ID,
    content: {
      title: '💳 Weekly Rewards Recap',
      body: `You could have earned $${formattedAmount} more this week by using your best card. Tap to optimize.`,
      data: { screen: 'WalletOptimizer' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = Sunday
      hour: 9,
      minute: 0,
    },
  });
}

/**
 * Cancel the scheduled weekly missed-rewards notification.
 */
export async function cancelWeeklyNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_NOTIF_ID);
  } catch {
    // Notification may not exist yet — safe to ignore
  }
}

export { WEEKLY_NOTIF_ID_KEY };
