/**
 * ApplicationTrackerService - F16: 5/24 Tracker
 * 
 * Features:
 * - Application tracking with fall-off dates
 * - Issuer-specific cooldown rules (8 Canadian + Chase 5/24)
 * - Eligibility checking per card
 * - Strategy advisor for application timing
 * - Offline-first storage with Supabase sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { getAllCardsSync } from './CardDataService';
import {
  CardApplication,
  CardApplicationInput,
  ApplicationTracker,
  IssuerRule,
  IssuerCooldownStatus,
  CardEligibility,
  ApplicationTimelineEvent,
  StrategyAdvice,
  ApplicationStrategy,
  WantedCard,
  TrackerAlert,
  ApplicationStatus,
  Result,
  success,
  failure,
  ApplicationTrackerError,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@rewardly/applications';
const MONTHS_24 = 24;
const MONTHS_12 = 12;

// ============================================================================
// Issuer Rules (Static Data)
// ============================================================================

export const ISSUER_RULES: IssuerRule[] = [
  // Canadian Issuers
  {
    issuer: 'American Express',
    cooldownDays: 90,
    isStrict: true,
    description: 'Can only apply for 1 Amex card every 90 days',
    welcomeBonusRule: 'Once per lifetime per card (with some exceptions)',
  },
  {
    issuer: 'Amex Canada',
    cooldownDays: 90,
    isStrict: true,
    description: 'Can only apply for 1 Amex card every 90 days',
    welcomeBonusRule: 'Once per lifetime per card (with some exceptions)',
  },
  {
    issuer: 'TD',
    cooldownDays: 90,
    isStrict: false,
    description: 'Not strict but multiple apps flag review',
  },
  {
    issuer: 'CIBC',
    cooldownDays: 0,
    isStrict: false,
    description: 'No hard limit but multiple apps may trigger review',
  },
  {
    issuer: 'RBC',
    cooldownDays: 0,
    isStrict: false,
    description: 'Generally flexible with applications',
  },
  {
    issuer: 'Scotiabank',
    cooldownDays: 0,
    isStrict: false,
    description: 'Generally flexible with applications',
  },
  {
    issuer: 'BMO',
    cooldownDays: 90,
    isStrict: false,
    description: 'Soft 90-day rule, similar to TD',
  },
  // US Issuers
  {
    issuer: 'Chase',
    cooldownDays: 0,
    isStrict: true,
    description: '5/24 Rule: Auto-denied if 5+ cards opened in 24 months',
    maxAppsPerPeriod: 5,
    periodMonths: 24,
  },
];

// ============================================================================
// In-Memory Cache
// ============================================================================

let applicationsCache: CardApplication[] = [];
let isInitialized = false;

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Normalize issuer name for comparison
 */
export function normalizeIssuer(issuer: string): string {
  return issuer.toLowerCase().trim();
}

/**
 * Count applications in last N months
 */
