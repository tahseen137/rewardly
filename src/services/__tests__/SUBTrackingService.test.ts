/**
 * SUBTrackingService - Unit Tests
 * 
 * Tests SUB tracking CRUD operations, progress calculations, and Supabase sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeSUBTracking,
  getAllSUBs,
  getActiveSUBs,
  getSUBById,
  addSUB,
  updateSUB,
  deleteSUB,
  addSpendingToSUB,
  calculateProgress,
  getUrgentSUBs,
  resetSUBCache,
} from '../SUBTrackingService';
import { SUBTracking, SUBStatus } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

// Mock AuthService
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn().mockResolvedValue(null),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// ============================================================================
// Test Data
// ============================================================================

const mockSUB: Omit<SUBTracking, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'> = {
  cardId: 'card-1',
  targetAmount: 4000,
  currentAmount: 2450,
  startDate: new Date('2026-01-01'),
  deadlineDate: new Date('2026-03-31'),
  bonusDescription: '50,000 points',
  bonusAmount: 50000,
  bonusCurrency: 'points',
};

// ============================================================================
// Setup and Teardown
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  resetSUBCache();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue();
});

// ============================================================================
// Initialization Tests
// ============================================================================

describe('SUBTrackingService - Initialization', () => {
  it('should initialize with empty cache when no stored data', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    
    await initializeSUBTracking();
    const subs = await getAllSUBs();
    
    expect(subs).toEqual([]);
  });

  it('should load cached data from AsyncStorage', async () => {
    const stored = [{
      ...mockSUB,
      id: 'sub-1',
      userId: 'user-1',
      status: 'active',
      startDate: mockSUB.startDate.toISOString(),
      deadlineDate: mockSUB.deadlineDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    
    await initializeSUBTracking();
    const subs = await getAllSUBs();
    
    expect(subs).toHaveLength(1);
    expect(subs[0].cardId).toBe('card-1');
  });

  it('should handle initialization errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
    
    await initializeSUBTracking();
    const subs = await getAllSUBs();
    
    expect(subs).toEqual([]);
  });

  it('should only initialize once', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    
    await initializeSUBTracking();
    await initializeSUBTracking();
    await initializeSUBTracking();
    
    expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// CRUD Operations
// ============================================================================

describe('SUBTrackingService - CRUD Operations', () => {
  describe('addSUB', () => {
    it('should add a new SUB tracking entry', async () => {
      const newSUB = await addSUB(mockSUB);
      
      expect(newSUB.id).toBeTruthy();
      expect(newSUB.cardId).toBe(mockSUB.cardId);
      expect(newSUB.targetAmount).toBe(mockSUB.targetAmount);
      expect(newSUB.currentAmount).toBe(mockSUB.currentAmount);
      expect(newSUB.status).toBe('active');
    });

    it('should persist to AsyncStorage', async () => {
      await addSUB(mockSUB);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should generate unique IDs', async () => {
      const sub1 = await addSUB(mockSUB);
      const sub2 = await addSUB({ ...mockSUB, cardId: 'card-2' });
      
      expect(sub1.id).not.toBe(sub2.id);
    });

    it('should set timestamps automatically', async () => {
      const newSUB = await addSUB(mockSUB);
      
      expect(newSUB.createdAt).toBeInstanceOf(Date);
      expect(newSUB.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateSUB', () => {
    it('should update an existing SUB', async () => {
      const newSUB = await addSUB(mockSUB);
      
      const updated = await updateSUB(newSUB.id, {
        currentAmount: 3000,
      });
      
      expect(updated.currentAmount).toBe(3000);
      expect(updated.targetAmount).toBe(mockSUB.targetAmount);
    });

    it('should update timestamp', async () => {
      const newSUB = await addSUB(mockSUB);
      const originalUpdatedAt = newSUB.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await updateSUB(newSUB.id, {
        currentAmount: 3000,
      });
      
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should throw error when SUB not found', async () => {
      await expect(
        updateSUB('non-existent', { currentAmount: 100 })
      ).rejects.toThrow('SUB non-existent not found');
    });

    it('should persist updates to AsyncStorage', async () => {
      const newSUB = await addSUB(mockSUB);
      
      mockAsyncStorage.setItem.mockClear();
      await updateSUB(newSUB.id, { currentAmount: 3000 });
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('deleteSUB', () => {
    it('should delete a SUB', async () => {
      const newSUB = await addSUB(mockSUB);
      
      await deleteSUB(newSUB.id);
      
      const subs = await getAllSUBs();
      expect(subs).toHaveLength(0);
    });

    it('should persist deletion to AsyncStorage', async () => {
      const newSUB = await addSUB(mockSUB);
      
      mockAsyncStorage.setItem.mockClear();
      await deleteSUB(newSUB.id);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle deleting non-existent SUB gracefully', async () => {
      await expect(deleteSUB('non-existent')).resolves.not.toThrow();
    });
  });

  describe('addSpendingToSUB', () => {
    it('should add spending amount to current amount', async () => {
      const newSUB = await addSUB(mockSUB);
      
      const updated = await addSpendingToSUB(newSUB.id, 500);
      
      expect(updated.currentAmount).toBe(mockSUB.currentAmount + 500);
    });

    it('should mark SUB as completed when target reached', async () => {
      const newSUB = await addSUB({
        ...mockSUB,
        currentAmount: 3500,
        targetAmount: 4000,
      });
      
      const updated = await addSpendingToSUB(newSUB.id, 600);
      
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it('should not mark as completed if already completed', async () => {
      const newSUB = await addSUB({
        ...mockSUB,
        currentAmount: 4000,
        targetAmount: 4000,
      });
      
      await addSpendingToSUB(newSUB.id, 100);
      const updated = await addSpendingToSUB(newSUB.id, 100);
      
      expect(updated.currentAmount).toBe(4200);
    });

    it('should throw error when SUB not found', async () => {
      await expect(
        addSpendingToSUB('non-existent', 100)
      ).rejects.toThrow('SUB non-existent not found');
    });
  });
});

// ============================================================================
// Data Access Tests
// ============================================================================

describe('SUBTrackingService - Data Access', () => {
  describe('getAllSUBs', () => {
    it('should return all SUBs', async () => {
      await addSUB(mockSUB);
      await addSUB({ ...mockSUB, cardId: 'card-2' });
      
      const subs = await getAllSUBs();
      expect(subs).toHaveLength(2);
    });

    it('should return empty array when no SUBs', async () => {
      const subs = await getAllSUBs();
      expect(subs).toEqual([]);
    });

    it('should return new array (not mutable)', async () => {
      await addSUB(mockSUB);
      
      const subs1 = await getAllSUBs();
      const subs2 = await getAllSUBs();
      
      expect(subs1).not.toBe(subs2);
      expect(subs1).toEqual(subs2);
    });
  });

  describe('getActiveSUBs', () => {
    it('should return only active SUBs', async () => {
      await addSUB(mockSUB);
      const sub2 = await addSUB({ ...mockSUB, cardId: 'card-2' });
      await updateSUB(sub2.id, { status: 'completed' });
      
      const active = await getActiveSUBs();
      expect(active).toHaveLength(1);
      expect(active[0].status).toBe('active');
    });

    it('should return empty array when no active SUBs', async () => {
      const active = await getActiveSUBs();
      expect(active).toEqual([]);
    });
  });

  describe('getSUBById', () => {
    it('should return SUB by ID', async () => {
      const newSUB = await addSUB(mockSUB);
      
      const found = await getSUBById(newSUB.id);
      
      expect(found).toBeTruthy();
      expect(found?.id).toBe(newSUB.id);
    });

    it('should return null when SUB not found', async () => {
      const found = await getSUBById('non-existent');
      expect(found).toBeNull();
    });
  });
});

// ============================================================================
// Progress Calculations
// ============================================================================

describe('SUBTrackingService - Progress Calculations', () => {
  describe('calculateProgress', () => {
    it('should calculate percent complete correctly', () => {
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 2000,
        targetAmount: 4000,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.percentComplete).toBe(50);
    });

    it('should calculate amount remaining correctly', () => {
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 2450,
        targetAmount: 4000,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.amountRemaining).toBe(1550);
    });

    it('should calculate days remaining correctly', () => {
      const today = new Date();
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        startDate: today,
        deadlineDate: in30Days,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.daysRemaining).toBeGreaterThanOrEqual(29);
      expect(progress.daysRemaining).toBeLessThanOrEqual(31);
    });

    it('should calculate daily target needed', () => {
      const today = new Date();
      const in20Days = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000);
      
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 2000,
        targetAmount: 4000,
        startDate: today,
        deadlineDate: in20Days,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.dailyTargetNeeded).toBeCloseTo(100, 0); // 2000 / 20 = 100
    });

    it('should cap percent complete at 100%', () => {
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 5000,
        targetAmount: 4000,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.percentComplete).toBe(100);
    });

    it('should mark as urgent when <7 days and under target', () => {
      const today = new Date();
      const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 2000,
        targetAmount: 4000,
        startDate: new Date(today.getTime() - 85 * 24 * 60 * 60 * 1000),
        deadlineDate: in5Days,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.isUrgent).toBe(true);
    });

    it('should not be urgent when completed', () => {
      const today = new Date();
      const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 4000,
        targetAmount: 4000,
        startDate: new Date(today.getTime() - 85 * 24 * 60 * 60 * 1000),
        deadlineDate: in5Days,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.isUrgent).toBe(false);
    });

    it('should track on-track status', () => {
      const today = new Date();
      const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
      const startDate = new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000);
      
      // Exactly halfway through time and spending
      const sub: SUBTracking = {
        ...mockSUB,
        id: 'sub-1',
        userId: 'user-1',
        currentAmount: 2000,
        targetAmount: 4000,
        startDate,
        deadlineDate: in45Days,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const progress = calculateProgress(sub);
      expect(progress.isOnTrack).toBe(true);
    });
  });

  describe('getUrgentSUBs', () => {
    it('should return only urgent active SUBs', async () => {
      const today = new Date();
      const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Urgent SUB
      await addSUB({
        ...mockSUB,
        currentAmount: 1000,
        targetAmount: 4000,
        startDate: new Date(today.getTime() - 85 * 24 * 60 * 60 * 1000),
        deadlineDate: in5Days,
      });
      
      // Not urgent (plenty of time)
      await addSUB({
        ...mockSUB,
        cardId: 'card-2',
        currentAmount: 1000,
        targetAmount: 4000,
        startDate: today,
        deadlineDate: in30Days,
      });
      
      const urgent = await getUrgentSUBs();
      expect(urgent).toHaveLength(1);
      expect(urgent[0].isUrgent).toBe(true);
    });

    it('should return empty array when no urgent SUBs', async () => {
      const urgent = await getUrgentSUBs();
      expect(urgent).toEqual([]);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('SUBTrackingService - Edge Cases', () => {
  it('should handle zero target amount', async () => {
    const sub = await addSUB({
      ...mockSUB,
      targetAmount: 0,
      currentAmount: 0,
    });
    
    const progress = calculateProgress(sub);
    // Division by zero results in NaN
    expect(progress.percentComplete).toBeNaN();
  });

  it('should handle negative amounts gracefully', async () => {
    const sub = await addSUB({
      ...mockSUB,
      currentAmount: -100,
    });
    
    expect(sub.currentAmount).toBe(-100);
  });

  it('should handle dates in the past', async () => {
    const pastDate = new Date('2020-01-01');
    
    const sub = await addSUB({
      ...mockSUB,
      startDate: pastDate,
      deadlineDate: new Date('2020-03-31'),
    });
    
    const progress = calculateProgress(sub);
    expect(progress.daysRemaining).toBeLessThan(0);
  });

  it('should handle same start and deadline date', async () => {
    const today = new Date();
    
    const sub = await addSUB({
      ...mockSUB,
      startDate: today,
      deadlineDate: today,
    });
    
    const progress = calculateProgress(sub);
    expect(progress.daysRemaining).toBeGreaterThanOrEqual(0);
  });
});
