/**
 * ApplicationTrackerService Tests
 * Target: ~45 tests covering all application tracking logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ISSUER_RULES,
  normalizeIssuer,
  countApplicationsInMonths,
  countIssuerApplications,
  getIssuerRule,
  calculateIssuerCooldown,
  checkCardEligibility,
  generateTimeline,
  generateStrategy,
  addApplication,
  getApplications,
  getTrackerState,
  deleteApplication,
  resetTracker,
  resetTrackerCache,
  initializeApplicationTracker,
} from '../ApplicationTrackerService';
import {
  CardApplication,
  CardApplicationInput,
  WantedCard,
} from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

// Mock AuthService
jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn(() => null),
}));

// Mock CardDataService
jest.mock('../CardDataService', () => ({
  getAllCardsSync: jest.fn(() => [
    { id: 'card1', name: 'Amex Gold', issuer: 'American Express' },
    { id: 'card2', name: 'Chase Sapphire', issuer: 'Chase' },
    { id: 'card3', name: 'TD Aeroplan', issuer: 'TD' },
  ]),
}));

describe('ApplicationTrackerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTrackerCache();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetTrackerCache();
  });

  // ============================================================================
  // Issuer Rules
  // ============================================================================

  describe('Issuer Rules', () => {
    it('should have 8 issuer rules (7 Canadian + 1 US)', () => {
      expect(ISSUER_RULES).toHaveLength(8);
    });

    it('should have Amex 90-day rule', () => {
      const amex = ISSUER_RULES.find(r => r.issuer === 'American Express');
      expect(amex).toBeDefined();
      expect(amex?.cooldownDays).toBe(90);
      expect(amex?.isStrict).toBe(true);
    });

    it('should have Chase 5/24 rule', () => {
      const chase = ISSUER_RULES.find(r => r.issuer === 'Chase');
      expect(chase).toBeDefined();
      expect(chase?.maxAppsPerPeriod).toBe(5);
      expect(chase?.periodMonths).toBe(24);
      expect(chase?.isStrict).toBe(true);
    });

    it('should have TD soft 90-day rule', () => {
      const td = ISSUER_RULES.find(r => r.issuer === 'TD');
      expect(td).toBeDefined();
      expect(td?.cooldownDays).toBe(90);
      expect(td?.isStrict).toBe(false);
    });

    it('should have flexible CIBC and RBC rules', () => {
      const cibc = ISSUER_RULES.find(r => r.issuer === 'CIBC');
      const rbc = ISSUER_RULES.find(r => r.issuer === 'RBC');
      
      expect(cibc?.cooldownDays).toBe(0);
      expect(rbc?.cooldownDays).toBe(0);
    });
  });

  // ============================================================================
  // Pure Helper Functions
  // ============================================================================

  describe('normalizeIssuer', () => {
    it('should normalize issuer names', () => {
      expect(normalizeIssuer('American Express')).toBe('american express');
      expect(normalizeIssuer('CHASE')).toBe('chase');
      expect(normalizeIssuer('  TD  ')).toBe('td');
    });

    it('should handle case-insensitive matching', () => {
      expect(normalizeIssuer('Amex Canada')).toBe('amex canada');
      expect(normalizeIssuer('AMEX CANADA')).toBe('amex canada');
    });
  });

  describe('getIssuerRule', () => {
    it('should find issuer rule case-insensitively', () => {
      const rule = getIssuerRule('american express');
      expect(rule).toBeDefined();
      expect(rule?.cooldownDays).toBe(90);
    });

    it('should find issuer rule with different casing', () => {
      const rule = getIssuerRule('CHASE');
      expect(rule).toBeDefined();
      expect(rule?.maxAppsPerPeriod).toBe(5);
    });

    it('should return undefined for unknown issuer', () => {
      const rule = getIssuerRule('Unknown Bank');
      expect(rule).toBeUndefined();
    });
  });

  // ============================================================================
  // Application Counting
  // ============================================================================

  describe('countApplicationsInMonths', () => {
    const refDate = new Date('2026-02-14');

    it('should count applications in last 24 months', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2024-03-01')), // 23 months ago
        createTestApp('app2', new Date('2024-02-01')), // 24+ months ago
        createTestApp('app3', new Date('2025-12-01')), // 2 months ago
      ];

      const count = countApplicationsInMonths(apps, 24, refDate);
      expect(count).toBe(2); // app1 and app3 within 24 months
    });

    it('should only count approved applications', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-01-01'), 'approved'),
        createTestApp('app2', new Date('2025-02-01'), 'denied'),
        createTestApp('app3', new Date('2025-03-01'), 'pending'),
      ];

      const count = countApplicationsInMonths(apps, 24, refDate);
      expect(count).toBe(1); // Only approved
    });

    it('should count zero for empty applications', () => {
      const count = countApplicationsInMonths([], 24, refDate);
      expect(count).toBe(0);
    });

    it('should count applications in last 12 months', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-03-01')), // 11 months ago
        createTestApp('app2', new Date('2025-01-01')), // 13+ months ago
      ];

      const count = countApplicationsInMonths(apps, 12, refDate);
      expect(count).toBe(1);
    });
  });

  describe('countIssuerApplications', () => {
    const refDate = new Date('2026-02-14');

    it('should count applications to specific issuer', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-06-01'), 'approved', 'American Express'),
        createTestApp('app2', new Date('2025-12-01'), 'approved', 'American Express'),
        createTestApp('app3', new Date('2025-12-01'), 'approved', 'Chase'),
      ];

      const { count, lastDate } = countIssuerApplications(apps, 'American Express', 12, refDate);
      expect(count).toBe(2);
      expect(lastDate).toEqual(new Date('2025-12-01'));
    });

    it('should be case-insensitive for issuer matching', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-06-01'), 'approved', 'american express'),
        createTestApp('app2', new Date('2025-12-01'), 'approved', 'AMERICAN EXPRESS'),
      ];

      const { count } = countIssuerApplications(apps, 'American Express', 12, refDate);
      expect(count).toBe(2);
    });

    it('should return null for lastDate if no applications', () => {
      const { count, lastDate } = countIssuerApplications([], 'Chase', 12, refDate);
      expect(count).toBe(0);
      expect(lastDate).toBeNull();
    });
  });

  // ============================================================================
  // Cooldown Calculation
  // ============================================================================

  describe('calculateIssuerCooldown', () => {
    const refDate = new Date('2026-02-14');

    it('should calculate Amex 90-day cooldown correctly', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-12-01'), 'approved', 'American Express'),
      ];

      const cooldown = calculateIssuerCooldown(apps, 'American Express', refDate);
      
      expect(cooldown.isEligible).toBe(false);
      expect(cooldown.daysUntilEligible).toBeGreaterThan(0);
      expect(cooldown.daysUntilEligible).toBeLessThanOrEqual(90);
    });

    it('should show eligible after 90 days for Amex', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-11-01'), 'approved', 'American Express'),
      ];

      const cooldown = calculateIssuerCooldown(apps, 'American Express', refDate);
      expect(cooldown.isEligible).toBe(true);
      expect(cooldown.daysUntilEligible).toBe(0);
    });

    it('should calculate Chase 5/24 correctly', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2024-03-01'), 'approved', 'Chase'),
        createTestApp('app2', new Date('2024-06-01'), 'approved', 'Chase'),
        createTestApp('app3', new Date('2024-09-01'), 'approved', 'Chase'),
        createTestApp('app4', new Date('2024-12-01'), 'approved', 'Chase'),
        createTestApp('app5', new Date('2025-03-01'), 'approved', 'Chase'),
      ];

      const cooldown = calculateIssuerCooldown(apps, 'Chase', refDate);
      expect(cooldown.isEligible).toBe(false);
      expect(cooldown.applicationCountInPeriod).toBe(5);
    });

    it('should handle issuers with no cooldown', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-12-01'), 'approved', 'RBC'),
      ];

      const cooldown = calculateIssuerCooldown(apps, 'RBC', refDate);
      expect(cooldown.isEligible).toBe(true);
      expect(cooldown.daysUntilEligible).toBe(0);
    });

    it('should handle unknown issuers gracefully', () => {
      const apps: CardApplication[] = [];
      const cooldown = calculateIssuerCooldown(apps, 'Unknown Bank', refDate);
      
      expect(cooldown.isEligible).toBe(true);
      expect(cooldown.rule.cooldownDays).toBe(0);
      expect(cooldown.rule.description).toContain('No known restrictions');
    });
  });

  // ============================================================================
  // Card Eligibility
  // ============================================================================

  describe('checkCardEligibility', () => {
    const refDate = new Date('2026-02-14');

    it('should check eligibility for card with no applications', () => {
      const eligibility = checkCardEligibility('card1', [], refDate);
      
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.cardName).toBe('Amex Gold');
      expect(eligibility.issuer).toBe('American Express');
      expect(eligibility.welcomeBonusEligible).toBe(true);
    });

    it('should check eligibility with recent Amex application', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-12-01'), 'approved', 'American Express', 'card1'),
      ];

      const eligibility = checkCardEligibility('card1', apps, refDate);
      
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reasons.length).toBeGreaterThan(0);
      expect(eligibility.daysUntilEligible).toBeGreaterThan(0);
    });

    it('should check 5/24 for Chase cards', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2024-03-01'), 'approved', 'TD'),
        createTestApp('app2', new Date('2024-06-01'), 'approved', 'RBC'),
        createTestApp('app3', new Date('2024-09-01'), 'approved', 'CIBC'),
        createTestApp('app4', new Date('2024-12-01'), 'approved', 'BMO'),
        createTestApp('app5', new Date('2025-03-01'), 'approved', 'Scotiabank'),
      ];

      const eligibility = checkCardEligibility('card2', apps, refDate);
      
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reasons.some(r => r.includes('5/24'))).toBe(true);
    });

    it('should note previous applications for welcome bonus', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2023-01-01'), 'approved', 'American Express', 'card1'),
      ];

      const eligibility = checkCardEligibility('card1', apps, refDate);
      
      expect(eligibility.previousApplications).toHaveLength(1);
      expect(eligibility.welcomeBonusEligible).toBe(true); // >2 years ago
    });

    it('should mark welcome bonus ineligible for recent application', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-01-01'), 'approved', 'American Express', 'card1'),
      ];

      const eligibility = checkCardEligibility('card1', apps, refDate);
      expect(eligibility.welcomeBonusEligible).toBe(false);
    });
  });

  // ============================================================================
  // Timeline Generation
  // ============================================================================

  describe('generateTimeline', () => {
    const refDate = new Date('2026-02-14');

    it('should generate timeline with past applications', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2024-03-01')),
        createTestApp('app2', new Date('2025-06-01')),
      ];

      const timeline = generateTimeline(apps, refDate);
      
      expect(timeline.length).toBeGreaterThanOrEqual(4); // 2 apps + 2 falloffs
      expect(timeline.some(e => e.type === 'application')).toBe(true);
      expect(timeline.some(e => e.type === 'falloff')).toBe(true);
    });

    it('should sort timeline events by date', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-06-01')),
        createTestApp('app2', new Date('2024-03-01')),
      ];

      const timeline = generateTimeline(apps, refDate);
      
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].date.getTime()).toBeGreaterThanOrEqual(
          timeline[i - 1].date.getTime()
        );
      }
    });

    it('should mark future events correctly', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2024-03-01')),
      ];

      const timeline = generateTimeline(apps, refDate);
      
      const pastEvents = timeline.filter(e => !e.isInFuture);
      const futureEvents = timeline.filter(e => e.isInFuture);
      
      expect(pastEvents.length).toBeGreaterThan(0);
      expect(futureEvents.length).toBeGreaterThan(0);
    });

    it('should include cooldown eligibility dates', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-12-01'), 'approved', 'American Express'),
      ];

      const timeline = generateTimeline(apps, refDate);
      
      const eligibleEvent = timeline.find(e => e.type === 'eligible');
      expect(eligibleEvent).toBeDefined();
      expect(eligibleEvent?.description).toContain('American Express');
    });
  });

  // ============================================================================
  // Strategy Generation
  // ============================================================================

  describe('generateStrategy', () => {
    const refDate = new Date('2026-02-14');

    it('should recommend applying now for eligible cards', () => {
      const wantedCards: WantedCard[] = [
        {
          cardId: 'card1',
          cardName: 'Amex Gold',
          issuer: 'American Express',
          priority: 'high',
          addedAt: new Date(),
        },
      ];

      const strategy = generateStrategy(wantedCards, [], refDate);
      
      expect(strategy.advice).toHaveLength(1);
      expect(strategy.advice[0].recommendation).toBe('apply_now');
      expect(strategy.summary).toContain('0/24');
    });

    it('should recommend waiting for cards in cooldown', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2025-12-01'), 'approved', 'American Express'),
      ];

      const wantedCards: WantedCard[] = [
        {
          cardId: 'card1',
          cardName: 'Amex Gold',
          issuer: 'American Express',
          priority: 'high',
          addedAt: new Date(),
        },
      ];

      const strategy = generateStrategy(wantedCards, apps, refDate);
      
      expect(strategy.advice[0].recommendation).toBe('wait');
      expect(strategy.advice[0].suggestedDate).toBeDefined();
    });

    it('should warn about approaching 5/24', () => {
      const apps: CardApplication[] = [
        createTestApp('app1', new Date('2024-06-01')),
        createTestApp('app2', new Date('2024-09-01')),
        createTestApp('app3', new Date('2024-12-01')),
        createTestApp('app4', new Date('2025-03-01')),
      ];

      const strategy = generateStrategy([], apps, refDate);
      
      expect(strategy.warnings.some(w => w.includes('5/24'))).toBe(true);
    });

    it('should prioritize high priority cards', () => {
      const wantedCards: WantedCard[] = [
        {
          cardId: 'card1',
          cardName: 'Low Priority',
          issuer: 'RBC',
          priority: 'low',
          addedAt: new Date(),
        },
        {
          cardId: 'card2',
          cardName: 'High Priority',
          issuer: 'Chase',
          priority: 'high',
          addedAt: new Date(),
        },
      ];

      const strategy = generateStrategy(wantedCards, [], refDate);
      
      expect(strategy.advice[0].cardId).toBe('card2'); // High priority first
    });

    it('should calculate 5/24 impact', () => {
      const wantedCards: WantedCard[] = [
        {
          cardId: 'card1',
          cardName: 'Amex Gold',
          issuer: 'American Express',
          priority: 'high',
          addedAt: new Date(),
        },
      ];

      const strategy = generateStrategy(wantedCards, [], refDate);
      
      expect(strategy.advice[0].impact.will524Increase).toBe(true);
      expect(strategy.advice[0].impact.new524Count).toBe(1);
    });
  });

  // ============================================================================
  // Service Methods
  // ============================================================================

  describe('addApplication', () => {
    it('should add a valid application', async () => {
      const input: CardApplicationInput = {
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2025-01-01'),
        status: 'approved',
      };

      const result = await addApplication(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.cardId).toBe('card1');
        expect(result.value.fallOffDate).toBeDefined();
      }
    });

    it('should calculate fall-off date correctly', async () => {
      const input: CardApplicationInput = {
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2024-02-14'),
        status: 'approved',
      };

      const result = await addApplication(input);
      
      if (result.success) {
        const fallOffDate = result.value.fallOffDate;
        const expectedDate = new Date('2026-02-14');
        expect(fallOffDate.getFullYear()).toBe(expectedDate.getFullYear());
        expect(fallOffDate.getMonth()).toBe(expectedDate.getMonth());
      }
    });

    it('should reject duplicate applications', async () => {
      const input: CardApplicationInput = {
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2025-01-01'),
        status: 'approved',
      };

      await addApplication(input);
      const result2 = await addApplication(input);
      
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.type).toBe('DUPLICATE_APPLICATION');
      }
    });

    it('should reject invalid input', async () => {
      const input: CardApplicationInput = {
        cardId: '',
        cardName: '',
        issuer: '',
        applicationDate: new Date(),
        status: 'approved',
      };

      const result = await addApplication(input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_APPLICATION');
      }
    });
  });

  describe('getApplications', () => {
    it('should return empty array initially', async () => {
      const apps = await getApplications();
      expect(apps).toEqual([]);
    });

    it('should return added applications', async () => {
      await addApplication({
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2025-01-01'),
        status: 'approved',
      });

      const apps = await getApplications();
      expect(apps).toHaveLength(1);
      expect(apps[0].cardName).toBe('Amex Gold');
    });
  });

  describe('getTrackerState', () => {
    it('should return tracker state with counts', async () => {
      await addApplication({
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2025-01-01'),
        status: 'approved',
      });

      const state = await getTrackerState();
      
      expect(state.countLast24Months).toBeGreaterThanOrEqual(0);
      expect(state.countLast12Months).toBeGreaterThanOrEqual(0);
      expect(state.applications).toHaveLength(1);
    });

    it('should include issuer cooldowns', async () => {
      await addApplication({
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2025-12-01'),
        status: 'approved',
      });

      const state = await getTrackerState();
      
      expect(state.issuerCooldowns.length).toBeGreaterThan(0);
      const amexCooldown = state.issuerCooldowns.find(
        c => normalizeIssuer(c.issuer) === 'american express'
      );
      expect(amexCooldown).toBeDefined();
    });

    it('should generate alerts for approaching 5/24', async () => {
      // Add 4 applications within the last 24 months
      const now = new Date();
      for (let i = 0; i < 4; i++) {
        const appDate = new Date(now);
        appDate.setMonth(appDate.getMonth() - (i * 5)); // Spread over last 20 months
        
        await addApplication({
          cardId: `card${i}`,
          cardName: `Card ${i}`,
          issuer: 'TD',
          applicationDate: appDate,
          status: 'approved',
        });
      }

      const state = await getTrackerState();
      
      const approaching524 = state.alerts.find(a => a.type === 'approaching_limit');
      expect(approaching524).toBeDefined();
    });
  });

  describe('deleteApplication', () => {
    it('should delete an existing application', async () => {
      const addResult = await addApplication({
        cardId: 'card1',
        cardName: 'Amex Gold',
        issuer: 'American Express',
        applicationDate: new Date('2025-01-01'),
        status: 'approved',
      });

      if (addResult.success) {
        const deleteResult = await deleteApplication(addResult.value.id);
        expect(deleteResult.success).toBe(true);

        const apps = await getApplications();
        expect(apps).toHaveLength(0);
      }
    });

    it('should return error for non-existent application', async () => {
      const result = await deleteApplication('non-existent');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('APPLICATION_NOT_FOUND');
      }
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createTestApp(
  id: string,
  applicationDate: Date,
  status: 'approved' | 'pending' | 'denied' = 'approved',
  issuer: string = 'TD',
  cardId: string = 'test-card'
): CardApplication {
  const fallOffDate = new Date(applicationDate);
  fallOffDate.setMonth(fallOffDate.getMonth() + 24);

  return {
    id,
    cardId,
    cardName: 'Test Card',
    issuer,
    applicationDate,
    status,
    fallOffDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
