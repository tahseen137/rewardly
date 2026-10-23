# Pricing Tiers Architecture Document

**Author:** VP of Engineering  
**Date:** Feb 13, 2026  
**Spec Reference:** `docs/PRICING-TIERS-SPEC.md`  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [File-by-File Implementation Plan](#2-file-by-file-implementation-plan)
3. [Database Migrations](#3-database-migrations)
4. [Supabase Edge Functions](#4-supabase-edge-functions)
5. [Component Hierarchy](#5-component-hierarchy)
6. [Test Plan](#6-test-plan)
7. [Implementation Order](#7-implementation-order)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Architecture Decisions

### 1.1 Deviations from CTO Spec

| CTO Spec | Deviation | Reasoning |
|----------|-----------|-----------|
| Create new `SubscriptionService.ts` | **Modify existing** | Service already exists with ~70% of required functionality. We enhance rather than replace. |
| Create `LockedFeature.tsx` | **Already exists** | Component exists with inline/overlay/card variants. Minor enhancements needed. |
| Create `Paywall.tsx` | **Already exists** | Component exists but uses mock subscription. Wire to real Stripe. |
| Sage tab visibility in `AppNavigator.tsx` | **Already implemented** | Line 202-210 already conditionally renders Sage tab. Minor refinement needed. |

### 1.2 Technology Choices

#### Stripe Integration Strategy

| Platform | Approach | Reasoning |
|----------|----------|-----------|
| **Web** | Stripe Checkout (redirect) | Standard web flow, handles 3DS/compliance |
| **iOS** | Stripe Checkout via in-app browser | App Store rules require IAP for digital goods. **Phase 2: Implement IAP** |
| **Android** | Stripe Checkout via in-app browser | Play Store allows external payments with disclosure. **Phase 2: Consider Play Billing** |

**Decision:** For MVP, use Stripe Checkout redirect for all platforms. This is compliant for web and Android. iOS requires IAP for App Store distribution, but:
- Web-only launch is viable
- TestFlight allows Stripe during testing
- IAP can be Phase 2

#### State Management for Subscription Data

```
┌─────────────────────────────────────────────────────────────┐
│                    Subscription State Flow                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Supabase (Source of Truth)                                │
│   ├── profiles.tier                                         │
│   ├── profiles.is_admin                                     │
│   ├── subscriptions.*                                       │
│   └── sage_usage.*                                          │
│            │                                                │
│            ▼                                                │
│   SubscriptionService (Client)                              │
│   ├── subscriptionCache (in-memory)                         │
│   ├── sageUsageCache (in-memory)                            │
│   └── AsyncStorage (offline fallback)                       │
│            │                                                │
│            ▼                                                │
│   React Components                                          │
│   └── Call canAccessFeatureSync() / getCurrentTierSync()    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Caching Strategy:**
1. **In-memory cache** - Primary access for sync functions (no await needed in render)
2. **AsyncStorage** - Offline fallback, persists across app restarts
3. **Supabase** - Source of truth, loaded on app init and after webhook updates
4. **Cache invalidation** - On subscription change (webhook), app foreground, manual refresh

**TTL:** Cache never expires within session. Refresh on:
- App launch (`initializeSubscription()`)
- After purchase flow completes
- On app foreground (via AppState listener)
- Manual pull-to-refresh on Settings

### 1.3 Admin Detection

Admin check happens at two points:
1. **On login/signup** - Check if email is in `ADMIN_EMAILS` env var, set `is_admin: true` in profile
2. **On subscription load** - Check email against hardcoded list as fallback

```typescript
// Hardcoded admin emails (fallback)
const ADMIN_EMAILS = [
  'aragorn@email.com',
  'aragorn@motu.inc',
  // Add from process.env.ADMIN_EMAILS at build time
];
```

---

## 2. File-by-File Implementation Plan

### 2.1 Database & Backend

#### `supabase/migrations/20260213_add_subscription_tables.sql`
- **Action:** CREATE
- **Dependencies:** None
- **What to do:** Create subscriptions table, sage_usage table, alter profiles table. Add RLS policies.
- **See:** [Section 3 - Database Migrations](#3-database-migrations)

#### `supabase/functions/create-checkout/index.ts`
- **Action:** CREATE
- **Dependencies:** Stripe SDK
- **What to do:** Create Stripe Checkout session, return URL
- **Pattern:** Follow existing `sage-chat-stream` pattern for auth validation
- **See:** [Section 4.1](#41-create-checkout)

#### `supabase/functions/stripe-webhook/index.ts`
- **Action:** CREATE
- **Dependencies:** Stripe SDK, Supabase Admin client
- **What to do:** Handle Stripe webhook events, update database
- **Pattern:** Service-style function with typed request/response
- **See:** [Section 4.2](#42-stripe-webhook)

#### `supabase/functions/manage-subscription/index.ts`
- **Action:** CREATE
- **Dependencies:** Stripe SDK
- **What to do:** Create Stripe Customer Portal session
- **See:** [Section 4.3](#43-manage-subscription)

---

### 2.2 Services

#### `src/services/SubscriptionService.ts`
- **Action:** MODIFY
- **Dependencies:** `AuthService`, `supabase`
- **Current state:** Already has 90% of tier logic. Missing: Stripe price IDs, checkout flow, card limit enforcement integration.

**Changes needed:**

```typescript
// ADD: Stripe price IDs mapping
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_xxxxx',   // Set after creating in Stripe
  pro_annual: 'price_xxxxx',
  max_monthly: 'price_xxxxx',
  max_annual: 'price_xxxxx',
} as const;

// ADD: Create checkout session
export async function createCheckoutSession(
  tier: 'pro' | 'max',
  interval: 'month' | 'year'
): Promise<{ url: string } | { error: string }> {
  const session = await getValidSession();
  if (!session?.access_token) {
    return { error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { tier, interval },
  });
  
  if (error) return { error: error.message };
  return { url: data.url };
}

// ADD: Open customer portal
export async function openCustomerPortal(): Promise<{ url: string } | { error: string }> {
  const session = await getValidSession();
  if (!session?.access_token) {
    return { error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase.functions.invoke('manage-subscription', {});
  
  if (error) return { error: error.message };
  return { url: data.url };
}

// ADD: Listen for realtime subscription changes
export function subscribeToSubscriptionChanges(
  userId: string,
  callback: (tier: SubscriptionTier) => void
): () => void {
  const channel = supabase
    .channel('subscription-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newTier = payload.new?.tier || 'free';
        subscriptionCache = { ...subscriptionCache!, tier: newTier };
        callback(newTier);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}
```

#### `src/services/CardPortfolioManager.ts`
- **Action:** MODIFY
- **Dependencies:** `SubscriptionService`

**Changes needed:**

```typescript
import { canAddCardSync, getCardLimitSync, canAccessFeatureSync } from './SubscriptionService';

// MODIFY: addCard function
export async function addCard(cardId: string): Promise<Result<UserCard, PortfolioError>> {
  // ... existing null checks ...

  // ADD: Check card limit
  const currentCount = portfolioCache!.length;
  if (!canAddCardSync(currentCount)) {
    const limit = getCardLimitSync();
    return failure({ 
      type: 'LIMIT_REACHED', 
      message: `You can only have ${limit} cards on the Free plan. Upgrade to Pro for unlimited cards.`,
      limit,
    });
  }

  // ... rest of existing logic ...
}
```

**Also update types.ts:**

```typescript
// ADD to PortfolioError union type
| { type: 'LIMIT_REACHED'; message: string; limit: number }
```

---

### 2.3 Screens

#### `src/screens/UpgradeScreen.tsx`
- **Action:** CREATE
- **Dependencies:** `SubscriptionService`, `Paywall`
- **Pattern:** Follow `SettingsScreen.tsx` layout with sections

**Purpose:** Dedicated upgrade screen navigable from anywhere in the app.

```typescript
// Pseudo-code structure
interface UpgradeScreenProps {
  route: { params?: { feature?: Feature; source?: string } };
  navigation: any;
}

export default function UpgradeScreen({ route, navigation }: UpgradeScreenProps) {
  const { feature, source } = route.params || {};
  const [showPaywall, setShowPaywall] = useState(true);
  
  // Auto-show paywall on mount
  // If dismissed, show feature comparison instead
  
  const handleSubscribe = async (tier: SubscriptionTier, period: BillingPeriod) => {
    const result = await createCheckoutSession(tier, period === 'annual' ? 'year' : 'month');
    if ('url' in result) {
      await Linking.openURL(result.url);
    }
  };
  
  return (
    <SafeAreaView>
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        highlightFeature={feature}
      />
      {!showPaywall && <FeatureComparisonFallback />}
    </SafeAreaView>
  );
}
```

#### `src/screens/MyCardsScreen.tsx`
- **Action:** MODIFY
- **Dependencies:** `SubscriptionService`, `LockedFeature`

**Changes needed:**

```typescript
// In handleAddCard, replace Alert with upgrade prompt
const handleAddCard = async (cardId: string) => {
  const result = await addCard(cardId);
  if (result.success) {
    setPortfolio(getCards());
    setIsModalVisible(false);
  } else {
    if (result.error.type === 'LIMIT_REACHED') {
      // Show upgrade prompt instead of plain alert
      Alert.alert(
        'Card Limit Reached',
        result.error.message,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { 
            text: 'Upgrade to Pro', 
            onPress: () => navigation.navigate('Upgrade', { feature: 'unlimited_cards' })
          },
        ]
      );
    } else if (result.error.type === 'DUPLICATE_CARD') {
      Alert.alert('Duplicate Card', `${result.error.cardName} is already in your portfolio.`);
    } else {
      Alert.alert('Error', 'Failed to add card. Please try again.');
    }
  }
};

// ADD: Show card count with limit for free users
const renderHeader = () => {
  const tier = getCurrentTierSync();
  const limit = getCardLimitSync();
  const showLimit = tier === 'free' && limit !== Infinity;
  
  return (
    <View style={styles.header}>
      <Text style={styles.subtitle}>
        {showLimit 
          ? `${portfolio.length}/${limit} cards in portfolio`
          : `${portfolio.length} card${portfolio.length !== 1 ? 's' : ''} in portfolio`
        }
      </Text>
      {showLimit && portfolio.length >= limit && (
        <TouchableOpacity onPress={() => navigation.navigate('Upgrade')}>
          <Text style={styles.upgradeLink}>Upgrade for unlimited</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

#### `src/screens/SettingsScreen.tsx`
- **Action:** MODIFY
- **Dependencies:** `SubscriptionService`

**Changes needed (most already exist, minor additions):**

```typescript
// In subscription section, add "Manage Subscription" for paid users
<SettingsRow
  icon={<Crown size={20} color={tierConfig.id === 'free' ? colors.text.secondary : colors.primary.main} />}
  title={t('settings.subscription')}
  description={tierConfig.name}
  isLast={subscriptionTier === 'free'}
  onPress={subscriptionTier === 'free' ? handleUpgrade : undefined}
>
  {subscriptionTier === 'free' ? (
    <Text style={styles.upgradeText}>{t('settings.upgrade')}</Text>
  ) : null}
</SettingsRow>

{/* ADD: Manage subscription for paid users */}
{subscriptionTier !== 'free' && subscriptionTier !== 'admin' && (
  <SettingsRow
    icon={<CreditCard size={20} color={colors.text.secondary} />}
    title="Manage Subscription"
    description={
      subscriptionState?.cancelAtPeriodEnd 
        ? `Cancels ${new Date(subscriptionState.expiresAt!).toLocaleDateString()}`
        : `Renews ${new Date(subscriptionState?.expiresAt || '').toLocaleDateString()}`
    }
    isLast={true}
    onPress={handleManageSubscription}
  >
    <ChevronRight size={18} color={colors.text.tertiary} />
  </SettingsRow>
)}

// ADD handler
const handleManageSubscription = async () => {
  const result = await openCustomerPortal();
  if ('url' in result) {
    await Linking.openURL(result.url);
  } else {
    Alert.alert('Error', 'Unable to open subscription management.');
  }
};

// ADD: Sage usage display for Pro users
{subscriptionTier === 'pro' && sageUsage && (
  <SettingsRow
    icon={<Sparkles size={20} color={colors.primary.main} />}
    title="Sage AI Usage"
    description={`${sageUsage.chatCount}/${sageUsage.limit} chats used this month`}
    isLast={true}
  >
    <View style={styles.usageBadge}>
      <Text style={styles.usageText}>
        {sageUsage.remaining} left
      </Text>
    </View>
  </SettingsRow>
)}
```

#### `src/screens/SageScreen.tsx`
- **Action:** MODIFY (Minor)
- **Dependencies:** `SubscriptionService`

**Current state:** Already handles auth check, chat limits, and counter display. Changes needed:

```typescript
// EXISTING: chatLimitReached state and handling is good

// ADD: After limit reached, show upgrade prompt in chat
if (chatLimitReached) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>...</View>
      <LockedFeature
        feature="sage_ai"
        title="Sage Limit Reached"
        description="You've used all 10 Sage chats this month. Upgrade to Max for unlimited AI-powered advice."
        icon={<Sparkles size={56} color={colors.primary.main} />}
        variant="inline"
        onSubscribe={() => {
          setChatLimitReached(false);
          refreshSageUsage();
        }}
      />
    </SafeAreaView>
  );
}
```

#### `src/screens/InsightsHomeScreen.tsx`
- **Action:** VERIFY (No changes needed)
- **Current state:** Already shows LockedFeature for non-Pro users (lines 125-136)

#### `src/screens/AutoPilotScreen.tsx`
- **Action:** MODIFY
- **Dependencies:** `SubscriptionService`, `LockedFeature`

**Add paywall check:**

```typescript
// At top of component
const [hasAccess, setHasAccess] = useState(true);

useFocusEffect(
  useCallback(() => {
    const checkAccess = async () => {
      await refreshSubscription();
      setHasAccess(canAccessFeatureSync('autopilot'));
    };
    checkAccess();
  }, [])
);

// In render, before main content
if (!hasAccess) {
  return (
    <LockedFeature
      feature="autopilot"
      title="Unlock AutoPilot"
      description="Get automatic notifications with the best card to use when you arrive at stores. Available on Max plan."
      icon={<Navigation size={56} color={colors.warning.main} />}
      variant="inline"
      onSubscribe={() => {
        setHasAccess(canAccessFeatureSync('autopilot'));
      }}
    />
  );
}
```

---

### 2.4 Navigation

#### `src/navigation/AppNavigator.tsx`
- **Action:** MODIFY
- **Dependencies:** `SubscriptionService`

**Changes needed:**

```typescript
// ADD: Import UpgradeScreen
import UpgradeScreen from '../screens/UpgradeScreen';

// ADD: UpgradeScreen to stack (outside tabs, modal presentation)
// Create a RootStack that wraps MainTabs

export type RootStackParamList = {
  MainTabs: undefined;
  Upgrade: { feature?: Feature; source?: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator({ onSignOut, onSignIn }) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs">
        {() => <MainTabs onSignOut={onSignOut} onSignIn={onSignIn} />}
      </RootStack.Screen>
      <RootStack.Screen 
        name="Upgrade" 
        component={UpgradeScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </RootStack.Navigator>
  );
}

// MODIFY: MainTabs Sage visibility (already exists, verify logic)
// Line 202-210 already conditionally renders Sage tab
// Ensure it re-checks on subscription change
React.useEffect(() => {
  const unsubscribe = subscribeToSubscriptionChanges(userId, (tier) => {
    setCanAccessSage(TIER_FEATURES[tier].includes('sage_ai'));
  });
  return unsubscribe;
}, [userId]);
```

---

### 2.5 Components

#### `src/components/Paywall.tsx`
- **Action:** MODIFY
- **Dependencies:** `SubscriptionService.createCheckoutSession`

**Changes needed:**

```typescript
// REPLACE mock handleSubscribe with real Stripe integration
const handleSubscribe = useCallback(async () => {
  setIsProcessing(true);
  
  try {
    const result = await createCheckoutSession(
      selectedTier,
      billingPeriod === 'annual' ? 'year' : 'month'
    );
    
    if ('error' in result) {
      Alert.alert('Error', result.error);
      return;
    }
    
    // Open Stripe Checkout
    const supported = await Linking.canOpenURL(result.url);
    if (supported) {
      await Linking.openURL(result.url);
      // User will return to app after checkout
      // Webhook will update subscription state
      onClose();
    } else {
      Alert.alert('Error', 'Unable to open checkout page');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  } finally {
    setIsProcessing(false);
  }
}, [selectedTier, billingPeriod, onClose]);

// REMOVE: __DEV__ check that sets tier directly
// Keep it only for testing with a special flag
```

#### `src/components/LockedFeature.tsx`
- **Action:** VERIFY (Minimal changes)
- **Current state:** Component is well-implemented. Verify required tier mapping is correct.

**Verify `getFeatureUnlockTier` returns correct tiers:**
- `autopilot` → 'max' ✓
- `multi_country` → 'max' ✓  
- `insights` → 'pro' ✓
- `sage_ai` → 'pro' (but hidden entirely for free users in nav)

---

### 2.6 Internationalization

#### `src/i18n/locales/en.json`
- **Action:** MODIFY
- **Add keys:**

```json
{
  "subscription": {
    "free": "Free",
    "pro": "Pro",
    "max": "Max",
    "admin": "Admin",
    "currentPlan": "Current Plan",
    "upgrade": "Upgrade",
    "manage": "Manage Subscription",
    "manageDescription": "Update payment, change plan, or cancel",
    "renewsOn": "Renews {{date}}",
    "cancelsOn": "Cancels {{date}}",
    "sageUsage": "Sage AI Usage",
    "sageUsageDescription": "{{used}}/{{limit}} chats used this month",
    "chatsRemaining": "{{count}} left",
    "cardLimit": "{{current}}/{{limit}} cards",
    "cardLimitReached": "Card Limit Reached",
    "cardLimitMessage": "You can only have {{limit}} cards on the Free plan. Upgrade to Pro for unlimited cards.",
    "sageLimitReached": "Sage Limit Reached",
    "sageLimitMessage": "You've used all {{limit}} Sage chats this month. Upgrade to Max for unlimited.",
    "upgradeToUnlock": "Upgrade to {{tier}} to unlock",
    "startingAt": "Starting at ${{price}}/month"
  },
  "upgrade": {
    "title": "Unlock Premium",
    "subtitle": "Get unlimited access to all features",
    "freeTrial": "Start 7-day free trial",
    "subscribe": "Subscribe to {{tier}}",
    "processing": "Processing...",
    "restorePurchases": "Restore Purchases"
  }
}
```

Also add to `fr.json` with French translations.

---

## 3. Database Migrations

### 3.1 Migration: `20260213_001_add_subscription_columns.sql`

```sql
-- Add subscription columns to profiles
-- Run first before creating new tables

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' 
  CHECK (tier IN ('free', 'pro', 'max'));

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for Stripe customer lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
  ON profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- Rollback:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS tier;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;
-- DROP INDEX IF EXISTS idx_profiles_stripe_customer;
```

### 3.2 Migration: `20260213_002_create_subscriptions_table.sql`

```sql
-- Create subscriptions table

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('pro', 'max')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status IN ('active', 'trialing');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Rollback:
-- DROP TABLE IF EXISTS subscriptions;
-- DROP FUNCTION IF EXISTS update_updated_at_column;
```

### 3.3 Migration: `20260213_003_create_sage_usage_table.sql`

```sql
-- Create sage_usage table for tracking monthly chat limits

CREATE TABLE IF NOT EXISTS sage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: 'YYYY-MM'
  chat_count INTEGER DEFAULT 0 CHECK (chat_count >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Index for fast lookup
CREATE INDEX idx_sage_usage_user_month ON sage_usage(user_id, month);

-- Updated at trigger
CREATE TRIGGER update_sage_usage_updated_at
  BEFORE UPDATE ON sage_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE sage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sage usage" ON sage_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sage usage" ON sage_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sage usage" ON sage_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role for backend operations
CREATE POLICY "Service role full access" ON sage_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Rollback:
-- DROP TABLE IF EXISTS sage_usage;
```

### 3.4 Execution Order

1. `20260213_001_add_subscription_columns.sql`
2. `20260213_002_create_subscriptions_table.sql`
3. `20260213_003_create_sage_usage_table.sql`

---

## 4. Supabase Edge Functions

### 4.1 `create-checkout`

**File:** `supabase/functions/create-checkout/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_IDS: Record<string, string> = {
  'pro_month': Deno.env.get('STRIPE_PRICE_PRO_MONTHLY')!,
  'pro_year': Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')!,
  'max_month': Deno.env.get('STRIPE_PRICE_MAX_MONTHLY')!,
  'max_year': Deno.env.get('STRIPE_PRICE_MAX_ANNUAL')!,
};

interface RequestBody {
  tier: 'pro' | 'max';
  interval: 'month' | 'year';
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { tier, interval }: RequestBody = await req.json();
    const priceKey = `${tier}_${interval}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Invalid tier or interval' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create Stripe customer
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${Deno.env.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL')}/subscription/cancel`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { tier, supabase_user_id: user.id },
      },
      metadata: { tier, supabase_user_id: user.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 4.2 `stripe-webhook`

**File:** `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// Tier mapping from Stripe product metadata
const PRICE_TO_TIER: Record<string, 'pro' | 'max'> = {
  [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY')!]: 'pro',
  [Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')!]: 'pro',
  [Deno.env.get('STRIPE_PRICE_MAX_MONTHLY')!]: 'max',
  [Deno.env.get('STRIPE_PRICE_MAX_ANNUAL')!]: 'max',
};

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier as 'pro' | 'max';
        
        if (!userId || !tier) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Update profile tier
        await supabase
          .from('profiles')
          .update({ tier, stripe_customer_id: session.customer as string })
          .eq('user_id', userId);

        console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          console.error('No profile found for customer:', customerId);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || subscription.metadata?.tier as 'pro' | 'max';

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          user_id: profile.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          tier: tier,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at 
            ? new Date(subscription.canceled_at * 1000).toISOString() 
            : null,
        }, { 
          onConflict: 'stripe_subscription_id' 
        });

        // Update profile tier (only if active/trialing)
        if (['active', 'trialing'].includes(subscription.status)) {
          await supabase
            .from('profiles')
            .update({ tier })
            .eq('user_id', profile.user_id);
        }

        console.log(`Subscription ${event.type} for user ${profile.user_id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) break;

        // Downgrade to free
        await supabase
          .from('profiles')
          .update({ tier: 'free' })
          .eq('user_id', profile.user_id);

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription deleted, user ${profile.user_id} downgraded to free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Could send notification to user here
        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
});
```

### 4.3 `manage-subscription`

**File:** `supabase/functions/manage-subscription/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { 
        status: 401 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get customer ID
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No subscription found' }), { 
        status: 404 
      });
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${Deno.env.get('APP_URL')}/settings`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Portal error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500 
    });
  }
});
```

---

## 5. Component Hierarchy

### 5.1 Subscription UI Component Tree

```
App
├── AppNavigator (wraps everything)
│   ├── AuthScreen (no subscription UI)
│   ├── OnboardingScreen (no subscription UI) 
│   └── RootNavigator
│       ├── MainTabs
│       │   ├── HomeScreen (no gating)
│       │   ├── Insights (InsightsNavigator)
│       │   │   └── InsightsHomeScreen
│       │   │       └── <LockedFeature variant="inline"> (if tier < pro)
│       │   ├── Sage (conditional on tier)
│       │   │   └── SageScreen
│       │   │       └── <LockedFeature> (if limit reached)
│       │   ├── AutoPilot
│       │   │   └── AutoPilotScreen
│       │   │       └── <LockedFeature variant="inline"> (if tier < max)
│       │   ├── MyCards
│       │   │   └── MyCardsScreen
│       │   │       └── Alert with upgrade CTA (on card limit)
│       │   └── Settings
│       │       └── SettingsScreen
│       │           ├── Subscription Row → opens Paywall or Portal
│       │           └── <Paywall visible={showPaywall}>
│       │
│       └── UpgradeScreen (modal)
│           └── <Paywall> (full screen)
```

### 5.2 Props Interfaces

```typescript
// LockedFeature (existing, verify)
interface LockedFeatureProps {
  feature: Feature;
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'overlay' | 'inline' | 'card';
  onSubscribe?: (tier: SubscriptionTier) => void;
  children?: React.ReactNode;  // For overlay variant
}

// Paywall (existing, verify)
interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (tier: SubscriptionTier, period: BillingPeriod) => void;
  highlightFeature?: string;
  defaultTier?: SubscriptionTier;
}

// UpgradeScreen (new)
interface UpgradeScreenProps {
  route: {
    params?: {
      feature?: Feature;
      source?: string;  // For analytics
    };
  };
  navigation: NativeStackNavigationProp<RootStackParamList>;
}
```

### 5.3 Context/Provider Placement

**SubscriptionService uses module-level caching, not React Context.** This is intentional:

- Avoids prop drilling
- Sync access via `*Sync()` functions
- Works outside React tree (in services)
- Simpler than Context for this use case

If React Context is needed later (e.g., for real-time subscription updates), add:

```typescript
// src/contexts/SubscriptionContext.tsx
export const SubscriptionContext = createContext<SubscriptionState | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState | null>(null);
  
  useEffect(() => {
    initializeSubscription().then(setState);
  }, []);
  
  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Wrap in App.tsx before AppNavigator
```

---

## 6. Test Plan

### 6.1 Unit Tests

#### `src/services/__tests__/SubscriptionService.test.ts` (CREATE)

```typescript
// Test cases:
describe('SubscriptionService', () => {
  describe('Tier checks', () => {
    it('returns free tier by default');
    it('returns admin tier for admin emails');
    it('correctly identifies features for each tier');
    it('canAccessFeature returns correct boolean for each tier/feature combo');
  });

  describe('Card limits', () => {
    it('returns 3 for free tier');
    it('returns Infinity for pro tier');
    it('canAddCard returns false when at limit');
  });

  describe('Sage limits', () => {
    it('returns 0 for free tier');
    it('returns 10 for pro tier');
    it('returns null (unlimited) for max tier');
    it('canUseSage returns false when limit reached');
    it('incrementSageUsage updates count correctly');
    it('resets count on new month');
  });

  describe('Checkout flow', () => {
    it('createCheckoutSession calls edge function');
    it('openCustomerPortal calls edge function');
  });
});
```

#### `src/services/__tests__/CardPortfolioManager.test.ts` (MODIFY)

```typescript
// Add test cases:
describe('Card limits', () => {
  beforeEach(() => {
    // Mock SubscriptionService to return free tier
  });

  it('allows adding cards up to limit');
  it('returns LIMIT_REACHED error when at limit');
  it('allows unlimited cards for pro tier');
});
```

### 6.2 Integration Tests

#### `src/services/__tests__/integration/SubscriptionFlow.test.ts` (CREATE)

```typescript
describe('Subscription flow integration', () => {
  it('free user sees locked Insights');
  it('free user cannot access Sage tab');
  it('pro user can access Insights');
  it('pro user sees Sage counter');
  it('max user has unlimited Sage');
  it('admin has all features');
});
```

### 6.3 Mock Strategy

```typescript
// src/services/__mocks__/SubscriptionService.ts
export const mockTier = jest.fn().mockReturnValue('free');
export const getCurrentTierSync = () => mockTier();
export const canAccessFeatureSync = (feature: Feature) => {
  const tier = mockTier();
  return TIER_FEATURES[tier].includes(feature);
};

// Usage in tests:
import { mockTier } from '../__mocks__/SubscriptionService';
mockTier.mockReturnValue('pro');
```

```typescript
// Supabase mock (existing pattern)
jest.mock('../supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: { url: 'https://checkout.stripe.com/...' } }),
    },
  },
  isSupabaseConfigured: () => true,
}));
```

### 6.4 Test File Locations

| Test File | Location |
|-----------|----------|
| SubscriptionService unit | `src/services/__tests__/SubscriptionService.test.ts` |
| CardPortfolioManager card limits | `src/services/__tests__/CardPortfolioManager.test.ts` |
| Integration tests | `src/services/__tests__/integration/` |
| Component snapshot tests | `src/components/__tests__/` |

---

## 7. Implementation Order

| # | Task | Dependencies | Complexity | Testable Checkpoint |
|---|------|--------------|------------|---------------------|
| 1 | Run database migrations in Supabase | None | S | Query profiles table for new columns |
| 2 | Create Stripe products/prices | None | S | Verify in Stripe dashboard |
| 3 | Set env vars in Supabase | Task 2 | S | Edge function can read vars |
| 4 | Create `create-checkout` edge function | Tasks 1-3 | M | Call from curl, get checkout URL |
| 5 | Create `stripe-webhook` edge function | Tasks 1-3 | M | Send test webhook from Stripe dashboard |
| 6 | Create `manage-subscription` edge function | Tasks 1-3 | S | Call from curl, get portal URL |
| 7 | Modify `SubscriptionService.ts` - add Stripe functions | Tasks 4, 6 | M | Unit tests pass |
| 8 | Modify `CardPortfolioManager.ts` - add limit checks | Task 7 | S | Unit tests pass |
| 9 | Modify `Paywall.tsx` - wire to Stripe checkout | Task 7 | M | Click Subscribe → opens Stripe |
| 10 | Create `UpgradeScreen.tsx` | Task 9 | M | Navigate to screen, see paywall |
| 11 | Modify `AppNavigator.tsx` - add UpgradeScreen | Task 10 | S | Can navigate to Upgrade modal |
| 12 | Modify `MyCardsScreen.tsx` - card limit UI | Tasks 8, 11 | S | Free user sees limit, upgrade prompt |
| 13 | Modify `SettingsScreen.tsx` - manage subscription | Task 7 | S | Pro user can open portal |
| 14 | Modify `SageScreen.tsx` - limit reached UI | Task 7 | S | Pro user at limit sees upgrade |
| 15 | Modify `AutoPilotScreen.tsx` - add paywall | None | S | Free/Pro user sees locked feature |
| 16 | Add i18n strings | None | S | Translations appear correctly |
| 17 | Write unit tests for SubscriptionService | Task 7 | M | All tests pass |
| 18 | Write integration tests | Tasks 7-15 | M | All tests pass |
| 19 | Manual E2E testing | All | L | Full flow works |
| 20 | Deploy to staging | All | S | Staging environment works |

---

## 8. Risk Assessment

### 8.1 What Could Go Wrong

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Webhook not received | Medium | High | Implement webhook retry, log failures, monitor |
| Race condition: user checks tier before webhook updates | High | Medium | Poll for tier update after checkout return |
| Stripe API rate limits | Low | Medium | Implement exponential backoff |
| User circumvents client-side gating | Medium | Low | Server validates on Sage calls; card limit is UX only |
| iOS App Store rejects external payments | High | High | Web-first launch; add IAP for iOS Phase 2 |
| Webhook secret exposed | Low | Critical | Use Supabase secrets, rotate periodically |

### 8.2 Edge Cases to Handle

| Edge Case | Handling |
|-----------|----------|
| Subscription expires mid-session | Tier check on each feature access; graceful downgrade |
| Payment fails after trial | Set status to `past_due`; grace period before downgrade |
| User cancels then resubscribes | Webhook updates tier back; clear `cancel_at_period_end` |
| Webhook arrives out of order | Use `updated_at` timestamps; idempotent upserts |
| Admin loses admin status | Re-check admin list on each login |
| Clock skew on sage_usage month | Use server time (Supabase `now()`) not client |
| Multiple devices, one account | Subscription syncs via Supabase; sage_usage is server-side |

### 8.3 Fallback Behavior

| Scenario | Fallback |
|----------|----------|
| Stripe API down | Show cached tier; allow feature access with last known state |
| Supabase down | Use AsyncStorage cached tier; offline-first |
| Webhook processing fails | Retry 3x with exponential backoff; alert on failure |
| Unknown subscription status | Treat as `free` tier (conservative) |
| Network error on checkout | Show error, allow retry |
| Portal session creation fails | Show email support contact |

### 8.4 Monitoring Recommendations

1. **Webhook health** - Track webhook delivery rate in Stripe dashboard
2. **Subscription events** - Log all tier changes with timestamps
3. **Failed payments** - Alert on `invoice.payment_failed` events
4. **Checkout abandonment** - Track sessions created vs completed
5. **Error rates** - Monitor edge function error rates

---

## Appendix A: Stripe Setup Checklist

1. [ ] Create Stripe account (if not exists)
2. [ ] Create products:
   - [ ] Rewardly Pro
   - [ ] Rewardly Max
3. [ ] Create prices:
   - [ ] Pro Monthly ($5.99)
   - [ ] Pro Annual ($49.99)
   - [ ] Max Monthly ($12.99)
   - [ ] Max Annual ($99.99)
4. [ ] Configure Customer Portal:
   - [ ] Allow plan changes
   - [ ] Allow cancellation
   - [ ] Set branding
5. [ ] Create webhook endpoint pointing to `stripe-webhook` function
6. [ ] Add webhook secret to Supabase secrets
7. [ ] Test with Stripe CLI: `stripe listen --forward-to <function-url>`

---

## Appendix B: Environment Variables

### Supabase Edge Functions Secrets

```bash
# Set via Supabase dashboard or CLI
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
supabase secrets set STRIPE_PRICE_MAX_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_MAX_ANNUAL=price_xxxxx
supabase secrets set APP_URL=https://rewardly.app
```

### Client-side (React Native)

```bash
# .env (already configured for Supabase)
# No Stripe keys needed on client - handled by edge functions
```

---

*Document complete. Ready for dev team implementation.*
