# Rewardly Referral System — Technical Specification
**Version:** 1.0  
**Date:** February 27, 2026  
**Priority:** P2 (Post-launch growth feature)

---

## Overview
Enable users to share Rewardly recommendations via unique referral links. Both referrer and referee get rewards when the referee signs up.

**Core value prop:** "Share your optimal card recommendation with friends, both of you get benefits."

---

## User Stories
1. **As a user**, I want to share my card recommendations with friends so they can benefit from the tool.
2. **As a referrer**, I want to earn rewards when someone signs up through my link.
3. **As a referee**, I want to get a bonus for signing up through a friend's referral link.
4. **As an admin**, I want to track referral conversions and reward distribution.

---

## Database Schema (Supabase)

### Table: `referral_codes`
```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,  -- e.g., 'REWARD-ABC123'
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 year'),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL  -- NULL = unlimited
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
```

### Table: `referral_signups`
```sql
CREATE TABLE referral_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id UUID REFERENCES referral_codes(id),
  referrer_user_id UUID REFERENCES auth.users(id),
  referee_user_id UUID REFERENCES auth.users(id),
  referrer_reward VARCHAR(255),  -- e.g., '1 month Pro', 'achievement badge'
  referee_reward VARCHAR(255),
  signed_up_at TIMESTAMP DEFAULT NOW(),
  reward_claimed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'  -- pending, claimed, expired
);

CREATE INDEX idx_referral_signups_referrer ON referral_signups(referrer_user_id);
CREATE INDEX idx_referral_signups_referee ON referral_signups(referee_user_id);
```

### Table: `referral_clicks` (Optional analytics)
```sql
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id UUID REFERENCES referral_codes(id),
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_referral_clicks_code ON referral_clicks(referral_code_id);
```

---

## Referral Code Generation

### Format
`REWARD-{6 alphanumeric chars}`  
Examples: `REWARD-A3X9K2`, `REWARD-B7Q4M1`

### Generation Logic (TypeScript)
```typescript
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);  // No 0/O/I/1 confusion

export function generateReferralCode(): string {
  return `REWARD-${nanoid()}`;
}

export async function createReferralCode(userId: string) {
  const code = generateReferralCode();
  const { data, error } = await supabase
    .from('referral_codes')
    .insert({
      user_id: userId,
      code: code
    })
    .select()
    .single();

  if (error) {
    // Handle collision (retry with new code)
    if (error.code === '23505') {  // unique violation
      return createReferralCode(userId);
    }
    throw error;
  }

  return data;
}
```

---

## URL Parameter Tracking

### Referral Link Format
```
https://rewardly.ca/?ref=REWARD-ABC123
https://rewardly.ca/compare?ref=REWARD-ABC123
```

### Implementation
```typescript
// On app load, check for ref parameter
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function trackReferral() {
  // Parse URL for ?ref=CODE
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');

  if (referralCode) {
    // Store in local storage (persist across signup flow)
    await AsyncStorage.setItem('pending_referral', referralCode);

    // Track click (optional analytics)
    await supabase.from('referral_clicks').insert({
      referral_code_id: (await getReferralCodeId(referralCode)),
      clicked_at: new Date().toISOString(),
      ip_address: await getClientIP(),  // Optional
      user_agent: navigator.userAgent
    });
  }
}

// On signup, associate referral with new user
export async function completeReferralSignup(newUserId: string) {
  const referralCode = await AsyncStorage.getItem('pending_referral');

  if (!referralCode) return;

  // Get referral code details
  const { data: refData } = await supabase
    .from('referral_codes')
    .select('id, user_id')
    .eq('code', referralCode)
    .eq('is_active', true)
    .single();

  if (!refData) return;

  // Create referral signup record
  await supabase.from('referral_signups').insert({
    referral_code_id: refData.id,
    referrer_user_id: refData.user_id,
    referee_user_id: newUserId,
    referrer_reward: '1 month Pro',  // Configurable
    referee_reward: 'Welcome bonus',
    status: 'claimed'
  });

  // Update usage count
  await supabase.rpc('increment_referral_usage', {
    code_id: refData.id
  });

  // Clear pending referral
  await AsyncStorage.removeItem('pending_referral');
}
```

---

## UI Components

