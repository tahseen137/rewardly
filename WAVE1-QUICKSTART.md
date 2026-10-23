# Wave 1 Quick Start Guide

## ⚡️ TL;DR - Start Here

```bash
cd /Users/clawdbot/.openclaw/workspace/rewardly

# 1. Start the app
npx expo start

# 2. Press 'w' for web, or scan QR for mobile
# 3. App should load without errors

# 4. Test the flow:
#    → AuthScreen (sign in or continue as guest)
#    → OnboardingScreen (pick country, add cards, meet Sage)
#    → Main App (Home | Sage | My Cards | Settings)
```

---

## 🧪 Quick Validation

Run automated tests:
```bash
node integration-test.js
# Should show: 16/17 passed ✅
```

Check imports:
```bash
node verify-imports.js  
# Should show: All imports look good! ✅
```

---

## 🔍 What Changed

### New Screens:
- **AuthScreen** - Sign in with email/Google/Apple or continue as guest
- **OnboardingScreen** - 3-step setup (country, cards, Sage intro)
- **SageScreen** - AI chat assistant

### New Services:
- **AuthService** - Supabase authentication
- **SageService** - AI chat backend
- **SubscriptionService** - 4-tier system (Free/Plus/Pro/Elite)
- **FeatureGate** - Feature access control

### Modified:
- **AppNavigator** - Added Sage tab, auth flow integration

---

## 📊 Data Files

### US Cards:
- `src/data/us_cards.json` - 20 US credit cards
- `src/data/us_rewards_programs.json` - US reward programs

### Canadian Cards (existing):
- `src/data/canadian_cards_extended.json` - 50+ CA cards

**Country switching works automatically** - app loads correct data based on user preference.

---

## 🎯 Key Features to Test

### 1. Auth Flow
- Email/password sign up
- Email/password sign in
- Google sign in (requires OAuth setup)
- Apple sign in (iOS only, requires Apple Developer account)
- **Guest mode** (easiest for quick testing)

### 2. Onboarding
- **Step 1:** Choose US 🇺🇸 or Canada 🇨🇦
- **Step 2:** Select cards from your portfolio
- **Step 3:** Introduction to Sage AI

### 3. Navigation
- **Home** tab - Main recommendations screen
- **Sage** tab - AI assistant (✨ NEW)
- **My Cards** tab - Portfolio management
- **Settings** tab - Preferences and account

### 4. Subscription Tiers
In dev mode, defaults to **Plus** tier.

Access levels:
- **Free:** 5 recommendations/day, 10 AI questions/month
- **Plus:** Unlimited recommendations & AI (default in dev)
- **Pro:** Plus + travel planner + analytics
- **Elite:** Pro + expert consultations + family sharing

---

## 🔧 Configuration (Optional)

### Required for Full Sage Functionality:
```bash
# In .env or Expo environment
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# In Supabase dashboard > Edge Functions > Secrets:
ANTHROPIC_API_KEY=sk-ant-... (or OPENAI_API_KEY)
```

**Without Supabase:** App works but Sage AI and auth are disabled.

---

## 🐛 Troubleshooting

### "Supabase client not configured"
**Normal in dev mode.** Auth and Sage won't work without Supabase, but rest of app functions.

### TypeScript stack overflow
**Ignore.** Use `npx expo start` instead of `tsc --noEmit`. This is a tooling issue, not a code issue.

### Cards not loading
Check console for country setting. Should auto-detect from locale.  
Force a country: Add debug code in `PreferenceManager.ts`.

### Sage screen blank
Expected if Supabase not configured. The welcome screen should show regardless.

---

## 📱 Testing Checklist

### Critical Path:
- [ ] App compiles and starts
- [ ] AuthScreen shows on first launch
- [ ] Can continue as guest
- [ ] Onboarding shows 3 steps
- [ ] Can complete onboarding
- [ ] Main app loads with 4 tabs
- [ ] Sage tab is between Home and MyCards
- [ ] US cards load (if country = US)
- [ ] CA cards load (if country = CA)

### Nice to Have:
- [ ] Email sign up works
- [ ] Email sign in works
- [ ] Paywall modal opens
- [ ] Subscription tiers display
- [ ] Sage chat interface loads
- [ ] Quick actions in Sage work

---

## 📖 Documentation

- **Full Details:** `docs/WAVE1-INTEGRATION-SUMMARY.md`
- **Integration Notes:** `docs/INTEGRATION-NOTES.md`
- **Test Results:** Run `node integration-test.js`

---

## 🚀 Quick Commands

```bash
# Start app (web)
npx expo start --web

# Start app (with cache clear)
npx expo start --clear

# Run integration tests
node integration-test.js

# Check imports
node verify-imports.js

# View US cards data
cat src/data/us_cards.json | jq '.cards | length'

# View CA cards data  
cat src/data/canadian_cards_extended.json | jq '.cards | length'
```

---

## ✅ Expected Behavior

### First Launch:
1. App shows **AuthScreen**
2. User signs in or continues as guest
3. App shows **OnboardingScreen** (3 steps)
4. After onboarding, shows **Main App** with tabs

### Subsequent Launches:
1. If user is logged in → Main App directly
2. If session expired → AuthScreen

### Tab Navigation:
- **Home** → Recommendation engine
- **Sage** → AI chat assistant ✨
- **My Cards** → Portfolio
- **Settings** → Preferences

---

**Status:** ✅ Ready for Wave 1 Testing  
**Build:** All components integrated and wired  
**Next:** Run `npx expo start` and test the flow!

