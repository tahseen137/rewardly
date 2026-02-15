# Rewardly QA Gate - Pre-Deploy Checklist

> **MANDATORY** — No deployments without passing ALL checks.

## 📋 Pre-Deploy Checklist

### 1. Automated Tests (REQUIRED)
```bash
cd /Users/clawdbot/.openclaw/workspace/rewardly

# Run full test suite - ALL must pass
npx jest --no-cache

# Build verification
npx expo export --platform web
```

**Pass criteria:**
- ✅ All tests pass (1187+ tests)
- ✅ Web build completes with no errors
- ✅ No TypeScript errors

### 2. Critical Flow Tests

#### A. Homepage Calculator
```
1. Open app in browser: npx expo start --web
2. Select category: Groceries
3. Enter amount: $100
4. Verify: Cards appear with reward calculations
5. Verify: "Up to X%" shows on recommended cards (not specific rate)
```

#### B. Recommendations Section
```
1. Clear localStorage (DevTools > Application > Clear site data)
2. Reload app (simulates new user with no portfolio)
3. Verify: "Top Cards to Consider" section appears
4. Verify: At least 1-3 cards show in recommendations
5. Click a recommended card
6. Verify: CardDetail modal opens with card info
```

#### C. Card Navigation
```
1. Click any recommended card on homepage
2. Verify: CardDetail screen opens
3. Verify: Back button works (or close modal)
4. Navigate to Insights tab
5. Open any sub-screen (e.g., Card Compare)
6. Verify: Back button appears in header
7. Click back → returns to Insights home
```

#### D. Country Change
```
1. Go to Settings tab
2. Change country (US → CA or CA → US)
3. Return to Home tab
4. Verify: No "Card not available" error
5. Verify: Cards reload for new country
6. Calculator still works with new country's cards
```

#### E. Smart Wallet (formerly AutoPilot)
```
1. Navigate to Wallet tab
2. Verify: Screen says "Smart Wallet" (not "AutoPilot")
3. Scroll to Privacy section
4. Click "Learn more about privacy"
5. Verify: Alert appears (not broken link)
```

### 3. Visual/UX Checks

#### Homepage Layout
- [ ] No hero banner cluttering the top
- [ ] No "Compare/Apply/Ask Sage" quick actions row
- [ ] Clean flow: Header → Category Grid → Amount → Results → Recommendations

#### Insights Navigation
- [ ] All insight sub-screens have back button in header
- [ ] InsightsHome (main tab) has NO header (clean design)

### 4. Regression Checklist
- [ ] Category selection works
- [ ] Amount input works
- [ ] Results show correct reward calculations
- [ ] Card press navigates to CardDetail
- [ ] Pull-to-refresh works on homepage
- [ ] Tab navigation works for all 5 tabs

---

## 🤖 VP Eng Nightly Build Agent Rules

When running nightly builds:

1. **Always run full test suite first**
2. **Check for failing tests before ANY code changes**
3. **If tests fail, investigate root cause before fixing**
4. **After any fix, re-run tests immediately**
5. **Document what was fixed in commit message**
6. **Never deploy with failing tests**

### Nightly Build Commands
```bash
# Full QA check
cd /Users/clawdbot/.openclaw/workspace/rewardly
npx jest --no-cache 2>&1 | tee /tmp/rewardly-test-results.txt
npx expo export --platform web 2>&1 | tee /tmp/rewardly-build-results.txt

# Quick sanity check
npx jest --testPathPattern="property|calculator|recommendation" --no-cache
```

---

## 🚨 Known Issues History

### 2026-02-14 — CEO Feedback Fixes

| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| Race condition on country change | `loadData()` called without `await` | Added `await loadData()` in country change handler |
| Recommendations not showing for new users | Section only rendered when `hasCards` was true | Removed conditional, show for ALL users |
| No back button on Insights sub-pages | `headerShown: false` on InsightsNavigator | Changed to `headerShown: true` with proper styling |
| Privacy link broken | Tried to open non-existent URL | Shows Alert directly |
| Homepage clutter | Hero banner + quick actions | Removed both sections |

---

## ✅ Sign-off

Before deploying, confirm:

- [ ] All automated tests pass
- [ ] Web build succeeds
- [ ] Manual browser verification complete (Chrome + Safari)
- [ ] No console errors in DevTools
- [ ] Date: ___________
- [ ] Signed by: ___________