### 1. Share Button (Results Page)
```tsx
import { Share } from 'react-native';

export function ReferralShareButton({ userId, cardName }: Props) {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Fetch or create user's referral code
    fetchReferralCode(userId).then(setReferralCode);
  }, [userId]);

  const handleShare = async () => {
    if (!referralCode) return;

    const message = `Check out Rewardly! I'm using the ${cardName} and saving money on every purchase. Sign up with my referral code for a bonus: https://rewardly.ca/?ref=${referralCode}`;

    try {
      await Share.share({
        message,
        url: `https://rewardly.ca/?ref=${referralCode}`,
        title: 'Join me on Rewardly'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
      <Icon name="share" size={20} color="#fff" />
      <Text style={styles.shareText}>Share & Earn Rewards</Text>
    </TouchableOpacity>
  );
}
```

### 2. Referral Dashboard (Settings/Profile)
```tsx
export function ReferralDashboard({ userId }: Props) {
  const [stats, setStats] = useState({ signups: 0, pending: 0, rewards: [] });

  useEffect(() => {
    // Fetch referral stats
    fetchReferralStats(userId).then(setStats);
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Referrals</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Total Signups" value={stats.signups} />
        <StatCard label="Pending" value={stats.pending} />
      </View>

      <View style={styles.linkSection}>
        <Text style={styles.label}>Your Referral Link:</Text>
        <CopyableLink link={`https://rewardly.ca/?ref=${referralCode}`} />
      </View>

      <View style={styles.rewardsSection}>
        <Text style={styles.subtitle}>Earned Rewards</Text>
        {stats.rewards.map(reward => (
          <RewardItem key={reward.id} reward={reward} />
        ))}
      </View>
    </View>
  );
}
```

### 3. Referral Success Toast (Post-Signup)
```tsx
export function ReferralSuccessToast({ show, referrerName }: Props) {
  if (!show) return null;

  return (
    <View style={styles.toast}>
      <Icon name="gift" size={24} color="#10b981" />
      <Text style={styles.message}>
        Welcome! You signed up through {referrerName}'s referral. 
        Both of you just earned rewards! 🎉
      </Text>
    </View>
  );
}
```

---

## Reward Structure (MVP)

### For Referrer (Person who shares)
- **1 signup** = Achievement badge ("Advocate")
- **5 signups** = 1 month Rewardly Pro
- **10 signups** = 3 months Pro
- **25 signups** = Lifetime Pro

### For Referee (Person who signs up)
- **Immediate:** Welcome achievement badge
- **After 7 days active:** "Friend Bonus" (e.g., early access to new features)

---

## Security Considerations

1. **Fraud Prevention:**
   - Track IP addresses for referral clicks
   - Limit signups from same IP (max 3 per referral code)
   - Require email verification before rewards activate

2. **Abuse Prevention:**
   - Expire unused referral codes after 1 year
   - Monitor for self-referral (same user creating multiple accounts)
   - Require minimum engagement before rewards vest (e.g., 1 week active use)

3. **Privacy:**
   - Don't expose referrer's email/name to referee (only "Your friend invited you")
   - Allow users to opt out of referral tracking

---

## Implementation Phases

### Phase 1: Core Functionality (MVP)
- [ ] Database schema (referral_codes, referral_signups)
- [ ] Referral code generation + assignment
- [ ] URL parameter tracking on app load
- [ ] Associate referral with signup
- [ ] Share button on results page

### Phase 2: UI & Tracking
- [ ] Referral dashboard in Settings
- [ ] Success toast on referred signup
- [ ] Admin panel to view referral stats

### Phase 3: Rewards & Gamification
- [ ] Achievement system integration
- [ ] Pro tier unlocks via referrals
- [ ] Leaderboard (optional)

---

## Testing Plan

### Unit Tests
- Referral code generation (uniqueness, format)
- URL parameter parsing
- Signup association logic

### Integration Tests
- Full referral flow: click link → sign up → both users get credit
- Fraud prevention (same IP, multiple signups)
- Expired code handling

### Manual QA
- Share button works on iOS/Android/Web
- Referral link opens correctly
- Rewards appear in user accounts

---

## Analytics to Track
- Referral link clicks
- Conversion rate (clicks → signups)
- Top referrers (leaderboard data)
- Time to conversion (click → signup)
- Viral coefficient (avg signups per user)

---

## Estimated Effort
- **Phase 1 (MVP):** 8-12 hours
  - DB schema: 1h
  - Code generation: 2h
  - URL tracking: 2h
  - Signup association: 3h
  - Share button UI: 2h
  - Testing: 2h

- **Phase 2 (UI):** 4-6 hours
- **Phase 3 (Rewards):** 6-8 hours

**Total:** 18-26 hours

---

## Next Steps
1. Review this spec with CEO (Aragorn)
2. Prioritize: MVP now vs post-launch?
3. If approved, create implementation tasks in task registry
4. Assign to dev agent or spawn coding sub-agent

---

## References
- [Referral SaaS](https://www.referralsaasquatch.com/) — Industry best practices
- [Dropbox referral case study](https://www.growthmarketingpro.com/dropbox-referral-program/) — Viral loop design
- [Supabase RLS for referrals](https://supabase.com/docs/guides/auth/row-level-security) — Security patterns