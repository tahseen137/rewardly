# Rewardly Pricing Tiers — Technical Spec
**Author:** Gandalf (CTO) | **Date:** Feb 13, 2026  
**Priority:** CRITICAL — Sprint deliverable  
**Approved by:** Aragorn (CEO)

---

## 1. Tier Definitions

### 🆓 Free (default for all new users)
| Feature | Access |
|---------|--------|
| Best card by category (9 categories) | ✅ |
| Store search | ✅ |
| Card wallet | **Max 3 cards** |
| Card details (read-only) | ✅ |
| Insights | ❌ Locked |
| Points Valuator | ❌ Locked |
| Point Balance Tracking | ❌ Locked |
| Sage AI | ❌ Hidden from nav |
| AutoPilot | ❌ Locked |
| Multi-country | ❌ (default country only) |
| Ads | Yes (future) |

### 💎 Pro — $5.99/mo | $49.99/yr
| Feature | Access |
|---------|--------|
| Everything in Free | ✅ |
| Card wallet | **Unlimited** |
| Insights dashboard | ✅ |
| Points Valuator | ✅ |
| Point Balance Tracking | ✅ |
| Sage AI | **10 chats/month** |
| AutoPilot | ❌ Locked |
| Multi-country | ❌ |
| Ads | None |

### 🚀 Max — $12.99/mo | $99.99/yr
| Feature | Access |
|---------|--------|
| Everything in Pro | ✅ |
| Sage AI | **Unlimited** |
| AutoPilot | ✅ |
| Multi-country (CA + US) | ✅ |
| Family sharing (up to 5) | ✅ (future) |
| Export reports | ✅ (future) |
| Priority support | ✅ (future) |

### 👑 Admin (internal only)
- All Max features unlocked
- No subscription required
- Flagged via `is_admin: true` in user profile
- Admin emails: configurable in env var `ADMIN_EMAILS`

---

## 2. Database Schema

### `profiles` table (UPDATE existing)
```sql
ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max'));
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
```

### `subscriptions` table (NEW)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('pro', 'max')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### `sage_usage` table (NEW)
```sql
CREATE TABLE sage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- '2026-02' format
  chat_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);
```

### RLS Policies
```sql
-- subscriptions: users can read their own
CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- sage_usage: users can read/update their own
CREATE POLICY "Users read own sage usage" ON sage_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own sage usage" ON sage_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users increment own sage usage" ON sage_usage
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 3. Feature Gating Service

### `src/services/SubscriptionService.ts` (NEW)
```typescript
export type Tier = 'free' | 'pro' | 'max' | 'admin';

export interface UserSubscription {
  tier: Tier;
  isAdmin: boolean;
  sageChatsRemaining: number | null; // null = unlimited
  canAccessFeature: (feature: Feature) => boolean;
}

export type Feature = 
  | 'unlimited_cards'
  | 'insights'
  | 'points_valuator'
  | 'balance_tracking'
  | 'sage_ai'
  | 'autopilot'
  | 'multi_country'
  | 'export'
  | 'family_sharing';

const TIER_FEATURES: Record<Tier, Feature[]> = {
  free: [],
  pro: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai'],
  max: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'autopilot', 'multi_country', 'export', 'family_sharing'],
  admin: ['unlimited_cards', 'insights', 'points_valuator', 'balance_tracking', 'sage_ai', 'autopilot', 'multi_country', 'export', 'family_sharing'],
};

// Card limits per tier
export const CARD_LIMITS: Record<Tier, number> = {
  free: 3,
  pro: Infinity,
  max: Infinity,
  admin: Infinity,
};

// Sage monthly chat limits (null = unlimited)
export const SAGE_LIMITS: Record<Tier, number | null> = {
  free: 0,
  pro: 10,
  max: null,
  admin: null,
};
```

Key methods:
- `getUserSubscription(userId): Promise<UserSubscription>` — fetch tier + usage
- `canAccessFeature(feature): boolean` — check tier permission
- `incrementSageUsage(userId): Promise<{allowed: boolean, remaining: number}>` — track + enforce
- `getCardLimit(): number` — return limit for tier

---

## 4. Stripe Integration

### Products & Prices (create in Stripe)
```
Product: Rewardly Pro
  - Price: $5.99/mo (recurring)
  - Price: $49.99/yr (recurring)

Product: Rewardly Max
  - Price: $12.99/mo (recurring)
  - Price: $99.99/yr (recurring)
