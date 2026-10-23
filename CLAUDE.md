# Rewardly — CLAUDE.md

## What It Is

Canadian credit card rewards optimizer. Users enter a store or spending category and instantly see which card in their wallet earns the most rewards. Supports 410+ Canadian credit cards across all major banks and premium issuers (TD, RBC, BMO, CIBC, Scotiabank, Amex, and more).

Cross-platform: iOS, Android, and Web (React Native + Expo). Privacy-first: all user data stored locally on-device via AsyncStorage.

**Author:** Tahseen Rahman  
**Repo:** https://github.com/tahseen137/rewardly  
**Bundle ID:** `com.rewardsoptimizer.app`  
**App scheme:** `rewards-optimizer://`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript ~5.9 |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Local storage | AsyncStorage (all user data — local-first, no mandatory cloud sync) |
| Backend/DB | Supabase (PostgreSQL) — optional cloud features |
| Store lookup | Google Places API |
| AI assistant | Anthropic Claude Haiku (via Supabase Edge Function `sage-chat`) |
| Internationalization | i18next — English and French |
| Error tracking | Sentry (`EXPO_PUBLIC_SENTRY_DSN`) |
| Animations | React Native Reanimated 4 + Expo Blur, Linear Gradient, Haptics |
| Testing | Jest 29 + fast-check (property-based) + Playwright (E2E) |
| Linting | ESLint + Prettier |
| Pre-commit | Husky + lint-staged |
| Mobile builds | EAS Build (Expo Application Services) |
| Web deploy | Vercel |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## Running the App

### Prerequisites
- Node 18+
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode + iOS Simulator
- For Android: Android Studio + emulator

### Install
```bash
npm install
```

### Start dev server
```bash
npx expo start        # Interactive — choose platform
npm run web           # Web only (opens http://localhost:8081)
npm run ios           # iOS simulator
npm run android       # Android emulator
```

### Type check / lint / test
```bash
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint on src/
npm run format        # Prettier write
npm test              # Jest unit tests
npm run test:watch    # Jest watch mode
npm run test:coverage # Jest coverage report
npm run validate      # lint + typecheck + test + web build smoke test (run before deploy)
```

### E2E (Playwright)
```bash
npm run test:e2e          # All E2E tests
npm run test:e2e:ui       # Interactive Playwright UI
npm run test:a11y         # Accessibility audit (axe-core)
```

---

## Building & Deploying

### Web (Vercel)
```bash
npm run deploy:vercel     # Runs validate then deploys to prod
# or manually:
npm run build:web         # expo export -p web → dist/
vercel --prod
```

### Mobile (EAS)
```bash
npm install -g eas-cli
eas login

# Preview builds (TestFlight / internal testing)
npm run build:preview     # both platforms
npm run build:android-apk # Android APK only

# Production (App Store + Play Store)
npm run build:production

# Submit to stores
npm run submit:ios
npm run submit:android
```

Note: The `eas.projectId` in `app.json` must be set to your Expo project ID before building.

---

## Environment Variables

Copy `.env.example` to `.env.local` (for local dev) or configure via Vercel/Supabase dashboards.

