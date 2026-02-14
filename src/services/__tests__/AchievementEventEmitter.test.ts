/**
 * AchievementEventEmitter Tests
 */

import { AchievementEventEmitter, trackAchievement } from '../AchievementEventEmitter';
import { AchievementEvent, AchievementEventType } from '../../types';

describe('AchievementEventEmitter', () => {
  beforeEach((done) => {
    // Reset emitter before each test
    AchievementEventEmitter.reset();
    // Wait for any pending setImmediate calls to complete
    setTimeout(done, 10);
  });

  afterEach((done) => {
    // Clean up listeners
    AchievementEventEmitter.reset();
    // Wait for any pending setImmediate calls to complete
    setTimeout(done, 10);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AchievementEventEmitter;
      const instance2 = AchievementEventEmitter;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Emission', () => {
    it('should emit achievement events', (done) => {
      const mockCallback = jest.fn((event: AchievementEvent) => {
        expect(event.type).toBe('card_added');
        expect(event.data?.cardCount).toBe(3);
        expect(event.timestamp).toBeInstanceOf(Date);
        done();
      });

      AchievementEventEmitter.onEvent(mockCallback);
      AchievementEventEmitter.track('card_added', { cardCount: 3 });
    });

    it('should emit events asynchronously (fire-and-forget)', () => {
      const mockCallback = jest.fn();
      AchievementEventEmitter.onEvent(mockCallback);
      
      AchievementEventEmitter.track('card_added', { cardCount: 1 });
      
      // Should not have been called yet (setImmediate)
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should emit multiple events in sequence', (done) => {
      const events: AchievementEventType[] = [];
      
      const mockCallback = jest.fn((event: AchievementEvent) => {
        events.push(event.type);
      });

      AchievementEventEmitter.onEvent(mockCallback);
      
      AchievementEventEmitter.track('card_added');
      AchievementEventEmitter.track('spending_profile_saved');
      AchievementEventEmitter.track('sage_chat');
      
      // Wait for all events to be processed
      setTimeout(() => {
        expect(events).toEqual(['card_added', 'spending_profile_saved', 'sage_chat']);
        expect(mockCallback).toHaveBeenCalledTimes(3);
        done();
      }, 50);
    });

    it('should include event data when provided', (done) => {
      const mockCallback = jest.fn((event: AchievementEvent) => {
        expect(event.data?.screenName).toBe('HomeScreen');
        expect(event.data?.cardId).toBe('card-123');
        done();
      });

      AchievementEventEmitter.onEvent(mockCallback);
      AchievementEventEmitter.track('screen_visited', {
        screenName: 'HomeScreen',
        cardId: 'card-123',
      });
    });

    it('should work without event data', (done) => {
      const mockCallback = jest.fn((event: AchievementEvent) => {
        expect(event.type).toBe('wallet_optimizer_used');
        expect(event.data).toBeUndefined();
        done();
      });

      AchievementEventEmitter.onEvent(mockCallback);
      AchievementEventEmitter.track('wallet_optimizer_used');
    });
  });

  describe('Event Subscription', () => {
    it('should allow multiple subscribers', (done) => {
      let callCount = 0;
      
      const callback1 = jest.fn(() => {
        callCount++;
        if (callCount === 2) done();
      });
      
      const callback2 = jest.fn(() => {
        callCount++;
        if (callCount === 2) done();
      });

      AchievementEventEmitter.onEvent(callback1);
      AchievementEventEmitter.onEvent(callback2);
      
      AchievementEventEmitter.track('card_added');
    });

    it('should allow unsubscribing', (done) => {
      const callback = jest.fn();

      AchievementEventEmitter.onEvent(callback);
      AchievementEventEmitter.offEvent(callback);
      
      AchievementEventEmitter.track('card_added');
      
      // Wait for async event processing
      setImmediate(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle unsubscribe before any events', () => {
      const callback = jest.fn();
      AchievementEventEmitter.onEvent(callback);
      AchievementEventEmitter.offEvent(callback);
      
      // Should not throw
      expect(() => {
        AchievementEventEmitter.track('card_added');
      }).not.toThrow();
    });
  });

  describe('trackAchievement Helper', () => {
    it('should track events via convenience function', (done) => {
      const mockCallback = jest.fn((event: AchievementEvent) => {
        expect(event.type).toBe('statement_uploaded');
        expect(event.data?.count).toBe(1);
        done();
      });

      AchievementEventEmitter.onEvent(mockCallback);
      trackAchievement('statement_uploaded', { count: 1 });
    });

    it('should work without data', (done) => {
      const mockCallback = jest.fn((event: AchievementEvent) => {
        expect(event.type).toBe('insights_viewed');
        done();
      });

      AchievementEventEmitter.onEvent(mockCallback);
      trackAchievement('insights_viewed');
    });
  });

  describe('Reset', () => {
    it('should remove all listeners', () => {
      const callback = jest.fn();
      AchievementEventEmitter.onEvent(callback);
      
      AchievementEventEmitter.reset();
      AchievementEventEmitter.track('card_added');
      
      setImmediate(() => {
        expect(callback).not.toHaveBeenCalled();
      });
    });

    it('should allow re-subscribing after reset', (done) => {
      AchievementEventEmitter.reset();
      
      const callback = jest.fn((event: AchievementEvent) => {
        expect(event.type).toBe('card_added');
        done();
      });
      
      AchievementEventEmitter.onEvent(callback);
      AchievementEventEmitter.track('card_added');
    });
  });

  describe('All Event Types', () => {
    const allEventTypes: AchievementEventType[] = [
      'card_added',
      'card_removed',
      'spending_profile_saved',
      'sage_chat',
      'wallet_optimizer_used',
      'fee_breakeven_viewed',
      'signup_roi_viewed',
      'gaps_found',
      'optimization_score_calculated',
      'statement_uploaded',
      'insights_viewed',
      'trends_viewed',
      'money_left_on_table_calculated',
      'app_opened',
      'card_comparison_viewed',
      'screen_visited',
      'card_benefits_viewed',
    ];

    it('should handle all achievement event types', (done) => {
      const receivedTypes: AchievementEventType[] = [];
      
      const callback = jest.fn((event: AchievementEvent) => {
        receivedTypes.push(event.type);
      });

      AchievementEventEmitter.onEvent(callback);
      
      allEventTypes.forEach(type => {
        AchievementEventEmitter.track(type);
      });
      
      // Wait for all events to be processed
      setTimeout(() => {
        expect(receivedTypes).toEqual(allEventTypes);
        expect(callback).toHaveBeenCalledTimes(allEventTypes.length);
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should not throw if callback throws error', () => {
      const badCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      AchievementEventEmitter.onEvent(badCallback);
      
      // Should not throw - event emission is fire-and-forget
      expect(() => {
        AchievementEventEmitter.track('card_added');
      }).not.toThrow();
    });

    it('should continue emitting to other listeners if one throws', (done) => {
      const badCallback = jest.fn(() => {
        throw new Error('Bad callback');
      });
      
      const goodCallback = jest.fn((event: AchievementEvent) => {
        expect(event.type).toBe('card_added');
        done();
      });

      AchievementEventEmitter.onEvent(badCallback);
      AchievementEventEmitter.onEvent(goodCallback);
      
      AchievementEventEmitter.track('card_added');
    });
  });
});
