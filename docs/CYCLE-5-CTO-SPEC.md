# Cycle 5 — CTO Specification
## Achievements & 5/24 Tracker (Quick Wins)
**Author:** Gandalf (CTO) | **Date:** Feb 14, 2026 | **Status:** Ready for VP Eng

---

## Overview
Two high-value, moderate-complexity features from the Cycle 2 backlog. These add gamification (stickiness) and credit strategy intelligence (differentiation). Both are self-contained with minimal external dependencies.

---

## F15: Achievements & Gamification System

### Problem
Users open the app, check their cards, then leave. No reason to come back. Achievements create dopamine loops — small wins that keep users engaged and progressing through the app's features.

### User Stories
- **US-15.1:** As a user, I want to earn achievements for using app features so I feel rewarded
- **US-15.2:** As a user, I want to see my progress toward incomplete achievements so I'm motivated to continue
- **US-15.3:** As a user, I want to see all my earned achievements in a trophy case
- **US-15.4:** As a user, I want to receive a notification/animation when I unlock an achievement
- **US-15.5:** As a user, I want to see my "level" or "rank" based on achievements earned

### Achievement Categories

#### Getting Started (Onboarding)
| ID | Name | Description | Trigger |
|----|------|-------------|---------|
| GS1 | First Card | Add your first credit card | addCard() called |
| GS2 | Card Collector | Add 3 credit cards | portfolio.length >= 3 |
| GS3 | Full Deck | Add 5 credit cards | portfolio.length >= 5 |
| GS4 | Profile Set | Complete your spending profile | spendingProfile saved |
| GS5 | Sage Seeker | Ask Sage AI your first question | sageChat count >= 1 |

#### Optimization
| ID | Name | Description | Trigger |
|----|------|-------------|---------|
| OP1 | Optimizer | Run the Wallet Optimizer | walletOptimizer used |
| OP2 | Fee Slayer | Check a fee breakeven analysis | feeBreakeven viewed |
| OP3 | Bonus Hunter | Check a signup bonus ROI | signupROI viewed |
| OP4 | Gap Finder | Discover a category gap in your portfolio | gaps.length > 0 found |
| OP5 | Perfect Wallet | Get 90%+ optimization score | optimizationScore >= 90 |

#### Data & Insights
| ID | Name | Description | Trigger |
|----|------|-------------|---------|
| DI1 | Statement Pro | Upload your first bank statement | statementUpload count >= 1 |
| DI2 | Data Driven | Upload 3 months of statements | statementUpload count >= 3 |
| DI3 | Insight Seeker | View the insights dashboard | insightsDashboard viewed |
| DI4 | Money Saver | Discover $100+ left on the table | moneyLeftOnTable >= 100 |
| DI5 | Trend Watcher | View spending trends | trends viewed |

#### Engagement
| ID | Name | Description | Trigger |
|----|------|-------------|---------|
| EN1 | Daily Visitor | Open the app 7 days in a row | streak >= 7 |
| EN2 | Power User | Open the app 30 days in a row | streak >= 30 |
| EN3 | Comparer | Compare 2 cards side by side | cardCompare used |
| EN4 | Explorer | Visit every main screen | allScreensVisited |
| EN5 | Card Scholar | View benefits of 10 different cards | cardBenefitsViewed >= 10 |

#### Mastery
| ID | Name | Description | Trigger |
|----|------|-------------|---------|
| MA1 | Rewards Rookie | Earn 5 achievements | totalAchievements >= 5 |
| MA2 | Rewards Pro | Earn 15 achievements | totalAchievements >= 15 |
| MA3 | Rewards Master | Earn all achievements | totalAchievements == total |

### Rank System
| Rank | Achievements Required | Title |
|------|----------------------|-------|
| 1 | 0-2 | Beginner |
| 2 | 3-5 | Card Curious |
| 3 | 6-10 | Rewards Explorer |
| 4 | 11-15 | Optimization Adept |
| 5 | 16-20 | Rewards Expert |
| 6 | 21-23 | Rewards Master |

### Requirements

#### Data Model
```typescript
interface Achievement {
  id: string                    // e.g., "GS1", "OP1"
  name: string
  description: string
  category: 'getting_started' | 'optimization' | 'data_insights' | 'engagement' | 'mastery'
  icon: string                  // Emoji
  unlockedAt?: Date            // null if locked
  progress?: number            // 0-1 for progressive achievements
  progressTarget?: number      // What number they need to hit
}

interface UserAchievements {
  userId: string
  achievements: Record<string, { unlockedAt: Date }>
  currentStreak: number        // Consecutive days
  lastVisitDate: string        // YYYY-MM-DD
  rank: number
  rankTitle: string
  totalUnlocked: number
}
```

#### Achievement Engine
- Check triggers on relevant actions (event-driven, not polling)
- Use an event emitter pattern: `AchievementTracker.track('card_added', { count: 3 })`
- Store locally (AsyncStorage) with optional Supabase sync
- Trigger unlock animation + optional haptic feedback on mobile

#### Tier Gating
- **Free:** All achievements visible, can earn all of them
- Achievements are NOT paywalled — they drive engagement for all users

### UI
- **AchievementsScreen:** Trophy case grid — earned (gold) vs locked (gray) with progress bars
- **Rank badge** on profile/home screen
- **Unlock animation:** Slide-in toast with emoji + achievement name
- **Progress indicators** for multi-step achievements (e.g., "2/5 cards added")

---

## F16: Credit Card 5/24 Tracker

