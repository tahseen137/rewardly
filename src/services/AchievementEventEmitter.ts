/**
 * AchievementEventEmitter - Typed event emitter for achievement tracking
 * 
 * Pattern: Services call emit() when actions occur.
 * AchievementService listens and checks for unlocks.
 * 
 * Benefits:
 * - Decoupled: Services don't need to know about achievements
 * - Lightweight: emit() is fire-and-forget
 * - Testable: Can mock emitter in tests
 */

import { AchievementEvent, AchievementEventType } from '../types';

type EventCallback = (event: AchievementEvent) => void;

class AchievementEventEmitterClass {
  private static instance: AchievementEventEmitterClass;
  private callbacks: EventCallback[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AchievementEventEmitterClass {
    if (!AchievementEventEmitterClass.instance) {
      AchievementEventEmitterClass.instance = new AchievementEventEmitterClass();
    }
    return AchievementEventEmitterClass.instance;
  }

  /**
   * Emit an achievement event
   * Fire-and-forget — does not block caller
   * Catches errors in callbacks to prevent breaking the app
   */
  track(type: AchievementEventType, data?: AchievementEvent['data']): void {
    const event: AchievementEvent = {
      type,
      data,
      timestamp: new Date(),
    };

    // Emit asynchronously to not block caller
    // Use setTimeout as setImmediate is not available on web
    const defer = typeof setImmediate !== 'undefined' ? setImmediate : (fn: () => void) => setTimeout(fn, 0);
    defer(() => {
      // Call each callback and catch errors individually
      for (const callback of this.callbacks) {
        try {
          callback(event);
        } catch (error) {
          // Silently catch errors to prevent breaking the app
          // Event emission is fire-and-forget
          console.error('[AchievementEventEmitter] Error in event handler:', error);
        }
      }
    });
  }

  /**
   * Subscribe to achievement events
   * Used by AchievementService
   */
  onEvent(callback: EventCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Unsubscribe from achievement events
   */
  offEvent(callback: EventCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.callbacks = [];
  }
}

// Export singleton instance
export const AchievementEventEmitter = AchievementEventEmitterClass.getInstance();

// Export convenience track function
export function trackAchievement(
  type: AchievementEventType,
  data?: AchievementEvent['data']
): void {
  AchievementEventEmitter.track(type, data);
}
