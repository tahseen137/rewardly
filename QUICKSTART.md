# ⚡ Rewardly Quickstart — MVP Sprint Edition

**Goal:** Get from zero to running the app in <5 minutes.

**Current Status:** Sprint #1 (Day 3/7) — MVP deployed, Sage AI integrated, targeting first paying customer.

---

## 🎯 What is Rewardly?

AI-powered credit card rewards optimizer for Canada (SaveSage competitor). Users ask "Which card should I use at Costco?" and Sage (our AI assistant) tells them + shows the math.

**Stack:**
- **Frontend:** React Native 0.81 + Expo 54 (iOS/Android/Web)
- **Database:** Supabase (PostgreSQL) — 80 cards (53 CA + 27 US)
- **AI:** Google Gemini API (directly from frontend, no backend proxy)
- **Deployment:** Vercel (web), EAS (mobile — not yet deployed)

---

## 🚀 5-Minute Setup

### 1. Prerequisites
```bash
node -v  # Need 18+
npm -v   # Should be 9+
```

If missing: Install from [nodejs.org](https://nodejs.org/)

### 2. Clone & Install
```bash
cd /Users/clawdbot/.openclaw/workspace/rewardly
npm install
```

### 3. Run Locally
```bash
npm start
# Then press:
#   w → Web browser (instant)
#   i → iOS simulator (requires Xcode)
#   a → Android emulator (requires Android Studio)
```

**That's it.** No `.env` file needed for local dev. Gemini API key is already embedded (public key, safe for MVP).

---

## 🧪 Test It Works

1. Open the app (web or mobile)
2. Tap **"Chat with Sage"** (bottom center, sparkles icon ✨)
3. Type: `Which card should I use for groceries?`
4. If Sage responds with recommendations → ✅ **Everything works!**

---

## 📁 Key Files (Where to Start)

| File | Purpose |
|------|---------|
| `src/screens/SageScreen.tsx` | AI chat UI (where users talk to Sage) |
| `src/services/SageService.ts` | Gemini API integration |
| `src/data/sage_system_prompt.ts` | AI personality + instructions |
| `src/services/RecommendationEngine.ts` | Card ranking algorithm (167 tests) |
| `supabase/migrations/` | Database schema (5 migrations) |
| `docs/ENGINEERING-ASSESSMENT.md` | VP Eng report (70% code reusable) |
| `docs/PRD-v1.md` | Product Requirements Doc |

---

## 📦 Database Setup (Optional)

**Local dev works without this.** But if you want to add cards or modify the DB:

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com/)
2. Create project (free tier is fine)
3. Copy `Project URL` and `anon public` API key

### 2. Set Environment Variables
Create `.env.local` in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

**Current DB:** `https://zdlozhpmqrtvvhdzbmrv.supabase.co` (West US Oregon)

---

## 🚧 Known Blockers (Sprint #1)

| Blocker | Status | Impact | Owner |
|---------|--------|--------|-------|
| **Sage API keys in frontend** | 🟡 Acceptable for MVP | Exposed in client code, but public key | Future: Add proxy |
| **No custom domain** | 🟡 Low priority | Using Vercel default URL | Post-MVP |
| **Not pushed to Git** | 🔴 **CRITICAL** | All changes local only! | **DO THIS NOW** |
| **My Cards race condition** | ✅ **FIXED** (Feb 11) | Cards showed "??" on load | Fixed with cache preload |
| **No bank linking** | 🟡 Post-MVP | Can't track spending automatically | Wave 4+ |
| **No monetization** | 🟡 Post-MVP | No affiliate links or subscriptions | Wave 5+ |

---

## 🎨 UI Overview

**3 Main Screens:**

1. **Home Screen** (`src/screens/HomeScreen.tsx`)
   - Search stores → Get card recommendation
   - Example: "Tim Hortons" → Shows best card from your portfolio

2. **My Cards** (`src/screens/MyCardsScreen.tsx`)
   - Manage your credit card portfolio
   - Toggle between "My Cards" and "Discover Cards"
   - ✅ Fixed race condition (Feb 11) — cards no longer show "??" on load

3. **Sage Chat** (`src/screens/SageScreen.tsx`)
   - AI assistant (Google Gemini 2.0 Flash)
   - Ask questions: "Best card for dining?" "Plan my trip redemption"
   - Shows math: "5x × 2.1¢ = 10.5% back"

---

## 🧠 How Sage Works (Architecture)

