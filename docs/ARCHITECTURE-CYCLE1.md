# Cycle 1 Architecture Document

**Date:** February 13, 2026  
**Author:** VP of Engineering  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Database Migration](#database-migration)
3. [Feature Architectures](#feature-architectures)
   - [F1: Card Benefits Dashboard](#f1-card-benefits-dashboard)
   - [F2: SUB Tracker](#f2-sub-tracker)
   - [F3: Card Comparison Tool](#f3-card-comparison-tool)
   - [F4: Spending Log](#f4-spending-log)
   - [F5: Recurring Subscriptions Optimizer](#f5-recurring-subscriptions-optimizer)
   - [F6: Annual Fee Tracker](#f6-annual-fee-tracker)
   - [F7: Redemption Guide](#f7-redemption-guide)
   - [F8: Card Recommendation Engine](#f8-card-recommendation-engine)
   - [F9: Notifications Center](#f9-notifications-center)
   - [F10: Monthly Savings Report](#f10-monthly-savings-report)
4. [Implementation Order](#implementation-order)
5. [Test Plan](#test-plan)
6. [Risk Assessment](#risk-assessment)

---

## Overview

This document provides build-ready architecture for 10 features. All code follows existing patterns:

- **Services**: Singleton with async init, local cache, Supabase sync
- **Screens**: Functional components with `useMemo` styles, `useCallback` handlers
- **Navigation**: React Navigation native stack, InsightsStack pattern
- **Tier gating**: `LockedFeature` component with `canAccessFeatureSync()`
- **i18n**: Keys in `src/i18n/locales/en.json` (and fr.json)

---

## Database Migration

**File:** `supabase/migrations/016_cycle1_features.sql`

```sql
-- ============================================================================
-- Migration: 016_cycle1_features.sql
-- Description: Cycle 1 features - SUB tracker, spending log, recurring charges,
--              annual fees, notifications, benefits, savings reports
-- Author: Dev Team
-- Date: 2026-02-13
-- ============================================================================

-- ============================================================================
-- F1: Card Benefits - Add benefits JSON to cards table
-- ============================================================================

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cards.benefits IS 'Array of benefit objects: [{name, description, category, value}]';

-- Benefit categories: travel, purchase, insurance, lifestyle
-- Example: [{"name": "Travel Insurance", "description": "Up to $500K coverage", "category": "travel", "value": "$500,000"}]

-- ============================================================================
-- F2: SUB (Sign-Up Bonus) Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS sub_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id VARCHAR(100) NOT NULL, -- card_key reference
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    bonus_description TEXT,
    bonus_amount INTEGER, -- points/dollars value
    bonus_currency VARCHAR(20), -- 'points', 'cashback', etc.
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_tracking_user ON sub_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_tracking_status ON sub_tracking(status);
CREATE INDEX IF NOT EXISTS idx_sub_tracking_deadline ON sub_tracking(deadline_date);

-- RLS
ALTER TABLE sub_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SUB tracking" ON sub_tracking
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F4: Spending Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS spending_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    store_name VARCHAR(200),
    card_used VARCHAR(100) NOT NULL, -- card_key
    optimal_card VARCHAR(100), -- card_key of best card
    rewards_earned DECIMAL(10,4), -- actual rewards earned
    rewards_missed DECIMAL(10,4), -- rewards left on table
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spending_log_user ON spending_log(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_log_date ON spending_log(transaction_date);
CREATE INDEX IF NOT EXISTS idx_spending_log_category ON spending_log(category);
CREATE INDEX IF NOT EXISTS idx_spending_log_card ON spending_log(card_used);

-- RLS
ALTER TABLE spending_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own spending log" ON spending_log
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F5: Recurring Charges
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
    current_card VARCHAR(100), -- card_key
    optimal_card VARCHAR(100), -- card_key recommended
    current_rewards DECIMAL(10,4), -- rewards with current card
    optimal_rewards DECIMAL(10,4), -- rewards with optimal card
    monthly_savings DECIMAL(10,4), -- difference
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_charges_user ON recurring_charges(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_charges_active ON recurring_charges(is_active);

-- RLS
ALTER TABLE recurring_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring charges" ON recurring_charges
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F6: User Card Tracking (for annual fees, open dates)
-- ============================================================================

-- Add columns to existing user_cards table
ALTER TABLE user_cards 
ADD COLUMN IF NOT EXISTS card_open_date DATE,
ADD COLUMN IF NOT EXISTS annual_fee_renewal_month INTEGER CHECK (annual_fee_renewal_month >= 1 AND annual_fee_renewal_month <= 12),
ADD COLUMN IF NOT EXISTS last_fee_alert_sent DATE;

-- ============================================================================
-- F9: Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'sub_deadline', 
        'fee_renewal', 
        'bonus_category', 
        'monthly_report', 
        'new_card_offer',
        'spending_alert',
        'general'
    )),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- deep link or screen name
    action_data JSONB, -- additional data for navigation
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F10: Monthly Savings Reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_month DATE NOT NULL, -- first day of month
    total_spend DECIMAL(12,2) DEFAULT 0,
    total_rewards_earned DECIMAL(10,4) DEFAULT 0,
    total_rewards_missed DECIMAL(10,4) DEFAULT 0,
    best_card VARCHAR(100), -- card_key
    best_card_earnings DECIMAL(10,4),
    worst_card VARCHAR(100), -- card_key
    worst_card_earnings DECIMAL(10,4),
    category_breakdown JSONB DEFAULT '[]'::jsonb, -- [{category, spend, earned, missed}]
    optimization_score INTEGER, -- 0-100
    generated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_user_month UNIQUE (user_id, report_month)
);

CREATE INDEX IF NOT EXISTS idx_savings_reports_user ON savings_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_reports_month ON savings_reports(report_month);

-- RLS
ALTER TABLE savings_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reports" ON savings_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Service role generates reports
CREATE POLICY "Service role manages reports" ON savings_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- F7: Transfer Partners (for Redemption Guide)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transfer_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES reward_programs(id) ON DELETE CASCADE,
    partner_name VARCHAR(200) NOT NULL,
    partner_type VARCHAR(50) CHECK (partner_type IN ('airline', 'hotel')),
    transfer_ratio DECIMAL(5,2) NOT NULL, -- e.g., 1.0 = 1:1, 0.5 = 2:1
    transfer_time VARCHAR(100), -- "Instant", "1-2 days"
    sweet_spots TEXT[], -- Array of notable redemptions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_partners_program ON transfer_partners(program_id);

-- Public read access for transfer partners
ALTER TABLE transfer_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read transfer partners" ON transfer_partners
    FOR SELECT USING (true);

-- ============================================================================
-- Update Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_sub_tracking_updated_at ON sub_tracking;
CREATE TRIGGER update_sub_tracking_updated_at
    BEFORE UPDATE ON sub_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spending_log_updated_at ON spending_log;
CREATE TRIGGER update_spending_log_updated_at
    BEFORE UPDATE ON spending_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_charges_updated_at ON recurring_charges;
CREATE TRIGGER update_recurring_charges_updated_at
    BEFORE UPDATE ON recurring_charges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Feature Flags in Profile (for tier-gated features)
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT ALL ON sub_tracking TO authenticated;
GRANT ALL ON spending_log TO authenticated;
GRANT ALL ON recurring_charges TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON savings_reports TO authenticated;
GRANT SELECT ON transfer_partners TO authenticated;

-- ============================================================================
-- Done
-- ============================================================================
```

---

## Feature Architectures

---

### F1: Card Benefits Dashboard

**Tier:** Pro+ (Free sees first 2 benefits + locked overlay)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/CardBenefitsScreen.tsx` | Main benefits display screen |
| `src/services/BenefitsService.ts` | Benefits data fetching & caching |
| `src/components/BenefitCard.tsx` | Individual benefit item component |
| `src/components/BenefitsSection.tsx` | Benefits list grouped by category |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `CardBenefits` to InsightsStack or create CardStack |
| `src/screens/index.ts` | Export `CardBenefitsScreen` |
| `src/components/index.ts` | Export new components |
| `src/types/index.ts` | Add `Benefit`, `BenefitCategory` types |
| `src/i18n/locales/en.json` | Add benefits i18n keys |
| `src/services/CardDataService.ts` | Update `Card` transformation to include benefits |

#### Service Layer

```typescript
// src/services/BenefitsService.ts

export interface Benefit {
  name: string;
  description: string;
  category: BenefitCategory;
  value?: string; // "$500,000 coverage"
}

export type BenefitCategory = 'travel' | 'purchase' | 'insurance' | 'lifestyle';

// Functions
export function getBenefitsForCard(cardId: string): Benefit[];
export function getBenefitsByCategory(benefits: Benefit[]): Record<BenefitCategory, Benefit[]>;
export function getVisibleBenefits(benefits: Benefit[], tier: SubscriptionTier): Benefit[];
```

#### Component Hierarchy

```
CardBenefitsScreen
├── ScrollView
│   ├── Header (card name, issuer badge)
│   ├── BenefitsSection (category="travel")
│   │   ├── SectionHeader
│   │   └── BenefitCard[] 
│   ├── BenefitsSection (category="purchase")
│   ├── BenefitsSection (category="insurance")
│   ├── BenefitsSection (category="lifestyle")
│   └── LockedFeature (if Free, shows after 2 benefits)
```

**Props & State:**
```typescript
// CardBenefitsScreen
interface Props {
  route: { params: { cardId: string } };
}
// State: benefits: Benefit[], isLoading: boolean, hasAccess: boolean

// BenefitCard
interface BenefitCardProps {
  benefit: Benefit;
  isLocked?: boolean;
}
```

#### Navigation Wiring

```typescript
// Add to InsightsStackParamList:
CardBenefits: { cardId: string };

// Access from card detail or MyCardsScreen:
navigation.navigate('Insights', { 
  screen: 'CardBenefits', 
  params: { cardId } 
});
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | First 2 benefits visible, rest locked with LockedFeature overlay |
| Pro | All benefits visible |
| Max | All benefits visible |

#### i18n Keys

```json
{
  "benefits": {
    "title": "Card Benefits",
    "categories": {
      "travel": "Travel Benefits",
      "purchase": "Purchase Protection",
      "insurance": "Insurance Coverage",
      "lifestyle": "Lifestyle Perks"
    },
    "noBenefits": "No benefits data available for this card",
    "viewAll": "View All Benefits",
    "lockedTitle": "Unlock All Benefits",
    "lockedDesc": "Upgrade to Pro to see all {{count}} benefits"
  }
}
```

---

### F2: SUB Tracker

**Tier:** Free (hook feature)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/SUBTrackerScreen.tsx` | Main SUB tracking screen with list |
| `src/services/SUBTrackingService.ts` | CRUD operations, progress calculation |
| `src/components/SUBCard.tsx` | Individual SUB progress card |
| `src/components/SUBProgressBar.tsx` | Animated progress bar component |
| `src/components/AddSUBModal.tsx` | Modal for adding/editing SUB |
| `src/components/SUBWidget.tsx` | Home screen widget showing active SUBs |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `SUBTracker` to InsightsStack |
| `src/screens/HomeScreen.tsx` | Add `SUBWidget` component |
| `src/screens/index.ts` | Export `SUBTrackerScreen` |
| `src/types/index.ts` | Add `SUBTracking` type |
| `src/i18n/locales/en.json` | Add SUB i18n keys |

#### Service Layer

```typescript
// src/services/SUBTrackingService.ts

export interface SUBTracking {
  id: string;
  userId: string;
  cardId: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  deadlineDate: Date;
  bonusDescription?: string;
  bonusAmount?: number;
  bonusCurrency?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  completedAt?: Date;
}

export interface SUBProgress {
  sub: SUBTracking;
  percentComplete: number;
  amountRemaining: number;
  daysRemaining: number;
  dailyTargetNeeded: number; // To hit goal
  isOnTrack: boolean;
  isUrgent: boolean; // <7 days and under target
}

// Functions
export async function initializeSUBTracking(): Promise<void>;
export async function getAllSUBs(): Promise<SUBTracking[]>;
export async function getActiveSUBs(): Promise<SUBTracking[]>;
export async function addSUB(sub: Omit<SUBTracking, 'id' | 'userId' | 'status'>): Promise<SUBTracking>;
export async function updateSUB(id: string, updates: Partial<SUBTracking>): Promise<SUBTracking>;
export async function deleteSUB(id: string): Promise<void>;
export async function addSpendingToSUB(id: string, amount: number): Promise<SUBTracking>;
export function calculateProgress(sub: SUBTracking): SUBProgress;
export function getUrgentSUBs(): SUBProgress[]; // For notifications
```

#### Component Hierarchy

```
SUBTrackerScreen
├── ScrollView
│   ├── Header ("Sign-Up Bonus Tracker")
│   ├── SummaryCard (active count, total potential value)
│   ├── SUBCard[] (for each active SUB)
│   │   ├── CardHeader (card name, badge)
│   │   ├── SUBProgressBar
│   │   ├── StatsRow (spent/target, days left)
│   │   └── ActionButtons (add spend, edit, delete)
│   ├── CompletedSection (collapsed)
│   │   └── SUBCard[] (completed SUBs)
│   └── EmptyState (if no SUBs)
├── FAB (Add SUB)
└── AddSUBModal

SUBWidget (for HomeScreen)
├── WidgetHeader ("Active Bonuses")
├── SUBMiniCard[] (max 2, most urgent)
└── ViewAllLink
```

**Props & State:**
```typescript
// SUBTrackerScreen
// State: subs: SUBTracking[], isLoading, showAddModal, editingSub

// SUBCard
interface SUBCardProps {
  sub: SUBTracking;
  progress: SUBProgress;
  onAddSpend: (amount: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

// SUBProgressBar  
interface SUBProgressBarProps {
  percentComplete: number;
  isUrgent: boolean;
  daysRemaining: number;
}

// AddSUBModal
interface AddSUBModalProps {
  visible: boolean;
  editingSub?: SUBTracking;
  onClose: () => void;
  onSave: (sub: SUBFormData) => void;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
SUBTracker: undefined;

// Access from:
// 1. InsightsHome quick action
// 2. HomeScreen SUBWidget tap
// 3. Notifications tap

navigation.navigate('Insights', { screen: 'SUBTracker' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | Full access (hook feature) |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "subTracker": {
    "title": "Sign-Up Bonus Tracker",
    "subtitle": "Track your spending toward signup bonuses",
    "addSUB": "Add Bonus to Track",
    "editSUB": "Edit Bonus",
    "deleteSUB": "Remove Tracking",
    "deleteConfirm": "Stop tracking this bonus?",
    "progress": {
      "spent": "Spent",
      "of": "of",
      "remaining": "{{amount}} to go",
      "daysLeft": "{{days}} days left",
      "daysLeftOne": "1 day left",
      "onTrack": "On track!",
      "behindSchedule": "Spend {{amount}}/day to hit goal",
      "completed": "Completed!",
      "expired": "Expired"
    },
    "form": {
      "selectCard": "Select Card",
      "targetAmount": "Spending Requirement",
      "startDate": "Start Date",
      "deadline": "Deadline",
      "bonusValue": "Bonus Value",
      "bonusDescription": "Bonus Description"
    },
    "addSpend": "Add Spending",
    "addSpendPrompt": "Enter amount spent:",
    "empty": {
      "title": "No Bonuses Being Tracked",
      "description": "Add a sign-up bonus to track your progress",
      "cta": "Add Your First Bonus"
    },
    "widget": {
      "title": "Active Bonuses",
      "viewAll": "View All"
    }
  }
}
```

---

### F3: Card Comparison Tool

**Tier:** Free (2 cards), Pro+ (3 cards)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/CardCompareScreen.tsx` | Side-by-side comparison view |
| `src/services/CardComparisonService.ts` | Comparison logic, scoring |
| `src/components/CompareSelector.tsx` | Card selection chips |
| `src/components/ComparisonTable.tsx` | Category-by-category comparison |
| `src/components/ComparisonRow.tsx` | Single row with winner highlighting |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `CardCompare` to InsightsStack |
| `src/screens/MyCardsScreen.tsx` | Add "Compare" button in header |
| `src/screens/index.ts` | Export `CardCompareScreen` |
| `src/i18n/locales/en.json` | Add comparison i18n keys |

#### Service Layer

```typescript
// src/services/CardComparisonService.ts

export interface ComparisonResult {
  cards: Card[];
  categoryComparisons: CategoryComparison[];
  overallScores: { cardId: string; score: number }[];
  winner: string; // cardId
}

export interface CategoryComparison {
  category: SpendingCategory | 'annual_fee' | 'signup_bonus' | 'benefits_count';
  values: { cardId: string; value: number | string; isWinner: boolean }[];
}

// Functions
export function compareCards(cardIds: string[]): ComparisonResult;
export function getComparisonCategories(): (SpendingCategory | string)[];
export function calculateOverallScore(card: Card): number;
export function getMaxCardsForTier(tier: SubscriptionTier): number; // 2 for free, 3 for pro+
```

#### Component Hierarchy

```
CardCompareScreen
├── Header
├── CompareSelector
│   ├── SelectedCardChip[] (with remove X)
│   └── AddCardButton (if under limit)
├── ScrollView (horizontal for 3 cards)
│   └── ComparisonTable
│       ├── CardHeaderRow (card names, issuers)
│       ├── ComparisonRow (rewards by category x9)
│       ├── ComparisonRow (annual fee)
│       ├── ComparisonRow (signup bonus)
│       ├── ComparisonRow (benefits count)
│       └── OverallScoreRow
├── CardPickerModal (when adding)
└── LockedFeature (if free user tries 3rd card)
```

**Props & State:**
```typescript
// CardCompareScreen
// State: selectedCardIds: string[], comparison: ComparisonResult | null, showPicker: boolean

// ComparisonRow
interface ComparisonRowProps {
  label: string;
  values: { cardId: string; display: string; isWinner: boolean }[];
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
CardCompare: { preselectedCards?: string[] };

// Access from MyCardsScreen:
<TouchableOpacity onPress={() => navigation.navigate('Insights', { 
  screen: 'CardCompare',
  params: { preselectedCards: selectedIds }
})}>
  <Text>Compare</Text>
</TouchableOpacity>
```

#### Tier Gating

| Tier | Max Cards |
|------|-----------|
| Free | 2 cards |
| Pro | 3 cards |
| Max | 3 cards |

Show `LockedFeature` card variant when free user tries to add 3rd card.

#### i18n Keys

```json
{
  "cardCompare": {
    "title": "Compare Cards",
    "subtitle": "See which card wins",
    "selectCards": "Select cards to compare",
    "addCard": "Add Card",
    "removeCard": "Remove",
    "maxCards": "Compare up to {{count}} cards",
    "upgradeFor3": "Upgrade to compare 3 cards",
    "categories": {
      "groceries": "Groceries",
      "dining": "Dining",
      "gas": "Gas",
      "travel": "Travel",
      "online_shopping": "Online Shopping",
      "entertainment": "Entertainment",
      "drugstores": "Pharmacy",
      "home_improvement": "Home Improvement",
      "other": "Everything Else",
      "annual_fee": "Annual Fee",
      "signup_bonus": "Sign-Up Bonus",
      "benefits_count": "Benefits"
    },
    "winner": "Winner",
    "overallScore": "Overall Score",
    "noFee": "No fee",
    "noBenefits": "None"
  }
}
```

---

### F4: Spending Log

**Tier:** Free (last 10), Pro+ (unlimited)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/SpendingLogScreen.tsx` | Transaction history with filters |
| `src/services/SpendingLogService.ts` | CRUD, calculations, filtering |
| `src/components/SpendingEntry.tsx` | Single transaction row |
| `src/components/AddSpendingModal.tsx` | Quick-add transaction form |
| `src/components/SpendingFAB.tsx` | Floating action button for HomeScreen |
| `src/components/SpendingFilters.tsx` | Filter bar (card, category, date) |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `SpendingLog` to InsightsStack |
| `src/screens/HomeScreen.tsx` | Add `SpendingFAB` |
| `src/screens/index.ts` | Export screen |
| `src/types/index.ts` | Add `SpendingEntry` type |
| `src/i18n/locales/en.json` | Add spending log keys |

#### Service Layer

```typescript
// src/services/SpendingLogService.ts

export interface SpendingEntry {
  id: string;
  userId: string;
  amount: number;
  category: SpendingCategory;
  storeName?: string;
  cardUsed: string; // cardId
  optimalCard?: string;
  rewardsEarned: number;
  rewardsMissed: number;
  transactionDate: Date;
  notes?: string;
}

export interface SpendingFilter {
  cardId?: string;
  category?: SpendingCategory;
  startDate?: Date;
  endDate?: Date;
}

export interface SpendingSummary {
  totalSpend: number;
  totalRewardsEarned: number;
  totalRewardsMissed: number;
  transactionCount: number;
}

// Functions
export async function initializeSpendingLog(): Promise<void>;
export async function getSpendingEntries(filter?: SpendingFilter, limit?: number): Promise<SpendingEntry[]>;
export async function addSpendingEntry(entry: Omit<SpendingEntry, 'id' | 'userId' | 'optimalCard' | 'rewardsEarned' | 'rewardsMissed'>): Promise<SpendingEntry>;
export async function updateSpendingEntry(id: string, updates: Partial<SpendingEntry>): Promise<SpendingEntry>;
export async function deleteSpendingEntry(id: string): Promise<void>;
export function calculateOptimalCard(amount: number, category: SpendingCategory): string;
export function calculateRewards(amount: number, cardId: string, category: SpendingCategory): number;
export async function getSpendingSummary(filter?: SpendingFilter): Promise<SpendingSummary>;
export function getEntryLimitForTier(tier: SubscriptionTier): number; // 10 for free, Infinity for pro+
```

#### Component Hierarchy

```
SpendingLogScreen
├── Header
├── SpendingFilters (collapsible)
│   ├── CardPicker
│   ├── CategoryPicker
│   └── DateRangePicker
├── SummaryCard (total spend, earned, missed)
├── FlatList
│   └── SpendingEntry[]
│       ├── DateHeader (grouped by date)
│       ├── StoreIcon
│       ├── AmountColumn
│       ├── CardUsedBadge
│       ├── RewardsColumn (earned/missed)
│       └── SwipeActions (edit, delete)
├── LimitBanner (if free user at 10)
└── AddSpendingModal

SpendingFAB (HomeScreen)
└── TouchableOpacity → opens AddSpendingModal
```

**Props & State:**
```typescript
// SpendingLogScreen
// State: entries, filter, isLoading, showAddModal, summary

// SpendingEntry
interface SpendingEntryProps {
  entry: SpendingEntry;
  onEdit: () => void;
  onDelete: () => void;
}

// AddSpendingModal
interface AddSpendingModalProps {
  visible: boolean;
  editingEntry?: SpendingEntry;
  subTrackingId?: string; // If adding spend to SUB
  onClose: () => void;
  onSave: (entry: SpendingFormData) => void;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
SpendingLog: { filter?: SpendingFilter };

// SpendingFAB on HomeScreen opens modal directly (no navigation)
// Tap on "View All" navigates to full screen
```

#### Tier Gating

| Tier | Entry Limit |
|------|-------------|
| Free | Last 10 entries (older auto-hidden) |
| Pro | Unlimited |
| Max | Unlimited |

Show upgrade banner when free user has 10+ entries.

#### i18n Keys

```json
{
  "spendingLog": {
    "title": "Spending Log",
    "subtitle": "Track your purchases and rewards",
    "addEntry": "Log Purchase",
    "editEntry": "Edit Purchase",
    "deleteEntry": "Delete",
    "deleteConfirm": "Delete this transaction?",
    "form": {
      "amount": "Amount",
      "store": "Store (optional)",
      "category": "Category",
      "card": "Card Used",
      "date": "Date",
      "notes": "Notes (optional)"
    },
    "summary": {
      "totalSpend": "Total Spent",
      "earned": "Rewards Earned",
      "missed": "Rewards Missed"
    },
    "optimal": "Optimal: {{card}}",
    "earnedLabel": "+{{amount}}",
    "missedLabel": "-{{amount}} missed",
    "filters": {
      "allCards": "All Cards",
      "allCategories": "All Categories",
      "dateRange": "Date Range"
    },
    "limitReached": {
      "title": "Free Limit Reached",
      "message": "Upgrade to Pro for unlimited history",
      "cta": "Upgrade"
    },
    "empty": {
      "title": "No Transactions Yet",
      "description": "Log your first purchase to start tracking rewards",
      "cta": "Log Purchase"
    }
  }
}
```

---

### F5: Recurring Subscriptions Optimizer

**Tier:** Pro+

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/RecurringScreen.tsx` | List of recurring charges with optimization |
| `src/services/RecurringService.ts` | CRUD, optimization calculations |
| `src/components/RecurringChargeCard.tsx` | Individual subscription display |
| `src/components/AddRecurringModal.tsx` | Add/edit recurring charge |
| `src/components/OptimizationSummary.tsx` | Total monthly savings banner |
| `src/data/commonSubscriptions.ts` | Pre-populated list (Netflix, Spotify, etc.) |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `Recurring` to InsightsStack |
| `src/screens/index.ts` | Export screen |
| `src/types/index.ts` | Add `RecurringCharge` type |
| `src/i18n/locales/en.json` | Add recurring keys |

#### Service Layer

```typescript
// src/services/RecurringService.ts

export interface RecurringCharge {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: SpendingCategory;
  billingDay?: number;
  currentCard?: string;
  optimalCard?: string;
  currentRewards: number;
  optimalRewards: number;
  monthlySavings: number;
  isActive: boolean;
}

export interface RecurringSummary {
  totalMonthlyCharges: number;
  totalCurrentRewards: number;
  totalOptimalRewards: number;
  totalMonthlySavings: number;
  optimizedCount: number; // charges not on optimal card
}

// Functions
export async function initializeRecurring(): Promise<void>;
export async function getRecurringCharges(): Promise<RecurringCharge[]>;
export async function addRecurringCharge(charge: Omit<RecurringCharge, 'id' | 'userId' | 'optimalCard' | 'currentRewards' | 'optimalRewards' | 'monthlySavings'>): Promise<RecurringCharge>;
export async function updateRecurringCharge(id: string, updates: Partial<RecurringCharge>): Promise<RecurringCharge>;
export async function deleteRecurringCharge(id: string): Promise<void>;
export async function recalculateOptimizations(): Promise<void>;
export function getRecurringSummary(charges: RecurringCharge[]): RecurringSummary;
export function getCommonSubscriptions(): { name: string; amount: number; category: SpendingCategory }[];
```

#### Component Hierarchy

```
RecurringScreen (wrapped in LockedFeature for free)
├── OptimizationSummary
│   ├── TotalCharges
│   ├── CurrentRewards
│   ├── PotentialRewards
│   └── MonthlySavings (highlighted)
├── SectionHeader ("Needs Optimization" - charges not on optimal)
├── RecurringChargeCard[]
│   ├── Name/Amount
│   ├── CurrentCard (red if not optimal)
│   ├── OptimalCard (green)
│   └── SavingsAmount
├── SectionHeader ("Already Optimized")
├── RecurringChargeCard[]
├── FAB (Add)
├── AddRecurringModal
│   ├── QuickAdd (common subscriptions)
│   └── CustomForm
```

**Props & State:**
```typescript
// RecurringScreen
// State: charges, isLoading, showAddModal, summary

// RecurringChargeCard
interface RecurringChargeCardProps {
  charge: RecurringCharge;
  onEdit: () => void;
  onDelete: () => void;
  onMarkSwitched: () => void; // Update currentCard to optimalCard
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
Recurring: undefined;

// Access from InsightsHome action cards
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature full screen |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "recurring": {
    "title": "Recurring Charges",
    "subtitle": "Optimize your subscriptions",
    "addCharge": "Add Subscription",
    "editCharge": "Edit",
    "deleteCharge": "Remove",
    "summary": {
      "totalCharges": "Monthly Total",
      "currentRewards": "Current Rewards",
      "potentialRewards": "Potential Rewards",
      "monthlySavings": "Monthly Savings",
      "yearlySavings": "That's {{amount}}/year!"
    },
    "sections": {
      "needsOptimization": "Needs Optimization",
      "optimized": "Already Optimized"
    },
    "card": {
      "current": "Current",
      "optimal": "Use",
      "savings": "+{{amount}}/mo"
    },
    "form": {
      "name": "Subscription Name",
      "amount": "Monthly Amount",
      "category": "Category",
      "currentCard": "Current Card",
      "billingDay": "Billing Day"
    },
    "quickAdd": {
      "title": "Quick Add",
      "popular": "Popular Subscriptions"
    },
    "markSwitched": "I switched to this card",
    "empty": {
      "title": "No Recurring Charges",
      "description": "Add your subscriptions to see which cards earn the most",
      "cta": "Add Subscription"
    }
  }
}
```

---

### F6: Annual Fee Tracker

**Tier:** Pro+

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/AnnualFeeScreen.tsx` | Fee overview dashboard |
| `src/services/AnnualFeeService.ts` | Fee calculations, worth-keeping logic |
| `src/components/FeeCard.tsx` | Individual card fee display |
| `src/components/WorthBadge.tsx` | Green/yellow/red badge component |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `AnnualFee` to InsightsStack |
| `src/screens/MyCardsScreen.tsx` | Show fee summary in header |
| `src/services/NotificationService.ts` | Add fee renewal alerts |
| `src/types/index.ts` | Add fee-related types |
| `src/i18n/locales/en.json` | Add fee keys |

#### Service Layer

```typescript
// src/services/AnnualFeeService.ts

export interface CardFeeAnalysis {
  cardId: string;
  annualFee: number;
  renewalDate: Date | null; // null if unknown
  daysUntilRenewal: number | null;
  estimatedRewardsEarned: number; // from spending log
  netValue: number; // rewards - fee
  worthKeeping: 'yes' | 'maybe' | 'no';
  worthReason: string;
}

export interface FeeSummary {
  totalAnnualFees: number;
  totalRewardsEarned: number;
  netValue: number;
  cardsWorthKeeping: number;
  cardsToReview: number;
  upcomingRenewals: CardFeeAnalysis[]; // next 30 days
}

// Functions
export async function analyzeCardFees(): Promise<CardFeeAnalysis[]>;
export async function getFeeSummary(): Promise<FeeSummary>;
export function calculateWorthKeeping(fee: number, rewardsEarned: number, benefits: number): 'yes' | 'maybe' | 'no';
export async function setCardOpenDate(cardId: string, openDate: Date): Promise<void>;
export async function scheduleRenewalAlert(cardId: string, renewalDate: Date): Promise<void>;
export function getUpcomingRenewals(days: number): CardFeeAnalysis[];
```

#### Component Hierarchy

```
AnnualFeeScreen (wrapped in LockedFeature)
├── FeeSummaryCard
│   ├── TotalFees
│   ├── RewardsEarned
│   ├── NetValue (+/-)
│   └── CardCounts (worth keeping vs review)
├── SectionHeader ("Upcoming Renewals" if any)
├── FeeCard[] (upcoming, sorted by date)
├── SectionHeader ("All Cards with Fees")
├── FeeCard[]
│   ├── CardInfo
│   ├── FeeAmount
│   ├── RenewalDate
│   ├── RewardsEarned
│   ├── NetValue
│   ├── WorthBadge
│   └── EditButton (set open date)
└── SetOpenDateModal
```

**Props & State:**
```typescript
// FeeCard
interface FeeCardProps {
  analysis: CardFeeAnalysis;
  card: Card;
  onSetOpenDate: () => void;
}

// WorthBadge
interface WorthBadgeProps {
  worth: 'yes' | 'maybe' | 'no';
  reason?: string;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
AnnualFee: undefined;

// Access from InsightsHome or MyCardsScreen header
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "annualFee": {
    "title": "Annual Fees",
    "subtitle": "Are your cards worth keeping?",
    "summary": {
      "totalFees": "Total Annual Fees",
      "rewardsEarned": "Est. Rewards Earned",
      "netValue": "Net Value",
      "worthKeeping": "{{count}} worth keeping",
      "needsReview": "{{count}} to review"
    },
    "upcomingRenewals": "Upcoming Renewals",
    "allCardsWithFees": "All Cards with Fees",
    "card": {
      "fee": "{{amount}}/year",
      "renewsIn": "Renews in {{days}} days",
      "renewsOn": "Renews {{date}}",
      "renewalUnknown": "Set renewal date",
      "earned": "~{{amount}} earned",
      "netValue": "Net: {{amount}}",
      "setOpenDate": "Set Card Open Date"
    },
    "worth": {
      "yes": "Worth Keeping",
      "maybe": "Review Needed",
      "no": "Consider Canceling",
      "reasonPositive": "Rewards exceed fee",
      "reasonBreakeven": "Close to break-even",
      "reasonNegative": "Fee exceeds rewards"
    },
    "noFeeCards": "No cards with annual fees",
    "renewalAlert": "{{card}} renewal in {{days}} days"
  }
}
```

---

### F7: Redemption Guide

**Tier:** Max

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/RedemptionGuideScreen.tsx` | Full redemption options for a program |
| `src/services/RedemptionService.ts` | Fetch transfer partners, calculate CPP |
| `src/components/RedemptionOption.tsx` | Single redemption method card |
| `src/components/TransferPartnerCard.tsx` | Airline/hotel partner display |
| `src/components/SweetSpotCard.tsx` | Notable redemption highlight |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `RedemptionGuide` to InsightsStack |
| `src/screens/index.ts` | Export screen |
| `src/types/index.ts` | Add `TransferPartner` type |
| `src/i18n/locales/en.json` | Add redemption keys |

#### Service Layer

```typescript
// src/services/RedemptionService.ts

export interface TransferPartner {
  id: string;
  programId: string;
  partnerName: string;
  partnerType: 'airline' | 'hotel';
  transferRatio: number; // 1.0 = 1:1
  transferTime: string;
  sweetSpots: string[];
  isActive: boolean;
}

export interface RedemptionMethod {
  type: string; // 'transfer', 'portal', 'statement_credit', 'gift_card'
  centsPerPoint: number;
  minimumRedemption: number | null;
  notes: string | null;
}

export interface ProgramRedemption {
  programName: string;
  programCategory: string;
  directRateCents: number;
  optimalRateCents: number;
  optimalMethod: string;
  redemptionOptions: RedemptionMethod[];
  transferPartners: TransferPartner[];
}

// Functions
export async function getRedemptionGuide(programId: string): Promise<ProgramRedemption>;
export async function getTransferPartners(programId: string): Promise<TransferPartner[]>;
export function formatCPP(centsPerPoint: number): string; // "2.1¢/pt"
export function getRatingForCPP(cpp: number): 'excellent' | 'good' | 'fair' | 'poor';
```

#### Component Hierarchy

```
RedemptionGuideScreen (wrapped in LockedFeature for non-Max)
├── Header (Program name, optimal CPP)
├── CPPOverview
│   ├── DirectRate
│   ├── OptimalRate
│   └── OptimalMethod
├── SectionHeader ("Transfer Partners")
├── TransferPartnerCard[]
│   ├── PartnerLogo
│   ├── Name/Type
│   ├── TransferRatio
│   ├── TransferTime
│   └── SweetSpots (expandable)
├── SectionHeader ("Other Redemptions")
├── RedemptionOption[]
│   ├── Type (Portal, Statement Credit, Gift Cards)
│   ├── CPP
│   └── Notes
```

**Props & State:**
```typescript
// RedemptionGuideScreen
interface Props {
  route: { params: { programId: string; cardId?: string } };
}
// State: redemption: ProgramRedemption, isLoading

// TransferPartnerCard
interface TransferPartnerCardProps {
  partner: TransferPartner;
  expanded: boolean;
  onToggle: () => void;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
RedemptionGuide: { programId: string; cardId?: string };

// Access from card detail or InsightsHome
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | LockedFeature |
| Max | Full access |

#### i18n Keys

```json
{
  "redemption": {
    "title": "Redemption Guide",
    "subtitle": "Maximize your point value",
    "cppLabel": "Cents per Point",
    "directRate": "Direct Redemption",
    "optimalRate": "Optimal Value",
    "optimalMethod": "Best Method",
    "transferPartners": "Transfer Partners",
    "otherRedemptions": "Other Redemptions",
    "partner": {
      "ratio": "{{ratio}}:1",
      "instant": "Instant",
      "time": "{{time}} transfer",
      "sweetSpots": "Sweet Spots",
      "viewSweetSpots": "View deals"
    },
    "options": {
      "portal": "Travel Portal",
      "statement": "Statement Credit",
      "giftCard": "Gift Cards",
      "merchandise": "Merchandise"
    },
    "rating": {
      "excellent": "Excellent",
      "good": "Good",
      "fair": "Fair",
      "poor": "Poor"
    }
  }
}
```

---

### F8: Card Recommendation Engine

**Tier:** Pro+ (basic), Max (with affiliate links)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/CardRecommendationsScreen.tsx` | Personalized card suggestions |
| `src/services/RecommendationEngine.ts` | Analysis & recommendation logic |
| `src/components/RecommendationCard.tsx` | Single recommendation display |
| `src/components/RecommendationReason.tsx` | Why this card component |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `CardRecommendations` to InsightsStack |
| `src/screens/index.ts` | Export screen |
| `src/i18n/locales/en.json` | Add recommendation keys |

#### Service Layer

```typescript
// src/services/RecommendationEngine.ts

export interface CardRecommendation {
  card: Card;
  reason: string;
  basedOn: 'spending' | 'gap' | 'upgrade' | 'signup_bonus';
  estimatedAnnualRewards: number;
  categoryMatch: SpendingCategory[]; // Which of user's top categories this covers
  signupBonus?: SignupBonus;
  affiliateUrl?: string; // Max tier only
  priority: number; // 1-5, higher = more relevant
}

export interface RecommendationAnalysis {
  recommendations: CardRecommendation[];
  userTopCategories: { category: SpendingCategory; monthlySpend: number }[];
  currentGaps: SpendingCategory[]; // Categories with suboptimal cards
  totalPotentialGain: number;
}

// Functions
export async function analyzeAndRecommend(): Promise<RecommendationAnalysis>;
export function getTopSpendingCategories(limit: number): { category: SpendingCategory; monthlySpend: number }[];
export function findCategoryGaps(): SpendingCategory[];
export function rankRecommendations(cards: Card[], userProfile: any): CardRecommendation[];
export function getAffiliateUrl(cardId: string, tier: SubscriptionTier): string | undefined;
```

#### Component Hierarchy

```
CardRecommendationsScreen (LockedFeature for free)
├── Header
├── AnalysisSummary
│   ├── TopCategories (mini chart)
│   ├── GapsFound
│   └── PotentialGain
├── RecommendationCard[] (sorted by priority)
│   ├── CardHeader (name, issuer)
│   ├── MatchBadges (category icons)
│   ├── RecommendationReason
│   ├── EstimatedRewards
│   ├── SignupBonusHighlight (if applicable)
│   └── ApplyButton (Max: affiliate link, Pro: external link)
├── RefreshButton
└── Disclaimer
```

**Props & State:**
```typescript
// CardRecommendationsScreen
// State: analysis, isLoading, isRefreshing

// RecommendationCard
interface RecommendationCardProps {
  recommendation: CardRecommendation;
  showAffiliateLink: boolean; // Max only
  onApply: (url?: string) => void;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
CardRecommendations: undefined;

// Access from InsightsHome
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | Basic recommendations (no affiliate links) |
| Max | Full with affiliate links |

#### i18n Keys

```json
{
  "recommendations": {
    "title": "Card Recommendations",
    "subtitle": "Cards that match your spending",
    "analysis": {
      "topCategories": "Your Top Categories",
      "gapsFound": "{{count}} categories could be optimized",
      "potentialGain": "+{{amount}}/year potential"
    },
    "card": {
      "reason": "Why this card?",
      "basedOn": {
        "spending": "Based on your spending",
        "gap": "Fills a gap in your wallet",
        "upgrade": "Upgrade from your current card",
        "signup_bonus": "Great sign-up bonus"
      },
      "estimatedRewards": "~{{amount}}/year",
      "signupBonus": "{{amount}} bonus",
      "apply": "Learn More",
      "applyAffiliate": "Apply Now"
    },
    "refresh": "Refresh Recommendations",
    "disclaimer": "Card details may change. Verify terms before applying.",
    "empty": {
      "title": "Need More Data",
      "description": "Log some purchases to get personalized recommendations"
    }
  }
}
```

---

### F9: Notifications Center

**Tier:** Free (basic), Pro+ (all types)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/NotificationsScreen.tsx` | Notification list/inbox |
| `src/services/NotificationService.ts` | CRUD, generate notifications |
| `src/components/NotificationItem.tsx` | Single notification row |
| `src/components/NotificationBell.tsx` | Header bell icon with badge |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `Notifications` to RootStack (modal) |
| `src/screens/HomeScreen.tsx` | Add NotificationBell to header |
| `src/screens/index.ts` | Export screen |
| `src/types/index.ts` | Add `Notification` type |
| `src/i18n/locales/en.json` | Add notification keys |

#### Service Layer

```typescript
// src/services/NotificationService.ts

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

// Functions
export async function initializeNotifications(): Promise<void>;
export async function getNotifications(limit?: number): Promise<AppNotification[]>;
export async function getUnreadCount(): Promise<number>;
export async function markAsRead(id: string): Promise<void>;
export async function markAllAsRead(): Promise<void>;
export async function deleteNotification(id: string): Promise<void>;
export async function createNotification(notification: Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>): Promise<AppNotification>;

// Notification generators (called by other services)
export async function generateSUBDeadlineAlert(sub: SUBTracking): Promise<void>;
export async function generateFeeRenewalAlert(cardId: string, daysUntil: number): Promise<void>;
export async function generateMonthlyReportNotification(reportId: string): Promise<void>;

// Type gating
export function getNotificationTypesForTier(tier: SubscriptionTier): NotificationType[];
```

#### Component Hierarchy

```
NotificationsScreen (modal presentation)
├── Header
│   ├── Title
│   ├── MarkAllReadButton
│   └── CloseButton
├── FilterTabs (All, Unread)
├── FlatList
│   └── NotificationItem[]
│       ├── TypeIcon
│       ├── Title/Message
│       ├── TimeAgo
│       ├── UnreadDot
│       └── SwipeToDelete
└── EmptyState (if no notifications)

NotificationBell (header component)
├── BellIcon
└── BadgeCount (if unread > 0)
```

**Props & State:**
```typescript
// NotificationsScreen
// State: notifications, filter, isLoading

// NotificationItem
interface NotificationItemProps {
  notification: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}

// NotificationBell
interface NotificationBellProps {
  onPress: () => void;
}
// Uses context/service to get unread count
```

#### Navigation Wiring

```typescript
// RootStackParamList
Notifications: undefined;

// NotificationBell in header navigates to modal:
navigation.navigate('Notifications');

// NotificationItem tap navigates based on actionUrl:
if (notification.actionUrl) {
  navigation.navigate(notification.actionUrl, notification.actionData);
}
```

#### Tier Gating

| Tier | Notification Types |
|------|---------------------|
| Free | `sub_deadline`, `fee_renewal` only |
| Pro | All types |
| Max | All types |

Filter notifications by tier in service layer.

#### i18n Keys

```json
{
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all read",
    "filters": {
      "all": "All",
      "unread": "Unread"
    },
    "types": {
      "sub_deadline": "Bonus Deadline",
      "fee_renewal": "Fee Renewal",
      "bonus_category": "Bonus Category",
      "monthly_report": "Monthly Report",
      "new_card_offer": "New Offer",
      "spending_alert": "Spending Alert",
      "general": "Update"
    },
    "timeAgo": {
      "now": "Just now",
      "minutes": "{{count}}m ago",
      "hours": "{{count}}h ago",
      "days": "{{count}}d ago"
    },
    "delete": "Delete",
    "empty": {
      "title": "No Notifications",
      "description": "You're all caught up!"
    }
  }
}
```

---

### F10: Monthly Savings Report

**Tier:** Pro+

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/SavingsReportScreen.tsx` | View monthly report |
| `src/services/SavingsReportService.ts` | Generate & fetch reports |
| `src/components/ReportCard.tsx` | Visual report card (shareable) |
| `src/components/CategoryBreakdown.tsx` | Pie/bar chart of categories |
| `src/components/ShareReportButton.tsx` | Generate & share image |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `SavingsReport` to InsightsStack |
| `src/screens/index.ts` | Export screen |
| `src/types/index.ts` | Add `SavingsReport` type |
| `src/i18n/locales/en.json` | Add report keys |

#### Service Layer

```typescript
// src/services/SavingsReportService.ts

export interface SavingsReport {
  id: string;
  userId: string;
  reportMonth: Date;
  totalSpend: number;
  totalRewardsEarned: number;
  totalRewardsMissed: number;
  bestCard: string; // cardId
  bestCardEarnings: number;
  worstCard: string;
  worstCardEarnings: number;
  categoryBreakdown: CategoryReportItem[];
  optimizationScore: number; // 0-100
  generatedAt: Date;
}

export interface CategoryReportItem {
  category: SpendingCategory;
  spend: number;
  earned: number;
  missed: number;
}

// Functions
export async function getCurrentMonthReport(): Promise<SavingsReport | null>;
export async function getReportHistory(months: number): Promise<SavingsReport[]>;
export async function generateReport(month: Date): Promise<SavingsReport>;
export async function generateShareableImage(report: SavingsReport): Promise<string>; // Returns base64 or URI
export function formatMonthYear(date: Date): string;
```

#### Component Hierarchy

```
SavingsReportScreen (LockedFeature for free)
├── MonthSelector (horizontal scroll of months)
├── ReportCard (the shareable visual)
│   ├── Header (Month, Year)
│   ├── MainStats
│   │   ├── TotalRewardsEarned (big number)
│   │   ├── RewardsMissed
│   │   └── OptimizationScore (circular progress)
│   ├── TopCards
│   │   ├── BestCard
│   │   └── WorstCard
│   └── MiniChart (category breakdown)
├── CategoryBreakdown (detailed)
│   └── CategoryRow[]
├── ShareReportButton
└── HistoricalChart (6 months trend)
```

**Props & State:**
```typescript
// SavingsReportScreen
// State: selectedMonth, report, reports (history), isLoading

// ReportCard
interface ReportCardProps {
  report: SavingsReport;
  ref?: React.Ref<View>; // For screenshot capture
}

// ShareReportButton
interface ShareReportButtonProps {
  report: SavingsReport;
  onShare: (imageUri: string) => void;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
SavingsReport: { month?: string }; // YYYY-MM format

// Access from:
// 1. InsightsHome
// 2. Notification tap (monthly_report type)
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "savingsReport": {
    "title": "Monthly Report",
    "subtitle": "Your rewards summary",
    "selectMonth": "Select Month",
    "stats": {
      "earned": "Rewards Earned",
      "missed": "Missed",
      "score": "Optimization Score"
    },
    "cards": {
      "best": "Best Performer",
      "worst": "Needs Improvement"
    },
    "breakdown": {
      "title": "Category Breakdown",
      "spend": "Spent",
      "earned": "Earned",
      "missed": "Missed"
    },
    "share": {
      "button": "Share Report",
      "title": "My {{month}} Rewards Report",
      "caption": "I earned {{amount}} in rewards this month! 💳"
    },
    "trend": {
      "title": "6-Month Trend",
      "improving": "You're improving!",
      "declining": "Let's optimize more"
    },
    "noData": {
      "title": "No Data Yet",
      "description": "Log purchases to generate your first report"
    }
  }
}
```

---

## Implementation Order

Implement in this exact order (respects dependencies):

| # | Feature | Est. Days | Dependencies | Notes |
|---|---------|-----------|--------------|-------|
| 1 | **F9: Notifications Center** | 2 | None | Infrastructure for other features |
| 2 | **F1: Card Benefits** | 1.5 | None | Pure data, easy win |
| 3 | **F2: SUB Tracker** | 3 | F9 (alerts) | Hook feature, high value |
| 4 | **F3: Card Comparison** | 2 | None | Uses existing data |
| 5 | **F4: Spending Log** | 3 | None | Foundation for F5, F8, F10 |
| 6 | **F5: Recurring Optimizer** | 2 | F4 (patterns) | Uses spending data |
| 7 | **F6: Annual Fee Tracker** | 2 | F4, F9 | Uses spending + notifications |
| 8 | **F7: Redemption Guide** | 2 | DB seed data | Max-only, lower priority |
| 9 | **F8: Card Recommendations** | 3 | F4 | Depends on spending log |
| 10 | **F10: Monthly Report** | 2.5 | F4 | Aggregates spending log |

**Total Estimate:** ~23 dev days

### Detailed Task Breakdown

```
Week 1:
├── Day 1-2: F9 NotificationService + NotificationsScreen + NotificationBell
├── Day 3: F1 BenefitsService + CardBenefitsScreen
├── Day 4: F1 finish + F2 start (SUBTrackingService)
├── Day 5: F2 SUBTrackerScreen + SUBWidget

Week 2:
├── Day 6: F2 finish (AddSUBModal, alerts)
├── Day 7: F3 CardComparisonService + CardCompareScreen
├── Day 8: F3 finish + F4 start (SpendingLogService)
├── Day 9: F4 SpendingLogScreen + AddSpendingModal
├── Day 10: F4 finish (filters, FAB, integration)

Week 3:
├── Day 11: F5 RecurringService + RecurringScreen
├── Day 12: F5 finish (optimization, common subs)
├── Day 13: F6 AnnualFeeService + AnnualFeeScreen
├── Day 14: F6 finish (alerts, worth calculations)
├── Day 15: F7 RedemptionService + RedemptionGuideScreen

Week 4:
├── Day 16: F7 finish (transfer partners, sweet spots)
├── Day 17-18: F8 RecommendationEngine + CardRecommendationsScreen
├── Day 19: F8 finish (affiliate links for Max)
├── Day 20-21: F10 SavingsReportService + SavingsReportScreen
├── Day 22: F10 finish (share image, history)
├── Day 23: Integration testing, bug fixes
```

---

## Test Plan

### Per-Feature Testing

#### F1: Card Benefits
- [ ] Benefits display correctly for Pro+ users
- [ ] Free users see only 2 benefits + lock overlay
- [ ] LockedFeature shows upgrade CTA
- [ ] Benefits grouped by category correctly
- [ ] Empty state for cards without benefits

#### F2: SUB Tracker
- [ ] Add new SUB tracking entry
- [ ] Edit existing SUB
- [ ] Delete SUB tracking
- [ ] Progress bar animates correctly
- [ ] Days remaining calculates correctly
- [ ] "Add Spending" updates currentAmount
- [ ] SUBWidget shows on HomeScreen
- [ ] Urgent SUBs (< 7 days) highlighted
- [ ] Completed SUBs move to completed section
- [ ] Alerts generated for deadlines (F9)

#### F3: Card Comparison
- [ ] Select 2 cards (free tier)
- [ ] Select 3 cards (pro+ tier)
- [ ] Free user blocked at 3rd card
- [ ] Comparison rows highlight winner (green)
- [ ] Overall scores calculate correctly
- [ ] Annual fee, SUB, benefits count display

#### F4: Spending Log
- [ ] Add transaction via FAB
- [ ] Edit existing transaction
- [ ] Delete transaction (swipe)
- [ ] Optimal card calculated correctly
- [ ] Rewards earned/missed calculated
- [ ] Filter by card, category, date
- [ ] Free tier limited to 10 entries
- [ ] Summary totals correct
- [ ] Date grouping works

#### F5: Recurring Optimizer
- [ ] Add recurring charge
- [ ] Edit recurring charge
- [ ] Delete recurring charge
- [ ] Quick-add common subscriptions
- [ ] Optimal card recommendation correct
- [ ] Monthly savings calculated
- [ ] "Mark as switched" updates currentCard
- [ ] Pro+ gating works

#### F6: Annual Fee Tracker
- [ ] Cards with fees displayed
- [ ] Worth-keeping badge logic correct
- [ ] Set card open date
- [ ] Renewal date calculated from open date
- [ ] Days until renewal correct
- [ ] Upcoming renewals section works
- [ ] Fee renewal alerts generated (F9)
- [ ] Net value calculation correct

#### F7: Redemption Guide
- [ ] Transfer partners load from DB
- [ ] CPP displayed correctly
- [ ] Sweet spots expand/collapse
- [ ] Other redemption options display
- [ ] Max-only gating works

#### F8: Card Recommendations
- [ ] Top spending categories analyzed
- [ ] Recommendations generated
- [ ] Priority sorting correct
- [ ] Affiliate links show for Max
- [ ] External links for Pro
- [ ] Refresh updates recommendations
- [ ] Empty state when no spending data

#### F9: Notifications Center
- [ ] NotificationBell shows unread count
- [ ] Notifications list displays
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Tap navigates to relevant screen
- [ ] Free tier only sees sub_deadline, fee_renewal
- [ ] Pro+ sees all types

#### F10: Monthly Savings Report
- [ ] Report generates from spending log
- [ ] Month selector works
- [ ] Stats display correctly
- [ ] Best/worst card identified
- [ ] Category breakdown chart renders
- [ ] Share button generates image
- [ ] Historical reports accessible
- [ ] Pro+ gating works

### Integration Tests

- [ ] SUB tracking + Spending log integration (adding spend to SUB)
- [ ] Notifications trigger from SUB deadlines
- [ ] Notifications trigger from fee renewals
- [ ] Spending log → Monthly report generation
- [ ] Spending log → Recommendation engine
- [ ] Tier changes update feature access immediately

### Edge Cases

- [ ] User with no cards in portfolio
- [ ] User with no spending log entries
- [ ] Card not found (switched country)
- [ ] Network failure handling
- [ ] Empty states for all features
- [ ] Very long card names truncate properly
- [ ] Large numbers format correctly

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Spending log performance with large datasets** | Slow UI, bad UX | Pagination, virtual lists, limit queries |
| **Benefits data not seeded in DB** | Empty feature | Prepare migration to seed benefits JSON for all cards |
| **Affiliate URL policy/compliance** | Legal issues | Legal review of disclosure requirements |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Report image generation on all devices** | Share feature broken | Use react-native-view-shot, test on low-end devices |
| **Notification badge not updating** | Missed notifications | Use React context or Zustand for global state |
| **Recurring charges category detection** | Wrong optimal card | Allow manual category override |
| **Transfer partner data staleness** | Incorrect redemption advice | Regular DB updates, show "last updated" date |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **i18n key mismatches** | Broken strings | CI check for missing keys |
| **Style inconsistencies** | Polish issues | Design review before merge |
| **Navigation edge cases** | Rare crashes | Deep link testing |

---

## Summary

This architecture document provides:

1. **Single migration file** (`016_cycle1_features.sql`) with all DB changes
2. **10 complete feature architectures** with files, services, components, and navigation
3. **Clear implementation order** respecting dependencies (~23 dev days)
4. **Comprehensive test plan** per feature + integration
5. **Risk assessment** with mitigations

A Sonnet-level developer can implement any feature without guessing by following this document.

---

*Document generated by VP of Engineering, February 13, 2026*