export function countApplicationsInMonths(
  applications: CardApplication[],
  months: number,
  referenceDate: Date = new Date()
): number {
  const cutoffDate = new Date(referenceDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  return applications.filter(
    app => app.applicationDate >= cutoffDate && app.status === 'approved'
  ).length;
}

/**
 * Count applications to specific issuer in period
 */
export function countIssuerApplications(
  applications: CardApplication[],
  issuer: string,
  months: number,
  referenceDate: Date = new Date()
): { count: number; lastDate: Date | null } {
  const cutoffDate = new Date(referenceDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  const issuerApps = applications.filter(
    app => 
      normalizeIssuer(app.issuer) === normalizeIssuer(issuer) &&
      app.applicationDate >= cutoffDate &&
      app.status === 'approved'
  );
  
  const sortedApps = issuerApps.sort(
    (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
  );
  
  return {
    count: issuerApps.length,
    lastDate: sortedApps[0]?.applicationDate || null,
  };
}

/**
 * Get issuer rule (case-insensitive)
 */
export function getIssuerRule(issuer: string): IssuerRule | undefined {
  const normalized = normalizeIssuer(issuer);
  return ISSUER_RULES.find(
    rule => normalizeIssuer(rule.issuer) === normalized
  );
}

/**
 * Calculate cooldown status for an issuer
 */
export function calculateIssuerCooldown(
  applications: CardApplication[],
  issuer: string,
  referenceDate: Date = new Date()
): IssuerCooldownStatus {
  const rule = getIssuerRule(issuer) || {
    issuer,
    cooldownDays: 0,
    isStrict: false,
    description: 'No known restrictions',
  };
  
  const { count, lastDate } = countIssuerApplications(
    applications,
    issuer,
    rule.periodMonths || 12,
    referenceDate
  );
  
  let isEligible = true;
  let nextEligibleDate: Date | undefined;
  let daysUntilEligible = 0;
  
  // Check cooldown period
  if (rule.cooldownDays > 0 && lastDate) {
    const cooldownEnd = new Date(lastDate);
    cooldownEnd.setDate(cooldownEnd.getDate() + rule.cooldownDays);
    
    if (cooldownEnd > referenceDate) {
      isEligible = false;
      nextEligibleDate = cooldownEnd;
      daysUntilEligible = Math.ceil(
        (cooldownEnd.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }
  
  // Check max apps per period (5/24 rule)
  if (rule.maxAppsPerPeriod && count >= rule.maxAppsPerPeriod) {
    // Find oldest app in period - when it falls off, we're eligible
    const periodApps = applications
      .filter(
        app =>
          normalizeIssuer(app.issuer) === normalizeIssuer(issuer) &&
          app.status === 'approved'
      )
      .sort((a, b) => a.applicationDate.getTime() - b.applicationDate.getTime());
    
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - (rule.periodMonths || 24));
    
    const oldestInPeriod = periodApps.find(app => app.applicationDate >= cutoff);
    
    if (oldestInPeriod) {
      const fallOffDate = new Date(oldestInPeriod.applicationDate);
      fallOffDate.setMonth(fallOffDate.getMonth() + (rule.periodMonths || 24));
      
      if (fallOffDate > referenceDate) {
        isEligible = false;
        if (!nextEligibleDate || fallOffDate > nextEligibleDate) {
          nextEligibleDate = fallOffDate;
          daysUntilEligible = Math.ceil(
            (fallOffDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }
    }
  }
  
  return {
    issuer,
    isEligible,
    lastApplicationDate: lastDate || undefined,
    nextEligibleDate,
    daysUntilEligible,
    rule,
    applicationCountInPeriod: count,
  };
}

/**
 * Check eligibility for a specific card
 */
export function checkCardEligibility(
  cardId: string,
  applications: CardApplication[],
  referenceDate: Date = new Date()
): CardEligibility {
  const card = getAllCardsSync().find(c => c.id === cardId);
  const cardName = card?.name || 'Unknown Card';
  const issuer = card?.issuer || 'Unknown';
  
  const cooldownStatus = calculateIssuerCooldown(applications, issuer, referenceDate);
  const previousApps = applications.filter(app => app.cardId === cardId);
  
  const reasons: string[] = [];
  let isEligible = true;
  let eligibleDate: Date | undefined;
  let daysUntilEligible = 0;
  
  // Check issuer cooldown
  if (!cooldownStatus.isEligible) {
    isEligible = false;
    reasons.push(
      `${issuer} cooldown: Wait ${cooldownStatus.daysUntilEligible} more days`
    );
    eligibleDate = cooldownStatus.nextEligibleDate;
    daysUntilEligible = cooldownStatus.daysUntilEligible;
  }
  
  // Check 5/24 for Chase cards
  if (normalizeIssuer(issuer) === 'chase') {
    const totalApps = countApplicationsInMonths(applications, 24, referenceDate);
    if (totalApps >= 5) {
      isEligible = false;
      reasons.push(`5/24 Rule: You have ${totalApps} cards in 24 months`);
    }
  }
  
  // Check previous applications to same card (welcome bonus)
  const rule = getIssuerRule(issuer);
  if (rule?.welcomeBonusRule && previousApps.length > 0) {
    reasons.push(`Note: ${rule.welcomeBonusRule}`);
  }
  
  // Check welcome bonus eligibility (simplified: 2 years for most issuers)
  const welcomeBonusEligible = previousApps.length === 0 ||
    previousApps.every(app => {
      const daysSince = Math.floor(
        (referenceDate.getTime() - app.applicationDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince > 365 * 2;
    });
  
  return {
    cardId,
    cardName,
    issuer,
    isEligible,
    reasons,
    eligibleDate,
    daysUntilEligible,
    cooldownStatus,
    previousApplications: previousApps,
    welcomeBonusEligible,
  };
}

/**
 * Generate application timeline (past + future events)
 */
export function generateTimeline(
  applications: CardApplication[],
  referenceDate: Date = new Date()
): ApplicationTimelineEvent[] {
  const events: ApplicationTimelineEvent[] = [];
  
  // Past applications
  for (const app of applications) {
    events.push({
      date: app.applicationDate,
      type: 'application',
      application: app,
      description: `Applied for ${app.cardName}`,
      isInFuture: false,
    });
    
    // Future fall-off
    if (app.fallOffDate > referenceDate) {
      events.push({
        date: app.fallOffDate,
        type: 'falloff',
        application: app,
        description: `${app.cardName} falls off 24-month count`,
        isInFuture: true,
      });
    }
  }
  
  // Future eligibility dates (from cooldowns)
  const issuers = [...new Set(applications.map(a => a.issuer))];
  for (const issuer of issuers) {
    const cooldown = calculateIssuerCooldown(applications, issuer, referenceDate);
    if (cooldown.nextEligibleDate && cooldown.nextEligibleDate > referenceDate) {
      events.push({
        date: cooldown.nextEligibleDate,
        type: 'eligible',
        description: `Eligible for new ${issuer} card`,
        isInFuture: true,
      });
    }
  }
  
  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Generate strategy advice for wanted cards
 */
export function generateStrategy(
  wantedCards: WantedCard[],
  applications: CardApplication[],
  referenceDate: Date = new Date()
): ApplicationStrategy {
  const advice: StrategyAdvice[] = [];
  const warnings: string[] = [];
  
  // Current 5/24 count
  const current524 = countApplicationsInMonths(applications, 24, referenceDate);
  
  // Sort wanted cards by priority
  const sortedWanted = [...wantedCards].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  let simulated524 = current524;
  
  for (const wanted of sortedWanted) {
    const eligibility = checkCardEligibility(wanted.cardId, applications, referenceDate);
    const cooldown = eligibility.cooldownStatus;
    
    let recommendation: StrategyAdvice['recommendation'];
    const reasons: string[] = [];
    let suggestedDate: Date | undefined;
    let priority = 0;
    
    // Determine recommendation
    if (eligibility.isEligible) {
      // Check if applying would hurt 5/24
      if (simulated524 >= 4 && normalizeIssuer(wanted.issuer) !== 'chase') {
        // About to hit 5/24 - prioritize Chase cards
        const hasChaseWanted = wantedCards.some(
          w => normalizeIssuer(w.issuer) === 'chase' && w.cardId !== wanted.cardId
        );
        
        if (hasChaseWanted) {
          recommendation = 'caution';
          reasons.push('Applying will put you at 5/24 - consider Chase cards first');
          priority = 50;
        } else {
          recommendation = 'apply_now';
          reasons.push('Eligible now');
          priority = 10;
        }
      } else {
        recommendation = 'apply_now';
        reasons.push('Eligible now');
        priority = wanted.priority === 'high' ? 5 : wanted.priority === 'medium' ? 15 : 25;
      }
      
      simulated524++;
    } else {
      // Not eligible
      if (cooldown.nextEligibleDate) {
        recommendation = 'wait';
        suggestedDate = cooldown.nextEligibleDate;
        reasons.push(`Wait until ${cooldown.nextEligibleDate.toLocaleDateString()}`);
        reasons.push(...eligibility.reasons.filter(r => !r.startsWith('Note:')));
        priority = 30 + cooldown.daysUntilEligible;
      } else {
        recommendation = 'not_recommended';
        reasons.push(...eligibility.reasons);
        priority = 100;
      }
    }
    
    const will524Increase = recommendation === 'apply_now';
    
    advice.push({
      cardId: wanted.cardId,
      cardName: wanted.cardName,
      issuer: wanted.issuer,
      recommendation,
      reasons,
      suggestedDate,
      priority,
      impact: {
        will524Increase,
        new524Count: will524Increase ? simulated524 : current524,
        affectedIssuers: will524Increase ? [wanted.issuer] : [],
      },
    });
  }
  
  // Sort by priority
  advice.sort((a, b) => a.priority - b.priority);
  
  // Generate warnings
  if (current524 >= 4) {
    warnings.push('You are at or near 5/24 - Chase cards will be difficult to get');
  }
  
  if (current524 >= 5) {
    warnings.push('You are over 5/24 - Chase cards are auto-denied until cards fall off');
  }
  
  // Generate summary
  let summary = `You have ${current524}/24 cards in the last 24 months. `;
  
  const applyNow = advice.filter(a => a.recommendation === 'apply_now');
  const wait = advice.filter(a => a.recommendation === 'wait');
  
  if (applyNow.length > 0) {
    summary += `You can apply for ${applyNow.length} card(s) now. `;
  }
  
  if (wait.length > 0) {
    const nextDate = wait[0]?.suggestedDate;
    if (nextDate) {
      summary += `Next application available: ${nextDate.toLocaleDateString()}. `;
    }
  }
  
  const timeline = generateTimeline(applications, referenceDate);
  
  return {
    wantedCards: sortedWanted,
    advice,
    timeline,
    warnings,
    summary,
  };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize application tracker
 */
export async function initializeApplicationTracker(): Promise<void> {
  if (isInitialized) return;

  try {
    // Try Supabase first for authenticated users
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && !user.isAnonymous) {
        await syncFromSupabase();
        isInitialized = true;
        return;
      }
    }

    // Fallback to local storage
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      applicationsCache = transformFromStorage(JSON.parse(stored));
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('[ApplicationTrackerService] Initialization error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Add a new card application
 */
export async function addApplication(
  input: CardApplicationInput
): Promise<Result<CardApplication, ApplicationTrackerError>> {
  if (!isInitialized) await initializeApplicationTracker();

  // Validate input
  if (!input.cardId || !input.cardName || !input.issuer) {
    return failure({
      type: 'INVALID_APPLICATION',
      message: 'Missing required fields',
    });
  }

  // Check for duplicates (same card, same day)
  const dateStr = input.applicationDate.toISOString().split('T')[0];
  const duplicate = applicationsCache.find(
    app =>
      app.cardId === input.cardId &&
      app.applicationDate.toISOString().split('T')[0] === dateStr
  );

  if (duplicate) {
    return failure({
      type: 'DUPLICATE_APPLICATION',
      cardId: input.cardId,
      date: dateStr,
    });
  }

  // Calculate fall-off date (24 months from application)
  const fallOffDate = new Date(input.applicationDate);
  fallOffDate.setMonth(fallOffDate.getMonth() + MONTHS_24);

  const application: CardApplication = {
    id: generateId(),
    ...input,
    fallOffDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  applicationsCache.push(application);
  applicationsCache.sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());

  // Persist
  await persistToStorage(applicationsCache);

  // Sync to Supabase
  if (isSupabaseConfigured()) {
    await syncToSupabase(applicationsCache);
  }

  return success(application);
}

/**
 * Get all applications
 */
export async function getApplications(): Promise<CardApplication[]> {
  if (!isInitialized) await initializeApplicationTracker();
  return [...applicationsCache];
}

/**
 * Get full tracker state
 */
export async function getTrackerState(): Promise<ApplicationTracker> {
  if (!isInitialized) await initializeApplicationTracker();

  const now = new Date();
  const count24 = countApplicationsInMonths(applicationsCache, MONTHS_24, now);
  const count12 = countApplicationsInMonths(applicationsCache, MONTHS_12, now);

  // Get unique issuers
  const issuers = [...new Set(applicationsCache.map(a => a.issuer))];
  const issuerCooldowns = issuers.map(issuer =>
    calculateIssuerCooldown(applicationsCache, issuer, now)
  );

  const upcoming = generateTimeline(applicationsCache, now).filter(e => e.isInFuture);

  const alerts: TrackerAlert[] = [];

  // Generate alerts
  if (count24 >= 4 && count24 < 5) {
    alerts.push({
      id: 'approaching_524',
      type: 'approaching_limit',
      title: 'Approaching 5/24',
      message: `You have ${count24} cards in 24 months. One more and you'll hit 5/24.`,
      date: now,
      dismissed: false,
      createdAt: now,
    });
  }

  return {
    userId: null,
    applications: applicationsCache,
    countLast24Months: count24,
    countLast12Months: count12,
    issuerCooldowns,
    upcoming,
    alerts,
    updatedAt: now,
  };
}

/**
 * Delete an application
 */
export async function deleteApplication(
  applicationId: string
): Promise<Result<void, ApplicationTrackerError>> {
  if (!isInitialized) await initializeApplicationTracker();

  const index = applicationsCache.findIndex(app => app.id === applicationId);
  if (index === -1) {
    return failure({
      type: 'APPLICATION_NOT_FOUND',
      applicationId,
    });
  }

  applicationsCache.splice(index, 1);

  await persistToStorage(applicationsCache);

  if (isSupabaseConfigured()) {
    await syncToSupabase(applicationsCache);
  }

  return success(undefined);
}

/**
 * Reset tracker (for testing)
 */
export async function resetTracker(): Promise<void> {
  applicationsCache = [];
  await AsyncStorage.removeItem(STORAGE_KEY);

  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('card_applications')
        .delete()
        .eq('user_id', user.id);
    }
  }
}

/**
 * Reset cache (for testing)
 */
export function resetTrackerCache(): void {
  applicationsCache = [];
  isInitialized = false;
}

// ============================================================================
// Storage Functions
// ============================================================================

async function persistToStorage(applications: CardApplication[]): Promise<void> {
  const serialized = JSON.stringify(
    applications.map(app => ({
      ...app,
      applicationDate: app.applicationDate.toISOString(),
      approvalDate: app.approvalDate?.toISOString(),
      fallOffDate: app.fallOffDate.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }))
  );
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

function transformFromStorage(data: any[]): CardApplication[] {
  return data.map(app => ({
    ...app,
    applicationDate: new Date(app.applicationDate),
    approvalDate: app.approvalDate ? new Date(app.approvalDate) : undefined,
    fallOffDate: new Date(app.fallOffDate),
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
  }));
}

// ============================================================================
// Supabase Sync
// ============================================================================

async function syncFromSupabase(): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('card_applications')
    .select('*')
    .eq('user_id', user.id);

  if (error || !data) {
    applicationsCache = [];
    return;
  }

  applicationsCache = data.map((row: any) => ({
    id: row.id,
    cardId: row.card_id,
    cardName: row.card_name,
    issuer: row.issuer,
    applicationDate: new Date(row.application_date),
    approvalDate: row.approval_date ? new Date(row.approval_date) : undefined,
    status: row.status as ApplicationStatus,
    fallOffDate: new Date(row.fall_off_date),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));

  await persistToStorage(applicationsCache);
}

async function syncToSupabase(applications: CardApplication[]): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  const rows = applications.map(app => ({
    id: app.id,
    user_id: user.id,
    card_id: app.cardId,
    card_name: app.cardName,
    issuer: app.issuer,
    application_date: app.applicationDate.toISOString().split('T')[0],
    approval_date: app.approvalDate?.toISOString().split('T')[0],
    status: app.status,
    fall_off_date: app.fallOffDate.toISOString().split('T')[0],
    notes: app.notes,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    await supabase
      .from('card_applications')
      .upsert(rows as any, { onConflict: 'id' });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