```
User: "Best card for groceries?"
    ↓
SageService.sendMessage()
    ↓
1. Build context:
   - User's card portfolio (from AsyncStorage)
   - Reward rates for each card
   - Point balances
   - Preferences (cashback vs. travel)
    ↓
2. Generate system prompt (sage_system_prompt.ts)
   - Personality: Friendly, helpful, concise
   - Point valuations (Aeroplan: 2¢, Amex MR: 2.1¢, etc.)
   - Instructions: "Show the math!"
    ↓
3. Call Gemini API (direct fetch, no backend)
   - Model: gemini-2.0-flash
   - API key: Embedded in frontend (public, safe for MVP)
   - Conversation history: In-memory (last 10 messages)
    ↓
4. Parse response
   - Extract card recommendations (heuristic matching)
   - Link to full card details
    ↓
Display to user (SageScreen.tsx)
```

**Why no backend?**
- Faster MVP iteration
- API key is public (acceptable for MVP)
- Can add proxy later (Vercel serverless function)

---

## 🧪 Testing

```bash
# Run all tests (167 tests, 100% passing)
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report (currently 27% statement coverage)
npm run test:coverage
```

**Test Highlights:**
- Property-based testing with `fast-check`
- RecommendationEngine: 100% passing (ranks cards correctly)
- RewardsCalculator: Accurate CAD conversion
- Edge cases: Empty portfolios, missing reward rates, fuzzy store matching

---

## 🚀 Deployment

### Web (Vercel) — ✅ LIVE
```bash
npm run deploy:vercel
```

**Current URL:** https://rewardly-ac1pz78ev-tahseen-rahmans-projects-58bcf065.vercel.app

### Mobile (EAS) — 🔴 NOT YET DEPLOYED
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build preview (iOS simulator + Android APK)
npm run build:preview

# Build production (App Store + Play Store)
npm run build:production
```

**NOTE:** App Store deployment is premature. Focus on MVP features first.

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

### Expo CLI commands not working
```bash
# Update Expo CLI
npm install -g expo-cli@latest
```

### Sage doesn't respond
1. Check browser console for API errors
2. Verify Gemini API key is valid (embedded in `SageService.ts`)
3. Check network tab — should see POST to `generativelanguage.googleapis.com`

### TypeScript errors
```bash
# Check for errors
npm run lint

# Auto-fix formatting
npm run format
```

---

## 📚 Deep Dive Documentation

Want to understand more? Read these docs:

| Document | Purpose | Length |
|----------|---------|--------|
| **[ENGINEERING-ASSESSMENT.md](docs/ENGINEERING-ASSESSMENT.md)** | VP Eng report — code audit, reusability | 33 KB |
| **[PRD-v1.md](docs/PRD-v1.md)** | Product Requirements Doc | 39 KB |
| **[SAGE_INTEGRATION_SUMMARY.md](SAGE_INTEGRATION_SUMMARY.md)** | Gemini API integration details | 6 KB |
| **[INTEGRATION-NOTES.md](docs/INTEGRATION-NOTES.md)** | Wave 1 integration notes | 3 KB |

**Don't read:** START_HERE.md, APP_STORE_DEPLOYMENT.md — those are for App Store deployment (premature).

---

## 🎯 Sprint #1 Goals (Day 3/7)

**Mission:** First paying customer by Feb 16

**Current Priorities:**
1. ✅ MVP deployed to Vercel
2. ✅ Sage AI integrated (Gemini)
3. ✅ 80 cards in database (53 CA + 27 US)
4. 🚧 Push to Git (CRITICAL — not done yet!)
5. 🚧 Custom domain (rewardly.ca)
6. 🚧 Monetization (subscriptions or affiliate links)

**Next Wave:**
- User onboarding flow
- Social proof (testimonials)
- Payment integration (Stripe)
- Landing page optimization

---

## 🧙 Questions?

**Stuck?** Check:
1. This QUICKSTART.md (you are here)
2. `docs/ENGINEERING-ASSESSMENT.md` (code quality report)
3. `SAGE_INTEGRATION_SUMMARY.md` (AI integration)
4. GitHub Issues (coming soon)

**Need help?** Tag @Gandalf (that's me 🧙‍♂️)

---

## ✅ Quick Checklist

Before starting work:
- [ ] `npm install` completed
- [ ] `npm start` works (app loads in browser)
- [ ] Sage chat responds to test question
- [ ] Read ENGINEERING-ASSESSMENT.md (at least Part 1)
- [ ] Understand current sprint goal (first paying customer)

---

**Welcome to the team! Let's ship this. 🚀**

*Last updated: Feb 12, 2026, 3:26 AM EDT*