```

### Supabase Edge Function: `create-checkout` (NEW)
- Input: `{ tier: 'pro' | 'max', interval: 'month' | 'year' }`
- Creates Stripe Checkout Session
- Returns checkout URL
- Web: redirect to Stripe Checkout
- Mobile (future): use Stripe SDK

### Supabase Edge Function: `stripe-webhook` (NEW)
- Handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Updates `subscriptions` table + `profiles.tier`
- On cancellation: downgrade to free at period end

### Supabase Edge Function: `manage-subscription` (NEW)
- Creates Stripe Customer Portal session
- User can cancel, change plan, update payment method

---

## 5. UI Changes

### Navigation (AppNavigator.tsx)
- **Sage tab:** Show for Pro+ and Admin users. Hidden for Free.
- Use `SubscriptionService.canAccessFeature('sage_ai')` to conditionally render tab.

### Home Screen
- Card wallet: if Free user has 3 cards and tries to add more → show upgrade prompt
- Category/store recommendations: always available (this is the hook)

### Insights Screen
- Free: show blurred/locked overlay with "Upgrade to Pro" CTA
- Pro+: full access

### AutoPilot Screen
- Free/Pro: show locked overlay with "Upgrade to Max" CTA
- Max+: full access

### Settings Screen
- Add "Subscription" section:
  - Current tier badge (Free/Pro/Max)
  - "Upgrade" button (Free/Pro users)
  - "Manage Subscription" button (paid users → Stripe Portal)
  - Sage usage counter for Pro users ("7/10 chats used this month")

### Sage Screen
- Only visible in tab bar for Pro+ users
- Pro users: show remaining chat count in header
- When limit hit: show upgrade to Max prompt
- Admin: unlimited, no counter

### Upgrade Screen (NEW: `src/screens/UpgradeScreen.tsx`)
- Comparison table of tiers
- Monthly/yearly toggle
- "Start Free Trial" or "Subscribe" CTAs
- Stripe Checkout redirect

### Locked Feature Component (NEW: `src/components/LockedFeature.tsx`)
- Reusable overlay for locked screens
- Shows which tier unlocks the feature
- "Upgrade" button → UpgradeScreen

---

## 6. Admin Setup
- Env var: `ADMIN_EMAILS=aragorn@email.com` (comma-separated)
- On auth signup/login: check if email is in admin list → set `is_admin: true`
- Admin flag checked in SubscriptionService → returns 'admin' tier
- **Aragorn gets full access to all features without paying**

---

## 7. User Stories & Acceptance Criteria

### US-1: Free User Card Limit
**As a** free user, **I want to** add up to 3 cards to my wallet, **so that** I can try the basic features.
- **AC1:** Free user can add exactly 3 cards
- **AC2:** Attempting to add a 4th card shows upgrade prompt
- **AC3:** Upgrade prompt links to UpgradeScreen
- **AC4:** Pro/Max/Admin users have no card limit

### US-2: Sage AI Access Control
**As a** pro user, **I want to** chat with Sage up to 10 times per month, **so that** I get AI-powered recommendations.
- **AC1:** Sage tab visible only for Pro+ and Admin users
- **AC2:** Free users do not see Sage in navigation
- **AC3:** Pro users see chat counter "X/10 chats remaining"
- **AC4:** After 10 chats, Pro users see "Upgrade to Max for unlimited"
- **AC5:** Max/Admin users have unlimited chats, no counter
- **AC6:** Chat count resets on the 1st of each month

### US-3: Insights Paywall
**As a** free user visiting Insights, **I want to** see a preview with upgrade prompt, **so that** I understand the value before paying.
- **AC1:** Free users see locked overlay on Insights screen
- **AC2:** Overlay shows feature description + "Upgrade to Pro" button
- **AC3:** Pro+ users see full Insights dashboard

### US-4: AutoPilot Paywall
**As a** Pro user, **I want to** see that AutoPilot requires Max, **so that** I know the upgrade path.
- **AC1:** Free/Pro users see locked overlay on AutoPilot
- **AC2:** Overlay says "Upgrade to Max to unlock AutoPilot"
- **AC3:** Max/Admin users have full AutoPilot access

### US-5: Subscription Purchase Flow
**As a** free user, **I want to** subscribe to Pro or Max, **so that** I can unlock premium features.
- **AC1:** UpgradeScreen shows all 3 tiers with feature comparison
- **AC2:** Monthly/yearly pricing toggle works
- **AC3:** Clicking "Subscribe" creates Stripe Checkout and redirects
- **AC4:** After successful payment, user tier updates immediately
- **AC5:** User can access new tier features without app restart

### US-6: Subscription Management
**As a** paid user, **I want to** manage my subscription, **so that** I can upgrade, downgrade, or cancel.
- **AC1:** Settings shows current tier and "Manage Subscription" button
- **AC2:** Button opens Stripe Customer Portal
- **AC3:** Cancellation sets `cancel_at_period_end: true`
- **AC4:** User keeps access until period end
- **AC5:** After period end, tier downgrades to free

### US-7: Admin Access
**As an** admin, **I want to** access all features without subscribing, **so that** I can test and demo the product.
- **AC1:** Admin email in env var gets `is_admin: true` on login
- **AC2:** Admin sees all features (Sage unlimited, AutoPilot, Insights, etc.)
- **AC3:** Admin has no card limit
- **AC4:** Admin does not see upgrade prompts
- **AC5:** Settings shows "Admin" badge instead of tier

### US-8: Upgrade Prompts
**As a** free/pro user, **I want to** see contextual upgrade prompts when I hit limits, **so that** I understand why I should upgrade.
- **AC1:** Hitting 3-card limit shows "Upgrade to Pro for unlimited cards"
- **AC2:** Hitting Sage 10-chat limit shows "Upgrade to Max for unlimited AI"
- **AC3:** Tapping locked Insights shows Pro upgrade prompt
- **AC4:** Tapping locked AutoPilot shows Max upgrade prompt
- **AC5:** All prompts navigate to UpgradeScreen

---

## 8. Test Requirements
- Unit tests for SubscriptionService (tier checks, feature gating, sage limits)
- Unit tests for card limit enforcement
- Integration test for upgrade flow (mock Stripe)
- All existing 198 tests must continue passing
- **Run on Sonnet** (CEO directive: Opus overkill for tests)

---

## 9. Implementation Order
1. Database schema (Supabase migrations)
2. SubscriptionService (feature gating logic)
3. UI: LockedFeature component + UpgradeScreen
4. UI: Wire Sage into tab bar with gate
5. UI: Add paywalls to Insights, AutoPilot, MyCards (card limit)
6. UI: Settings subscription section
7. Stripe products/prices + Edge Functions (checkout, webhook, portal)
8. Admin flag logic
9. Sage usage tracking + monthly limit
10. Tests
11. Deploy + verify

---

*Approved for development. Target: ASAP with quality.*