### Client-side (must use `EXPO_PUBLIC_` prefix)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your-places-api-key
EXPO_PUBLIC_SENTRY_DSN=            # optional — leave blank to disable
```

> **Warning:** `EXPO_PUBLIC_` variables are bundled into the client. Never put secret keys here.

### Server-side (Supabase Edge Functions only — set via `supabase secrets set`)
```env
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
STRIPE_PRICE_MAX_MONTHLY=price_xxx
STRIPE_PRICE_MAX_ANNUAL=price_xxx
STRIPE_PRICE_LIFETIME=price_xxx
APP_URL=https://rewardly.ca
AI_PROVIDER=anthropic              # anthropic | openai
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx              # optional fallback
```

---

## Folder Structure

```
Rewardly/
├── App.tsx                      # Expo root — wraps AppNavigator
├── app.json                     # Expo config (bundle IDs, permissions, splash)
├── babel.config.js
├── assets/                      # Icons, splash screen
├── chrome-extension/            # Companion Chrome extension (standalone)
│   ├── manifest.json
│   ├── popup.js / popup.html
│   └── data/merchants.json
├── content/blog/                # MDX blog posts (SEO content)
├── data/                        # Static data files and import docs
├── src/
│   ├── components/              # Reusable UI components (50+)
│   │   └── chat/                # Sage chat-specific components
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Bottom tab navigator + stack setup
│   ├── screens/                 # One file per screen (30+ screens)
│   ├── services/                # Business logic layer
│   │   ├── CardDataService.ts           # 410+ card DB + lookups
│   │   ├── RecommendationEngine.ts      # Core ranking algorithm
│   │   ├── CardPortfolioManager.ts      # User's card collection (AsyncStorage)
│   │   ├── PreferenceManager.ts         # User preferences
│   │   ├── StoreDataService.ts          # Store → category mapping
│   │   ├── WalletOptimizerService.ts    # Portfolio gap analysis
│   │   ├── StatementParserService.ts    # CSV import (TD/RBC/BMO/CIBC/Scotia/Tangerine/Simplii/EQ)
│   │   ├── AchievementService.ts        # Gamification (23 achievements, 6 ranks)
│   │   ├── ApplicationTrackerService.ts # 5/24 rule tracker
│   │   ├── SpendingProfileService.ts    # Spending pattern analysis
│   │   └── SageAIService.ts             # AI chat — calls Supabase Edge Function
│   ├── i18n/                    # Translation files (EN + FR)
│   ├── theme/
│   │   └── ThemeContext.tsx      # Dark/light theme
│   ├── types/                   # Shared TypeScript types
│   └── utils/
│       └── lazyScreen.tsx       # Lazy screen loading helper
├── .env.example                 # All env vars documented
├── .eslintrc.json
├── .prettierrc
├── .lintstagedrc.json
└── .github/workflows/ci.yml     # GitHub Actions CI
```

---

## Key Screens

| Screen | File | Purpose |
|--------|------|---------|
| Home | `HomeScreen.tsx` | Search stores → card recommendation |
| My Cards | `MyCardsScreen.tsx` | Manage portfolio + discover cards |
| Sage Chat | `SageScreen.tsx` | AI assistant (Anthropic Claude Haiku) |
| Wallet Optimizer | `WalletOptimizerScreen.tsx` | Portfolio gap analysis |
| Statement Upload | `StatementUploadScreen.tsx` | CSV import from 8 banks |
| Achievements | `AchievementsScreen.tsx` | 23 achievements, Copper → Diamond ranks |
| Application Tracker | `ApplicationTrackerScreen.tsx` | 5/24 rule tracking |
| Points Calculator | `PointsCalculatorScreen.tsx` | Signup ROI + fee breakeven |
| Explore Cards | `ExploreCardsScreen.tsx` | Full card discovery + filters |
| Settings | `SettingsScreen.tsx` | Preferences, language, theme |
| Auth | `AuthScreen.tsx` | Supabase auth (optional cloud features) |

---

## Architecture Notes

**Local-first:** All user data (card portfolio, preferences, spending logs) is stored in AsyncStorage. Supabase is only required for cloud sync, Sage AI (via Edge Function), and Stripe payments. The app is fully functional offline.

**Recommendation engine:** `RecommendationEngine.ts` is the core algorithm — it ranks cards by effective reward rate for a given store/category. It has property-based tests via fast-check. Do not change its interface without running the full test suite.

**Sage AI flow:**
1. User sends message in `SageScreen.tsx`
2. `SageAIService.ts` calls the Supabase Edge Function `sage-chat`
3. Edge Function sends request to Anthropic API (model: `claude-haiku`) with user's card portfolio as context
4. Response streams back to client

**Card data:** 410+ cards are stored as static data in `src/services/CardDataService.ts` (not in the database). The database is used for user accounts, referrals, and analytics only.

**Chrome extension:** The `chrome-extension/` folder is a standalone companion extension — it overlays card recommendations on merchant websites. It has its own manifest and reads from `data/merchants.json`. It is not part of the Expo build.

**Monetization:** Stripe integration for Pro/Max subscription tiers. `UpgradeScreen.tsx` → Stripe Checkout → Supabase Edge Function webhook. Paywall logic lives in `Paywall.tsx` and `LockedFeature.tsx`.

---

## CI / Pre-commit

**GitHub Actions** (on every PR and push to main):
1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:coverage`
4. `npm run test:web` (web build smoke test — catches runtime crashes)

**Husky pre-commit:** Runs lint-staged (ESLint + Prettier) on staged `.ts`/`.tsx` files. Do not bypass with `--no-verify` unless you have a very good reason.

---

## Gotchas

- **`EXPO_PUBLIC_` prefix is mandatory** for any env var used in the app. Without it, the variable will be `undefined` at runtime.
- **Web and native share the same codebase** but some native modules (expo-haptics, expo-location) are no-ops on web. Use platform guards where needed.
- **New Architecture is enabled** (`"newArchEnabled": true` in `app.json`). Not all third-party libraries support this yet — check compatibility before adding dependencies.
- **iOS background location** requires `NSLocationAlwaysUsageDescription` in `app.json` plist — already set. Adding new permissions requires rebuilding native code.
- **EAS build requires** the `projectId` in `app.json → extra.eas` to be set to your actual Expo project. The placeholder `"your-project-id"` will fail.
- **Supabase migrations** are in `supabase/migrations/`. Run `supabase db push` after adding migrations.
- The `App.tsx` at the project root is the Expo entry point, not inside `src/`.