### Problem
Many premium cards (especially Amex) have application rules — some issuers will reject you if you've opened too many cards recently. The "5/24 rule" (Chase) is the most famous, but Canadian issuers have their own quirks. Users need to know their application eligibility before applying.

### User Stories
- **US-16.1:** As a user, I want to see how many cards I've opened in the last 24 months
- **US-16.2:** As a user, I want to know if I'm eligible for specific cards based on application rules
- **US-16.3:** As a user, I want to see a timeline of when old applications will "fall off"
- **US-16.4:** As a user, I want to get alerts when I'm approaching a limit
- **US-16.5:** As a user, I want strategy advice on optimal application timing

### Canadian Issuer Rules
| Issuer | Rule | Details |
|--------|------|---------|
| **Amex Canada** | 1 per 90 days | Can only apply for 1 Amex card every 90 days |
| **Amex Canada** | Welcome bonus | Once per lifetime per card (with some exceptions) |
| **TD** | 1 per 90 days (soft) | Not strict but multiple apps flag review |
| **CIBC** | No hard limit | But multiple apps in short period may trigger review |
| **RBC** | No stated limit | Generally flexible |
| **Scotiabank** | No stated limit | Generally flexible |
| **BMO** | 1 per 90 days (soft) | Similar to TD |
| **Chase (US)** | 5/24 rule | Auto-denied if 5+ cards opened in 24 months |

### Requirements

#### Data Model
```typescript
interface CardApplication {
  id: string
  cardId: string
  cardName: string
  issuer: string
  applicationDate: Date
  status: 'approved' | 'pending' | 'denied'
  fallOffDate: Date            // When this no longer counts (applicationDate + 24 months)
}

interface ApplicationTracker {
  userId: string
  applications: CardApplication[]
  countLast24Months: number
  countByIssuer: Record<string, { count: number; lastDate: Date; nextEligible: Date }>
  eligibility: CardEligibility[]
}

interface CardEligibility {
  cardId: string
  cardName: string
  issuer: string
  isEligible: boolean
  reason?: string              // "Applied for Amex card 45 days ago, wait 45 more days"
  eligibleDate?: Date          // When they'll become eligible
  daysUntilEligible?: number
}
```

#### Tracker Logic
```typescript
// Core calculations (pure functions)
getApplicationCount(apps: CardApplication[], months: number): number
getIssuerCooldown(issuer: string, apps: CardApplication[]): { eligible: boolean; nextDate?: Date }
getCardEligibility(cardId: string, apps: CardApplication[]): CardEligibility
getApplicationTimeline(apps: CardApplication[]): TimelineEvent[]
getOptimalApplicationStrategy(apps: CardApplication[], wantedCards: Card[]): StrategyAdvice[]
```

#### Strategy Advisor
Given a list of cards the user wants, generate an optimal application timeline:
- "Apply for Amex Cobalt now (you're eligible)"
- "Wait until March 15 to apply for Amex Gold (90-day cooldown)"
- "Apply for TD Aeroplan anytime (no issuer restriction)"
- "Warning: applying for 2 more cards will put you at 5/24 for Chase cards"

#### Tier Gating
- **Free:** See application count + basic eligibility
- **Pro:** Full timeline + issuer cooldowns + strategy advisor
- **Max:** Application strategy optimizer + reminders when eligible

### UI
- **ApplicationTrackerScreen:** 
  - Hero: "X/24 cards in last 24 months" with visual gauge
  - Application timeline (list with dates, fall-off countdown)
  - Issuer status cards (Amex: eligible ✅, TD: wait 23 days ⏳)
  - "Add Application" form (select card, date, status)
- **Strategy tab:** Optimal application order for wanted cards
- **Alerts:** "You're now eligible for Amex Gold!" (when cooldown expires)

---

## Shared Infrastructure

### AchievementService (NEW)
```typescript
// Core
initAchievements(): void
getAchievements(): UserAchievements
checkAndUnlock(event: string, data?: any): Achievement | null  // Returns newly unlocked, or null
track(event: string, data?: any): void  // Fire-and-forget tracking

// Storage
saveAchievements(achievements: UserAchievements): void
syncToSupabase(): void
```

### ApplicationTrackerService (NEW)
```typescript
// Core
addApplication(app: Omit<CardApplication, 'id' | 'fallOffDate'>): CardApplication
getApplications(): CardApplication[]
getTracker(): ApplicationTracker
checkEligibility(cardId: string): CardEligibility
getStrategy(wantedCardIds: string[]): StrategyAdvice[]

// Storage
saveApplications(): void
syncToSupabase(): void
```

### Supabase Tables
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE card_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  application_date DATE NOT NULL,
  status TEXT DEFAULT 'approved',
  fall_off_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own applications" ON card_applications FOR ALL USING (auth.uid() = user_id);
```

---

## Build Order
1. **AchievementService** — achievement definitions + tracking engine + storage
2. **AchievementsScreen** — trophy case UI
3. **Achievement integration** — wire track() calls into existing services
4. **ApplicationTrackerService** — application tracking + eligibility + strategy
5. **ApplicationTrackerScreen** — tracker UI with timeline
6. **Navigation + Home** — wire both into app

---

## Estimated Scope
| Feature | Services | Screens | Tests | Hours |
|---------|----------|---------|-------|-------|
| F15 Achievements | AchievementService | AchievementsScreen | ~45 | 10 |
| F16 5/24 Tracker | ApplicationTrackerService | ApplicationTrackerScreen | ~40 | 10 |
| Integration | Event wiring | - | ~10 | 4 |
| **Total** | **2 services** | **2 screens** | **~95** | **24** |

---

*Ready for VP Eng architecture review.*
